from pydantic import BaseModel, EmailStr, Field
class LoginRequest(BaseModel): email: EmailStr; password: str = Field(min_length=1)
class UserWrite(BaseModel): name: str = Field(min_length=1); email: EmailStr; role: str; status: str
class OrgWrite(BaseModel): name: str = Field(min_length=1); industry: str = Field(min_length=1); location: str = Field(min_length=1); currency: str = Field(min_length=1)
class CustomerWrite(BaseModel): name: str = Field(min_length=1); company: str = Field(min_length=1); type: str = Field(min_length=1); industry: str = Field(min_length=1); location: str = Field(min_length=1)
class EmailRequest(BaseModel): subject: str = ""; body: str = Field(min_length=1)
