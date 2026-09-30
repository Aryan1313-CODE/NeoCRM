from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Customer, Lead, Quote, User
from app.schemas.api import CustomerWrite
from app.services.audit_service import write_audit


def dashboard_summary(db: Session, organization_id: str) -> dict:
    total = db.query(Customer).filter(Customer.organization_id == organization_id).count()
    active_leads = db.query(Lead).filter(
        Lead.organization_id == organization_id, Lead.status.notin_(["WON", "LOST"]),
    ).count()
    pipeline = db.query(func.coalesce(func.sum(Lead.value), 0)).filter(
        Lead.organization_id == organization_id, Lead.status.notin_(["WON", "LOST"]),
    ).scalar() or 0
    quotes = db.query(Quote).filter(
        Quote.organization_id == organization_id, Quote.status != "DRAFT",
    ).count()
    closed = db.query(Lead).filter(
        Lead.organization_id == organization_id, Lead.status.in_(["WON", "LOST"]),
    ).count()
    won = db.query(Lead).filter(
        Lead.organization_id == organization_id, Lead.status == "WON",
    ).count()
    return {
        "totalCustomers": total,
        "activeLeads": active_leads,
        "pipelineValue": float(pipeline),
        "quotesSent": quotes,
        "conversionRate": round((won / closed) * 100, 1) if closed else 0,
    }


def create_customer(db: Session, actor: User, payload: CustomerWrite, request) -> dict:
    values = payload.model_dump()
    customer = Customer(organization_id=actor.organization_id, **values)
    db.add(customer)
    db.commit()
    write_audit(db, actor, "CREATE", "Customer", "SUCCESS", customer.id,
                after=values, request=request)
    return {"id": customer.id, **values, "status": "Active", "last": "Never"}
