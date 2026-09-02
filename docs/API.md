# MEDUSA — API Specification (`/api/v1`)

All endpoints are prefixed with `/api/v1` and return standard JSON response envelopes:
- Success: `{ "data": T, "meta": { "timestamp": "ISO..." } }`
- Error: `{ "error": { "code": "ERROR_CODE", "message": "...", "details": ... } }`

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/signup`
- **Body**: `{ "name": "...", "email": "...", "password": "...", "timezone": "UTC", "commitment_phrase": "I ACCEPT THE COST" }`
- **Response**: `{ "user": { ... }, "tokens": { "access_token": "...", "refresh_token": "...", "expires_in": 900 } }`

### `POST /api/v1/auth/login`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "user": { ... }, "tokens": { "access_token": "...", "refresh_token": "..." } }`

### `POST /api/v1/auth/refresh`
- **Body**: `{ "refresh_token": "..." }`
- **Response**: `{ "user": { ... }, "tokens": { "access_token": "...", "refresh_token": "..." } }`

### `POST /api/v1/auth/logout`
- **Body**: `{ "refresh_token": "..." }`
- **Response**: `{ "success": true }`

---

## 2. Tasks (`/api/v1/tasks`)

### `POST /api/v1/tasks`
- **Auth**: Bearer Token
- **Body**: `{ "arc_id": "...", "title": "...", "description": "...", "category_id": "...", "estimated_minutes": 60, "difficulty": 2, "priority": "HIGH", "scheduled_date": "2026-09-02" }`
- **Response**: Task object with initial revision v1 and immutable TaskEvent.

### `GET /api/v1/tasks`
- **Query**: `?arcId=...&date=...&status=...&categoryId=...`
- **Response**: Array of Task objects.

### `GET /api/v1/tasks/:id`
- **Response**: Task detail with revisions, events, dependencies, category.

### `PATCH /api/v1/tasks/:id`
- **Body**: `{ "title": "...", "estimated_minutes": 90, ... }`
- **Note**: If definition fields change, creates revision v2+ with `user_modified: true`.

### `POST /api/v1/tasks/:id/complete`
- **Body**: `{ "actual_minutes": 85, "notes": "..." }`
- **Behavior**: Verifies status (`PENDING` or `IN_PROGRESS`), marks `COMPLETED`, creates `TaskEvent`, triggers `ScoringService`, updates `ArcDay`.

### `POST /api/v1/tasks/:id/skip`
- **Body**: `{ "reason_code": "SCHEDULE_CONFLICT", "reason_text": "", "commitment_phrase": "I ACCEPT THE COST" }`
- **Behavior**: Validates commitment phrase (case-insensitive trimmed), applies skip penalty (-15), resets streak to 0, creates `TaskEvent`, schedules next occurrence for next day.

### `POST /api/v1/tasks/:id/abandon`
- **Body**: `{ "reason": "No longer relevant", "commitment_phrase": "I ACCEPT THE COST" }`
- **Behavior**: Permanent terminal state, applies abandon penalty (-25).

### `POST /api/v1/tasks/:id/reschedule`
- **Body**: `{ "scheduled_date": "2026-09-05", "reason": "Postponed" }`
- **Behavior**: Marks original task `RESCHEDULED`, creates new task linked via `rescheduled_from_task_id`.

### `GET /api/v1/tasks/:id/revisions`
- **Response**: Array of `TaskRevision` entries ordered by version descending.

---

## 3. Arcs & ArcDays (`/api/v1/arcs`)

### `POST /api/v1/arcs`
- **Body**: `{ "name": "...", "start_date": "2026-09-01", "end_date": "2026-10-01", "daily_capacity_minutes": 360 }`
- **Response**: Created Arc with initialized `UserStats` and daily `ArcDay` records.

### `GET /api/v1/arcs/:arcId/days/:date`
- **Response**: Day detail including scheduled tasks and focus sessions.

### `POST /api/v1/arcs/:arcId/days/:date/close`
- **Behavior**: Authoritative daily closure. Converts pending/in-progress tasks to `MISSED`, aggregates minutes, evaluates perfect day bonus (+20), updates streaks, and emits `day.closed`.

