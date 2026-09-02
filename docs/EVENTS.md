# MEDUSA — Domain Events Architecture

The backend utilizes an event-driven architecture powered by `@nestjs/event-emitter` to decouple side effects (scoring, streaks, achievements, notifications, analytics) from domain mutations.

---

## 1. Domain Event Catalog

| Event Name | Emitted When | Primary Handlers / Side Effects |
|---|---|---|
| `task.created` | Task is created (manual or AI) | Audit log, Analytics |
| `task.updated` | Task definition or status modified | Revision creation, Event ledger |
| `task.completed` | Task completed | Scoring delta, ArcDay aggregation, Achievement check, In-App notification |
| `task.skipped` | Task skipped with commitment phrase | Penalty score, Streak reset to 0, Next occurrence auto-scheduled, Notification |
| `task.abandoned` | Task permanently abandoned | Abandon penalty score, UserStats total_abandoned increment |
| `task.missed` | Task left incomplete at day closure | Status transition, Streak break |
| `task.rescheduled` | Task moved to another date | Link preservation, TaskEvent ledger |
| `focus.started` | Deep work focus session starts | Real-time broadcast |
| `focus.completed` | Focus session ends | Deep work minutes accumulation, Score points award, Stats update |
| `day.closed` | Day closed via `/days/:date/close` | Perfect day bonus evaluation, Streak increment/break, Notification |
| `score.updated` | Authoritative score ledger updated | WebSocket emit to user room (`user:{id}`) |
| `streak.milestone` | Milestone reached (7, 14, 30 days) | Achievement evaluation, Realtime broadcast |
| `streak.broken` | Streak reset to 0 | Realtime emit, In-app warning |
| `tag.assigned` | Behavioral tag applied by rule engine | Accountability finding created, User notification |
| `achievement.unlocked` | User satisfies achievement condition | Persistence to `user_achievements`, Realtime notification |
| `github.verified` | GitHub worker detects matching commits | Task auto-completion, Points award, Status: VERIFIED |
| `github.discrepancy`| Manual completion lacks GitHub commits | Status flagged as UNVERIFIED, Reconciliation log |
