from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, require_permission
from app.db.session import get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.services.audit_service import audit_service

router = APIRouter(prefix="/organization", tags=["organization"])


def _org_to_response(org: Organization) -> OrganizationResponse:
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        address=org.address,
        phone=org.phone,
        email=org.email,
        website=org.website,
        is_active=org.is_active,
        created_at=org.created_at.isoformat(),
    )


@router.get("", response_model=OrganizationResponse)
def get_organization(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return _org_to_response(org)


@router.put("", response_model=OrganizationResponse)
def update_organization(
    payload: OrganizationUpdate,
    request: Request,
    current_user: User = Depends(require_permission("organization:update")),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    before = {"name": org.name, "address": org.address, "phone": org.phone}

    if payload.name is not None:
        org.name = payload.name.strip()
    if payload.address is not None:
        org.address = payload.address
    if payload.phone is not None:
        org.phone = payload.phone
    if payload.email is not None:
        org.email = payload.email
    if payload.website is not None:
        org.website = payload.website

    audit_service.log(
        db=db,
        actor=current_user,
        action="organization:update",
        resource_type="organizations",
        resource_id=org.id,
        result="success",
        before_state=before,
        after_state={"name": org.name, "address": org.address, "phone": org.phone},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return _org_to_response(org)
