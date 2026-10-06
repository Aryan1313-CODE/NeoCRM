# NeoCRM — React + FastAPI + PostgreSQL

NeoCRM is now a single Python business backend architecture:

**React/Nginx → FastAPI → PostgreSQL**

FastAPI includes CRM APIs and the AI service boundary. SQLAlchemy is the ORM and Alembic is the schema migration system. The frontend API contract from the previous Node/Prisma prototype is preserved, so the existing React screens continue to work without a rewrite.

## Project reference documents

- [78-day delivery plan](docs/reference/NeoCRM_Inventory_78_Day_Plan.pdf)
- [Inventory architecture design](docs/reference/NeoCRM_Inventory_Architecture_Design.pdf)

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

## Frontend architecture

The frontend is organized by responsibility while keeping the existing FastAPI contracts intact:

- `src/app` — application composition and global loading state.
- `src/routes` — centralized React Router route tree and protected routes.
- `src/auth` — authentication/session provider.
- `src/permissions` — permission definitions, provider, route guards and UI gates.
- `src/components/layout` — application shell, sidebar and topbar.
- `src/components/ui` — reusable Button, Card, Badge, Dialog and Input primitives.
- `src/components/settings` — settings navigation layout.
- `src/feedback` — error boundary and user feedback/toasts.
- `src/services` — API client and domain service adapters for auth, customers, users, organization, audit and dashboard.
- `src/pages` — focused page modules instead of a single frontend monolith.

Mock adapters remain isolated behind `VITE_USE_MOCK_API` for development only; production remains connected to the FastAPI backend.
