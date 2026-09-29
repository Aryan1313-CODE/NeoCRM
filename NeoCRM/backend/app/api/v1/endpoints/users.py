from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserListResponse, UserResponse, UserUpdate
from app.services.audit_service import audit_service
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["users"])


def _user_to_response(u: User) -> UserResponse:
    return UserResponse(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        status=u.status.value,
        is_superadmin=u.is_superadmin,
        organization_id=u.organization_id,
        roles=[r.name for r in u.roles],
        created_at=u.created_at.isoformat(),
    )


@router.get("", response_model=UserListResponse)
def list_users(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_permission("users:read")),
    db: Session = Depends(get_db),
):
    limit = min(limit, 100)
    users, total = user_service.list_users(db, current_user.organization_id, page, limit)
    return UserListResponse(
        items=[_user_to_response(u) for u in users],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    current_user: User = Depends(require_permission("users:create")),
    db: Session = Depends(get_db),
):
    if user_service.get_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    new_user = user_service.create_user(db, payload, current_user.organization_id)

    audit_service.log(
        db=db,
        actor=current_user,
        action="users:create",
        resource_type="users",
        resource_id=new_user.id,
        result="success",
        after_state={"email": new_user.email, "full_name": new_user.full_name},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(new_user)
    return _user_to_response(new_user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    current_user: User = Depends(require_permission("users:read")),
    db: Session = Depends(get_db),
):
    user = user_service.get_by_id(db, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_to_response(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdate,
    request: Request,
    current_user: User = Depends(require_permission("users:update")),
    db: Session = Depends(get_db),
):
    user = user_service.get_by_id(db, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    before = {"full_name": user.full_name, "status": user.status.value}
    updated = user_service.update_user(db, user, payload)

    audit_service.log(
        db=db,
        actor=current_user,
        action="users:update",
        resource_type="users",
        resource_id=user_id,
        result="success",
        before_state=before,
        after_state={"full_name": updated.full_name, "status": updated.status.value},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(updated)
    return _user_to_response(updated)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(require_permission("users:delete")),
    db: Session = Depends(get_db),
):
    user = user_service.get_by_id(db, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent self-deactivation
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    user_service.deactivate_user(db, user)
    audit_service.log(
        db=db,
        actor=current_user,
        action="users:deactivate",
        resource_type="users",
        resource_id=user_id,
        result="success",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
