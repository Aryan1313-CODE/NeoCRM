from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password
from app.models import Role, User, UserRole
from app.schemas.api import UserWrite
from app.services.audit_service import write_audit


class UserServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int):
        self.code = code
        self.message = message
        self.status_code = status_code


def list_users(db: Session, organization_id: str) -> list[dict]:
    rows = db.execute(
        select(User)
        .options(joinedload(User.roles).joinedload(UserRole.role))
        .where(User.organization_id == organization_id)
        .order_by(User.created_at)
    ).unique().scalars()
    return [
        {"id": row.id, "name": row.name, "email": row.email,
         "role": row.roles[0].role.name if row.roles else "sales",
         "status": "Active" if row.status == "ACTIVE" else "Inactive"}
        for row in rows
    ]


def create_user(db: Session, actor: User, payload: UserWrite, request) -> dict:
    if db.query(User).filter(func.lower(User.email) == str(payload.email).lower()).first():
        raise UserServiceError("EMAIL_ALREADY_EXISTS", "A user with this email already exists.", 409)
    role = db.query(Role).filter(Role.name == payload.role).first()
    if not role:
        raise UserServiceError("ROLE_NOT_FOUND", "Role not configured", 422)
    new_user = User(
        name=payload.name,
        email=str(payload.email).lower(),
        password_hash=hash_password("Welcome@123"),
        organization_id=actor.organization_id,
        status="ACTIVE" if payload.status == "Active" else "INACTIVE",
    )
    db.add(new_user)
    db.flush()
    db.add(UserRole(user_id=new_user.id, role_id=role.id))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise UserServiceError("EMAIL_ALREADY_EXISTS", "A user with this email already exists.", 409) from exc
    write_audit(db, actor, "CREATE", "User", "SUCCESS", new_user.id,
                after={"name": new_user.name, "email": new_user.email, "role": payload.role, "status": payload.status},
                request=request)
    return {"id": new_user.id, "name": new_user.name, "email": new_user.email, "role": payload.role, "status": payload.status}


def update_user(db: Session, actor: User, user_id: str, payload: UserWrite, request) -> dict:
    user = db.query(User).options(joinedload(User.roles).joinedload(UserRole.role)).filter(
        User.id == user_id, User.organization_id == actor.organization_id,
    ).first()
    if not user:
        raise UserServiceError("USER_NOT_FOUND", "User was not found.", 404)
    email = str(payload.email).lower()
    duplicate = db.query(User).filter(func.lower(User.email) == email, User.id != user.id).first()
    if duplicate:
        raise UserServiceError("EMAIL_ALREADY_EXISTS", "A user with this email already exists.", 409)
    role = db.query(Role).filter(Role.name == payload.role).first()
    if not role:
        raise UserServiceError("ROLE_NOT_FOUND", "Role not configured", 422)
    before = {"name": user.name, "email": user.email, "role": user.roles[0].role.name if user.roles else None, "status": user.status}
    user.name = payload.name
    user.email = email
    user.status = "ACTIVE" if payload.status == "Active" else "INACTIVE"
    user.roles.clear()
    db.flush()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise UserServiceError("EMAIL_ALREADY_EXISTS", "A user with this email already exists.", 409) from exc
    after = {"name": user.name, "email": user.email, "role": payload.role, "status": payload.status}
    write_audit(db, actor, "UPDATE", "User", "SUCCESS", user.id, before=before, after=after, request=request)
    return {"id": user.id, **after}


def deactivate_user(db: Session, actor: User, user_id: str, request) -> dict:
    user = db.query(User).filter(User.id == user_id, User.organization_id == actor.organization_id).first()
    if not user:
        raise UserServiceError("USER_NOT_FOUND", "User was not found.", 404)
    before = user.status
    user.status = "INACTIVE"
    db.commit()
    write_audit(db, actor, "DELETE", "User", "SUCCESS", user.id,
                before={"status": before}, after={"status": "INACTIVE"}, request=request)
    return {"success": True}
