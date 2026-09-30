import uuid
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint, Index, UniqueConstraint, func, column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("status IN ('ACTIVE', 'INACTIVE')", name="ck_users_status"),
        Index("ix_users_org", "organization_id"),
        Index("ix_users_org_created", "organization_id", "created_at"),
        Index("uq_users_email_lower", func.lower(column("email")), unique=True),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", index=True, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    organization = relationship("Organization", back_populates="users")
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    audits = relationship("AuditLog", back_populates="actor")

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    users = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("resource", "action", name="uq_permission_resource_action"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resource: Mapped[str] = mapped_column(String(80), nullable=False)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[str] = mapped_column(ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")

class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (Index("ix_sessions_user", "user_id"), Index("ix_sessions_jti", "jti"))
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    jti: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
