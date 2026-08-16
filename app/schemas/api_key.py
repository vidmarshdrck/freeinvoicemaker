from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ApiKeyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    scopes: str = Field(default="*", description="Comma-separated scopes or '*' for all")
    business_id: Optional[str] = None


class ApiKeyCreate(ApiKeyBase):
    pass


class ApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    scopes: Optional[str] = None
    is_active: Optional[bool] = None


class ApiKeyResponse(ApiKeyBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime


class ApiKeyCreatedResponse(ApiKeyResponse):
    raw_key: str = Field(..., description="Full API key shown only once upon creation")
