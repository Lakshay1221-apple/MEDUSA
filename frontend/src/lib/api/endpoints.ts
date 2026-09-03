import { apiClient } from './client';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseData,
  UpdateUserDto,
  CreateArcDto,
  UpdateArcDto,
  CreateTaskDto,
  UpdateTaskDto,
  CompleteTaskDto,
  CompleteTaskResponse,
  SkipTaskDto,
  SkipTaskResponse,
  AbandonTaskDto,
  AbandonTaskResponse,
  RescheduleTaskDto,
  RescheduleTaskResponse,
  StartFocusDto,
  CompleteFocusDto,
  CreateHabitDto,
  UpdateHabitDto,
  UploadDocumentDto,
  GenerateScheduleDto,
  ConnectGithubDto,
  CreateWorkspaceDto,
  JoinWorkspaceDto,
  CreateCategoryDto,
} from '../types/api';
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
  AccountabilityFinding,
  AccountabilityTag,
  AchievementItem,
  GitDotCell,
  WarReport,
  Workspace,
  WorkspaceLeaderboardEntry,
  NotificationItem,
  NotificationPreference,
  GitDotMode,
  TaskStatus,
} from '../types/domain';

// 1. Auth API
export const authApi = {
  signup: (dto: SignupDto) => apiClient.post<AuthResponseData>('/auth/signup', dto),
  login: (dto: LoginDto) => apiClient.post<AuthResponseData>('/auth/login', dto),
  refresh: (dto: RefreshTokenDto) => apiClient.post<AuthResponseData>('/auth/refresh', dto),
  logout: (dto: RefreshTokenDto) => apiClient.post<{ success: boolean }>('/auth/logout', dto),
};

// 2. Users API
export const usersApi = {
  getProfile: () => apiClient.get<User>('/users/me'),
  updateProfile: (dto: UpdateUserDto) => apiClient.patch<User>('/users/me', dto),
};

// 3. Arcs API
export const arcsApi = {
  create: (dto: CreateArcDto) => apiClient.post<Arc>('/arcs', dto),
  list: () => apiClient.get<Arc[]>('/arcs'),
  getById: (id: string) => apiClient.get<Arc>(`/arcs/${id}`),
  update: (id: string, dto: UpdateArcDto) => apiClient.patch<Arc>(`/arcs/${id}`, dto),
};

// 4. Arc Days API
export const arcDaysApi = {
  listDays: (arcId: string) => apiClient.get<ArcDay[]>(`/arcs/${arcId}/days`),
  getDay: (arcId: string, date: string) => apiClient.get<ArcDay>(`/arcs/${arcId}/days/${date}`),
  closeDay: (arcId: string, date: string) =>
    apiClient.post<{ arcDay: ArcDay; stats: any }>(`/arcs/${arcId}/days/${date}/close`),
};

