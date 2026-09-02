# MEDUSA — Frontend Setup & Development Guide

## Prerequisites
- Node.js >= v20
- Running MEDUSA Backend (port 3000)

## Quick Start
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server (port 3001)
npm run dev

# Run unit & component tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Environment Configuration (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000/realtime
```
