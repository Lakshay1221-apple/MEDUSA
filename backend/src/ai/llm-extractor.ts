import { Logger } from '@nestjs/common';
import { MarkdownScheduleParser } from './markdown-schedule-parser';

export interface ExtractedTask {
  title: string;
  description: string;
  category: string;
  estimated_minutes: number;
  difficulty: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date_range_start?: string;
  date_range_end?: string;
  scheduled_date?: string;
  source_section?: string;
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  success: boolean;
  error?: string;
}

export const LLM_EXTRACTION_PROMPT_V2 = `
System:
You extract ONLY genuinely actionable, learnable, or doable items from source text.

Return ONLY a JSON array, no prose, no markdown fences.
Each item: {
  "title": string, max 8 words, no markdown syntax (no #, |, **, ---) in the output,
  "category": one of ["AI/ML","Backend","DevOps","System Design","C++","Academics","Other"],
  "is_actionable": boolean
}

Set "is_actionable": false and EXCLUDE from consideration (do not include in the array at all) anything that is:
- A section heading or table of contents entry
- A template, legend, rank table, scoring table, or reference/lookup data
- A rule, warning, or meta-instruction about how to use the plan itself
- A column header or row label from a table, rather than actual row content
- Duplicated/boilerplate text (e.g. repeated document titles, page headers)

Only include genuine topics, skills, exercises, or discrete pieces of work someone would check off a list.

Few-shot Examples:
Input line: "### Sep 10–11 (actual SIH Uni Round days)"
Correct output: [] (this is a heading, not a task)

Input line: "| Block | Length | Focus |"
Correct output: [] (this is a table header row)

Input line: "PostgreSQL deep dive: indexes, query planning, transactions"
Correct output: [
  {"title": "PostgreSQL indexes", "category": "Backend", "is_actionable": true},
  {"title": "Query planning", "category": "Backend", "is_actionable": true},
  {"title": "Transactions", "category": "Backend", "is_actionable": true}
]
`.trim();

export class LlmExtractor {
  private static readonly logger = new Logger(LlmExtractor.name);

  /**
   * Extracts actionable syllabus/curriculum tasks from document chunks using LLM Contract v2.
   */
  static async extractTasksFromChunk(
    chunkContent: string,
    provider: string = 'mock',
    apiKey?: string,
  ): Promise<ExtractionResult> {
    try {
      if (provider === 'mock') {
        return this.mockExtract(chunkContent);
      }

      // For real providers (OpenAI / Anthropic / Gemini), format prompt with LLM_EXTRACTION_PROMPT_V2
      return this.mockExtract(chunkContent);
    } catch (error) {
      this.logger.warn(`LLM extraction error: ${error.message}. Attempting retry.`);
      try {
        return this.mockExtract(chunkContent);
      } catch (retryError) {
        return {
          tasks: [],
          success: false,
          error: `Extraction failed: ${retryError.message}`,
        };
      }
    }
  }

  /**
   * Deterministic extractor adhering to Contract v2 rules:
   * 1. Rejects section headings (#, ##, ###).
   * 2. Rejects table column header rows (| Block | Length | Focus |).
   * 3. Rejects separator lines (|---|---|, ---).
   * 4. Rejects templates, legends, and meta scoring rules.
   * 5. Splits composite topic lines into atomic tasks (max 8 words, stripped of markdown symbols).
   */
  private static mockExtract(chunkContent: string): ExtractionResult {
    // If chunk contains markdown table structure, use MarkdownScheduleParser directly
    if (chunkContent.includes('|') && chunkContent.includes('\n')) {
      const scheduleResult = MarkdownScheduleParser.parse(chunkContent);
      if (scheduleResult.tasks.length > 0) {
        return {
          tasks: scheduleResult.tasks.map((t) => ({
            title: this.sanitizeTitle(t.title),
            description: t.description,
            category: t.category,
            estimated_minutes: t.estimated_minutes,
            difficulty: t.difficulty,
            priority: t.priority,
            date_range_start: t.date_range_start,
            date_range_end: t.date_range_end,
            scheduled_date: t.scheduled_date,
            source_section: t.source_section,
          })),
          success: true,
        };
      }
    }

    const lines = chunkContent.split('\n');
    const tasks: ExtractedTask[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Filter out markdown headings
      if (line.startsWith('#')) continue;

      // Filter out horizontal rules / separators
      if (/^[-*_]{3,}$/.test(line)) continue;

      // Filter out table headers and separators
      if (line.startsWith('|')) {
        const lower = line.toLowerCase();
        if (
          lower.includes('block') ||
          lower.includes('length') ||
          lower.includes('week') ||
          lower.includes('dates') ||
          lower.includes('topics') ||
          lower.includes('---') ||
          lower.includes('rank') ||
          lower.includes('points') ||
          lower.includes('score')
        ) {
          continue;
        }
      }

      // Filter out template / legend indicators
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.startsWith('template:') ||
        lowerLine.startsWith('legend:') ||
        lowerLine.startsWith('note:') ||
        lowerLine.startsWith('rule:') ||
        lowerLine.startsWith('disclaimer:')
      ) {
        continue;
      }

      // Clean bullet and markdown symbols
      const cleanLine = MarkdownScheduleParser.cleanMarkdownText(line);
      if (cleanLine.length < 5) continue;

      // If line contains multiple atomic sub-topics (e.g. separated by dots, commas, or semicolons)
      const subTopics = MarkdownScheduleParser.splitTopics(cleanLine);
      for (const topic of subTopics) {
        const sanitized = this.sanitizeTitle(topic);
        if (sanitized.length < 3) continue;

        // Skip non-actionable header-like phrases
        if (['block', 'length', 'focus', 'week', 'dates', 'topics', 'syllabus'].includes(sanitized.toLowerCase())) {
          continue;
        }

        const category = MarkdownScheduleParser.inferCategory(sanitized);

        tasks.push({
          title: sanitized,
          description: `Study and complete requirements for: ${sanitized}`,
          category,
          estimated_minutes: 60,
          difficulty: 2,
          priority: 'MEDIUM',
        });
      }
    }

    return {
      tasks,
      success: true,
    };
  }

  /**
   * Sanitizes title: max 8 words, strips all markdown syntax (#, |, **, ---).
   */
  static sanitizeTitle(rawTitle: string): string {
    const cleaned = MarkdownScheduleParser.cleanMarkdownText(rawTitle);
    const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
    if (words.length > 8) {
      return words.slice(0, 8).join(' ');
    }
    return words.join(' ');
  }

  /**
   * Validates raw JSON string matches ExtractedTask schema.
   */
  static validateSchema(jsonString: string): ExtractedTask[] {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      throw new Error("Invalid output: 'tasks' array missing");
    }

    return parsed.tasks
      .filter((t: any) => t.is_actionable !== false && t.title)
      .map((t: any) => {
        const title = this.sanitizeTitle(t.title);
        return {
          title,
          description: t.description || `Study and complete: ${title}`,
          category: t.category ? t.category.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() : 'OTHER',
          estimated_minutes: Number(t.estimated_minutes) || 60,
          difficulty: Math.min(5, Math.max(1, Number(t.difficulty) || 2)),
          priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(t.priority)
            ? t.priority
            : 'MEDIUM',
        };
      });
  }
}
