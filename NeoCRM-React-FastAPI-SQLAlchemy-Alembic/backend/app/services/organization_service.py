from sqlalchemy.orm import Session

from app.models import Organization, User
from app.schemas.api import OrgWrite
from app.services.audit_service import write_audit


def get_organization(db: Session, organization_id: str) -> dict | None:
    organization = db.get(Organization, organization_id)
    if not organization:
        return None
    return {
        "name": organization.name,
        "industry": organization.industry,
        "location": organization.location,
        "currency": organization.currency,
    }


def update_organization(db: Session, actor: User, payload: OrgWrite, request) -> dict | None:
    organization = db.get(Organization, actor.organization_id)
    if not organization:
        return None
    before = {
        "name": organization.name,
        "industry": organization.industry,
        "location": organization.location,
        "currency": organization.currency,
    }
    for field, value in payload.model_dump().items():
        setattr(organization, field, value)
    db.commit()
    after = get_organization(db, organization.id)
    write_audit(db, actor, "UPDATE", "Organization", "SUCCESS", organization.id,
                before=before, after=after, request=request)
    return after
