Yes. I checked the backend prompt you uploaded, and I would **not just append the word Medusa to it**. The original prompt is a good backend foundation, but the new product direction changes several architectural requirements:

* Product is now **Medusa**.
* Backend is **shared by Web + Android**.
* We build **Web first**, then package/build the Android app.
* AI-generated tasks are **editable by the user**.
* Task revisions/history must be preserved.
* GitDot/Execution Graph is a backend-supported feature.
* Notifications are core.
* Focus/deep-work tracking is part of the system.
* Accountability/tags need backend support.
* The API must be a clean contract so the future mobile client doesn't require backend changes.
* We should deliberately avoid building anything Android-specific into the backend.

Your existing prompt correctly emphasized backend-only implementation, NestJS, PostgreSQL, Redis, BullMQ, exhaustive testing, and API documentation. 

Below is the **replacement master prompt** I'd give Antigravity.

---

# 🐍 MEDUSA — MASTER BACKEND BUILD PROMPT

> **Paste this entire prompt into Antigravity.**
>
> Run **Plan Mode first**. Do not start implementation immediately.
>
> The backend is being built first. The frontend will be built afterward.
>
> **Do NOT build any frontend, Android UI, React components, or mobile code in this task.**

---

## 1. PROJECT

Build the production-grade backend for a product called:

# MEDUSA

### Tagline

**Execution Enforcement System**

Medusa is a fixed-duration personal execution platform.

It takes a user's curriculum/syllabus, automatically understands it, converts it into structured tasks, lets the user modify those tasks, schedules them across an Arc, tracks execution, verifies work where possible, calculates an Arc Score, analyzes behavioral patterns, and enforces accountability.

This is **not a generic todo application**.

The central loop is:

```text
DOCUMENT
   ↓
AI UNDERSTANDING
   ↓
TASK GENERATION
   ↓
USER REVIEW / EDIT
   ↓
BACKLOG
   ↓
SCHEDULING
   ↓
DAILY EXECUTION
   ↓
VERIFICATION
   ↓
SCORE
   ↓
STREAK
   ↓
ACCOUNTABILITY
   ↓
ANALYTICS
   ↓
NEXT DAY
```

---

# 2. CRITICAL ARCHITECTURAL REQUIREMENT

## One backend. Multiple clients.

Medusa will have:

```text
                    MEDUSA BACKEND
                          │
             ┌────────────┴────────────┐
             │                         │
         WEB CLIENT              ANDROID CLIENT
         Phase 1                  Phase 2
```

The backend must **not know or care** whether the request comes from:

```text
Next.js Web
Android APK
Future iOS app
Future desktop client
```

The backend exposes a clean versioned API.

Therefore:

```text
Web ───────┐
           ├── /api/v1 ── Medusa Backend
Android ───┘
```

Do not create web-specific business logic.

Do not create Android-specific business logic.

Do not put important logic in the frontend.

The server is the source of truth.

---

# 3. DEVELOPMENT ORDER

The overall Medusa project will be built in this order:

### Phase A — Backend

You are responsible for this task.

```text
Database
API
Authentication
Business logic
AI ingestion
Scheduling
Scoring
GitHub verification
Notifications
Accountability
Analytics
WebSockets
Queues
Testing
Documentation
Docker
```

### Phase B — Web

A separate task will build:

```text
Next.js
React
Tailwind
Dashboard
Today
Backlog
Upload
Analytics
GitDot
Squad
Settings
```

### Phase C — Android

Only after the web application works correctly:

```text
Existing web frontend
       ↓
PWA
       ↓
Capacitor
       ↓
Android
       ↓
APK
```

The backend should require **zero architectural changes** when Android is introduced.

---

# 4. BEFORE WRITING CODE

Enter Plan Mode.

Produce a detailed implementation plan containing:

1. Architecture
2. Module boundaries
3. Database schema
4. Entity relationships
5. API contract
6. Event architecture
7. Queue architecture
8. Authentication architecture
9. AI architecture
10. Scheduling architecture
11. Scoring architecture
12. Accountability architecture
13. Notification architecture
14. GitHub integration
15. WebSocket architecture
16. GitDot data aggregation
17. Security model
18. Testing strategy
19. Docker development environment
20. Migration strategy
21. API versioning strategy
22. Error-handling strategy
23. Idempotency strategy

Most importantly:

