# MEDUSA — Development & Operations Guide

## 1. Repository Structure

MEDUSA is organized as a monorepo with independent backend and frontend applications:

```text
MEDUSA/
├── backend/    # NestJS API, BullMQ workers, Prisma ORM
├── frontend/   # Next.js 14 App Router, Tailwind CSS, TanStack Query
├── docs/       # Architecture & API specifications
└── uploads/    # Local storage directory
```

---

## 2. Backend Development

```bash
cd backend

# 1. Configure environment
cp .env.example .env

# 2. Install dependencies & generate Prisma client
npm install
npm run prisma:generate

# 3. Run database migrations
npm run prisma:migrate

# 4. Start NestJS development server
npm run start:dev

# 5. Run backend tests & build
npm test
npm run build
```

---

## 3. Frontend Development

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Next.js development server (port 3001)
npm run dev

# 3. Run frontend tests & production build
npm test
npm run build
```

---

## 4. Docker Compose Orchestration

```bash
# Start PostgreSQL, Redis, Backend API, Worker, and Frontend containers
docker compose up --build
```
