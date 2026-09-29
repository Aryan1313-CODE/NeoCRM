"""
Audit Log — append-only per ADD Standard 1 (Chapter 5 §5.11, Chapter 8 §8.4.4).

Rules enforced here:
  - created_at only, no updated_at
  - No UPDATE/DELETE granted to app role (enforced in migration via REVOKE)
  - Corrections are new rows, never mutations
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Who did it
    actor_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    actor_email: Mapped[str | None] = mapped_column(
        String(255), nullable=True  # denormalised so log survives user deletion
    )
    # What happened
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # e.g. "users", "organizations", "auth"
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    # Result
    result: Mapped[str] = mapped_column(String(20), nullable=False)  # "success" | "failure" | "denied"
    # Before/after state snapshot (nullable for creates/reads)
    before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Request metadata
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    extra: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Append-only: created_at only, never updated_at
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    actor: Mapped["User | None"] = relationship(
        "User", back_populates="audit_logs", foreign_keys=[actor_id]
    )
