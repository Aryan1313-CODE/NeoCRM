from app.ai.schemas import ClassificationResult


def classify_email(subject: str, body: str) -> ClassificationResult:
    """Deterministic local adapter; future LLM/agent results use the same schema."""
    content = f"{subject} {body}".lower()
    sales = sum(term in content for term in ("quote", "quotation", "price", "pricing", "buy", "purchase", "require", "need", "kg", "ton"))
    support = sum(term in content for term in ("issue", "problem", "error", "complaint", "not working", "support"))
    if sales > support and sales:
        category, confidence = "SALES_INQUIRY", min(0.95, 0.65 + sales * 0.05)
    elif support:
        category, confidence = "SUPPORT", min(0.95, 0.65 + support * 0.05)
    else:
        category, confidence = "OTHER", 0.55

    # Parsing through the schema is mandatory even for this local adapter.
    return ClassificationResult.model_validate({
        "category": category,
        "confidence": round(confidence, 2),
        "extracted": {"subject": subject.strip()},
        "provider": "prototype-rule-engine",
    })
