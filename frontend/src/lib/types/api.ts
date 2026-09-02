// MEDUSA API Request/Response Types — Derived directly from Backend DTOs & Interceptors

import {
  User,
  Arc,
  ArcDay,
  Task,
  TaskRevision,
  Category,
  Habit,
  FocusSession,
  SourceDocument,
  SchedulePlan,
  ScoreEvent,
  UserStats,
  AccountabilityFinding,
  AccountabilityTag,
  AchievementItem,
  GitDotCell,
  WarReport,
  Workspace,
  WorkspaceLeaderboardEntry,
  NotificationItem,
  NotificationPreference,
  TaskStatus,
  TaskPriority,
  TaskOrigin,
  VerificationType,
  DocumentFileType,
  HabitFrequency,
  NotificationChannel,
  GitDotMode,
} from './domain';

// Standard Backend Response Envelope
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

// Standard Backend Error Envelope
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 1. Auth DTOs
export interface SignupDto {
  name: string;
  email: string;
  password: string;
  timezone?: string;
  commitment_phrase?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface AuthResponseData {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  };
}

// 2. Users DTOs
export interface UpdateUserDto {
  name?: string;
  timezone?: string;
  commitment_phrase?: string;
  github_username?: string;
}

// 3. Arcs DTOs
export interface CreateArcDto {
  name: string;
  description?: string;
  start_date: string; // ISO / YYYY-MM-DD
  end_date: string; // ISO / YYYY-MM-DD
  timezone?: string;
  daily_capacity_minutes?: number;
  weekly_capacity_minutes?: number;
}

export interface UpdateArcDto {
  name?: string;
  description?: string;
  status?: string;
  daily_capacity_minutes?: number;
  weekly_capacity_minutes?: number;
}

// 4. Tasks DTOs
export interface CreateTaskDto {
  arc_id: string;
  title: string;
  description?: string;
  category_id: string;
  estimated_minutes?: number;
  difficulty?: number;
  priority?: TaskPriority;
  scheduled_date?: string; // YYYY-MM-DD
  scheduled_start?: string; // HH:mm
  scheduled_end?: string; // HH:mm
  deadline?: string;
  status?: TaskStatus;
  origin?: TaskOrigin;
  verification_type?: VerificationType;
  source_document_id?: string;
  source_section_id?: string;
  depends_on_task_ids?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category_id?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  difficulty?: number;
  priority?: TaskPriority;
  scheduled_date?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  deadline?: string;
  status?: TaskStatus;
  verification_type?: VerificationType;
}

export interface CompleteTaskDto {
  actual_minutes?: number;
  notes?: string;
}

export interface CompleteTaskResponse {
  task: Task;
  scoreDelta: number;
  scoreEventId: string;
}

export interface SkipTaskDto {
  reason_code: string;
  reason_text?: string;
  commitment_phrase: string;
}

export interface SkipTaskResponse {
  task: Task;
  penalty: number;
  scoreEventId: string;
  nextOccurrence?: Task | null;
}

export interface AbandonTaskDto {
  reason: string;
  commitment_phrase: string;
  notes?: string;
}

export interface AbandonTaskResponse {
  task: Task;
  penalty: number;
  scoreEventId: string;
}

export interface RescheduleTaskDto {
  scheduled_date: string;
  scheduled_start?: string;
  scheduled_end?: string;
  reason?: string;
}

export interface RescheduleTaskResponse {
  originalTask: Task;
  rescheduledTask: Task;
}

// 5. Focus DTOs
export interface StartFocusDto {
  task_id?: string;
}

export interface CompleteFocusDto {
  duration_seconds: number;
}

// 6. Habits DTOs
export interface CreateHabitDto {
  arc_id: string;
  title: string;
  description?: string;
  category_id: string;
  frequency?: HabitFrequency;
  target_days?: string[];
  estimated_minutes?: number;
  active?: boolean;
}

export interface UpdateHabitDto {
  title?: string;
  description?: string;
  category_id?: string;
  frequency?: HabitFrequency;
  target_days?: string[];
  estimated_minutes?: number;
  active?: boolean;
}

// 7. Documents DTOs
export interface UploadDocumentDto {
  arc_id: string;
  file_type: DocumentFileType;
  content: string;
  filename: string;
}

// 8. Scheduling DTOs
export interface GenerateScheduleDto {
  arc_id: string;
  blackout_dates?: string[];
  pinned_task_ids?: string[];
}

// 9. GitHub DTOs
export interface ConnectGithubDto {
  github_username: string;
  oauth_token: string;
}

// 10. Workspaces DTOs
export interface CreateWorkspaceDto {
  name: string;
  slug: string;
}

export interface JoinWorkspaceDto {
  invite_code: string;
}

// 11. Categories DTOs
export interface CreateCategoryDto {
  name: string;
  slug: string;
  icon?: string;
  color_token?: string;
  priority?: number;
  weekly_target_minutes?: number;
}
