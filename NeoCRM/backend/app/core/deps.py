"""
FastAPI dependencies for auth and RBAC.

ADD Standard 3: RBAC checkpoint sits at the API layer, deny-by-default,
both permitted and denied attempts are audit-logged (Ch.4 §4.4.2, D13, D15).
"""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.services.audit_service import audit_service

bearer = HTTPBearer(auto_error=False)


def _get_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_current_user(
    request: Request,
    token: str = Depends(_get_token),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub", "")
    user = (
        db.query(User)
        .options(joinedload(User.roles).joinedload("permissions"))
        .filter(User.id == user_id)
        .first()
    )

    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def require_permission(action: str):
    """
    Returns a FastAPI dependency that enforces a specific permission.
    Denied attempts are audit-logged per ADD Standard 3 / D15.

    Usage:
        @router.get("/resource", dependencies=[Depends(require_permission("resource:read"))])
    """
    def _check(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if not current_user.has_permission(action):
            # Log denied attempt (ADD Standard 3, D15)
            audit_service.log(
                db=db,
                actor=current_user,
                action=action,
                resource_type="permission_check",
                result="denied",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {action}",
            )
        return current_user

    return _check
