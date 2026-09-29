"""
Audit service — single writer for all audit log entries.

ADD Standard 1: append-only, no mutations.
ADD Standard 2: every handler logs trigger event + effect in one entry.
ADD Standard 3: both permitted and denied attempts are logged (D15).
"""
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


class AuditService:
    def log(
        self,
        db: Session,
        action: str,
        resource_type: str,
        result: str,  # "success" | "failure" | "denied"
        actor: Optional[User] = None,
        actor_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        before_state: Optional[dict] = None,
        after_state: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            result=result,
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
            user_agent=user_agent,
            extra=extra,
        )
        db.add(entry)
        db.flush()  # get the ID without committing — caller owns the transaction
        return entry

    def log_and_commit(self, db: Session, **kwargs) -> AuditLog:
        """Convenience: log + commit in one call. Use for standalone audit events."""
        entry = self.log(db=db, **kwargs)
        db.commit()
        return entry


audit_service = AuditService()
