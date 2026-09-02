import { HabitsService } from './habits.service';
import { HabitFrequency, TaskStatus } from '@prisma/client';

describe('HabitsService', () => {
  let habitsService: HabitsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      arc: { findUnique: jest.fn().mockResolvedValue({ id: 'arc-1', user_id: 'user-1' }) },
      habit: {
        create: jest.fn().mockResolvedValue({ id: 'habit-1', title: 'Gym' }),
        findMany: jest.fn(),
      },
      task: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'task-habit', title: 'Gym' }),
      },
      taskRevision: { create: jest.fn() },
      taskEvent: { create: jest.fn() },
    };

    habitsService = new HabitsService(mockPrisma);
  });

  it('should generate daily habit occurrences idempotently without duplicates', async () => {
    mockPrisma.habit.findMany.mockResolvedValue([
      {
        id: 'habit-1',
        title: 'Morning Gym',
        category_id: 'cat-gym',
        frequency: HabitFrequency.DAILY,
        estimated_minutes: 45,
      },
    ]);

    // Case 1: First call -> task does not exist
    mockPrisma.task.findFirst.mockResolvedValueOnce(null);

    const firstRun = await habitsService.generateDailyHabitOccurrences('user-1', 'arc-1', '2026-09-02');
    expect(firstRun.generatedCount).toBe(1);
    expect(mockPrisma.task.create).toHaveBeenCalled();

    // Case 2: Second call for the same day -> task already exists
    mockPrisma.task.findFirst.mockResolvedValueOnce({ id: 'existing-task' });

    const secondRun = await habitsService.generateDailyHabitOccurrences('user-1', 'arc-1', '2026-09-02');
    expect(secondRun.generatedCount).toBe(0); // 0 duplicates created!
  });
});
