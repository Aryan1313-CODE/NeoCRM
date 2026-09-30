# AI integration boundary

AI workflows belong inside this FastAPI application under `app/ai`. Route handlers
should call a service or workflow adapter and validate every structured result
with a Pydantic schema before using it to update CRM data. Model and agent output
is untrusted input.

The email classifier is a local deterministic adapter today. Future LangGraph,
MCP, or model providers should implement the same service contract; they should
not introduce a second API server or write directly to SQLAlchemy models. Keep
provider credentials in settings and make external side effects explicit.
