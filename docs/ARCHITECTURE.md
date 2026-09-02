# MEDUSA — System Architecture & Design

## 1. Domain-Driven Clean Architecture

The system enforces clear boundaries where controllers only handle transport, application services orchestrate domain workflows, and domain engines contain business rules.

```
Client (Web / Android)
        │
        ▼
HTTP (/api/v1) & WebSocket Gateway
        │
   ┌────┴────┐
   │ Guards  │ (JWT, Rate Limiting, Workspace Auth)
   └────┬────┘
        ▼
   Controllers
        │
        ▼
Application Services (TasksService, ArcsService, etc.)
        │
   ┌────┴──────────────────────────┐
   │ Domain Engines / Rule Sets    │
   │  - Task State Machine         │
   │  - Authoritative Scoring      │
   │  - Streaks Engine             │
   │  - AutoScheduler Engine       │
   │  - Accountability Rule Engine │
   │  - GitDot Aggregator          │
   │  - Document Parser & Diff     │
   └────┬──────────────────────────┘
        ▼
   Event Emitter (Domain Events)
        │
        ▼
   Prisma ORM -> PostgreSQL / Redis Pub-Sub
```

---

## 2. Server as the Authoritative Source of Truth
- **Scoring**: Controllers never directly mutate user score or streak counts. All modifications pass through `ScoringService.applyScoreDelta` creating append-only `ScoreEvent`s.
- **Streaks**: Streaks increment only upon verified daily closure and break immediately on skip or missed tasks.
- **State Machine**: Transitions are strictly validated (`VALID_TRANSITIONS` table) preventing invalid state changes or double completion.
- **AI Tasks**: User edits generate versioned `TaskRevision` entries while preserving original definitions (`version: 1, changed_by: AI`).

---

## 3. Asynchronous AI Document Ingestion
```
Upload Document (PDF/MD/TXT)
  ↓
Storage Service (S3 / Local)
  ↓
SourceDocument Record (UPLOADED)
  ↓
Document Processor Job
  ↓
DocumentParser (Hierarchical: Module -> Section -> Topic)
  ↓
DocumentChunker (1500 char boundary preservation)
  ↓
LlmExtractor (Structured JSON Schema validation + Retry)
  ↓
Task Generator (Creates tasks in BACKLOG with TaskRevision v1)
  ↓
SourceDocument (COMPLETED)
```

---

## 4. Multi-Client Readiness (Web + Android)
Both the Web client (Phase 1) and Android APK (Phase 2) communicate with the exact same domain endpoints under `/api/v1`. The backend is completely client-agnostic and relies on standard JSON envelopes and JWT tokens.
