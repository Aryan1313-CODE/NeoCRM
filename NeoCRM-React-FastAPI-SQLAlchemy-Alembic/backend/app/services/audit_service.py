from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import AuditLog, User

def write_audit(db: Session, user: User | None, action: str, resource: str, result: str, resource_id=None, before=None, after=None, request=None, extra=None):
    row = AuditLog(organization_id=user.organization_id if user else (extra or {}).get("organization_id"), actor_user_id=user.id if user else None, actor_email=user.email if user else None, action=action, resource=resource, resource_id=str(resource_id) if resource_id else None, result=result, before_state=before, after_state=after, ip_address=request.client.host if request and request.client else None, user_agent=request.headers.get("user-agent") if request else None, extra=extra)
    db.add(row); db.commit(); return row
