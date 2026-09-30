# NeoCRM — React + FastAPI + PostgreSQL

NeoCRM is now a single Python business backend architecture:

**React/Nginx → FastAPI → PostgreSQL**

FastAPI includes CRM APIs and the AI service boundary. SQLAlchemy is the ORM and Alembic is the schema migration system. The frontend API contract from the previous Node/Prisma prototype is preserved, so the existing React screens continue to work without a rewrite.

## Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- FastAPI: http://localhost:8000
- Swagger: http://localhost:8000/docs
- PostgreSQL: localhost:5432 / `chemora` / `postgres` / `postgres`

Default login: `admin@chemora.com` / `Admin@123`

## Architecture

- React 19 + Vite + React Router
- FastAPI + SQLAlchemy + Alembic
- PostgreSQL 16
- JWT authentication with revocable sessions
- RBAC with deny-by-default permission checks
- Append-only audit application contract with actor/result/before/after metadata
- CRM customer/lead/quote/dashboard APIs
- AI email classification endpoint

## Migration policy

Alembic migrations are the production schema source of truth. The old Prisma `db push --accept-data-loss` flow has been removed.
