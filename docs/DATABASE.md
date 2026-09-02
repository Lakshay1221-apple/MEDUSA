# MEDUSA — Database Schema & Data Models

MEDUSA uses **PostgreSQL** via **Prisma ORM**.

---

## 1. Core Tables & Responsibilities

| Table Name | Description | Key Indexes / Constraints |
|---|---|---|
| `users` | User accounts, timezone, commitment phrase, encrypted GitHub token | `email` (UNIQUE) |
| `refresh_tokens` | Refresh token rotation & revocation tracking | `token_hash` (UNIQUE), `user_id` |
| `arcs` | Execution arcs (PLANNED, ACTIVE, PAUSED, COMPLETED, ARCHIVED) | `user_id` |
| `arc_days` | Daily execution analytics, minutes, task counts, daily status | `(arc_id, date)` (UNIQUE) |
| `categories` | Categorization (AI_ML, BACKEND, CPP, etc.) | `(user_id, slug)` (UNIQUE) |
| `source_documents`| Uploaded curriculum source files & status | `user_id`, `arc_id` |
| `document_sections`| Hierarchical structure (MODULE, SECTION, TOPIC) | `document_id`, `parent_id` |
| `document_chunks` | Chunked text pieces for extraction | `document_id` |
| `tasks` | Actionable work items, status, verification, origins | `user_id`, `arc_id`, `scheduled_date`, `status` |
| `task_revisions` | Immutable version history for task definitions | `(task_id, version)` (UNIQUE) |
| `task_dependencies`| Blocking & soft task prerequisites | `(task_id, depends_on_task_id)` (UNIQUE) |
| `task_events` | Append-only immutable task transition ledger | `task_id`, `user_id`, `occurred_at` |
| `score_events` | Append-only immutable score transaction ledger | `user_id`, `arc_id`, `occurred_at` |
| `user_stats` | Authoritative aggregated statistics per arc | `arc_id` (UNIQUE), `user_id` |
| `habits` | Recurring task templates | `user_id`, `arc_id` |
| `focus_sessions` | Deep work focus tracking | `user_id`, `task_id` |
| `schedule_plans` | Auto-scheduler generated plans | `arc_id`, `status` |
| `schedule_items` | Task placements within schedule plan | `schedule_plan_id`, `task_id` |
| `accountability_findings` | Deterministic behavioral fact findings | `user_id`, `arc_id` |
| `accountability_tags` | Behavioral labels assigned with proof | `user_id`, `tag` |
| `user_achievements` | Unlocked milestone records | `(user_id, achievement_key)` (UNIQUE) |
| `notifications` | In-app & delivery notifications | `user_id`, `read_at` |
| `notification_preferences` | User channel & type preferences | `(user_id, notification_type, channel)` (UNIQUE) |
| `workspaces` | Squad workspaces & invite codes | `slug` (UNIQUE), `invite_code` (UNIQUE) |
| `workspace_members` | Workspace membership & roles | `(workspace_id, user_id)` (UNIQUE) |
