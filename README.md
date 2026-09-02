# 🐍 MEDUSA — Execution Enforcement System

> **Fixed-Duration Personal Execution Platform & Enforcement Engine**

Medusa takes a user's curriculum/syllabus, understands it through an asynchronous AI ingestion pipeline, converts it into structured tasks, preserves user modifications with immutable revisions, schedules them across an Arc, tracks daily execution, verifies work via GitHub integrations, calculates authoritative scores and streaks, derives behavioral accountability findings/tags, and aggregates semantic GitDot activity.

The repository is organized as a clean, decoupled monorepo:
- **`backend/`**: NestJS 10, Prisma ORM, PostgreSQL, Redis BullMQ, WebSocket Gateway, and authoritative execution rules.
- **`frontend/`**: Next.js 14 App Router, TypeScript, Tailwind CSS, TanStack Query, and real-time Command Center.
- **`docs/`**: Comprehensive system architecture, API specifications, database design, events, and frontend guides.

---

## 🏛️ Monorepo Structure

```text
MEDUSA/
├── backend/         # NestJS Server & Enforcement Engine
│   ├── src/
│   ├── prisma/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/        # Next.js Command Center Web App
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── docs/            # Technical Specifications & Documentation
├── uploads/         # Local Storage Directory
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend

# Setup environment & dependencies
cp .env.example .env
npm install
npx prisma generate

# Run migrations (ensure Postgres is running)
npx prisma migrate dev --name init

# Start backend dev server (port 3000)
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start frontend dev server (port 3001)
npm run dev
```

---

## 🐳 Running with Docker Compose

To launch the entire platform (PostgreSQL, Redis, Backend API, Worker, and Frontend Web App):

```bash
docker compose up --build
```

- **Backend API**: `http://localhost:3000/api/v1`
- **Frontend App**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 🧪 Testing & Verification

```bash
# Run backend test suite (19 test suites, 71 tests)
cd backend
npm test
npm run build

# Run frontend test suite (5 test files, 13 tests)
cd frontend
npm test
npm run build
```

---

## 📚 Documentation Links
- [System Architecture](file:///home/lakshay/MEDUSA/docs/ARCHITECTURE.md)
- [API Specification](file:///home/lakshay/MEDUSA/docs/API.md)
- [Database Schema & Models](file:///home/lakshay/MEDUSA/docs/DATABASE.md)
- [Domain Events Architecture](file:///home/lakshay/MEDUSA/docs/EVENTS.md)
- [Frontend Architecture](file:///home/lakshay/MEDUSA/docs/FRONTEND_ARCHITECTURE.md)
- [Frontend API Mapping](file:///home/lakshay/MEDUSA/docs/FRONTEND_API_MAP.md)
- [Frontend Setup Guide](file:///home/lakshay/MEDUSA/docs/FRONTEND_SETUP.md)
- [Frontend Testing Guide](file:///home/lakshay/MEDUSA/docs/FRONTEND_TESTING.md)
