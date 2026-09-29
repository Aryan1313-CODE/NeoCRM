from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role_ids: list[str] = []

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be blank")
        return v.strip()


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    status: Optional[str] = None
    role_ids: Optional[list[str]] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    status: str
    is_superadmin: bool
    organization_id: str
    roles: list[str]
    created_at: str

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    limit: int