## Produce a complete test matrix before implementation.

Every correctness-critical behavior must have tests.

Do not proceed with implementation until the plan is coherent.

---

# 5. TECHNOLOGY STACK

Use this stack unless there is a strong technical reason to change it.

### API

```text
Node.js
NestJS
TypeScript
```

### Database

```text
PostgreSQL
Prisma
```

### Cache / distributed state

```text
Redis
```

### Background jobs

```text
BullMQ
```

### Authentication

```text
JWT
Refresh Tokens
Argon2 or bcrypt
```

### Realtime

```text
NestJS WebSocket Gateway
Socket.IO
Redis Pub/Sub
```

### Testing

```text
Jest
Supertest
```

### Local development

```text
Docker
Docker Compose
```

### Object storage

S3-compatible storage.

---

# 6. BACKEND ARCHITECTURE

Structure the application around domain modules.

```text
src/

├── auth/
├── users/
├── arcs/
├── arc-days/
│
├── documents/
├── curriculum/
├── tasks/
├── task-revisions/
├── scheduling/
│
├── habits/
├── focus/
│
├── scoring/
├── streaks/
├── accountability/
├── achievements/
│
├── github/
├── notifications/
├── analytics/
├── activity/
│
├── workspaces/
├── realtime/
│
├── storage/
├── ai/
│
├── common/
├── config/
├── database/
└── workers/
```

Do not turn the application into one giant `TasksService`.

Each domain should have clear responsibilities.

---

# 7. CORE DATABASE MODEL

Implement the following entities.

---

## User

```text
id
name
email
password_hash
timezone
github_username
github_oauth_token_encrypted
commitment_phrase
created_at
updated_at
```

---

## Arc

```text
id
user_id
name
description
start_date
end_date
timezone
daily_capacity_minutes
weekly_capacity_minutes
status
created_at
updated_at
```

Statuses:

```text
PLANNED
ACTIVE
PAUSED
COMPLETED
ARCHIVED
```

---

# 8. ArcDay

This is a first-class entity.

```text
id
arc_id
date

planned_minutes
completed_minutes
deep_work_minutes

planned_tasks
completed_tasks
missed_tasks
skipped_tasks
abandoned_tasks

score_delta

status

opened_at
closed_at
created_at
updated_at
```

This entity powers:

* daily analytics
* historical reports
* GitDot
* streak calculations
* War Reports

---

# 9. Category

Do not hard-code categories into business logic.

Support:

```text
AI_ML
BACKEND
DEVOPS
SYSTEM_DESIGN
CPP
OPEN_SOURCE
GITHUB
ACADEMICS
GYM
MIND
READING
FREELANCING
PROJECT
OTHER
```

But design the system so users can create custom categories.

Fields:

```text
id
user_id nullable
name
slug
icon
color_token
priority
weekly_target_minutes
created_at
```

---

# 10. SourceDocument

```text
id
user_id
arc_id

file_type
original_filename
storage_key
storage_url

content_hash

status
error_message

uploaded_at
processed_at
created_at
updated_at
```

Statuses:

```text
UPLOADED
PARSING
OCR
EXTRACTING
REVIEW
COMPLETED
FAILED
```

---

# 11. DocumentSection

Preserve curriculum hierarchy.

```text
id
document_id
parent_id

title
section_type
order_index

source_page
source_text

created_at
```

This allows:

```text
Document
 └── Module
      └── Section
           └── Topic
                └── Task
```

---

# 12. DocumentChunk

```text
id
document_id
section_id

chunk_index
content

extraction_status
extraction_attempts

created_at
updated_at
```

---

# 13. Task

The Task model must support AI-generated tasks AND user-created tasks.

```text
id
user_id
arc_id

title
description

origin
AI | USER

category_id

source_document_id nullable
source_section_id nullable

estimated_minutes
difficulty
priority

scheduled_date
scheduled_start
scheduled_end

deadline

status

verification_type
verification_status

parent_task_id nullable
rescheduled_from_task_id nullable

current_revision_id

created_at
updated_at
```

---

# 14. CRITICAL — USER EDITING OF AI TASKS

AI-generated tasks are **not immutable**.

The user MUST be able to modify them.

Editable fields:

```text
title
description
category
estimated_minutes
difficulty
priority
scheduled date
deadline
verification type
dependencies
```

Users must also be able to:

