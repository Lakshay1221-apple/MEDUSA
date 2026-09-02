import { GitDotEngine } from './gitdot.engine';

describe('GitDotEngine', () => {
  it('should return level 0 for empty day or 0% execution', () => {
    const res = GitDotEngine.calculateCell({
      date: '2026-09-01',
      plannedTasks: 3,
      completedTasks: 0,
      deepWorkMinutes: 0,
      scoreDelta: 0,
    });
    expect(res.level).toBe(0);
    expect(res.execution_percent).toBe(0);
  });

  it('should calculate intermediate execution levels correctly', () => {
    // 1-24%
    const l1 = GitDotEngine.calculateCell({
      date: '2026-09-01',
      plannedTasks: 10,
      completedTasks: 2,
      deepWorkMinutes: 0,
      scoreDelta: 20,
    });
    expect(l1.level).toBe(1);

    // 25-49%
    const l2 = GitDotEngine.calculateCell({
      date: '2026-09-01',
      plannedTasks: 10,
      completedTasks: 4,
      deepWorkMinutes: 0,
      scoreDelta: 40,
    });
    expect(l2.level).toBe(2);

    // 50-74%
    const l3 = GitDotEngine.calculateCell({
      date: '2026-09-01',
      plannedTasks: 10,
      completedTasks: 6,
      deepWorkMinutes: 0,
      scoreDelta: 60,
    });
    expect(l3.level).toBe(3);

    // 75-99%
    const l4 = GitDotEngine.calculateCell({
      date: '2026-09-01',
      plannedTasks: 10,
      completedTasks: 8,
      deepWorkMinutes: 0,
      scoreDelta: 80,
    });
    expect(l4.level).toBe(4);
  });

  it('should return level 5 for 100% execution', () => {
    const res = GitDotEngine.calculateCell({
      date: '2026-09-01',
      plannedTasks: 5,
      completedTasks: 5,
      deepWorkMinutes: 120,
      scoreDelta: 75,
    });
    expect(res.level).toBe(5);
    expect(res.execution_percent).toBe(100);
  });

  it('should support different modes (SCORE, FOCUS, TASKS, GITHUB)', () => {
    const focusRes = GitDotEngine.calculateCell(
      {
        date: '2026-09-01',
        plannedTasks: 0,
        completedTasks: 0,
        deepWorkMinutes: 250,
        scoreDelta: 0,
      },
      'FOCUS',
    );
    expect(focusRes.level).toBe(5);

    const githubRes = GitDotEngine.calculateCell(
      {
        date: '2026-09-01',
        plannedTasks: 0,
        completedTasks: 0,
        deepWorkMinutes: 0,
        scoreDelta: 0,
        githubVerifiedTasks: 3,
      },
      'GITHUB',
    );
    expect(githubRes.level).toBe(4);
  });
});
