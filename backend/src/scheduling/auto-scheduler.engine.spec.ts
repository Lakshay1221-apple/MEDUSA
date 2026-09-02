import {
  AutoSchedulerEngine,
  SchedulerArcInput,
  SchedulerTaskInput,
} from './auto-scheduler.engine';

describe('AutoSchedulerEngine', () => {
  const mockArc: SchedulerArcInput = {
    id: 'arc-1',
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    dailyCapacityMinutes: 180,
    weeklyCapacityMinutes: 900,
    blackoutDates: ['2026-09-03'], // Day 3 is blacked out
  };

  it('should allocate tasks without placing on blackout dates and respecting daily capacity', () => {
    const tasks: SchedulerTaskInput[] = [
      {
        id: 'task-1',
        title: 'Task 1',
        estimatedMinutes: 90,
        difficulty: 2,
        priority: 'HIGH',
        categoryId: 'cat-1',
        dependsOnTaskIds: [],
      },
      {
        id: 'task-2',
        title: 'Task 2',
        estimatedMinutes: 90,
        difficulty: 2,
        priority: 'HIGH',
        categoryId: 'cat-1',
        dependsOnTaskIds: [],
      },
      {
        id: 'task-3',
        title: 'Task 3',
        estimatedMinutes: 90,
        difficulty: 2,
        priority: 'MEDIUM',
        categoryId: 'cat-1',
        dependsOnTaskIds: [],
      },
    ];

    const placements = AutoSchedulerEngine.schedule(mockArc, tasks);

    expect(placements).toHaveLength(3);
    // Day 1 has capacity for task 1 (90m) and task 2 (90m) = 180m total
    expect(placements[0].date).toBe('2026-09-01');
    expect(placements[1].date).toBe('2026-09-01');
    // Task 3 goes to Day 2 (2026-09-02)
    expect(placements[2].date).toBe('2026-09-02');

    // No tasks should be on blacked out 2026-09-03
    for (const p of placements) {
      expect(p.date).not.toBe('2026-09-03');
    }
  });

  it('should respect dependencies such that dependent task is scheduled on or after dependency date', () => {
    const tasks: SchedulerTaskInput[] = [
      {
        id: 'task-parent',
        title: 'Parent Task',
        estimatedMinutes: 180,
        difficulty: 3,
        priority: 'CRITICAL',
        categoryId: 'cat-1',
        dependsOnTaskIds: [],
      },
      {
        id: 'task-child',
        title: 'Child Task',
        estimatedMinutes: 90,
        difficulty: 2,
        priority: 'HIGH',
        categoryId: 'cat-1',
        dependsOnTaskIds: ['task-parent'],
      },
    ];

    const placements = AutoSchedulerEngine.schedule(mockArc, tasks);
    const parentPlacement = placements.find((p) => p.taskId === 'task-parent');
    const childPlacement = placements.find((p) => p.taskId === 'task-child');

    expect(parentPlacement.date).toBe('2026-09-01');
    expect(childPlacement.date >= parentPlacement.date).toBe(true);
  });

  it('should preserve user pinned dates and overrides', () => {
    const tasks: SchedulerTaskInput[] = [
      {
        id: 'task-pinned',
        title: 'Pinned Task',
        estimatedMinutes: 60,
        difficulty: 1,
        priority: 'LOW',
        categoryId: 'cat-1',
        scheduledDate: '2026-09-04',
        isPinned: true,
        dependsOnTaskIds: [],
      },
      {
        id: 'task-unpinned',
        title: 'Unpinned High Priority',
        estimatedMinutes: 60,
        difficulty: 3,
        priority: 'CRITICAL',
        categoryId: 'cat-1',
        dependsOnTaskIds: [],
      },
    ];

    const placements = AutoSchedulerEngine.schedule(mockArc, tasks);
    const pinned = placements.find((p) => p.taskId === 'task-pinned');

    expect(pinned.date).toBe('2026-09-04');
  });
});
