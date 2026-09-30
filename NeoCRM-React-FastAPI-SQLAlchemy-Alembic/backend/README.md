# NeoCRM FastAPI Backend

Primary business API for NeoCRM. Uses FastAPI + SQLAlchemy + Alembic + PostgreSQL.

The API intentionally preserves the frontend contract from the previous Node/Prisma prototype (`/auth`, `/users`, `/organization`, `/audit`, `/customers`, `/dashboard/summary`, `/leads`). The AI email-classification contract is also hosted here at `/v1/email/classify`, so the deployed architecture is React → FastAPI → PostgreSQL with AI capabilities inside the same Python service.

## Development

```bash
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

Default admin: `admin@chemora.com` / `Admin@123`.

Alembic migrations are the source of truth for schema evolution. `db push` is not used.
