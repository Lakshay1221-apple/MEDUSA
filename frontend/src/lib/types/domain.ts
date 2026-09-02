// MEDUSA Domain Types — Derived directly from Prisma Schema & Domain Engines

export type ArcStatus = 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type DayStatus = 'OPEN' | 'CLOSED';
export type DocumentFileType = 'PDF' | 'MARKDOWN' | 'TXT';
export type DocumentStatus =
  | 'UPLOADED'
  | 'PARSING'
  | 'OCR'
  | 'EXTRACTING'
  | 'REVIEW'
  | 'COMPLETED'
  | 'FAILED';
export type SectionType = 'MODULE' | 'SECTION' | 'TOPIC';
export type ChunkStatus = 'PENDING' | 'EXTRACTED' | 'FAILED' | 'REVIEW_NEEDED';
export type TaskOrigin = 'AI' | 'USER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus =
  | 'BACKLOG'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'ABANDONED'
  | 'MISSED'
  | 'RESCHEDULED';
export type VerificationType = 'MANUAL' | 'GITHUB_COMMIT' | 'GITHUB_PR';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ChangeActor = 'AI' | 'USER' | 'SYSTEM' | 'GITHUB';
export type DependencyType = 'BLOCKING' | 'SOFT';
export type HabitFrequency = 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';
export type FocusStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SchedulePlanStatus = 'DRAFT' | 'ACCEPTED' | 'SUPERSEDED';
export type AccountabilitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TagType =
  | 'EXECUTOR'
  | 'IRON_STREAK'
  | 'NO_QUIT'
  | 'SHIPPER'
  | 'DEEP_WORKER'
  | 'OSS_CONTRIBUTOR'
  | 'SYSTEM_BUILDER'
  | 'ARC_BEAST'
  | 'TASK_QUITTER'
  | 'RESCHEDULE_ADDICT'
  | 'EXCUSE_PATTERN'
  | 'STREAK_KILLER'
  | 'GHOST_MODE'
  | 'CHRONIC_PROCRASTINATOR';
export type NotificationChannel = 'IN_APP' | 'WEB_PUSH' | 'EMAIL';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type GitDotMode = 'EXECUTION' | 'SCORE' | 'FOCUS' | 'TASKS' | 'GITHUB';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  github_username?: string | null;
  commitment_phrase: string;
  created_at: string;
  updated_at?: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  arc_id: string;
  current_score: number;
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  total_skipped: number;
  total_abandoned: number;
  total_deep_work_minutes: number;
  last_active_date?: string | null;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  slug: string;
  icon?: string | null;
  color_token?: string | null;
  priority: number;
  weekly_target_minutes: number;
  created_at: string;
}

export interface Arc {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  daily_capacity_minutes: number;
  weekly_capacity_minutes: number;
  status: ArcStatus;
  created_at: string;
  updated_at: string;
  user_stats?: UserStats | null;
  days?: ArcDay[];
  tasks?: Task[];
  habits?: Habit[];
  documents?: SourceDocument[];
}

export interface ArcDay {
  id: string;
  arc_id: string;
  date: string; // YYYY-MM-DD
  planned_minutes: number;
  completed_minutes: number;
  deep_work_minutes: number;
  planned_tasks: number;
  completed_tasks: number;
  missed_tasks: number;
  skipped_tasks: number;
  abandoned_tasks: number;
  score_delta: number;
  status: DayStatus;
  opened_at: string;
  closed_at?: string | null;
}

export interface TaskRevision {
  id: string;
  task_id: string;
  version: number;
  title: string;
  description?: string | null;
  category_id: string;
  estimated_minutes: number;
  difficulty: number;
  priority: TaskPriority;
  changed_by: ChangeActor;
  change_summary?: string | null;
  created_at: string;
  category?: Category;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  user_id: string;
  from_status?: TaskStatus | null;
  to_status: TaskStatus;
  event_type: string;
  reason_code?: string | null;
  reason_text?: string | null;
  metadata?: any;
  actor: ChangeActor;
  occurred_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  type: DependencyType;
  created_at: string;
  depends_on?: Task;
  task?: Task;
}

