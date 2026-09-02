export const DOMAIN_EVENTS = {
  // Task events
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_SKIPPED: 'task.skipped',
  TASK_ABANDONED: 'task.abandoned',
  TASK_MISSED: 'task.missed',
  TASK_RESCHEDULED: 'task.rescheduled',
  TASK_START: 'task.start',
  TASK_LATE: 'task.late',
  TASK_DEADLINE: 'task.deadline',

  // Focus events
  FOCUS_STARTED: 'focus.started',
  FOCUS_COMPLETED: 'focus.completed',

  // Day & Arc events
  DAY_CLOSED: 'day.closed',
  DAY_OPENED: 'day.opened',
  WEEKLY_REVIEW: 'weekly.review',

  // Streak & Scoring
  SCORE_UPDATED: 'score.updated',
  STREAK_MILESTONE: 'streak.milestone',
  STREAK_BROKEN: 'streak.broken',

  // Accountability & Tags
  TAG_ASSIGNED: 'tag.assigned',
  ACCOUNTABILITY_FINDING: 'accountability.finding',

  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',

  // Workspace
  SQUAD_OVERTAKEN: 'squad.overtaken',
  MEMBER_ACTIVE: 'member.active',
  RANK_CHANGED: 'rank.changed',

  // GitHub
  GITHUB_VERIFIED: 'github.verified',
  GITHUB_DISCREPANCY: 'github.discrepancy',
} as const;
