# Days 1–6 Full-Stack Foundation

The project now follows the final agreed architecture:

- React + Vite frontend
- Node.js + Express + TypeScript primary backend
- PostgreSQL + Prisma database layer
- FastAPI dedicated AI service
- Docker Compose orchestration

The FastAPI service is intentionally separate from the CRM application backend. Node.js remains the single application/API entry point for the frontend and can call FastAPI for AI capabilities.

## Docker services

- `frontend` — React production build served by Nginx on `http://localhost:8080`
- `backend` — Node.js API on `http://localhost:8000`
- `ai` — FastAPI AI service on `http://localhost:8001`
- `postgres` — PostgreSQL on `localhost:5432`

## Start

```bash
docker compose up --build
```
