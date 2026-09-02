# 🐍 MEDUSA — Execution Enforcement System Backend

> **Fixed-Duration Personal Execution Platform & Enforcement Engine**

Medusa takes a user's curriculum/syllabus, understands it through an asynchronous AI ingestion pipeline, converts it into structured tasks, preserves user modifications with immutable revisions, schedules them across an Arc, tracks daily execution, verifies work via GitHub integrations, calculates authoritative scores and streaks, derives behavioral accountability findings/tags, and aggregates semantic GitDot activity.

The backend exposes a single, versioned `/api/v1` contract consumed identically by both the **Web Client** and future **Android Application**.

---

## 🏛️ Core Architecture Highlights

1. **Server is the Authoritative Source of Truth**: Scores, streaks, state transitions, scheduling validity, and verification are strictly server-computed.
2. **Immutable Ledgers**: `TaskEvent` and `ScoreEvent` records are append-only.
3. **Task Revision Preservation**: AI-generated tasks are user-editable. The system preserves original AI definitions (v1) while maintaining a complete revision history for user edits.
4. **Deterministic Accountability**: Rules analyze measurable behavior (reschedule loops, skip patterns, deep work hours) to derive factual findings and tags without hallucinations.
5. **GitDot Contribution Graph**: Semantic activity levels (0-5) computed server-side across multiple visual modes (`EXECUTION`, `SCORE`, `FOCUS`, `TASKS`, `GITHUB`).
6. **Workspace Privacy Boundary**: Leaderboards expose only aggregate metrics (rank, score, streak, execution %, last active). Private tasks, notes, documents, and skip reasons are never leaked.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 15
- Redis >= 7

### 2. Setup Environment
```bash
cp .env.example .env
npm install
npx prisma generate
```

### 3. Run Migrations & Seed Data
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Start the Application
```bash
# Development mode with hot-reload
npm run start:dev

# Production build & start
npm run build
npm run start:prod
```

### 5. Running with Docker Compose
```bash
docker compose up --build
```

---

## 🧪 Testing & Verification

```bash
# Run all unit and integration tests
npm test

# Run tests with coverage report
npm run test:cov

# Run typecheck & build
npm run build
```

---

## 📚 Documentation Links
- [API Specification](file:///home/lakshay/MEDUSA/docs/API.md)
- [System Architecture](file:///home/lakshay/MEDUSA/docs/ARCHITECTURE.md)
- [Database Schema & Models](file:///home/lakshay/MEDUSA/docs/DATABASE.md)
- [Domain Events Architecture](file:///home/lakshay/MEDUSA/docs/EVENTS.md)
- [Development & Deployment Guide](file:///home/lakshay/MEDUSA/docs/DEVELOPMENT.md)