```text
Split task
Merge tasks
Delete task
Restore task
Convert to recurring task
```

---

# 15. TaskRevision

Never overwrite historical task definitions.

Create:

```text
TaskRevision

id
task_id
version

title
description
category_id

estimated_minutes
difficulty
priority

changed_by
AI
USER
SYSTEM

created_at
```

Example:

```text
AI:
"Study Redis"

↓

USER:
"Study Redis + build caching demo"

↓

Revision 2
```

The API must allow the frontend to retrieve revision history.

---

# 16. Task Ownership

Every task must know where it originated.

```text
origin = AI
```

or

```text
origin = USER
```

If an AI task is modified:

```text
origin = AI
user_modified = true
```

Never destroy the original AI-generated version.

---

# 17. Task Dependencies

Support:

```text
Task A
   ↓
Task B
   ↓
Task C
```

A task should not be scheduled before its dependency unless explicitly overridden.

Create:

```text
TaskDependency

id
task_id
depends_on_task_id
type
```

---

# 18. Task Events

This table is immutable.

```text
TaskEvent

id
task_id
user_id

from_status
to_status

event_type

reason_code
reason_text

metadata

actor
USER
AI
SYSTEM
GITHUB

occurred_at
```

There must be:

**NO UPDATE endpoint.**

**NO DELETE endpoint.**

---

# 19. TASK STATE MACHINE

Implement explicit state transitions.

```text
BACKLOG
   ↓
PENDING
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

Alternative:

```text
PENDING
   ↓
MISSED
   ↓
RESCHEDULED
   ↓
PENDING
```

Skip:

```text
PENDING
   ↓
SKIPPED
   ↓
RESCHEDULED
   ↓
PENDING
```

Abandon:

```text
PENDING
   ↓
ABANDONED
```

Invalid transitions must be rejected.

---

# 20. COMPLETE TASK

```http
POST /api/v1/tasks/:id/complete
```

Must:

1. Verify ownership.
2. Verify current status.
3. Prevent double completion.
4. Create TaskEvent.
5. Update task state.
6. Trigger Scoring Service.
7. Update relevant ArcDay.
8. Emit domain event.
9. Trigger analytics updates.
10. Potentially trigger achievement/tag evaluation.

Everything must be transactional where necessary.

---

# 21. SKIP TASK

```http
POST /api/v1/tasks/:id/skip
```

Required:

```json
{
  "reason_code": "SCHEDULE_CONFLICT",
  "reason_text": "",
  "commitment_phrase": "I ACCEPT THE COST"
}
```

Server must verify:

```text
reason
+
commitment phrase
+
task state
+
ownership
```

Commitment phrase comparison:

```text
trim whitespace
case insensitive
exact match
```

---

# 22. SKIP CONSEQUENCES

Successful skip:

```text
Task → SKIPPED

TaskEvent created

Score penalty

Current streak → 0

New task occurrence created for next eligible day

Analytics updated

Accountability evaluation triggered

Notification generated
```

Never silently delete the original task.

---

# 23. ABANDON TASK

Create:

```http
POST /api/v1/tasks/:id/abandon
```

Requires:

```text
reason
commitment phrase
explicit confirmation
```

Abandonment must be recorded permanently.

---

# 24. RESCHEDULING

Support:

```http
POST /api/v1/tasks/:id/reschedule
```

Rescheduling creates a new occurrence/revision according to the domain model.

Never erase the original history.

Maintain the chain safely:

```text
Task A
 ↓
Task B
 ↓
Task C
```

No infinite recursive corruption.

---

# 25. SCORING SERVICE

The Scoring Service is the **single source of truth** for score and execution statistics.

No controller may directly modify:

```text
score
current_streak
longest_streak
total_completed
total_skipped
```

---

# 26. SCORE EVENTS

Create:

```text
ScoreEvent

id
user_id
arc_id
task_event_id

delta
reason
metadata

occurred_at
```

Score must be an event ledger.

---

# 27. CONFIGURABLE SCORING

Never hard-code point values.

Support configuration:

```text
SCHEDULED_POINTS
HABIT_POINTS
SKIP_PENALTY
ABANDON_PENALTY
PERFECT_DAY_BONUS
DIFFICULTY_MULTIPLIER
DEEP_WORK_POINTS
GITHUB_VERIFICATION_POINTS
OSS_POINTS
```

The configuration should be environment/database backed.

---

# 28. STREAKS

Track:

```text
current_streak
longest_streak
```

A skip immediately breaks the current streak.

Longest streak must never decrease.

Daily closure determines perfect-day bonuses.

---

# 29. HABITS

Support recurring tasks:

```text
Gym
Mind
GitHub
C++
Reading
Custom
```

Habit templates:

```text
Habit

