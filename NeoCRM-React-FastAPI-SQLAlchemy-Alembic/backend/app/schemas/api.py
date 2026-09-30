from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints


ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Currency = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=3, to_upper=True)]


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=1, max_length=1024)]


class UserWrite(BaseModel):
    name: ShortText
    email: EmailStr
    role: Literal["admin", "sales_manager", "sales", "inventory", "auditor"]
    status: Literal["Active", "Inactive"]


class OrgWrite(BaseModel):
    name: ShortText
    industry: ShortText
    location: ShortText
    currency: Currency


class CustomerWrite(BaseModel):
    name: ShortText
    company: ShortText
    type: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    industry: ShortText
    location: ShortText


class EmailRequest(BaseModel):
    subject: Annotated[str, Field(max_length=500)] = ""
    body: Annotated[str, Field(min_length=1, max_length=100_000)]
