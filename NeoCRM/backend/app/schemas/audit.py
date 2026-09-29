from pydantic import BaseModel
from typing import Optional, Any


class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    result: str
    before_state: Optional[Any] = None
    after_state: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class AuditListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    limit: int
