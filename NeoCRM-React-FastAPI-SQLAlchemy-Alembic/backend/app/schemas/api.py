from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field
class LoginRequest(BaseModel): email: EmailStr; password: str = Field(min_length=1)
class UserWrite(BaseModel): name: str = Field(min_length=1); email: EmailStr; role: str; status: str
class OrgWrite(BaseModel): name: str = Field(min_length=1); industry: str = Field(min_length=1); location: str = Field(min_length=1); currency: str = Field(min_length=1)
class CustomerWrite(BaseModel):
    name: str = Field(min_length=1, max_length=200); company: str = Field(min_length=1, max_length=200); type: str = Field(min_length=1, max_length=50); industry: str = Field(min_length=1, max_length=200); location: str = Field(min_length=1, max_length=200); parent_customer_id: str | None = None
class LeadWrite(BaseModel):
    company: str = Field(min_length=1, max_length=200); contact_name: str = Field(min_length=1, max_length=200); value: Decimal = Field(default=Decimal('0'), ge=0, max_digits=14, decimal_places=2); email: EmailStr | None = None; phone: str | None = Field(default=None, max_length=40); source: str | None = Field(default=None, max_length=80); description: str | None = None; customer_id: str | None = None; owner_user_id: str | None = None
class LeadStageWrite(BaseModel): status: str
class ActivityWrite(BaseModel):
    kind: str = Field(pattern="^(NOTE|CALL|EMAIL|MEETING|TASK)$"); title: str = Field(min_length=1, max_length=200); notes: str | None = None; due_at: datetime | None = None
class EmailRequest(BaseModel): subject: str = ""; body: str = Field(min_length=1)
