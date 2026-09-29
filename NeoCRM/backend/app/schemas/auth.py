from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    status: str
    is_superadmin: bool
    organization_id: str
    roles: list[str]
    permissions: list[str]

    class Config:
        from_attributes = True
