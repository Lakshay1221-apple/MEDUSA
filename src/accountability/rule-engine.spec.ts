import { AccountabilityRuleEngine } from './rule-engine';
import { TagType, AccountabilitySeverity } from '@prisma/client';

describe('AccountabilityRuleEngine', () => {
  it('should detect RESCHEDULE_PATTERN when a single task has been rescheduled 3+ times', () => {
    const findings = AccountabilityRuleEngine.evaluate({
      userId: 'user-1',
      arcId: 'arc-1',
      totalCompleted: 5,
      totalSkipped: 0,
      totalAbandoned: 0,
      currentStreak: 2,
      deepWorkMinutes: 100,
      githubVerifiedTasks: 0,
      maxReschedulesOnSingleTask: 3,
      recentSkipsCount: 0,
    });

    const rescheduleFinding = findings.find((f) => f.type === 'RESCHEDULE_PATTERN');
    expect(rescheduleFinding).toBeDefined();
    expect(rescheduleFinding.severity).toBe(AccountabilitySeverity.HIGH);
    expect(rescheduleFinding.tagToAssign).toBe(TagType.RESCHEDULE_ADDICT);
  });

  it('should detect EXCUSE_PATTERN when recent skips count in 7 days is 3+', () => {
    const findings = AccountabilityRuleEngine.evaluate({
      userId: 'user-1',
      arcId: 'arc-1',
      totalCompleted: 5,
      totalSkipped: 4,
      totalAbandoned: 0,
      currentStreak: 0,
      deepWorkMinutes: 100,
      githubVerifiedTasks: 0,
      maxReschedulesOnSingleTask: 1,
      recentSkipsCount: 3,
    });

    const excuseFinding = findings.find((f) => f.type === 'EXCUSE_PATTERN');
    expect(excuseFinding).toBeDefined();
    expect(excuseFinding.tagToAssign).toBe(TagType.EXCUSE_PATTERN);
  });

  it('should award IRON_STREAK when current streak is 14+', () => {
    const findings = AccountabilityRuleEngine.evaluate({
      userId: 'user-1',
      arcId: 'arc-1',
      totalCompleted: 20,
      totalSkipped: 0,
      totalAbandoned: 0,
      currentStreak: 14,
      deepWorkMinutes: 500,
      githubVerifiedTasks: 5,
      maxReschedulesOnSingleTask: 0,
      recentSkipsCount: 0,
    });

    const streakFinding = findings.find((f) => f.type === 'IRON_STREAK');
    expect(streakFinding).toBeDefined();
    expect(streakFinding.tagToAssign).toBe(TagType.IRON_STREAK);
  });

  it('should not assign tags when there is insufficient measurable evidence', () => {
    const findings = AccountabilityRuleEngine.evaluate({
      userId: 'user-1',
      arcId: 'arc-1',
      totalCompleted: 5,
      totalSkipped: 1,
      totalAbandoned: 0,
      currentStreak: 2,
      deepWorkMinutes: 60,
      githubVerifiedTasks: 1,
      maxReschedulesOnSingleTask: 1,
      recentSkipsCount: 1,
    });

    expect(findings).toHaveLength(0);
  });
});
