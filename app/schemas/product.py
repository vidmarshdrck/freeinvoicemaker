from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = None
    unit: str = "unit"
    price: Decimal = Decimal("0.00")
    currency: str = "USD"
    tax_rate: Decimal = Decimal("0.00")
    is_active: bool = True


class ProductCreate(ProductBase):
    business_id: str


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[Decimal] = None
    currency: Optional[str] = None
    tax_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime
