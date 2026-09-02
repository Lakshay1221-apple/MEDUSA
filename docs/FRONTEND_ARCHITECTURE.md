# MEDUSA — Frontend Architecture Specification

## 1. Core Architectural Principle

MEDUSA frontend operates as an authoritative **Operational Command Center** built strictly upon the rule:

```text
                 MEDUSA
                    │
        ┌───────────┴───────────┐
        │                       │
     FRONTEND                BACKEND
        │                       │
 presentation              authority
 interaction               validation
 visualization             state machine
 forms                     scoring
 navigation                streaks
 realtime UI               accountability
        │                       │
        └────── API/WebSocket ──┘
```

The frontend **NEVER** computes:
- Score changes or penalties
- Streak increments or resets
- Task state machine transitions
- Accountability findings or tag assignments
- GitDot activity heatmap levels
- Daily closure evaluations

The frontend requests mutations, receives authoritative server responses, and synchronizes its state via TanStack Query and targeted WebSocket events.

---

## 2. Directory & Domain Modular Structure

The codebase is organized into domain features aligned with backend boundaries:

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (16 primary routes)
│   │   ├── dashboard/          # Primary Command Center
│   │   ├── arcs/               # Execution Arc lifecycle & daily timelines
│   │   ├── tasks/              # Task registry, revisions diffs, event logs
│   │   ├── schedule/           # AutoScheduler topological plan viewer & accept
│   │   ├── documents/          # Async document ingestion & AI extraction review
│   │   ├── focus/              # Deep work focus chamber & session telemetry
│   │   ├── habits/             # Recurring habits tracker & daily generator
│   │   ├── accountability/     # Fact-based behavioral findings & tags
│   │   ├── score/              # Authoritative score transaction ledger
│   │   ├── streaks/            # Streaks & milestone checklist
│   │   ├── achievements/       # Milestone achievements catalog
│   │   ├── github/             # Commit verification & discrepancy audits
│   │   ├── analytics/          # Weekly War Report & 5-mode GitDot heatmap
│   │   ├── workspaces/         # Squad workspaces & privacy-preserving leaderboard
│   │   ├── notifications/      # System dispatch feed & channel preferences
│   │   └── settings/           # Operator parameters & commitment phrase
│   ├── components/
│   │   ├── ui/                 # Tactical dark primitives (Button, Input, Modal, Badge, Card, etc.)
│   │   ├── shell/              # Sidebar, Header, AppShell with auth guard
│   │   ├── tasks/              # Complete, Skip, Abandon, Reschedule, Create modals & TaskCard
│   │   ├── gitdot/             # 5-mode interactive GitDot activity graph
│   │   ├── focus/              # Real-time focus timer chamber widget
│   │   └── arcs/               # Daily closure modal with consequence warnings
│   ├── features/
│   │   ├── auth/               # Centralized AuthProvider & useAuth hook
│   │   └── realtime/           # RealtimeProvider with targeted query invalidations
│   └── lib/
│       ├── api/                # Centralized typed API client & endpoint mappings
│       ├── query/              # TanStack Query client & key factory
│       ├── socket/             # Socket.IO client manager
│       ├── types/              # Domain & API DTO contracts
│       └── utils/              # Formatters & classnames
```

---

## 3. Centralized Authentication & Token Isolation

- JWT access tokens and refresh tokens are stored in the centralized `ApiClient` (memory + localStorage).
- Component trees only consume high-level session status (`UNAUTHENTICATED`, `AUTHENTICATING`, `AUTHENTICATED`, `SESSION_EXPIRED`) through `useAuth()`.
- Automated single-flight refresh token rotation on HTTP 401 responses.

---

## 4. Targeted Realtime Event Synchronization

WebSocket connections to `/realtime` are maintained per authenticated user. Events trigger targeted invalidation of specific query caches:
- `SCORE_UPDATED` &rarr; invalidates `['score']`, `['arcs']`, `['analytics']`
- `STREAK_MILESTONE` &rarr; Toast notification + invalidates `['streaks']`, `['arcs']`
- `ACHIEVEMENT_UNLOCKED` &rarr; Toast notification + invalidates `['achievements']`
