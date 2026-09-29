from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse
from app.services.audit_service import audit_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, payload.email, payload.password)

    if not user:
        # Log failed attempt — ADD Standard 3, D15
        audit_service.log_and_commit(
            db=db,
            action="auth:login",
            resource_type="auth",
            result="failure",
            actor_email=payload.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            extra={"reason": "invalid_credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_service.build_token(user)
    auth_service.record_login(db, user)

    # Log successful login
    audit_service.log_and_commit(
        db=db,
        actor=user,
        action="auth:login",
        resource_type="auth",
        resource_id=user.id,
        result="success",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_active_user)):
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        status=current_user.status.value,
        is_superadmin=current_user.is_superadmin,
        organization_id=current_user.organization_id,
        roles=[r.name for r in current_user.roles],
        permissions=sorted(current_user.permissions),
    )
