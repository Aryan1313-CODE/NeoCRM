# NeoCRM — Full-Stack Days 1–6 Prototype

This package contains the NeoCRM frontend plus the application backend, PostgreSQL database, and a separate FastAPI AI service.

## Final architecture

```text
React + Vite
     |
     v
Node.js + Express + TypeScript  ----->  FastAPI AI Service
     |                                      |
     v                                      v
PostgreSQL                              AI/ML workflows
```

### Responsibilities

- **React/Vite:** frontend UI.
- **Node.js/Express:** primary application backend — authentication, RBAC, CRM/Inventory business logic, audit, integrations, and PostgreSQL access.
- **PostgreSQL:** transactional system of record.
- **FastAPI:** dedicated AI/ML service. It is not a second CRM backend.

## Docker services

| Service | Port | Purpose |
|---|---:|---|
| PostgreSQL | 5432 | Database |
| Node.js API | 8000 | Main backend |
| FastAPI AI | 8001 | AI service |
| React/Nginx | 8080 | Frontend |

## Start everything

```bash
docker compose up --build
```

Open the frontend:

```text
http://localhost:8080
```

Main API:

```text
http://localhost:8000
```

AI API:

```text
http://localhost:8001
```

Health checks:

```text
http://localhost:8000/health
http://localhost:8001/health
```

## Demo login

```text
Email: admin@chemora.com
Password: Admin@123
```

## AI service

The FastAPI service currently exposes a provider-free prototype email-classification contract:

```text
POST /v1/email/classify
```

The Node.js backend proxies authenticated AI requests through:

```text
POST /ai/email/classify
```

This keeps the browser talking to the Node.js API while FastAPI remains an internal AI service. The prototype classifier does not require an external AI key; it is a placeholder contract for the later LLM/RAG/agent implementation.
