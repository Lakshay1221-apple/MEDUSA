export interface ParsedSection {
  title: string;
  sectionType: 'MODULE' | 'SECTION' | 'TOPIC';
  sourceText: string;
  orderIndex: number;
  children: ParsedSection[];
}

export interface ParsedDocument {
  title: string;
  rawText: string;
  sections: ParsedSection[];
  chunks: string[];
}

export class DocumentParser {
  /**
   * Parses Markdown, plain text, or extracted PDF text into structured hierarchical sections and chunks.
   */
  static parse(content: string, filename: string): ParsedDocument {
    const rawText = content.trim();
    const lines = rawText.split('\n');

    const sections: ParsedSection[] = [];
    let currentModule: ParsedSection | null = null;
    let currentSection: ParsedSection | null = null;
    let orderIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        // Module level
        currentModule = {
          title: trimmed.replace(/^#\s+/, ''),
          sectionType: 'MODULE',
          sourceText: '',
          orderIndex: orderIndex++,
          children: [],
        };
        sections.push(currentModule);
        currentSection = null;
      } else if (trimmed.startsWith('## ')) {
        // Section level
        currentSection = {
          title: trimmed.replace(/^##\s+/, ''),
          sectionType: 'SECTION',
          sourceText: '',
          orderIndex: orderIndex++,
          children: [],
        };
        if (currentModule) {
          currentModule.children.push(currentSection);
        } else {
          sections.push(currentSection);
        }
      } else if (trimmed.startsWith('### ')) {
        // Topic level
        const topic: ParsedSection = {
          title: trimmed.replace(/^###\s+/, ''),
          sectionType: 'TOPIC',
          sourceText: '',
          orderIndex: orderIndex++,
          children: [],
        };
        if (currentSection) {
          currentSection.children.push(topic);
        } else if (currentModule) {
          currentModule.children.push(topic);
        } else {
          sections.push(topic);
        }
      } else if (trimmed.length > 0) {
        if (currentSection) {
          currentSection.sourceText += trimmed + '\n';
        } else if (currentModule) {
          currentModule.sourceText += trimmed + '\n';
        }
      }
    }

    // If no headings found, create a single default module
    if (sections.length === 0) {
      sections.push({
        title: filename,
        sectionType: 'MODULE',
        sourceText: rawText,
        orderIndex: 0,
        children: [],
      });
    }

    // Chunking: Split raw text into chunks of ~1500 characters
    const chunks = this.chunkText(rawText, 1500);

    return {
      title: filename,
      rawText,
      sections,
      chunks,
    };
  }

  private static chunkText(text: string, maxChunkSize: number): string[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if ((currentChunk + '\n\n' + p).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = p;
      } else {
        currentChunk = currentChunk.length > 0 ? `${currentChunk}\n\n${p}` : p;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }
}