---

## 4. Scheduling (`/api/v1/scheduling`)

### `POST /api/v1/scheduling/plans/generate`
- **Body**: `{ "arc_id": "...", "blackout_dates": ["2026-09-03"], "pinned_task_ids": [...] }`
- **Response**: Generated `SchedulePlan` (DRAFT) with topological sorting, capacity allocation, dependency ordering, and deadline enforcement.

### `POST /api/v1/scheduling/plans/:id/accept`
- **Behavior**: Applies plan dates to target tasks and sets plan status to `ACCEPTED`.

---

## 5. Document Ingestion (`/api/v1/documents`)

### `POST /api/v1/documents/upload`
- **Body**: `{ "arc_id": "...", "filename": "curriculum.md", "file_type": "MARKDOWN", "content": "..." }`
- **Behavior**: Uploads to storage, initiates background parser, chunker, and LLM task extraction pipeline.

### `GET /api/v1/documents/:id`
- **Response**: SourceDocument detail with hierarchical sections, chunks, and generated tasks.

---

## 6. GitDot & Analytics (`/api/v1/analytics`)

### `GET /api/v1/analytics/activity-graph`
- **Query**: `?arcId=...&mode=EXECUTION` (Modes: `EXECUTION`, `SCORE`, `FOCUS`, `TASKS`, `GITHUB`)
- **Response**: Array of daily cells: `{ "date": "2026-09-02", "level": 4, "execution_percent": 82, "tasks_completed": 9, "tasks_planned": 11, "deep_work_minutes": 240, "score_delta": 84 }`

### `GET /api/v1/analytics/war-report`
- **Query**: `?arcId=...`
- **Response**: Comprehensive performance summary (execution %, completed, missed, skipped, reschedules, deep work, GitHub verifications, best/weakest category, findings, tags).

---

## 7. Focus Sessions (`/api/v1/focus`)

### `POST /api/v1/focus/start`
- **Body**: `{ "task_id": "..." }`
- **Response**: Active `FocusSession`.

### `POST /api/v1/focus/:id/complete`
- **Body**: `{ "duration_seconds": 3600 }`
- **Behavior**: Marks session `COMPLETED`, adds deep work minutes to `ArcDay`, awards score points (1 pt per 15 min).

---

## 8. GitHub Integration (`/api/v1/github`)

### `POST /api/v1/github/connect`
- **Body**: `{ "github_username": "...", "oauth_token": "..." }`
- **Behavior**: Encrypts token with AES-256 and connects account.

### `POST /api/v1/github/verify-today`
- **Query**: `?arcId=...&date=2026-09-02`
- **Behavior**: Polls GitHub commits/PRs, marks tasks `VERIFIED`, auto-completes pending tasks, or flags discrepancies (`UNVERIFIED`).

---

## 9. Accountability & Achievements (`/api/v1/accountability`, `/api/v1/achievements`)

### `POST /api/v1/accountability/evaluate`
- **Behavior**: Runs deterministic rule engine against user statistics and immutable task events to generate behavioral findings and tags (`RESCHEDULE_ADDICT`, `EXCUSE_PATTERN`, `IRON_STREAK`, `SHIPPER`, `DEEP_WORKER`, `NO_QUIT`).

### `GET /api/v1/achievements`
- **Response**: List of achievements with unlock timestamps.

---

## 10. Workspaces & Leaderboard (`/api/v1/workspaces`)

### `POST /api/v1/workspaces`
- **Body**: `{ "name": "Alpha Squad", "slug": "alphasquad" }`
- **Response**: Created workspace with unique invite code.

### `POST /api/v1/workspaces/join`
- **Body**: `{ "invite_code": "MEDUSA-ALPHA100" }`

### `GET /api/v1/workspaces/:id/leaderboard`
- **Response**: Ranked leaderboard with public aggregate metrics only (`userId`, `name`, `score`, `streak`, `executionPercent`, `lastActiveDate`, `rank`).