id
user_id
arc_id
title
category
frequency
target
active
created_at
```

Generate occurrences idempotently.

Repeated requests for the same day must never create duplicates.

---

# 30. AUTO SCHEDULER

Implement a backend scheduling engine.

Inputs:

```text
Arc
Available capacity
Tasks
Estimated duration
Difficulty
Priority
Categories
Dependencies
Deadlines
Blackout dates
Pinned dates
Recurring habits
Existing schedule
Historical execution
```

Scheduler output:

```text
SchedulePlan
```

---

# 31. SchedulePlan

```text
id
arc_id
generated_at
status
algorithm_version
```

Statuses:

```text
DRAFT
ACCEPTED
SUPERSEDED
```

---

# 32. ScheduleItem

```text
id
schedule_plan_id
task_id

date
start_time
end_time

reason
```

The frontend should be able to display the generated plan before acceptance.

---

# 33. USER OVERRIDE OF AI SCHEDULE

Users must be able to manually change:

```text
date
time
duration
priority
```

The scheduler must respect user overrides.

Never blindly regenerate and overwrite them.

---

# 34. ADAPTIVE SCHEDULING

Eventually account for execution behavior.

Example:

```text
Estimated: 90m
Actual: 150m

Repeated 4 times

→ Scheduler learns estimation drift
```

Store actual task duration.

Do not make the adaptive system dependent on an LLM.

Use deterministic rules first.

---

# 35. DOCUMENT INGESTION

Support:

```text
PDF
Markdown
TXT
```

Pipeline:

```text
Upload
 ↓
S3
 ↓
Document record
 ↓
BullMQ job
 ↓
Parser
 ↓
OCR if necessary
 ↓
Structure extraction
 ↓
Chunking
 ↓
LLM
 ↓
Schema validation
 ↓
Task generation
 ↓
Review state
```

---

# 36. AI EXTRACTION

LLM must return structured data.

Example:

```json
{
  "tasks": [
    {
      "title": "Learn LCEL",
      "description": "Understand LCEL composition",
      "category": "AI_ML",
      "estimated_minutes": 90,
      "difficulty": 3,
      "priority": "HIGH"
    }
  ]
}
```

Validate strictly.

Malformed output:

```text
Retry once
 ↓
Still invalid
 ↓
Flag chunk
 ↓
Manual review
```

Never silently lose extracted content.

---

# 37. RE-UPLOAD DIFFING

If the user uploads a newer version:

```text
Old Document
+
New Document
 ↓
Diff Engine
```

Detect:

```text
Added
Removed
Changed
Unchanged
```

User-modified tasks must not be overwritten automatically.

---

# 38. GITHUB INTEGRATION

Support GitHub OAuth.

Store OAuth tokens encrypted.

Support:

```text
connect
disconnect
verify today
activity history
```

---

# 39. GITHUB WORKER

BullMQ worker periodically checks GitHub activity.

If:

```text
GitHub habit exists
+
matching activity exists
```

then:

```text
GitHub verification
 ↓
Task completion
 ↓
Scoring Service
```

Never bypass the normal scoring path.

---

# 40. GITHUB RECONCILIATION

If:

```text
User manually completed GitHub task
```

but later:

```text
No matching GitHub activity
```

mark:

```text
verification_status = UNVERIFIED
```

Do not silently claw back points.

Record the discrepancy.

---

# 41. FOCUS SESSIONS

Implement deep-work sessions.

```text
FocusSession

id
user_id
task_id

started_at
ended_at
duration_seconds

