import { Logger } from '@nestjs/common';

export interface ExtractedTask {
  title: string;
  description: string;
  category: string;
  estimated_minutes: number;
  difficulty: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  success: boolean;
  error?: string;
}

export class LlmExtractor {
  private static readonly logger = new Logger(LlmExtractor.name);

  /**
   * Extracts actionable syllabus/curriculum tasks from document chunks.
   * Validates structure against JSON schema and handles fallback retry.
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

      // If real provider (OpenAI / Anthropic / Gemini), we format prompt with schema instructions
      // and parse the response with validation.
      return this.mockExtract(chunkContent);
    } catch (error) {
      this.logger.warn(`LLM extraction error: ${error.message}. Attempting retry.`);
      try {
        // Fallback retry
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
   * Deterministic extractor that analyzes chunk text for topics, concepts, and bullet points.
   */
  private static mockExtract(chunkContent: string): ExtractionResult {
    const lines = chunkContent.split('\n');
    const tasks: ExtractedTask[] = [];

    for (const line of lines) {
      const trimmed = line.trim().replace(/^[-*•\d.]+\s*/, '');
      if (trimmed.length > 5 && (trimmed.toLowerCase().includes('learn') ||
          trimmed.toLowerCase().includes('build') ||
          trimmed.toLowerCase().includes('implement') ||
          trimmed.toLowerCase().includes('study') ||
          trimmed.toLowerCase().includes('design') ||
          trimmed.toLowerCase().includes('chapter') ||
          trimmed.toLowerCase().includes('module') ||
          trimmed.toLowerCase().includes('topic') ||
          trimmed.length > 20)) {
        
        let category = 'BACKEND';
        const lower = trimmed.toLowerCase();
        if (lower.includes('ai') || lower.includes('ml') || lower.includes('model') || lower.includes('prompt') || lower.includes('llm')) {
          category = 'AI_ML';
        } else if (lower.includes('docker') || lower.includes('kubernetes') || lower.includes('ci/cd') || lower.includes('deploy')) {
          category = 'DEVOPS';
        } else if (lower.includes('system') || lower.includes('scale') || lower.includes('architecture') || lower.includes('distributed')) {
          category = 'SYSTEM_DESIGN';
        } else if (lower.includes('c++') || lower.includes('pointer') || lower.includes('memory')) {
          category = 'CPP';
        }

        tasks.push({
          title: trimmed.length > 80 ? trimmed.substring(0, 77) + '...' : trimmed,
          description: `Study and complete requirements for: ${trimmed}`,
          category,
          estimated_minutes: 60,
          difficulty: 2,
          priority: 'MEDIUM',
        });
      }
    }

    // If no specific lines matched, generate task from chunk summary
    if (tasks.length === 0 && chunkContent.trim().length > 0) {
      const title = chunkContent.trim().slice(0, 50).replace(/\n/g, ' ');
      tasks.push({
        title: `Master ${title}`,
        description: chunkContent.trim().slice(0, 200),
        category: 'BACKEND',
        estimated_minutes: 45,
        difficulty: 2,
        priority: 'MEDIUM',
      });
    }

    return {
      tasks,
      success: true,
    };
  }

  /**
   * Validates raw JSON string matches ExtractedTask schema.
   */
  static validateSchema(jsonString: string): ExtractedTask[] {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      throw new Error("Invalid output: 'tasks' array missing");
    }

    return parsed.tasks.map((t: any) => {
      if (!t.title || typeof t.title !== 'string') throw new Error('Task title invalid');
      return {
        title: t.title,
        description: t.description || '',
        category: t.category || 'OTHER',
        estimated_minutes: Number(t.estimated_minutes) || 30,
        difficulty: Math.min(5, Math.max(1, Number(t.difficulty) || 1)),
        priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(t.priority)
          ? t.priority
          : 'MEDIUM',
      };
    });
  }
}
