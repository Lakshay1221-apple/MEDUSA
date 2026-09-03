export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ExtractedScheduleTask {
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
  is_recurring?: boolean;
  frequency?: string;
}

export interface TemplateTimeBlock {
  label: string;
  duration_minutes: number;
  focus: string;
}

export interface RecurringTemplate {
  name: string;
  applies: string; // e.g. "weekday", "weekend", "daily"
  blocks: TemplateTimeBlock[];
}

export interface MarkdownScheduleResult {
  tasks: ExtractedScheduleTask[];
  templates: RecurringTemplate[];
  sections: Array<{
    title: string;
    level: number;
    sourceText: string;
  }>;
}

const MONTH_MAP: Record<string, number> = {
  JAN: 1, JANUARY: 1,
  FEB: 2, FEBRUARY: 2,
  MAR: 3, MARCH: 3,
  APR: 4, APRIL: 4,
  MAY: 5,
  JUN: 6, JUNE: 6,
  JUL: 7, JULY: 7,
  AUG: 8, AUGUST: 8,
  SEP: 9, SEPT: 9, SEPTEMBER: 9,
  OCT: 10, OCTOBER: 10,
  NOV: 11, NOVEMBER: 11,
  DEC: 12, DECEMBER: 12,
};

export class MarkdownScheduleParser {
  /**
   * Main deterministic parser for Markdown documents containing schedules, tables, headings, and checklists.
   */
  static parse(content: string, defaultYear: number = 2026): MarkdownScheduleResult {
    const rawLines = content.split('\n');
    const tasks: ExtractedScheduleTask[] = [];
    const templates: RecurringTemplate[] = [];
    const sections: Array<{ title: string; level: number; sourceText: string }> = [];

    let currentH1 = '';
    let currentH2 = '';
    let currentH3 = '';
    let currentSectionHeading = '';

    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i].trim();

      // 1. Heading tracking (never a task)
      if (line.startsWith('#')) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = this.cleanMarkdownText(headingMatch[2]);
          sections.push({ title: headingText, level, sourceText: line });

