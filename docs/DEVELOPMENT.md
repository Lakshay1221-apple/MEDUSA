# MEDUSA — Development & Operations Guide

## 1. Environment Variables Setup

Configure `.env` using `.env.example`:
```bash
cp .env.example .env
```

Key variables:
- `PORT`: HTTP port (default `3000`)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: Secrets for token signing
- `ENCRYPTION_KEY`: 64-char hex key for AES-256 token encryption
- `STORAGE_DRIVER`: `local` or `s3`

---

## 2. Database Migrations & Seeding

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed development database
npm run prisma:seed
```

---

## 3. Running Test Suites

```bash
# Run unit & integration tests
npm test

# Run with full coverage report
npm run test:cov
```

---

## 4. Docker Deployment

```bash
# Start PostgreSQL, Redis, API, and Worker containers
docker compose up --build
```
