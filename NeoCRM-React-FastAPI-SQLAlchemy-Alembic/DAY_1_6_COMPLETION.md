# Days 1–6 — Full-Stack Foundation

## Final stack
- React 19 + Vite + React Router
- FastAPI + SQLAlchemy + Alembic primary backend
- PostgreSQL 16
- JWT authentication with revocable sessions
- RBAC and organization-scoped access
- Append-only audit logging
- Docker Compose: frontend, backend, PostgreSQL

## Completed
- App shell, routing and permission-aware navigation
- Login, session restore and logout
- Backend-authoritative RBAC
- User CRUD/deactivation
- Organization management
- Audit log with pagination/filtering
- Customer list/search/create
- Dashboard summary API
- Leads read API for dashboard/domain foundation
- AI email classification endpoint preserved under `/v1/email/classify`
- Alembic migration as database schema source of truth
- Seed data and development credentials

## Compatibility
The React frontend API contract remains unchanged from the previous Node/Prisma prototype, so no frontend rewrite is required for the backend migration.
