export type GitDotMode = 'EXECUTION' | 'SCORE' | 'FOCUS' | 'TASKS' | 'GITHUB';

export interface DayActivityData {
  date: string;
  plannedTasks: number;
  completedTasks: number;
  deepWorkMinutes: number;
  scoreDelta: number;
  githubVerifiedTasks?: number;
}

export interface GitDotCell {
  date: string;
  level: number; // 0 to 5
  execution_percent: number;
  tasks_completed: number;
  tasks_planned: number;
  deep_work_minutes: number;
  score_delta: number;
}

export class GitDotEngine {
  /**
   * Calculates semantic activity levels (0-5) across different visual modes.
   */
  static calculateCell(data: DayActivityData, mode: GitDotMode = 'EXECUTION'): GitDotCell {
    const executionPercent =
      data.plannedTasks > 0
        ? Math.round((data.completedTasks / data.plannedTasks) * 100)
        : data.completedTasks > 0
          ? 100
          : 0;

    let level = 0;

    switch (mode) {
      case 'SCORE':
        if (data.scoreDelta <= 0) level = 0;
        else if (data.scoreDelta < 20) level = 1;
        else if (data.scoreDelta < 40) level = 2;
        else if (data.scoreDelta < 70) level = 3;
        else if (data.scoreDelta < 100) level = 4;
        else level = 5;
        break;

      case 'FOCUS':
        if (data.deepWorkMinutes === 0) level = 0;
        else if (data.deepWorkMinutes < 45) level = 1;
        else if (data.deepWorkMinutes < 90) level = 2;
        else if (data.deepWorkMinutes < 150) level = 3;
        else if (data.deepWorkMinutes < 240) level = 4;
        else level = 5;
        break;

      case 'TASKS':
        if (data.completedTasks === 0) level = 0;
        else if (data.completedTasks <= 2) level = 1;
        else if (data.completedTasks <= 4) level = 2;
        else if (data.completedTasks <= 6) level = 3;
        else if (data.completedTasks <= 9) level = 4;
        else level = 5;
        break;

      case 'GITHUB':
        const gh = data.githubVerifiedTasks || 0;
        if (gh === 0) level = 0;
        else if (gh === 1) level = 2;
        else if (gh === 2) level = 3;
        else if (gh === 3) level = 4;
        else level = 5;
        break;

      case 'EXECUTION':
      default:
        if (executionPercent === 0 && data.deepWorkMinutes === 0) level = 0;
        else if (executionPercent < 25) level = 1;
        else if (executionPercent < 50) level = 2;
        else if (executionPercent < 75) level = 3;
        else if (executionPercent < 100) level = 4;
        else level = 5; // 100% execution
        break;
    }

    return {
      date: data.date,
      level,
      execution_percent: executionPercent,
      tasks_completed: data.completedTasks,
      tasks_planned: data.plannedTasks,
      deep_work_minutes: data.deepWorkMinutes,
      score_delta: data.scoreDelta,
    };
  }
}