status
```

Statuses:

```text
ACTIVE
COMPLETED
CANCELLED
```

Use this for:

* deep-work analytics
* Arc Score
* daily reports
* GitDot intensity

---

# 42. GITDOT / EXECUTION GRAPH

This is a first-class backend feature.

The frontend will render a GitHub-style contribution graph.

Backend endpoint:

```http
GET /api/v1/analytics/activity-graph
```

Each day should expose aggregated activity.

Example:

```json
{
  "date": "2026-09-18",
  "level": 4,
  "execution_percent": 82,
  "tasks_completed": 9,
  "tasks_planned": 11,
  "deep_work_minutes": 240,
  "score_delta": 84
}
```

---

# 43. GITDOT LEVEL CALCULATION

Do not hard-code frontend colors.

Return:

```text
activity level
```

not a color.

Example:

```text
0
1
2
3
4
5
```

The frontend determines actual color from Medusa design tokens.

This ensures Web and Android can share the same data while rendering appropriately.

---

# 44. ACTIVITY GRAPH MODES

Backend should support future modes:

```text
EXECUTION
SCORE
FOCUS
TASKS
GITHUB
```

Default:

```text
EXECUTION
```

---

# 45. ACCOUNTABILITY ENGINE

Analyze:

```text
misses
skips
reschedules
abandons
lateness
completion rate
category performance
streaks
focus time
GitHub activity
weekly performance
```

Output structured behavioral findings.

Example:

```json
{
  "type": "RESCHEDULE_PATTERN",
  "severity": "HIGH",
  "facts": {
    "task_rescheduled_count": 3
  }
}
```

---

# 46. ACCOUNTABILITY TAGS

Positive:

```text
EXECUTOR
IRON_STREAK
NO_QUIT
SHIPPER
DEEP_WORKER
OSS_CONTRIBUTOR
SYSTEM_BUILDER
ARC_BEAST
```

Negative:

```text
TASK_QUITTER
RESCHEDULE_ADDICT
EXCUSE_PATTERN
STREAK_KILLER
GHOST_MODE
CHRONIC_PROCRASTINATOR
```

Tags must be derived from measurable behavior.

Do not allow the LLM to arbitrarily assign labels.

Rules determine the tag.

LLM may generate the wording.

---

# 47. ACCOUNTABILITY MESSAGES

Architecture:

```text
Behavior facts
      ↓
Rule engine
      ↓
Finding
      ↓
Optional LLM copy generation
      ↓
User-facing message
```

Never allow the LLM to invent statistics.

---

# 48. NOTIFICATION ENGINE

Notifications are core functionality.

Events:

```text
TASK_UPCOMING
TASK_START
TASK_LATE
TASK_DEADLINE
TASK_COMPLETED
TASK_MISSED
TASK_SKIPPED
TASK_RESCHEDULED

STREAK_MILESTONE
STREAK_BROKEN

DAY_CLOSING
DAY_CLOSED

WEEKLY_REVIEW

SQUAD_OVERTAKEN

ACHIEVEMENT_UNLOCKED
TAG_ASSIGNED
```

---

# 49. Notification Model

```text
Notification

id
user_id

type
title
body

scheduled_for
sent_at
read_at

metadata
created_at
```

Preferences:

```text
NotificationPreference

id
user_id
notification_type
enabled
channel
```

---

# 50. WEB PUSH ARCHITECTURE

Prepare the backend for:

```text
Web Push
```

The future Android client can use an appropriate push adapter.

Do not tightly couple notification business logic to browser APIs.

Architecture:

```text
Domain Event
 ↓
Notification Engine
 ↓
Notification Queue
 ↓
