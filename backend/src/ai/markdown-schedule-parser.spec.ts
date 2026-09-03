import { MarkdownScheduleParser } from './markdown-schedule-parser';

describe('MarkdownScheduleParser — Winter Arc Fixture Audit', () => {
  const winterArcMarkdown = `
# ❄️ Winter Arc — Week-by-Week Execution Plan (v3)

## 🕐 Daily Time-Block Template (from Sep 12 onward)
| Block | Length | Focus |
|---|---|---|
| Block A | 150m | AI/ML — syllabus, in order |
| Block B | 120m | Backend / Full-Stack |
| Block C | 30m | C++ or Open Source/GitHub |

### Sep 10–11 (actual SIH Uni Round days)

## 📅 The 12-Week Syllabus Map
| Week | Dates | Syllabus Section(s) Covered | Topics |
|---|---|---|---|
| 1 | Sep 12–18 | LangChain — Architecture & Foundations | Architecture & Ecosystem 2026 · LLM Integrations & Model Abstraction · Prompt Engineering · LCEL Deep Dive |
| 2 | Sep 19–25 | Advanced RAG & Vector Databases | Hybrid Search & Re-ranking · Chunking Strategies · Query Transformations · Vector Index Optimization |
| 8 | Oct 31–Nov 6 | Kafka & Event-Driven Architecture | Event Sourcing & CQRS · Kafka Brokers & Partitions · Consumer Groups · Stream Processing |

## 🔁 Every Single Week (Non-Negotiable Maintenance)
- [ ] C++: 30–45 min, 3–4x/week (DSA / systems)
- [ ] GitHub: 1 commit/week minimum
- [ ] War Report: weekly closure and audit
- [ ] Deep Work: 20+ hours logged
- [ ] Fitness: 4x gym sessions
  `.trim();

  it('1. Zero resulting tasks have a title containing #, |, **, or ---', () => {
    const result = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    expect(result.tasks.length).toBeGreaterThan(0);

    for (const task of result.tasks) {
      expect(task.title).not.toMatch(/[#|*]{2,}/);
      expect(task.title).not.toContain('#');
      expect(task.title).not.toContain('|');
      expect(task.title).not.toContain('---');
    }
  });

  it('2. Zero resulting tasks are created from a table header row (e.g. Block, Length, Focus, Week, Dates, Topics)', () => {
    const result = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    const titles = result.tasks.map((t) => t.title.toLowerCase());

    expect(titles).not.toContain('block');
    expect(titles).not.toContain('length');
    expect(titles).not.toContain('focus');
    expect(titles).not.toContain('week');
    expect(titles).not.toContain('dates');
    expect(titles).not.toContain('topics');
    expect(titles).not.toContain('| block | length | focus |');
    expect(titles).not.toContain('| week | dates | syllabus section(s) covered | topics |');
    expect(titles).not.toContain('### sep 10–11 (actual sih uni round days)');
  });

  it('3. The "Daily Time-Block Template" table produces a RecurringTemplate record and zero Task records directly', () => {
    const result = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    expect(result.templates.length).toBeGreaterThan(0);

    const template = result.templates[0];
    expect(template.blocks).toHaveLength(3);
    expect(template.blocks[0].label).toBe('Block A');
    expect(template.blocks[0].duration_minutes).toBe(150);

    // Ensure no task was generated for Block A, B, C directly
    const blockTasks = result.tasks.filter((t) => t.title.startsWith('Block A') || t.title.startsWith('Block B'));
    expect(blockTasks).toHaveLength(0);
  });

  it('4. The Week 1 schedule row produces exactly 4 atomic Task records each with date_range_start = 2026-09-12 and date_range_end = 2026-09-18', () => {
    const result = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    const week1Tasks = result.tasks.filter(
      (t) => t.date_range_start === '2026-09-12' && t.date_range_end === '2026-09-18',
    );

    expect(week1Tasks).toHaveLength(4);
    const titles = week1Tasks.map((t) => t.title);
    expect(titles).toContain('Architecture & Ecosystem 2026');
    expect(titles).toContain('LLM Integrations & Model Abstraction');
    expect(titles).toContain('Prompt Engineering');
    expect(titles).toContain('LCEL Deep Dive');

    for (const t of week1Tasks) {
      expect(t.category).toBe('AI_ML');
    }
  });

  it('5. The "Every Single Week" checklist section produces 5 recurring (weekly) tasks, not one-off dated tasks', () => {
    const result = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    const recurringTasks = result.tasks.filter((t) => t.is_recurring && t.frequency === 'weekly');

    expect(recurringTasks).toHaveLength(5);
    const titles = recurringTasks.map((t) => t.title);
    expect(titles.some((t) => t.includes('C++'))).toBe(true);
    expect(titles.some((t) => t.includes('GitHub'))).toBe(true);
    expect(titles.some((t) => t.includes('War Report'))).toBe(true);
  });

  it('6. Re-running ingestion on the same file produces identical output (idempotency)', () => {
    const result1 = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    const result2 = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);

    expect(result1.tasks).toEqual(result2.tasks);
    expect(result1.templates).toEqual(result2.templates);
  });

  it('7. A row with a cross-month date range (Oct 31–Nov 6) parses both dates into correct months/years', () => {
    const result = MarkdownScheduleParser.parse(winterArcMarkdown, 2026);
    const week8Tasks = result.tasks.filter((t) => t.title.includes('Kafka Brokers') || t.title.includes('Event Sourcing'));

    expect(week8Tasks.length).toBeGreaterThan(0);
    const task = week8Tasks[0];
    expect(task.date_range_start).toBe('2026-10-31');
    expect(task.date_range_end).toBe('2026-11-06');
    expect(task.category).toBe('BACKEND');
  });
});
