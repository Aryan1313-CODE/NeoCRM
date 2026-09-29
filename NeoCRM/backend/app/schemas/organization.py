from pydantic import BaseModel, EmailStr
from typing import Optional


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True