Delivery Provider
```

This allows future:

```text
Web
Android
Email
```

without rewriting the notification system.

---

# 51. DAILY CLOSE

Implement:

```http
POST /api/v1/arcs/:arcId/days/:date/close
```

Generate:

```text
planned
completed
missed
skipped
abandoned
deep work
score
execution %
```

Then trigger:

```text
streak calculation
accountability
notifications
analytics
```

---

# 52. WEEKLY WAR REPORT

Backend endpoint:

```http
GET /api/v1/analytics/war-report
```

Return:

```text
execution %
tasks completed
tasks missed
tasks skipped
reschedules
deep work
GitHub verification
OSS activity
score change
streak
best category
weakest category
behavior findings
tags
```

---

# 53. WORKSPACES

Support:

```text
Create workspace
Join workspace
Leave workspace
Leaderboard
```

Workspace should expose only:

```text
name
score
streak
execution %
last active
rank
```

Never expose:

```text
private task list
skip reasons
private notes
personal documents
focus details
```

---

# 54. REALTIME

Use:

```text
NestJS WebSocket Gateway
+
Redis Pub/Sub
```

Events:

```text
SCORE_UPDATED
STREAK_UPDATED
RANK_CHANGED
MEMBER_ACTIVE
ACHIEVEMENT_UNLOCKED
```

Only broadcast to authorized workspace members.

---

# 55. ACHIEVEMENTS

Support a backend achievement engine.

Examples:

```text
FIRST_TASK
7_DAY_STREAK
30_DAY_STREAK
100_TASKS
FIRST_OSS_CONTRIBUTION
FIRST_GITHUB_VERIFICATION
PERFECT_WEEK
DEEP_WORK_50_HOURS
```

Achievements should be derived from actual events.

---

# 56. API VERSIONING

All APIs must begin with:

```text
/api/v1
```

Do not expose unversioned production APIs.

This is important because:

```text
Web
```

will be built first and:

```text
Android
```

will consume the same backend later.

---

# 57. API RESPONSE STANDARD

Use a consistent response structure.

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Errors:

```json
{
  "error": {
    "code": "TASK_ALREADY_COMPLETED",
    "message": "Task has already been resolved.",
    "details": {}
  }
}
```

Do not leak stack traces.

---

# 58. IDEMPOTENCY

Critical endpoints must be safe against duplicate requests.

Especially:

```text
complete
skip
abandon
reschedule
GitHub verification
daily habit generation
score events
```

Handle:

```text
double clicks
network retries
mobile retry behavior
concurrent requests
```

This is especially important because Android clients can experience unstable networks.

---

# 59. TIMEZONE

Store timestamps in UTC.

But all user-facing date calculations must use:

```text
user.timezone
```

"Today" must be calculated according to the user's timezone.

Explicitly test:

```text
UTC+13
UTC
UTC-8
```

for the same instant.

---

# 60. SECURITY

Implement:

```text
JWT
Refresh token rotation
Password hashing
Rate limiting
Input validation
Authorization
Ownership checks
Encrypted GitHub tokens
Secure headers
Audit logging
```

Rate-limit:

```text
/task skip
/documents upload
/auth
GitHub verification
```

---

# 61. AI SECURITY

The LLM is untrusted.

Never allow LLM output to directly control:

```text
authorization
score
task completion
user deletion
workspace permissions
```

All AI output must pass:

```text
Schema validation
Business validation
Authorization
```

---

# 62. NO FRONTEND IN THIS TASK

Do NOT create:

```text
Next.js
React components
Tailwind UI
HTML dashboard
Android project
Capacitor project
APK
```

This task is strictly:

```text
Backend
Database
Workers
API
Tests
Infrastructure
Documentation
```

The frontend will consume the finished API.

---

# 63. API DOCUMENTATION

Generate:

```text
API.md
```

from the actual implementation.

Document:

```text
Authentication
Arcs
Documents
Tasks
Task revisions
Scheduling
Habits
Focus
Scoring
Analytics
GitDot
GitHub
Accountability
Notifications
Workspaces
WebSockets
```

Every endpoint must include:

```text
Method
Path
Authentication
Request body
Response
Errors
Example
```

Do not document endpoints that don't exist.

---

# 64. TESTING

Testing is not optional.

## Unit tests

Test:

```text
Task state machine
Scoring
Streaks
Scheduling
Task revision
GitDot levels
Accountability rules
Notification rules
Timezone calculations
GitHub verification
```

---

# 65. Completion Tests

Test:

```text
pending → completed
completed → completed rejected
skipped → completed rejected
abandoned → completed rejected
double request
concurrent requests
```

---

# 66. Skip Tests

Test:

```text
valid reason + valid phrase
wrong phrase
missing phrase
wrong reason
other without text
other with text
already completed
already skipped
rescheduled task
concurrent skip
```

---

# 67. AI Ingestion Tests

Test:

```text
PDF
Markdown
TXT
corrupted document
large document
LLM valid response
LLM malformed response
retry
failed extraction
duplicate extraction
re-upload
changed document
user-modified task preservation
```

---

# 68. Scheduler Tests

Test:

```text
daily capacity
weekly capacity
blackout dates
deadlines
dependencies
category balancing
priority
pinned dates
existing tasks
user modifications
overloaded schedule
empty backlog
large backlog
```

---

# 69. GitHub Tests

Test:

```text
activity exists
no activity
API timeout
API error
OAuth failure
manual completion + no verification
manual completion + verification
duplicate worker execution
```

---

# 70. Scoring Tests

At minimum table-driven scenarios:

```text
Perfect week
One skip
Multiple skips
Alternating completion/skip
Partial day
Negative score
Longest streak preservation
Habit completion
Scheduled task completion
Perfect-day bonus
```

---

# 71. GitDot Tests

Verify:

```text
0% execution → level 0
partial execution → correct level
full execution → max level
empty day
completed day
mixed activity
timezone boundary
```

---

# 72. Accountability Tests

Verify that behavioral tags are based on actual data.

Examples:

```text
3+ reschedules
Repeated skips
Long streak
High completion
High deep work
GitHub consistency
```

Also verify that the engine does **not** assign tags without sufficient evidence.

---

# 73. Workspace Security Tests

Test:

```text
member can see leaderboard
non-member cannot
user A cannot access user B's tasks
workspace does not leak skip reasons
workspace does not leak private documents
WebSocket only broadcasts to authorized members
```

---

# 74. NON-FUNCTIONAL TESTS

Test:

```text
Rate limits → 429
Timezone boundaries
Encrypted GitHub tokens
JWT expiration
Refresh token rotation
Concurrent task actions
Queue retry behavior
Database transaction rollback
```

---

# 75. DOCKER

Provide:

```text
docker-compose.yml
```

with:

```text
PostgreSQL
Redis
Medusa API
Worker
```

Local development should be:

```bash
docker compose up
```

or clearly documented equivalent.

---

# 76. ENVIRONMENT CONFIGURATION

Provide:

```text
.env.example
```

including placeholders for:

```text
DATABASE_URL
REDIS_URL

