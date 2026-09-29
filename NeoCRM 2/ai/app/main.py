from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="NeoCRM AI Service", version="1.0.0")


class EmailRequest(BaseModel):
    subject: str = Field(default="")
    body: str = Field(min_length=1)


class ClassificationResponse(BaseModel):
    category: str
    confidence: float
    extracted: dict[str, Any]
    provider: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai"}


@app.post("/v1/email/classify", response_model=ClassificationResponse)
def classify_email(payload: EmailRequest) -> ClassificationResponse:
    """Prototype AI contract.

    This is intentionally provider-free so the Docker stack works without an
    external API key. Replace this function with an LLM/RAG/LangGraph workflow
    when the AI implementation phase begins.
    """
    text = f"{payload.subject} {payload.body}".lower()
    sales_terms = ["quote", "quotation", "price", "pricing", "buy", "purchase", "require", "need", "kg", "ton"]
    support_terms = ["issue", "problem", "error", "complaint", "not working", "support"]

    sales_hits = sum(term in text for term in sales_terms)
    support_hits = sum(term in text for term in support_terms)

    if sales_hits > support_hits and sales_hits > 0:
        category, confidence = "SALES_INQUIRY", min(0.95, 0.65 + sales_hits * 0.05)
    elif support_hits > 0:
        category, confidence = "SUPPORT", min(0.95, 0.65 + support_hits * 0.05)
    else:
        category, confidence = "OTHER", 0.55

    return ClassificationResponse(
        category=category,
        confidence=round(confidence, 2),
        extracted={"subject": payload.subject.strip()},
        provider="prototype-rule-engine",
    )
