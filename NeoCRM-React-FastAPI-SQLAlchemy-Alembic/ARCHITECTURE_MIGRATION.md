# Architecture migration

## Final stack

React + FastAPI + PostgreSQL.

Node.js/Express and Prisma were removed from the primary runtime. FastAPI now owns the API/business layer and also hosts the existing AI email-classification contract.

## Preserved frontend contracts

The React application continues to call:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET/POST /users`
- `PUT/DELETE /users/:id`
- `GET/PUT /organization`
- `GET /audit`
- `GET/POST /customers`
- `GET /dashboard/summary`
- `GET /leads`
- `GET /health`

## Sanjana PR concepts incorporated

- FastAPI primary backend
- SQLAlchemy ORM
- Alembic versioned migrations
- JWT authentication
- Revocable persisted sessions
- organization-scoped data access
- deny-by-default RBAC
- denied permission attempts written to audit logs
- audit actor email, result, before/after state, request metadata
- database trigger enforcing append-only audit rows
- service-oriented separation of seed/security/audit/database concerns

## Migration policy

`alembic upgrade head` is the container startup migration step. The old Prisma `db push --accept-data-loss` command is intentionally gone.

## Verification limitation

The development environment used to assemble this ZIP does not have Docker installed, so `docker compose up --build` could not be executed here. The package was syntax-checked with Python and the Compose file was manually constructed to preserve the existing ports and service names. Run the Docker smoke test locally before merging.