JWT_SECRET
JWT_REFRESH_SECRET

S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY

GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET

LLM_API_KEY

WEB_PUSH_PUBLIC_KEY
WEB_PUSH_PRIVATE_KEY
```

Never commit secrets.

---

# 77. DATABASE MIGRATIONS

Use proper migrations.

Do not rely on:

```text
db push
```

as the production migration strategy.

The repository must be reproducible from an empty database.

---

# 78. SEED SCRIPT

Provide a development seed script capable of creating:

```text
test user
test arc
categories
sample tasks
sample completed tasks
sample skipped tasks
sample focus sessions
sample GitDot history
sample workspace
```

Seed data must never be required for production.

---

# 79. OBSERVABILITY

Implement structured logging.

Track:

```text
API latency
database errors
queue failures
LLM failures
GitHub failures
notification failures
document processing
scheduler execution
```

Every background worker must fail gracefully and retry where appropriate.

---

# 80. ARCHITECTURAL PRINCIPLE

The system should follow:

```text
CONTROLLER
    ↓
APPLICATION SERVICE
    ↓
DOMAIN LOGIC
    ↓
REPOSITORY
    ↓
DATABASE
```

Controllers should not contain business logic.

Workers should call application/domain services rather than duplicating logic.

---

# 81. EVENT-DRIVEN SIDE EFFECTS

Example:

```text
TASK_MISSED
      │
      ├── Scoring
      ├── Streak
      ├── Scheduler
      ├── Accountability
      ├── Notification
      ├── Analytics
      └── Tags
```

Do not make `TasksService` directly implement all seven responsibilities.

Use domain events / event handlers.

---

# 82. FINAL REPOSITORY STRUCTURE

Aim for something similar to:

```text
medusa/
│
├── apps/
│   └── api/
│
├── packages/
│   ├── config/
│   ├── contracts/
│   └── shared/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── workers/
│
├── test/
│
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── EVENTS.md
│   └── DEVELOPMENT.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

The exact structure may differ if NestJS conventions make another structure cleaner, but maintain clear separation of responsibilities.

---

# 83. API CONTRACT FOR FUTURE CLIENTS

The API must be designed with these future clients in mind:

```text
Medusa Web
Medusa Android
Medusa iOS
```

Therefore:

### Never

```text
POST /web/task/complete
```

### Instead

```text
POST /api/v1/tasks/:id/complete
```

The backend should expose **product/domain APIs**, not frontend APIs.

---

# 84. DEFINITION OF DONE

The backend is complete only when:

### Core

* [ ] Authentication works
* [ ] Arc system works
* [ ] Tasks work
* [ ] Task revisions work
* [ ] User editing of AI tasks works
* [ ] Task state machine works
* [ ] Skip flow works
* [ ] Abandon flow works
* [ ] Rescheduling works
* [ ] Scoring works
* [ ] Streaks work