export interface Task {
  id: string;
  user_id: string;
  arc_id: string;
  title: string;
  description?: string | null;
  origin: TaskOrigin;
  user_modified: boolean;
  category_id: string;
  source_document_id?: string | null;
  source_section_id?: string | null;
  estimated_minutes: number;
  actual_minutes?: number | null;
  difficulty: number;
  priority: TaskPriority;
  scheduled_date?: string | null; // YYYY-MM-DD
  scheduled_start?: string | null; // HH:mm
  scheduled_end?: string | null; // HH:mm
  deadline?: string | null;
  status: TaskStatus;
  verification_type: VerificationType;
  verification_status: VerificationStatus;
  parent_task_id?: string | null;
  rescheduled_from_task_id?: string | null;
  current_revision_id?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  dependencies?: TaskDependency[];
  dependent_tasks?: TaskDependency[];
  revisions?: TaskRevision[];
  events?: TaskEvent[];
}

export interface Habit {
  id: string;
  user_id: string;
  arc_id: string;
  title: string;
  description?: string | null;
  category_id: string;
  frequency: HabitFrequency;
  target_days: string[];
  estimated_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  status: FocusStatus;
  task?: Task | null;
}

export interface DocumentSection {
  id: string;
  document_id: string;
  parent_id?: string | null;
  title: string;
  section_type: SectionType;
  order_index: number;
  source_page?: number | null;
  source_text?: string | null;
  children?: DocumentSection[];
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  section_id?: string | null;
  chunk_index: number;
  content: string;
  extraction_status: ChunkStatus;
  extraction_attempts: number;
  created_at: string;
}

export interface SourceDocument {
  id: string;
  user_id: string;
  arc_id: string;
  file_type: DocumentFileType;
  original_filename: string;
  storage_key: string;
  storage_url: string;
  content_hash: string;
  status: DocumentStatus;
  error_message?: string | null;
  uploaded_at: string;
  processed_at?: string | null;
  sections?: DocumentSection[];
  chunks?: DocumentChunk[];
  tasks?: Task[];
  _count?: {
    sections: number;
    chunks: number;
    tasks: number;
  };
}

export interface ScheduleItem {
  id: string;
  schedule_plan_id: string;
  task_id: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
  task?: Task;
}

export interface SchedulePlan {
  id: string;
  arc_id: string;
  status: SchedulePlanStatus;
  algorithm_version: string;
  generated_at: string;
  items: ScheduleItem[];
}

export interface ScoreEvent {
  id: string;
  user_id: string;
  arc_id: string;
  task_event_id?: string | null;
  delta: number;
  reason: string;
  metadata?: any;
  occurred_at: string;
  task_event?: TaskEvent | null;
}

export interface AccountabilityFinding {
  id: string;
  user_id: string;
  arc_id: string;
  type: string;
  severity: AccountabilitySeverity;
  facts: any;
  message: string;
  created_at: string;
}

export interface AccountabilityTag {
  id: string;
  user_id: string;
  tag: TagType;
  assigned_at: string;
  active: boolean;
  evidence?: any;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  metadata?: any;
}

export interface AchievementItem {
  key: string;
  title: string;
  description: string;
  points: number;
  is_unlocked: boolean;
  unlocked_at?: string | null;
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

export interface WarReport {
  execution_percent: number;
  tasks_completed: number;
  tasks_missed: number;
  tasks_skipped: number;
  tasks_rescheduled: number;
  tasks_abandoned: number;
  deep_work_minutes: number;
  github_verifications: number;
  score: number;
  current_streak: number;
  longest_streak: number;
  best_category: string;
  weakest_category: string;
  findings: AccountabilityFinding[];
  tags: TagType[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  role?: WorkspaceRole;
}

export interface WorkspaceLeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  streak: number;
  executionPercent: number;
  lastActiveDate: string | null;
  rank: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  scheduled_for: string;
  sent_at?: string | null;
  read_at?: string | null;
  metadata?: any;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  enabled: boolean;
  channel: NotificationChannel;
}
