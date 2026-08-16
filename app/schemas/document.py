from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.customer import CustomerResponse
from app.schemas.business import BusinessResponse


class DocumentItemCreate(BaseModel):
    product_id: Optional[str] = None
    item_order: int = 0
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    unit: str = "unit"
    quantity: Decimal = Field(default=Decimal("1.00"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    discount_amount: Optional[Decimal] = None
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None


class DocumentItemResponse(DocumentItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    document_id: str
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal


class DocumentBase(BaseModel):
    customer_id: str
    document_type: str = "invoice"  # invoice, quotation, estimate, receipt, proforma
    document_number: Optional[str] = None  # Auto-generated if not provided
    reference_number: Optional[str] = None

    issue_date: str  # YYYY-MM-DD
    due_date: Optional[str] = None  # YYYY-MM-DD
    expiry_date: Optional[str] = None  # YYYY-MM-DD
    status: Optional[str] = None  # draft, sent, etc.

    currency: str = "USD"
    discount_type: str = "fixed"  # fixed, percentage
    discount_rate: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")
    tax_type: str = "exclusive"  # exclusive, inclusive
    shipping_fee: Decimal = Decimal("0.00")

    notes: Optional[str] = None
    terms: Optional[str] = None
    cover_letter_enabled: bool = False
    cover_letter_title: Optional[str] = None
    cover_letter_body: Optional[str] = None
    payment_instructions_override: Optional[str] = None
    bank_details_override: Optional[str] = None

    template_name: Optional[str] = None
    primary_color: Optional[str] = None
    signature_enabled: bool = True
    stamp_enabled: bool = True


class DocumentCreate(DocumentBase):
    business_id: str
    items: List[DocumentItemCreate] = []


class DocumentUpdate(BaseModel):
    customer_id: Optional[str] = None
    document_number: Optional[str] = None
    reference_number: Optional[str] = None
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    expiry_date: Optional[str] = None
    status: Optional[str] = None

    currency: Optional[str] = None
    discount_type: Optional[str] = None
    discount_rate: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    tax_type: Optional[str] = None
    shipping_fee: Optional[Decimal] = None

    notes: Optional[str] = None
    terms: Optional[str] = None
    cover_letter_enabled: Optional[bool] = None
    cover_letter_title: Optional[str] = None
    cover_letter_body: Optional[str] = None
    payment_instructions_override: Optional[str] = None
    bank_details_override: Optional[str] = None

    template_name: Optional[str] = None
    primary_color: Optional[str] = None
    signature_enabled: Optional[bool] = None
    stamp_enabled: Optional[bool] = None

    items: Optional[List[DocumentItemCreate]] = None


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    business_id: str
    document_number: str
    status: str

    subtotal: Decimal
    total_discount: Decimal
    total_tax: Decimal
    grand_total: Decimal
    total_paid: Decimal
    amount_due: Decimal

    converted_from_id: Optional[str] = None
    converted_to_invoice_id: Optional[str] = None
    pdf_path: Optional[str] = None
    pdf_url: Optional[str] = None

    created_at: datetime
    updated_at: datetime
    items: List[DocumentItemResponse] = []


class DocumentDetailResponse(DocumentResponse):
    customer: Optional[CustomerResponse] = None
    business: Optional[BusinessResponse] = None


class ConvertQuotationRequest(BaseModel):
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