### Intelligence

* [ ] PDF ingestion
* [ ] Markdown ingestion
* [ ] TXT ingestion
* [ ] OCR interface
* [ ] LLM extraction
* [ ] Validation
* [ ] Re-upload diffing
* [ ] Auto scheduler
* [ ] Adaptive scheduling foundation

### Verification

* [ ] GitHub OAuth
* [ ] GitHub worker
* [ ] Verification
* [ ] Reconciliation

### Accountability

* [ ] Accountability engine
* [ ] Behavioral tags
* [ ] Achievements
* [ ] War Report

### Activity

* [ ] Focus sessions
* [ ] ArcDay
* [ ] GitDot aggregation
* [ ] Analytics

### Social

* [ ] Workspace
* [ ] Leaderboard
* [ ] WebSockets
* [ ] Redis pub/sub

### Notifications

* [ ] Notification engine
* [ ] Preferences
* [ ] Scheduling
* [ ] Delivery abstraction
* [ ] Web Push readiness

### Infrastructure

* [ ] Docker
* [ ] Redis
* [ ] BullMQ
* [ ] PostgreSQL
* [ ] Migrations
* [ ] Seed
* [ ] Logging
* [ ] Error handling

### Quality

* [ ] Unit tests
* [ ] Integration tests
* [ ] HTTP/API tests
* [ ] Concurrency tests
* [ ] Security tests
* [ ] Timezone tests
* [ ] Coverage report
* [ ] API.md
* [ ] Architecture documentation

---

# 85. FINAL VALIDATION

Before declaring completion, run:

```bash
npm test
```

or the project's equivalent.

Run:

```text
unit tests
integration tests
e2e/API tests
lint
typecheck
build
migration validation
```

Report the **actual terminal output**.

Do not say:

> "Tests pass"

unless you actually ran them.

Report:

```text
Tests:
X passed
Y failed

Coverage:
Overall XX%

Scoring XX%
Task lifecycle XX%
GitHub XX%
Scheduler XX%
```

Anything below 80% on correctness-critical modules must be investigated and justified.

---

# 86. FINAL OUTPUT REQUIRED FROM ANTIGRAVITY

When finished, provide:

```text
1. Architecture summary

2. Repository structure

3. Database schema summary

4. API endpoint list

5. Event architecture

6. Worker architecture

7. AI ingestion architecture

8. Scheduling architecture

9. Scoring architecture

10. GitDot architecture

11. Accountability architecture

12. Notification architecture

13. Security model

14. Test results

15. Coverage

16. Build results

17. Known limitations

18. Future Android integration notes
```

---

# 87. MOST IMPORTANT RULE

**Do not prematurely optimize for Android.**

Build a clean backend for Medusa first.

The backend contract should be:

```text
                 MEDUSA API
                     │
        ┌────────────┴────────────┐
        │                         │
     WEB CLIENT              ANDROID APP
     FIRST                  LATER
        │                         │
        └────────────┬────────────┘
                     │
              SAME BACKEND
```

The web application will be the first client.

Once the web application is stable, we will build the Android application on top of the same API.

**Do not create an Android project during this backend task.**

---

## One architectural change I'd make from your old prompt

Your old prompt's biggest limitation was that it treated the backend largely as a **task/scoring API**. The new Medusa backend should be treated as an **execution engine**.

The important distinction is:

```text
OLD

Tasks
 ↓
Score


NEW MEDUSA

             ┌── AI Ingestion
             │
             ├── Scheduler
             │
             ├── Tasks
             │
             ├── Verification
             │
             ├── Focus
             │
             ├── Scoring
             │
             ├── Streaks
             │
             ├── Accountability
             │
             ├── Notifications
             │
             ├── Analytics
             │
             ├── GitDot
             │
             └── Squad
                    │
                    ▼
              EXECUTION ENGINE
```

That architecture will make the later **Medusa Web → Medusa APK** transition much cleaner. Your original backend prompt already had the right foundation of NestJS, PostgreSQL, Redis, BullMQ, immutable task events and exhaustive correctness testing; this version expands that foundation around the actual Medusa product rather than just a task tracker.  

**Build backend first. Then we build the Web client against its API. Then we turn that same client into the Android app.**

