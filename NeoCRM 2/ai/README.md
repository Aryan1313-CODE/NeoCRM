# NeoCRM AI Service

FastAPI service dedicated to AI/ML capabilities. It is intentionally separate from the Node.js application backend.

## Current prototype endpoints

- `GET /health`
- `POST /v1/email/classify`

The email classifier is a provider-free prototype contract so the complete Docker stack works without an external AI API key. It should later be replaced/extended with the project's actual LLM/RAG/agent workflow.

## Responsibility boundary

- Node.js: authentication, RBAC, CRM/Inventory business logic, PostgreSQL access and integrations.
- FastAPI: AI/ML inference and AI workflows.
- PostgreSQL: transactional system of record.
