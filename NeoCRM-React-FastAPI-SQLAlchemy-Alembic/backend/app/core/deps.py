from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.security import decode_token
from app.models import User, Session as LoginSession, UserRole, Role, RolePermission
from app.services.audit_service import write_audit

def db(session: Session = Depends(get_db)):
    yield session

def current_user(request: Request, authorization: str | None = Header(default=None), db: Session = Depends(db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, detail="Authentication required")
    try:
        payload = decode_token(authorization[7:])
    except Exception:
        raise HTTPException(401, detail="Invalid or expired token")
    sid = db.query(LoginSession).filter(
        LoginSession.jti == payload.get("jti"),
        LoginSession.revoked_at.is_(None),
        LoginSession.expires_at > datetime.now(timezone.utc),
    ).first()
    if not sid or sid.user_id != payload.get("sub"):
        raise HTTPException(401, detail="Invalid or revoked session")
    user = (
        db.query(User)
        .options(joinedload(User.roles).joinedload(UserRole.role).joinedload(Role.permissions).joinedload(RolePermission.permission))
        .filter(User.id == payload.get("sub"))
        .first()
    )
    if not user or user.status != "ACTIVE":
        raise HTTPException(401, detail="Invalid or inactive session")
    request.state.auth_user = user
    return user

def require_permission(resource: str, action: str):
    def checker(request: Request, user: User = Depends(current_user), db: Session = Depends(db)):
        allowed = {f"{rp.permission.resource}:{rp.permission.action}" for ur in user.roles for rp in ur.role.permissions}
        if f"{resource}:{action}" not in allowed:
            # Match the architecture requirement: denied attempts are themselves audited.
            write_audit(db, user, request.method, resource, "DENIED", resource_id=request.path_params.get("user_id") or request.path_params.get("id"), request=request)
            raise HTTPException(403, detail="You do not have permission to perform this action.")
        return user
    return checker