          if (level === 1) {
            currentH1 = headingText;
            currentH2 = '';
            currentH3 = '';
          } else if (level === 2) {
            currentH2 = headingText;
            currentH3 = '';
          } else if (level === 3) {
            currentH3 = headingText;
          }
          currentSectionHeading = headingText;
        }
        i++;
        continue;
      }

      // 2. Checklist items (e.g. "- [ ] C++: 30-45 min, 3-4x/week")
      const checklistMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
      if (checklistMatch) {
        const itemText = this.cleanMarkdownText(checklistMatch[2]);
        if (itemText.length > 3) {
          const category = this.inferCategory(itemText, currentSectionHeading);
          tasks.push({
            title: itemText.length > 80 ? itemText.substring(0, 77) + '...' : itemText,
            description: `Recurring checklist from section: ${currentSectionHeading || currentH2 || 'Checklist'}`,
            category,
            estimated_minutes: this.inferDuration(itemText, 45),
            difficulty: 2,
            priority: 'HIGH',
            is_recurring: true,
            frequency: 'weekly',
            source_section: currentSectionHeading || currentH2,
          });
        }
        i++;
        continue;
      }

      // 3. Table detection (starts with | and has subsequent separator |---|)
      if (line.startsWith('|') && line.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
          tableLines.push(rawLines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          this.processTable(tableLines, currentSectionHeading || currentH2, defaultYear, tasks, templates);
        }
        continue;
      }

      i++;
    }

    return {
      tasks,
      templates,
      sections,
    };
  }

  /**
   * Process a parsed markdown table based on header classification.
   */
  private static processTable(
    tableLines: string[],
    parentHeading: string,
    defaultYear: number,
    tasks: ExtractedScheduleTask[],
    templates: RecurringTemplate[],
  ): void {
    const rawHeader = tableLines[0];
    const headerCols = this.parseTableRow(rawHeader).map((c) => c.toLowerCase());

    // Check if second line is separator
    const isSeparator = tableLines[1].includes('---') || tableLines[1].includes('---|');
    const dataRows = isSeparator ? tableLines.slice(2) : tableLines.slice(1);

    // Classify table by column names and parent heading
    const isTemplateTable =
      (parentHeading.toLowerCase().includes('template') || parentHeading.toLowerCase().includes('time-block') || parentHeading.toLowerCase().includes('routine')) &&
      (headerCols.some((c) => c.includes('block') || c.includes('length') || c.includes('duration')));

    const isReferenceTable =
      headerCols.some((c) => c.includes('rank') || c.includes('score') || c.includes('threshold') || c.includes('points') || c.includes('penalty') || c.includes('multiplier'));

    const isScheduleTable =
      headerCols.some((c) => c.includes('week') || c.includes('date') || c.includes('day') || c.includes('phase')) &&
      headerCols.some((c) => c.includes('topic') || c.includes('syllabus') || c.includes('focus') || c.includes('content') || c.includes('subject'));

    if (isTemplateTable) {
      // Parse RecurringTemplate
      const templateBlocks: TemplateTimeBlock[] = [];
      for (const row of dataRows) {
        const cols = this.parseTableRow(row);
        if (cols.length >= 3) {
          templateBlocks.push({
            label: this.cleanMarkdownText(cols[0]),
            duration_minutes: this.inferDuration(cols[1], 60),
            focus: this.cleanMarkdownText(cols[2]),
          });
        }
      }

      if (templateBlocks.length > 0) {
        templates.push({
          name: parentHeading || 'Time Blocks Template',
          applies: parentHeading.toLowerCase().includes('weekend') ? 'weekend' : 'weekday',
          blocks: templateBlocks,
        });
      }
      return; // Do NOT generate tasks from template tables
    }

    if (isReferenceTable && !isScheduleTable) {
      // Discard reference tables from task creation
      return;
    }

    if (isScheduleTable || headerCols.some((c) => c.includes('topic') || c.includes('syllabus') || c.includes('dates'))) {
      // Identify column indices with priority
      let dateColIdx = headerCols.findIndex((c) => c.includes('date') || c.includes('day'));
      if (dateColIdx < 0) {
        dateColIdx = headerCols.findIndex((c) => c.includes('week') || c.includes('time') || c.includes('phase'));
      }

      let topicColIdx = headerCols.findIndex((c) => c === 'topics' || c === 'topic' || c === 'focus' || c.includes('topic') || c.includes('task'));
      if (topicColIdx < 0) {
        topicColIdx = headerCols.findIndex((c) => c.includes('content') || c.includes('focus') || c.includes('description'));
      }

      let sectionColIdx = headerCols.findIndex(
        (c, idx) => idx !== topicColIdx && (c.includes('syllabus section') || c.includes('module') || c.includes('subject') || c.includes('area') || c.includes('syllabus')),
      );

      for (const row of dataRows) {
        const cols = this.parseTableRow(row);
        if (cols.length === 0) continue;

        let dateStr = dateColIdx >= 0 && cols[dateColIdx] ? cols[dateColIdx] : '';
        let dateRange = this.parseDateRange(dateStr, defaultYear);

        // If dateRange wasn't parsed from dateCol, check all columns for date patterns
        if (!dateRange) {
          for (const col of cols) {
            const foundRange = this.parseDateRange(col, defaultYear);
            if (foundRange) {
              dateRange = foundRange;
              dateStr = col;
              break;
            }
          }
        }

        const sectionStr = sectionColIdx >= 0 && cols[sectionColIdx] ? cols[sectionColIdx] : (cols.length > 2 && sectionColIdx !== topicColIdx ? cols[2] : '');
        const topicsStr = topicColIdx >= 0 && cols[topicColIdx] ? cols[topicColIdx] : cols[cols.length - 1];

        const sectionClean = this.cleanMarkdownText(sectionStr);

        // Split topic cell into individual atomic topics
        const topicFragments = this.splitTopics(topicsStr);

        for (const fragment of topicFragments) {
          const cleanTitle = this.cleanMarkdownText(fragment);
          if (cleanTitle.length < 3) continue;

          // Skip if title matches a table header word
          if (['block', 'length', 'focus', 'week', 'dates', 'topics', 'syllabus'].includes(cleanTitle.toLowerCase())) {
            continue;
          }

          const category = this.inferCategory(`${sectionClean} ${cleanTitle}`, parentHeading);

          tasks.push({
            title: cleanTitle,
            description: `Syllabus Section: ${sectionClean}${dateStr ? ` (Scheduled: ${dateStr})` : ''}`,
            category,
            estimated_minutes: 60,
            difficulty: this.inferDifficulty(cleanTitle),
            priority: 'MEDIUM',
            date_range_start: dateRange?.startDate,
            date_range_end: dateRange?.endDate,
            scheduled_date: dateRange?.startDate,
            source_section: sectionClean || parentHeading,
          });
        }
      }
    }
  }

  /**
   * Splits a raw topic cell string into atomic topic strings.
   * Splits by `·` (middle dot), `•` (bullet), or `,` (comma if no bullet).
   */
  static splitTopics(rawTopics: string): string[] {
    if (!rawTopics) return [];

    let cleaned = rawTopics.trim();

    // Remove surrounding pipes or markdown artifacts
    cleaned = cleaned.replace(/^\|+|\|+$/g, '').trim();

    let fragments: string[] = [];
    if (cleaned.includes('·')) {
      fragments = cleaned.split('·');
    } else if (cleaned.includes('•')) {
      fragments = cleaned.split('•');
    } else if (cleaned.includes(';')) {
      fragments = cleaned.split(';');
    } else if (cleaned.includes(',')) {
      fragments = cleaned.split(',');
    } else {
      fragments = [cleaned];
    }

    return fragments
      .map((f) => MarkdownScheduleParser.cleanMarkdownText(f))
      .filter((f) => f.length > 0);
  }

  /**
   * Parses markdown table row into array of cell strings.
   */
  private static parseTableRow(row: string): string[] {
    return row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  }

  /**
   * Cleans markdown artifacts (bold **, italic *, header #, code `, bullets, pipes).
   */
  static cleanMarkdownText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove **bold**
      .replace(/\*(.*?)\*/g, '$1')     // remove *italic*
      .replace(/`([^`]+)`/g, '$1')     // remove `code`
      .replace(/^#{1,6}\s+/, '')       // remove leading #
      .replace(/\|/g, ' ')             // remove pipes
      .replace(/^[-*•\d.]+\s*/, '')    // remove leading bullet/numbering
      .replace(/\s+/g, ' ')            // normalize whitespace
      .trim();
  }

  /**
   * Parses date ranges such as "Sep 12–18", "Oct 31–Nov 6", "Sep 10", "2026-09-12".
   */
  static parseDateRange(dateStr: string, defaultYear: number = 2026): DateRange | null {
    if (!dateStr) return null;
    const clean = dateStr.replace(/–/g, '-').replace(/—/g, '-').trim();

    // 1. ISO format YYYY-MM-DD
    const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return {
        startDate: isoMatch[0],
        endDate: isoMatch[0],
      };
    }

    // 2. Cross-month range: "Oct 31 - Nov 6" or "Oct 31-Nov 6"
    const crossMonthMatch = clean.match(/([a-zA-Z]+)\s*(\d{1,2})\s*-\s*([a-zA-Z]+)\s*(\d{1,2})/);
    if (crossMonthMatch) {
      const startMonth = MONTH_MAP[crossMonthMatch[1].toUpperCase()];
      const startDay = parseInt(crossMonthMatch[2], 10);
      const endMonth = MONTH_MAP[crossMonthMatch[3].toUpperCase()];
      const endDay = parseInt(crossMonthMatch[4], 10);

      if (startMonth && endMonth) {
        let endYear = defaultYear;
        // If end month < start month (e.g. Dec to Jan), increment year
        if (endMonth < startMonth) endYear = defaultYear + 1;

        const startIso = `${defaultYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
        const endIso = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
        return { startDate: startIso, endDate: endIso };
      }
    }

    // 3. Same-month range: "Sep 12 - 18" or "Sep 12-18"
    const sameMonthMatch = clean.match(/([a-zA-Z]+)\s*(\d{1,2})\s*-\s*(\d{1,2})/);
    if (sameMonthMatch) {
      const month = MONTH_MAP[sameMonthMatch[1].toUpperCase()];
      const startDay = parseInt(sameMonthMatch[2], 10);
      const endDay = parseInt(sameMonthMatch[3], 10);

      if (month) {
        const startIso = `${defaultYear}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
        const endIso = `${defaultYear}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
        return { startDate: startIso, endDate: endIso };
      }
    }

    // 4. Single month day: "Sep 10" or "September 10"
    const singleMatch = clean.match(/([a-zA-Z]+)\s*(\d{1,2})/);
    if (singleMatch) {
      const month = MONTH_MAP[singleMatch[1].toUpperCase()];
      const day = parseInt(singleMatch[2], 10);
      if (month) {
        const iso = `${defaultYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { startDate: iso, endDate: iso };
      }
    }

    return null;
  }

  /**
   * Infers category from keywords in topic title, section name, and heading context.
   */
  static inferCategory(text: string, context: string = ''): string {
    const combined = `${text} ${context}`.toLowerCase();

    if (
      combined.includes('langchain') ||
      combined.includes('langgraph') ||
      combined.includes('rag') ||
      combined.includes('lcel') ||
      combined.includes('prompt') ||
      combined.includes('llm') ||
      combined.includes('transformer') ||
      combined.includes('agent') ||
      combined.includes('mcp') ||
      combined.includes('vector') ||
      combined.includes('embedding') ||
      combined.includes('ai') ||
      combined.includes('model abstraction')
    ) {
      return 'AI_ML';
    }

    if (
      combined.includes('c++') ||
      combined.includes('cpp') ||
      combined.includes('pointer') ||
      combined.includes('raii') ||
      combined.includes('allocator') ||
      combined.includes('memory') ||
      combined.includes('stl')
    ) {
      return 'CPP';
    }

    if (
      combined.includes('postgres') ||
      combined.includes('sql') ||
      combined.includes('redis') ||
      combined.includes('kafka') ||
      combined.includes('node') ||
      combined.includes('nest') ||
      combined.includes('backend') ||
      combined.includes('api') ||
      combined.includes('rest') ||
      combined.includes('graphql') ||
      combined.includes('auth') ||
      combined.includes('jwt') ||
      combined.includes('event-driven') ||
      combined.includes('event sourcing')
    ) {
      return 'BACKEND';
    }

    if (
      combined.includes('docker') ||
      combined.includes('kubernetes') ||
      combined.includes('k8s') ||
      combined.includes('ci/cd') ||
      combined.includes('deploy') ||
      combined.includes('terraform') ||
      combined.includes('aws') ||
      combined.includes('devops')
    ) {
      return 'DEVOPS';
    }

    if (
      combined.includes('system design') ||
      combined.includes('architecture') ||
      combined.includes('scale') ||
      combined.includes('distributed') ||
      combined.includes('sharding') ||
      combined.includes('replication') ||
      combined.includes('load balancer')
    ) {
      return 'SYSTEM_DESIGN';
    }

    if (
      combined.includes('github') ||
      combined.includes('open source') ||
      combined.includes('git') ||
      combined.includes('commit') ||
      combined.includes('pull request') ||
      combined.includes('oss')
    ) {
      return 'OPEN_SOURCE';
    }

    if (
      combined.includes('exam') ||
      combined.includes('university') ||
      combined.includes('academic') ||
      combined.includes('sih') ||
      combined.includes('college')
    ) {
      return 'ACADEMICS';
    }

    if (
      combined.includes('postgres') ||
      combined.includes('sql') ||
      combined.includes('redis') ||
      combined.includes('kafka') ||
      combined.includes('node') ||
      combined.includes('nest') ||
      combined.includes('backend') ||
      combined.includes('api') ||
      combined.includes('rest') ||
      combined.includes('graphql') ||
      combined.includes('auth') ||
      combined.includes('jwt')
    ) {
      return 'BACKEND';
    }

    return 'BACKEND';
  }

  /**
   * Infers task duration from text (e.g. "30-45 min", "150m", "2h").
   */
  private static inferDuration(text: string, defaultMinutes: number = 60): number {
    const minMatch = text.match(/(\d+)\s*(?:m|min|minutes)/i);
    if (minMatch) return parseInt(minMatch[1], 10);

    const hrMatch = text.match(/(\d+)\s*(?:h|hr|hours)/i);
    if (hrMatch) return parseInt(hrMatch[1], 10) * 60;

    return defaultMinutes;
  }

  /**
   * Infers difficulty rating (1 to 5) from topic complexity keywords.
   */
  private static inferDifficulty(title: string): number {
    const lower = title.toLowerCase();
    if (lower.includes('deep dive') || lower.includes('internals') || lower.includes('distributed') || lower.includes('custom memory')) {
      return 4;
    }
    if (lower.includes('advanced') || lower.includes('optimization') || lower.includes('architecture')) {
      return 3;
    }
    if (lower.includes('basics') || lower.includes('intro') || lower.includes('setup') || lower.includes('foundations')) {
      return 1;
    }
    return 2;
  }
}
