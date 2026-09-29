# Chemora / NeoCRM Backend — Days 1–6

This backend is designed specifically for the existing Days 1–6 React frontend.

## Stack

- Node.js + TypeScript
- Express (modular-monolith foundation)
- PostgreSQL
- Prisma ORM
- JWT authentication
- Argon2 password hashing
- Zod validation
- Helmet + CORS
- Jest
- Docker + Docker Compose

## What is implemented

### Day 1
- PostgreSQL
- Prisma schema/migrations
- Organization/User/Role/Permission models
- Health endpoint
- Docker Compose

### Day 2
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- JWT access token
- Argon2 password hashing

### Day 3
- RBAC
- deny-by-default permission middleware
- role/permission seed data
- denied actions return 403

### Day 4
- User list/create/update/deactivate
- Organization read/update
- role assignment

### Day 5
- Audit log
- successful and denied actions
- standardized validation/auth errors

### Day 6
- PostgreSQL indexes
- transactions for user + role changes
- pagination/filtering for audit
- tests
- Dockerized backend

## Demo credentials

After seeding:

- Admin: `admin@chemora.com`
- Password: `Admin@123`

New users created from the current UI receive a temporary password:

`Welcome@123`

For a production system, this should be replaced by an invitation/password-reset flow.

## Run with Docker

```bash
docker compose up --build
```

API:

`http://localhost:8000`

Health:

`http://localhost:8000/health`

## Run locally

1. Start PostgreSQL.
2. Copy `.env.example` to `.env`.
3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Create/apply migration:

```bash
npx prisma migrate dev --name init
```

6. Seed:

```bash
npm run prisma:seed
```

7. Start:

```bash
npm run start:dev
```

## Frontend connection

Set the frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

Restart Vite after changing `.env`.

## Current frontend contracts

The existing frontend can call:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /organization`
- `PUT /organization`
- `GET /audit`
- `GET /health`

Additional APIs are included for making the Customer and Dashboard screens real:

- `GET /customers`
- `POST /customers`
- `GET /dashboard/summary`

## Important

The current frontend's Customers and Dashboard components still use local/demo state. The backend already exposes APIs for them, but those two frontend components must be switched from local data to API calls in the next integration step.
