import { AiService } from './ai.service';
import { DocumentParser } from './document-parser';
import { LlmExtractor } from './llm-extractor';
import { DocumentDiffEngine } from './diff-engine';

describe('AiPipeline', () => {
  describe('DocumentParser', () => {
    it('should parse hierarchical markdown into modules, sections, topics and chunks', () => {
      const markdown = `
# Module 1: Distributed Systems
## Section 1.1: Consistency Models
### Topic 1.1.1: Raft Consensus
Study raft leader election and log replication mechanics.

# Module 2: High Performance Caching
## Section 2.1: Redis Internals
Learn memory optimization and SDS string allocation in Redis.
      `.trim();

      const parsed = DocumentParser.parse(markdown, 'curriculum.md');

      expect(parsed.title).toBe('curriculum.md');
      expect(parsed.sections).toHaveLength(2);
      expect(parsed.sections[0].title).toBe('Module 1: Distributed Systems');
      expect(parsed.sections[0].children[0].title).toBe('Section 1.1: Consistency Models');
      expect(parsed.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('LlmExtractor', () => {
    it('should extract structured tasks and validate schema', async () => {
      const chunkText = `
- Learn LCEL composition in LangChain
- Build a distributed rate limiter with Redis and Token Bucket algorithm
- Implement custom memory allocator in C++
      `;

      const result = await LlmExtractor.extractTasksFromChunk(chunkText, 'mock');
      expect(result.success).toBe(true);
      expect(result.tasks.length).toBeGreaterThan(0);

      const firstTask = result.tasks[0];
      expect(firstTask.title).toBeDefined();
      expect(firstTask.category).toBeDefined();
      expect(firstTask.estimated_minutes).toBeGreaterThan(0);
    });
  });

  describe('DocumentDiffEngine', () => {
    it('should detect added, removed, and unchanged lines when re-uploading modified document', () => {
      const oldDoc = `
Learn Redis
Learn Kafka
Learn PostgreSQL
      `.trim();

      const newDoc = `
Learn Redis
Learn Kafka Streams
Learn PostgreSQL
Learn ClickHouse
      `.trim();

      const diff = DocumentDiffEngine.diff(oldDoc, newDoc);

      expect(diff.unchangedLines).toContain('Learn Redis');
      expect(diff.unchangedLines).toContain('Learn PostgreSQL');
      expect(diff.addedLines).toContain('Learn Kafka Streams');
      expect(diff.addedLines).toContain('Learn ClickHouse');
      expect(diff.removedLines).toContain('Learn Kafka');
    });
  });
});
