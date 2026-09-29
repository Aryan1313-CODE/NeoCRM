import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.session import Base
from app.models.role import user_roles


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        SAEnum(UserStatus), default=UserStatus.active, nullable=False
    )
    is_superadmin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # FK to organization
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    # last_login is mutable — it's operational state, not a business fact
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="users"
    )
    roles: Mapped[list["Role"]] = relationship(
        "Role", secondary=user_roles, back_populates="users"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id"
    )

    @property
    def permissions(self) -> set[str]:
        """Flat set of all permission actions this user holds via their roles."""
        perms: set[str] = set()
        for role in self.roles:
            for perm in role.permissions:
                perms.add(perm.action)
        return perms

    def has_permission(self, action: str) -> bool:
        if self.is_superadmin:
            return True
        return action in self.permissions
