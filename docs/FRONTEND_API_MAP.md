# MEDUSA — Frontend to Backend API Mapping Matrix

| Backend Controller | HTTP Route | Frontend API Function | Primary UI Route |
| :--- | :--- | :--- | :--- |
| `AuthController` | `POST /auth/signup` | `authApi.signup(dto)` | `/signup` |
| `AuthController` | `POST /auth/login` | `authApi.login(dto)` | `/login` |
| `AuthController` | `POST /auth/refresh` | `authApi.refresh(dto)` | Auto-interceptor |
| `AuthController` | `POST /auth/logout` | `authApi.logout(dto)` | Header Logout button |
| `UsersController` | `GET /users/me` | `usersApi.getProfile()` | `/settings`, Header |
| `UsersController` | `PATCH /users/me` | `usersApi.updateProfile(dto)`| `/settings` |
| `ArcsController` | `POST /arcs` | `arcsApi.create(dto)` | `/arcs` |
| `ArcsController` | `GET /arcs` | `arcsApi.list()` | `/arcs`, `/dashboard` |
| `ArcsController` | `GET /arcs/:id` | `arcsApi.getById(id)` | `/arcs/[id]` |
| `ArcDaysController`| `GET /arcs/:arcId/days` | `arcDaysApi.listDays(arcId)` | `/arcs/[id]` |
| `ArcDaysController`| `GET /arcs/:arcId/days/:date` | `arcDaysApi.getDay(arcId, date)`| `/dashboard` |
| `ArcDaysController`| `POST /arcs/:arcId/days/:date/close`| `arcDaysApi.closeDay(arcId, date)`| `/dashboard`, `/arcs/[id]` |
| `TasksController` | `POST /tasks` | `tasksApi.create(dto)` | `/tasks`, `/dashboard` |
| `TasksController` | `GET /tasks` | `tasksApi.list(filters)` | `/tasks`, `/dashboard` |
| `TasksController` | `GET /tasks/:id` | `tasksApi.getById(id)` | `/tasks/[id]` |
| `TasksController` | `PATCH /tasks/:id` | `tasksApi.update(id, dto)` | `/tasks/[id]` |
| `TasksController` | `POST /tasks/:id/complete` | `tasksApi.complete(id, dto)` | Task Card |
| `TasksController` | `POST /tasks/:id/skip` | `tasksApi.skip(id, dto)` | Task Card |
| `TasksController` | `POST /tasks/:id/abandon` | `tasksApi.abandon(id, dto)` | Task Card |
| `TasksController` | `POST /tasks/:id/reschedule`| `tasksApi.reschedule(id, dto)` | Task Card |
| `TasksController` | `DELETE /tasks/:id` | `tasksApi.delete(id)` | Task Card (Backlog) |
| `TaskRevisionsService`| `GET /tasks/:id/revisions`| `tasksApi.getRevisions(id)` | `/tasks/[id]` |
| `CategoriesController`| `GET /categories` | `categoriesApi.list()` | Category Selectors |
| `FocusController` | `POST /focus/start` | `focusApi.start(dto)` | `/focus`, `/dashboard` |
| `FocusController` | `POST /focus/:id/complete`| `focusApi.complete(id, dto)`| `/focus`, `/dashboard` |
| `FocusController` | `POST /focus/:id/cancel` | `focusApi.cancel(id)` | `/focus`, `/dashboard` |
| `FocusController` | `GET /focus` | `focusApi.list()` | `/focus` |
| `HabitsController`| `POST /habits` | `habitsApi.create(dto)` | `/habits` |
| `HabitsController`| `GET /habits` | `habitsApi.list(arcId)` | `/habits` |
| `HabitsController`| `POST /habits/generate-daily`| `habitsApi.generateDaily(arcId, date)`| `/habits` |
| `DocumentsController`| `POST /documents/upload`| `documentsApi.upload(dto)` | `/documents` |
| `DocumentsController`| `GET /documents` | `documentsApi.list(arcId)` | `/documents` |
| `DocumentsController`| `GET /documents/:id` | `documentsApi.getById(id)` | `/documents/[id]` |
| `SchedulingController`| `POST /scheduling/plans/generate`| `schedulingApi.generate(dto)`| `/schedule` |
| `SchedulingController`| `POST /scheduling/plans/:id/accept`| `schedulingApi.accept(id)`| `/schedule` |
| `SchedulingController`| `GET /scheduling/plans/latest`| `schedulingApi.getLatest(arcId)`| `/schedule` |
| `AnalyticsController`| `GET /analytics/activity-graph`| `analyticsApi.getActivityGraph(arcId, mode)`| `/analytics`, `/dashboard`|
| `AnalyticsController`| `GET /analytics/war-report`| `analyticsApi.getWarReport(arcId)`| `/analytics` |
| `GithubController` | `POST /github/connect` | `githubApi.connect(dto)` | `/github` |
| `GithubController` | `POST /github/disconnect`| `githubApi.disconnect()` | `/github` |
| `GithubController` | `POST /github/verify-today`| `githubApi.verifyToday(arcId, date)`| `/github` |
| `AccountabilityController`| `POST /accountability/evaluate`| `accountabilityApi.evaluate(arcId)`| `/accountability` |
| `AccountabilityController`| `GET /accountability/tags`| `accountabilityApi.listTags()` | `/accountability`, `/dashboard`|
| `AccountabilityController`| `GET /accountability/findings`| `accountabilityApi.listFindings(arcId)`| `/accountability` |
| `AchievementsController`| `GET /achievements` | `achievementsApi.list()` | `/achievements` |
| `WorkspacesController`| `POST /workspaces` | `workspacesApi.create(dto)` | `/workspaces` |
| `WorkspacesController`| `POST /workspaces/join`| `workspacesApi.join(dto)` | `/workspaces` |
| `WorkspacesController`| `GET /workspaces` | `workspacesApi.list()` | `/workspaces` |
| `WorkspacesController`| `GET /workspaces/:id/leaderboard`| `workspacesApi.getLeaderboard(id)`| `/workspaces/[id]/leaderboard`|
| `NotificationsController`| `GET /notifications` | `notificationsApi.list()` | `/notifications` |
| `NotificationsController`| `PATCH /notifications/:id/read`| `notificationsApi.markRead(id)`| `/notifications` |
| `NotificationsController`| `GET /notifications/preferences`| `notificationsApi.getPreferences()`| `/notifications` |
| `NotificationsController`| `PATCH /notifications/preferences`| `notificationsApi.updatePreference(dto)`| `/notifications` |
