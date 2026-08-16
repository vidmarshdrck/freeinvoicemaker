from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    payment_date: str  # YYYY-MM-DD
    payment_method: str = "Bank Transfer"  # Cash, Bank Transfer, Mobile Money, Card, Cheque, Other
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    business_id: str
    customer_id: Optional[str] = None
    document_id: Optional[str] = None  # Link to invoice if applicable
    generate_receipt: bool = True


class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    business_id: str
    customer_id: str
    document_id: Optional[str] = None
    receipt_number: Optional[str] = None
    pdf_path: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
