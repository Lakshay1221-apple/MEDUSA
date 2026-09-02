export interface DiffResult {
  addedLines: string[];
  removedLines: string[];
  unchangedLines: string[];
  changePercentage: number;
}

export class DocumentDiffEngine {
  /**
   * Compares an existing document's content with a newly uploaded version.
   */
  static diff(oldText: string, newText: string): DiffResult {
    const oldLines = new Set(oldText.split('\n').map((l) => l.trim()).filter(Boolean));
    const newLines = new Set(newText.split('\n').map((l) => l.trim()).filter(Boolean));

    const addedLines: string[] = [];
    const removedLines: string[] = [];
    const unchangedLines: string[] = [];

    for (const line of newLines) {
      if (oldLines.has(line)) {
        unchangedLines.push(line);
      } else {
        addedLines.push(line);
      }
    }

    for (const line of oldLines) {
      if (!newLines.has(line)) {
        removedLines.push(line);
      }
    }

    const totalLines = Math.max(1, oldLines.size + newLines.size);
    const changePercentage = Math.round(
      ((addedLines.length + removedLines.length) / totalLines) * 100,
    );

    return {
      addedLines,
      removedLines,
      unchangedLines,
      changePercentage,
    };
  }
}
