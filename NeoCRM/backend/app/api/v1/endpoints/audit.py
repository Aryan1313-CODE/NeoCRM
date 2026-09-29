from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_permission
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditListResponse, AuditLogResponse

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=AuditListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: str | None = Query(None),
    result: str | None = Query(None),
    resource_type: str | None = Query(None),
    current_user: User = Depends(require_permission("audit:read")),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog).order_by(AuditLog.created_at.desc())

    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if result:
        q = q.filter(AuditLog.result == result)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)

    total = q.count()
    logs = q.offset((page - 1) * limit).limit(limit).all()

    return AuditListResponse(
        items=[
            AuditLogResponse(
                id=log.id,
                actor_id=log.actor_id,
                actor_email=log.actor_email,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                result=log.result,
                before_state=log.before_state,
                after_state=log.after_state,
                ip_address=log.ip_address,
                created_at=log.created_at.isoformat(),
            )
            for log in logs
        ],
        total=total,
        page=page,
        limit=limit,
    )
