# 🐍 MEDUSA — Execution Enforcement System

> **Fixed-Duration Personal Execution Platform & Enforcement Engine**

MEDUSA is an authoritative execution enforcement system designed to convert educational syllabus, engineering roadmaps, and daily operational commitments into measurable, verified execution. 

Unlike standard task trackers or todo lists that rely on honor systems and superficial checklists, MEDUSA operates as a **strict state machine and enforcement engine**: the backend serves as the sole source of truth for task states, score ledgers, unbroken streaks, daily closure reckonings, and deterministic behavioral audits.

---

## 📋 Table of Contents

- [Overview & Philosophy](#-overview--philosophy)
- [System Architecture](#-system-architecture)
- [Core Features & Domain Engines](#-core-features--domain-engines)
  - [1. Document Ingestion & AI Task Extraction](#1-document-ingestion--ai-task-extraction)
  - [2. Task Lifecycle & State Machine](#2-task-lifecycle--state-machine)
  - [3. Execution Arcs & Authoritative Daily Closure](#3-execution-arcs--authoritative-daily-closure)
  - [4. AutoScheduler Engine](#4-autoscheduler-engine)
  - [5. Authoritative Scoring & Immutable Ledger](#5-authoritative-scoring--immutable-ledger)
  - [6. Streaks & Milestones](#6-streaks--milestones)
  - [7. Deterministic Accountability & Behavioral Rules](#7-deterministic-accountability--behavioral-rules)
  - [8. Deep Work Focus Chamber](#8-deep-work-focus-chamber)
  - [9. Recurring Habits Engine](#9-recurring-habits-engine)
  - [10. GitHub Commit & PR Verification](#10-github-commit--pr-verification)
  - [11. 5-Mode GitDot Activity Heatmap](#11-5-mode-gitdot-activity-heatmap)
  - [12. Squad Workspaces & Privacy-Preserving Leaderboards](#12-squad-workspaces--privacy-preserving-leaderboards)
  - [13. Realtime Telemetry & WebSockets](#13-realtime-telemetry--websockets)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Quick Start & Local Setup](#-quick-start--local-setup)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Manual Development Setup](#manual-development-setup)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Authentication Model](#-security--authentication-model)
- [Documentation Index](#-documentation-index)
- [Status & Roadmap](#-status--roadmap)

---

## 🎯 Overview & Philosophy

### The Problem
Most personal execution tools suffer from:
1. **Friction in breakdown**: Converting large curriculum documents or multi-week roadmaps into atomic daily tasks is tedious.
2. **Honor-system drift**: Missed deadlines are silently rescheduled without consequence, eroding discipline.
3. **Arbitrary metrics**: Gamification is often superficial, lacking verifiable proofs or immutable transaction tracking.
4. **Leaky team models**: Multi-user workspaces frequently expose private notes and sensitive tasks to peers.

### The MEDUSA Solution
MEDUSA implements an architectural separation of concerns:
- **Backend = Sole Authority**: The backend strictly validates state transitions, computes score deltas, increments/resets streaks, checks commitment phrases, and evaluates behavioral rule findings.
- **Frontend = Tactical Command Center**: The Next.js client renders real-time telemetry, provides high-density interaction flows, and reflects server state without duplicating business logic.
- **Immutable Financial-Grade Audits**: Every task transition (`TaskEvent`) and point change (`ScoreEvent`) is appended to an immutable ledger.
- **Verifiable Proof of Work**: Completed directives can be cross-checked against git commits and pull requests via encrypted GitHub integrations.

> *"No excuses. Just execution."*

---

## 🏛️ System Architecture

```text
                                 ┌─────────────────────────────────────────┐
                                 │       Frontend Web Application          │
                                 │     Next.js 14 / TypeScript / Tailwind │
                                 │        TanStack Query / Socket.IO       │
                                 └────────────────────┬────────────────────┘
                                                      │
                                          HTTP REST   │   WebSocket (/realtime)
                                          /api/v1     │   Targeted Cache Invalidation
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │       Backend Enforcement Engine        │
                                 │          NestJS 10 / TypeScript         │
                                 │      17 Domain Modules / Controllers    │
                                 └────────────────────┬────────────────────┘
                                                      │
                 ┌────────────────────────────────────┼────────────────────────────────────┐
                 │                                    │                                    │
                 ▼                                    ▼                                    ▼
      ┌────────────────────┐               ┌────────────────────┐               ┌────────────────────┐
      │     PostgreSQL     │               │       Redis        │               │   BullMQ Workers   │
      │     Prisma ORM     │               │ Queue & PubSub     │               │ Async Pipelines    │
      │ 19 Relational Models│              │ Key-Value Caching  │               │ OCR, AI, GitHub    │
      └────────────────────┘               └────────────────────┘               └─────────┬──────────┘
                                                                                          │
                                              ┌───────────────────────────────────────────┼─────────────────────────────────┐
                                              ▼                                           ▼                                 ▼
                                   ┌────────────────────┐                      ┌────────────────────┐            ┌────────────────────┐
                                   │   LLM Extractor    │                      │  Document Storage  │            │    GitHub API      │
                                   │ OpenAI / Anthropic │                      │ Local FS / MinIO S3│            │ Commit Verification│
                                   └────────────────────┘                      └────────────────────┘            └────────────────────┘
```

---

## ⚡ Core Features & Domain Engines

### 1. Document Ingestion & AI Task Extraction
- **Asynchronous Pipeline**: Upload curriculum syllabi, course outlines, or architecture guides in Markdown (`.md`), Plain Text (`.txt`), or PDF format.
- **Hierarchical Parser**: Deconstructs documents into a strict 3-tier tree (`Module` &rarr; `Section` &rarr; `Topic`).
- **Deterministic Chunker & LLM Extraction**: Splits text into 1,500-character overlapping chunks; passes them to LLM workers to generate structured tasks with estimated durations (minutes), difficulty ratings (D1–D5), and priority classifications.
- **Review Boundary**: Extracted tasks are presented in a dedicated review boundary where the operator can verify, edit, and categorize items before committing them to the active backlog.

### 2. Task Lifecycle & State Machine
The task state machine strictly enforces valid transitions:

```text
       ┌──────────────┐
       │   BACKLOG    │
       └──────┬───────┘
              │ (schedule)
              ▼
       ┌──────────────┐ ◄────────────────────────────────────────┐
       │   PENDING    ├──────────────┐                          │
       └──┬───┬───┬───┘              │                          │
          │   │   │                  │                          │
          │   │   │ (start)          │                          │
          │   │   ▼                  │                          │
          │   │ ┌──────────────┐     │ (skip)                   │
          │   │ │ IN_PROGRESS  │     │                          │
          │   │ └──┬───┬───┬───┘     ▼                          │
          │   │    │   │   └─► ┌───────────┐ (reschedule)       │
          │   │    │   │       │  SKIPPED  ├────────────────────┤
          │   │    │   │       └───────────┘                    │
          │   │    │   │                                        │
          │   ▼    ▼   │ (complete)                             │
          │ ┌────────┐ │                                        │
          │ │COMPLETED││                                        │
          │ └────────┘ │ (abandon)                              │
          │            ▼                                        │
          │         ┌───────────┐                               │
          │         │ ABANDONED │ (Terminal)                    │
          │         └───────────┘                               │
          │                                                     │
          │ (daily close / cutoff)                              │
          ▼                                                     │
       ┌───────────┐ (reschedule)                               │
       │  MISSED   ├────────────────────────────────────────────┘
       └───────────┘
```

- **Immutable Revisions (`TaskRevision`)**: Version 1 preserves the original AI definition. Edits generate versioned revisions (`v2+`) with structured diff summaries.
- **Task Event Audit Trail (`TaskEvent`)**: Every transition logs `from_status`, `to_status`, timestamp, and reason metadata.
- **Enforced Commitment Phrases**: Skipping or abandoning tasks requires typing the exact commitment phrase (default: `I ACCEPT THE COST`), preventing accidental concessions.

### 3. Execution Arcs & Authoritative Daily Closure
- **Arc Management**: Time-boxed execution cycles (e.g., 30-day, 60-day, 90-day sprints) with fixed daily and weekly capacity budgets.
- **ArcDays Timeline**: Granular daily ledger tracking planned tasks, completed tasks, missed tasks, skipped tasks, deep work minutes, and net score delta.
- **Daily Closure Reckoning (`POST /arcs/:arcId/days/:date/close`)**:
  - Validates that the execution day is currently open.
  - Automatically resolves unresolved `PENDING` or `IN_PROGRESS` tasks to `MISSED`.
  - Breaks streak if any task was missed, skipped, or abandoned.
  - Evaluates **Perfect Day Bonus** (+20 pts awarded if 100% completed with $\ge 1$ task).

### 4. AutoScheduler Engine
- **Topological Dependency Resolution**: Automatically sequences tasks respecting prerequisite chains.
- **Capacity Balancing**: Distributes backlog tasks evenly across open Arc days without exceeding the operator's daily capacity limit.
- **Interactive Plan Viewer**: Generates non-destructive draft schedule plans with conflict explanations; commits them to `PENDING` upon user acceptance.

### 5. Authoritative Scoring & Immutable Ledger
All point balances and adjustments are computed on the server. The client never runs scoring formulas:
- **Task Completion**: `+10 pts` (base) $\times$ difficulty multiplier (D1–D5).
- **Habit Occurrence**: `+5 pts`.
- **Deep Work Focus**: `+1 pt` per 15 minutes of verified focus time.
- **GitHub Verified Delivery**: `+15 pts` verification bonus.
- **Perfect Day Completion**: `+20 pts` bonus.
- **Skip Penalty**: `-15 pts` + immediate streak reset to 0.
- **Abandon Penalty**: `-25 pts` terminal deduction.
- **Immutable Ledger (`ScoreEvent`)**: Financial-grade transaction stream with delta, reason, and contextual metadata.

### 6. Streaks & Milestones
- Increments only upon clean daily closure with 100% commitment resolution.
- Resets immediately to `0` upon any skipped, abandoned, or missed task.
- Automated milestone progression checklist: 3, 7, 14, 21, 30, 50, 75, 100, 150, and 365 days.

### 7. Deterministic Accountability & Behavioral Rules
Fact-based behavioral audit engine that evaluates execution patterns without AI hallucinations:
- `RESCHEDULE_ADDICT`: Assigned when a single task has been rescheduled $\ge 3$ times.
- `EXCUSE_PATTERN`: Assigned when $\ge 3$ tasks are skipped within a 7-day window.
- `TASK_QUITTER`: Assigned when $\ge 2$ tasks are permanently abandoned.
- `IRON_STREAK`: Assigned when maintaining an active streak of $\ge 14$ days.
- `SHIPPER`: Assigned when $\ge 20$ tasks are verified via GitHub commits.
- `DEEP_WORKER`: Assigned when accumulating $\ge 20$ hours of deep work focus.
- `NO_QUIT`: Assigned upon completing $\ge 50$ tasks with 0 concessions.

### 8. Deep Work Focus Chamber
- Live stopwatch widget linked directly to active task directives.
- Real-time elapsed timer with session start, complete, and discard controls.
- Automatic focus minutes aggregation and score point conversion.

### 9. Recurring Habits Engine
- Deterministic habit templates supporting `DAILY`, `WEEKDAYS`, `WEEKENDS`, and `CUSTOM` frequencies.
- One-click daily occurrence generator (`POST /habits/generate-daily`) converting recurring commitments into actionable task directives.

### 10. GitHub Commit & PR Verification
- Secure AES-256 encrypted OAuth token storage.
- Automated commit matching: parses repository commit logs and PR merges against task titles and identifiers.
- Verification audits auto-complete matching tasks with verified delivery badges.

### 11. 5-Mode GitDot Activity Heatmap
Semantic activity matrix visualizing longitudinal discipline across 5 distinct dimensions:
1. `EXECUTION`: Percentage of daily planned commitments resolved (0–100%).
2. `SCORE`: Net daily score points earned.
3. `FOCUS`: Cumulative deep work minutes logged.
4. `TASKS`: Total volume of completed task directives.
5. `GITHUB`: Total count of commit-verified deliverables.

### 12. Squad Workspaces & Privacy-Preserving Leaderboards
- Multi-user squad collaboration with invite codes.
- **Strict Privacy Barrier**: Squad leaderboards expose **only** public aggregate metrics:
  - Rank, Operator Call-sign, Arc Score, Current Streak, Execution Rate %, Last Active Date.
  - Personal task titles, private notes, syllabus documents, and skip explanations remain strictly confidential.

### 13. Realtime Telemetry & WebSockets
- Socket.IO gateway running on `/realtime` namespace.
- Scoped rooms: `user:${userId}` for private alerts and `workspace:${workspaceId}` for squad updates.
- Targeted client-side cache invalidation on `SCORE_UPDATED`, `STREAK_MILESTONE`, and `ACHIEVEMENT_UNLOCKED` events.

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | Node.js 20+, NestJS 10, TypeScript 5, Express |
| **Database & ORM** | PostgreSQL 15+, Prisma ORM 6 |
| **Async Queues & Cache** | Redis 7, BullMQ, IoRedis |
| **Realtime Gateway** | Socket.IO |
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript 5 |
| **Styling & Design System** | Tailwind CSS 3, Obsidian Tactical Palette, Monospace Typography |
| **Client State & API** | TanStack React Query v5, Axios, Centralized API Client |
| **Testing Frameworks** | Vitest, React Testing Library, Jest, Supertest |
| **Containerization** | Docker, Docker Compose |

---

## 📁 Repository Structure

```text
MEDUSA/
├── backend/                    # NestJS Backend Application
│   ├── src/
│   │   ├── auth/               # JWT authentication & session handling
│   │   ├── tasks/              # Task state machine, controller & service
│   │   ├── task-revisions/     # Immutable v1 vs v2+ task revision diffs
│   │   ├── arcs/               # Execution Arc lifecycle
│   │   ├── arc-days/           # ArcDay timeline & authoritative daily closure
│   │   ├── scoring/            # Server-authoritative scoring & ledger
│   │   ├── streaks/            # Streak tracking & milestone evaluation
│   │   ├── scheduling/         # AutoScheduler topological engine
│   │   ├── documents/          # Curriculum document uploader & status
│   │   ├── focus/              # Deep work focus timer sessions
│   │   ├── habits/             # Recurring habits & daily generator
│   │   ├── accountability/     # Deterministic behavioral rule engine
│   │   ├── achievements/       # Milestone achievements catalog
│   │   ├── github/             # GitHub commit & PR verification
│   │   ├── activity/           # 5-mode GitDot activity graph engine
│   │   ├── analytics/          # Weekly War Report aggregation
│   │   ├── workspaces/         # Squad workspaces & privacy-preserving leaderboards
│   │   ├── notifications/      # Dispatch feed & preferences
│   │   ├── realtime/           # Socket.IO WebSocket gateway (/realtime)
│   │   ├── categories/         # Task taxonomy & weekly targets
│   │   ├── users/              # User profile & commitment phrase
│   │   ├── database/           # Prisma service & transaction helpers
│   │   ├── storage/            # Local filesystem & MinIO S3 drivers
│   │   ├── ai/                 # LLM chunk extraction & parsing
│   │   ├── workers/            # BullMQ background processors
│   │   ├── common/             # Interceptors, guards, exception filters, crypto
│   │   ├── config/             # Typed environment configuration
│   │   ├── app.module.ts       # Root NestJS application module
│   │   └── main.ts             # Application entrypoint & global pipes
│   ├── prisma/
│   │   ├── schema.prisma       # 19 Prisma models & enums
│   │   └── seed.ts             # Development seeding script
│   ├── test/                   # E2E & critical flow test suites
│   ├── Dockerfile              # Backend multi-stage Docker build
│   ├── nest-cli.json           # Nest CLI configuration
│   ├── package.json            # Backend package manifest & scripts
│   ├── tsconfig.json           # Backend TypeScript configuration
│   └── .env.example            # Backend environment template
│
├── frontend/                   # Next.js 14 Web Command Center
│   ├── src/
│   │   ├── app/                # App Router pages (16 primary routes)
│   │   ├── components/         # UI primitives, shell, task modals, GitDot graph
│   │   ├── features/           # AuthContext & RealtimeProvider
│   │   ├── lib/                # API client, endpoints, domain types, formatters
│   │   ├── styles/             # Obsidian tactical dark styling & animations
│   │   └── test/               # Vitest component & unit tests
│   ├── public/                 # Static web assets
│   ├── Dockerfile              # Frontend multi-stage Docker build
│   ├── next.config.js          # Next.js configuration with API rewrites
│   ├── tailwind.config.ts      # Tailwind design system tokens
│   ├── tsconfig.json           # Frontend TypeScript configuration
│   ├── vitest.config.ts        # Vitest configuration
│   └── package.json            # Frontend package manifest & scripts
│
├── docs/                       # Comprehensive Technical Documentation
│   ├── ARCHITECTURE.md         # Full system architecture specification
│   ├── API.md                  # Complete REST API reference
│   ├── DATABASE.md             # Prisma database schema & relationships
│   ├── DEVELOPMENT.md          # Local development & operational runbook
│   ├── EVENTS.md               # Domain events & WebSocket documentation
│   ├── FRONTEND_ARCHITECTURE.md# Frontend architecture & state rules
│   ├── FRONTEND_API_MAP.md     # 1-to-1 backend controller to frontend mapping
│   ├── FRONTEND_SETUP.md       # Frontend installation & dev guide
│   └── FRONTEND_TESTING.md     # Frontend testing strategy & suites
│
├── uploads/                    # Shared local document storage mount
├── docker-compose.yml          # Multi-container orchestration (Postgres, Redis, API, Worker, Frontend)
├── .gitignore                  # Monorepo gitignore rules
├── .env.example                # Shared root environment template
└── README.md                   # Primary repository documentation
```

---

## 🚀 Quick Start & Local Setup

### Running with Docker Compose
The fastest way to spin up the entire MEDUSA platform (PostgreSQL, Redis, Backend API, BullMQ Worker, and Frontend Web Client):

```bash
# 1. Clone repository
git clone https://github.com/Lakshay1221-apple/MEDUSA.git
cd MEDUSA

# 2. Configure environment
cp .env.example .env

# 3. Build and launch all containers
docker compose up --build
```

- **Frontend App**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **PostgreSQL**: `localhost:5432` (User: `postgres`, Password: `postgres`, DB: `medusa_db`)
- **Redis**: `localhost:6379`

---

### Manual Development Setup

#### Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 15
- Redis >= 7

#### 1. Backend Setup
```bash
cd backend

# Configure environment & install dependencies
cp .env.example .env
npm install

# Generate Prisma Client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# (Optional) Seed development database
npm run prisma:seed

# Start backend in watch mode (port 3000)
npm run start:dev
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server (port 3001)
npm run dev
```

---

## 🧪 Testing & Quality Assurance

Both backend and frontend maintain dedicated automated test suites with 100% pass rates:

### Backend Tests (Jest)
Covers state machine transitions, scoring formulas, crypto AES-256 functions, BullMQ jobs, AutoScheduler topological sorting, and critical end-to-end user journeys:

```bash
cd backend
npm test
```
*Result: 19 test suites, 71 tests passing.*

### Frontend Tests (Vitest)
Covers API client error parsing, date/duration formatters, TaskCard interactions, SkipTaskModal commitment phrase validation, and 5-mode GitDot activity graph rendering:

```bash
cd frontend
npm test
```
*Result: 5 test files, 13 tests passing.*

### Production Builds
```bash
# Verify backend NestJS compilation
cd backend && npm run build

# Verify frontend Next.js 14 production build (22 routes)
cd frontend && npm run build
```

---

## 🔒 Security & Authentication Model

1. **Dual-Token JWT Authentication**:
   - Access tokens (15-minute expiration) signed with `JWT_SECRET`.
   - Refresh tokens (7-day expiration) signed with `JWT_REFRESH_SECRET` and hashed with Argon2/SHA-256 in the database.
   - Centralized Axios interceptor transparently performs single-flight token rotation on HTTP 401 responses.
2. **Encrypted Third-Party Integrations**:
   - GitHub OAuth access tokens are encrypted at rest using AES-256-GCM via a dedicated 64-character hex `ENCRYPTION_KEY`.
3. **Workspace Privacy Guard**:
   - Multi-tenant squad leaderboards only aggregate scalar values (`rank`, `score`, `streak`, `executionPercent`). Personal tasks, documents, notes, and skip reasons cannot be queried across tenant boundaries.

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| [System Architecture](file:///home/lakshay/MEDUSA/docs/ARCHITECTURE.md) | In-depth technical architecture, module boundaries, and execution models. |
| [API Reference](file:///home/lakshay/MEDUSA/docs/API.md) | Complete endpoints, request DTOs, response envelopes, and error codes. |
| [Database Schema](file:///home/lakshay/MEDUSA/docs/DATABASE.md) | Prisma relational models, indexes, cascade behaviors, and enum definitions. |
| [Domain Events](file:///home/lakshay/MEDUSA/docs/EVENTS.md) | Event catalog, BullMQ queue names, and WebSocket broadcast payloads. |
| [Development Guide](file:///home/lakshay/MEDUSA/docs/DEVELOPMENT.md) | Local development commands, migrations, seeding, and operations runbook. |
| [Frontend Architecture](file:///home/lakshay/MEDUSA/docs/FRONTEND_ARCHITECTURE.md) | Client-side architectural principles, token isolation, and query design. |
| [Frontend API Map](file:///home/lakshay/MEDUSA/docs/FRONTEND_API_MAP.md) | 1-to-1 mapping matrix connecting NestJS controllers to Next.js routes. |
| [Frontend Setup](file:///home/lakshay/MEDUSA/docs/FRONTEND_SETUP.md) | Frontend setup, environment configuration, and dev scripts. |
| [Frontend Testing](file:///home/lakshay/MEDUSA/docs/FRONTEND_TESTING.md) | Vitest testing strategy, mocks, and component verification. |

---

## 🗺️ Status & Roadmap

- [x] Complete NestJS Backend & 17 Domain Controllers
- [x] Prisma ORM Schema & Relational Models (PostgreSQL)
- [x] Asynchronous BullMQ Document Ingestion & AI Task Extraction Pipeline
- [x] Topological AutoScheduler Engine
- [x] Server-Authoritative Scoring Ledger & Streak State Machine
- [x] Fact-Based Behavioral Accountability Rule Engine
- [x] GitHub Commit & PR Delivery Verification (AES-256 Encrypted)
- [x] 5-Mode GitDot Activity Heatmap Matrix
- [x] Privacy-Preserving Squad Leaderboards
- [x] Socket.IO Realtime Telemetry Gateway (`/realtime`)
- [x] Next.js 14 Command Center Web Application
- [x] Tactical Dark Design System & Monospace Typography
- [x] Monorepo Restructuring (`/backend`, `/frontend`, `/docs`)
- [ ] Native Android Client (Kotlin / Jetpack Compose) consuming `/api/v1`
- [ ] Web Push Service Worker Notification Handlers
- [ ] S3 / MinIO Cloud Storage Multi-Region Driver

---

## ⚖️ License

Private and proprietary. All rights reserved.