// 5. Tasks API
export const tasksApi = {
  create: (dto: CreateTaskDto) => apiClient.post<Task>('/tasks', dto),
  list: (filters?: { arcId?: string; date?: string; status?: TaskStatus; categoryId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.arcId) params.append('arcId', filters.arcId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    const query = params.toString();
    return apiClient.get<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  update: (id: string, dto: UpdateTaskDto) => apiClient.patch<Task>(`/tasks/${id}`, dto),
  complete: (id: string, dto?: CompleteTaskDto) =>
    apiClient.post<CompleteTaskResponse>(`/tasks/${id}/complete`, dto || {}),
  skip: (id: string, dto: SkipTaskDto) =>
    apiClient.post<SkipTaskResponse>(`/tasks/${id}/skip`, dto),
  abandon: (id: string, dto: AbandonTaskDto) =>
    apiClient.post<AbandonTaskResponse>(`/tasks/${id}/abandon`, dto),
  reschedule: (id: string, dto: RescheduleTaskDto) =>
    apiClient.post<RescheduleTaskResponse>(`/tasks/${id}/reschedule`, dto),
  delete: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/tasks/${id}`),
  getRevisions: (id: string) => apiClient.get<TaskRevision[]>(`/tasks/${id}/revisions`),
};

// 6. Categories API
export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories'),
  create: (dto: CreateCategoryDto) => apiClient.post<Category>('/categories', dto),
};

// 7. Focus API
export const focusApi = {
  start: (dto: StartFocusDto) => apiClient.post<FocusSession>('/focus/start', dto),
  complete: (id: string, dto: CompleteFocusDto) =>
    apiClient.post<{ session: FocusSession; points: number }>(`/focus/${id}/complete`, dto),
  cancel: (id: string) => apiClient.post<FocusSession>(`/focus/${id}/cancel`),
  list: () => apiClient.get<FocusSession[]>('/focus'),
};

// 8. Habits API
export const habitsApi = {
  create: (dto: CreateHabitDto) => apiClient.post<Habit>('/habits', dto),
  list: (arcId: string) => apiClient.get<Habit[]>(`/habits?arcId=${arcId}`),
  update: (id: string, dto: UpdateHabitDto) => apiClient.patch<Habit>(`/habits/${id}`, dto),
  generateDaily: (arcId: string, date: string) =>
    apiClient.post<Task[]>(`/habits/generate-daily?arcId=${arcId}&date=${date}`),
};

// 9. Documents API
export const documentsApi = {
  upload: (dto: UploadDocumentDto) => apiClient.post<SourceDocument>('/documents/upload', dto),
  list: (arcId: string) => apiClient.get<SourceDocument[]>(`/documents?arcId=${arcId}`),
  getById: (id: string) => apiClient.get<SourceDocument>(`/documents/${id}`),
  retry: (id: string) => apiClient.post<{ message: string; documentId: string }>(`/documents/${id}/retry`),
};

// 10. Scheduling API
export const schedulingApi = {
  generate: (dto: GenerateScheduleDto) =>
    apiClient.post<SchedulePlan>('/scheduling/plans/generate', dto),
  accept: (id: string) => apiClient.post<SchedulePlan>(`/scheduling/plans/${id}/accept`),
  getLatest: (arcId: string) =>
    apiClient.get<SchedulePlan | null>(`/scheduling/plans/latest?arcId=${arcId}`),
};

// 11. Analytics & Activity API
export const analyticsApi = {
  getActivityGraph: (arcId?: string, mode?: GitDotMode) => {
    const params = new URLSearchParams();
    if (arcId) params.append('arcId', arcId);
    if (mode) params.append('mode', mode);
    const query = params.toString();
    return apiClient.get<GitDotCell[]>(`/analytics/activity-graph${query ? `?${query}` : ''}`);
  },
  getWarReport: (arcId: string) => apiClient.get<WarReport>(`/analytics/war-report?arcId=${arcId}`),
};

// 12. GitHub API
export const githubApi = {
  connect: (dto: ConnectGithubDto) =>
    apiClient.post<{ success: boolean; username: string }>('/github/connect', dto),
  disconnect: () => apiClient.post<{ success: boolean }>('/github/disconnect'),
  verifyToday: (arcId: string, date: string) =>
    apiClient.post<{
      verifiedCount: number;
      discrepancyCount: number;
      verifiedTasks: Task[];
    }>(`/github/verify-today?arcId=${arcId}&date=${date}`),
};

// 13. Accountability API
export const accountabilityApi = {
  evaluate: (arcId: string) =>
    apiClient.post<{ findings: AccountabilityFinding[]; assignedTags: AccountabilityTag[] }>(
      `/accountability/evaluate?arcId=${arcId}`,
    ),
  listTags: () => apiClient.get<AccountabilityTag[]>('/accountability/tags'),
  listFindings: (arcId: string) =>
    apiClient.get<AccountabilityFinding[]>(`/accountability/findings?arcId=${arcId}`),
};

// 14. Achievements API
export const achievementsApi = {
  list: () => apiClient.get<AchievementItem[]>('/achievements'),
};

// 15. Workspaces API
export const workspacesApi = {
  create: (dto: CreateWorkspaceDto) => apiClient.post<Workspace>('/workspaces', dto),
  join: (dto: JoinWorkspaceDto) =>
    apiClient.post<{ message: string; workspace: Workspace }>('/workspaces/join', dto),
  list: () => apiClient.get<Workspace[]>('/workspaces'),
  getLeaderboard: (id: string) =>
    apiClient.get<{ workspace: Workspace; leaderboard: WorkspaceLeaderboardEntry[] }>(
      `/workspaces/${id}/leaderboard`,
    ),
};

// 16. Notifications API
export const notificationsApi = {
  list: () => apiClient.get<NotificationItem[]>('/notifications'),
  markRead: (id: string) => apiClient.patch<NotificationItem>(`/notifications/${id}/read`),
  getPreferences: () => apiClient.get<NotificationPreference[]>('/notifications/preferences'),
  updatePreference: (body: {
    notification_type: string;
    enabled: boolean;
    channel?: string;
  }) => apiClient.patch<NotificationPreference>('/notifications/preferences', body),
};
