from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentSequenceConfig(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    document_type: str
    prefix: str = "INV-"
    next_number: int = 1
    padding_length: int = 5
    include_year: bool = False
    include_month: bool = False


class DocumentSequenceUpdate(BaseModel):
    prefix: Optional[str] = None
    next_number: Optional[int] = None
    padding_length: Optional[int] = None
    include_year: Optional[bool] = None
    include_month: Optional[bool] = None


class BusinessBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    trading_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_number: Optional[str] = None

    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province_state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Zambia"

    logo_path: Optional[str] = None
    signature_path: Optional[str] = None
    signature_label: Optional[str] = "Authorised Signatory"
    stamp_path: Optional[str] = None

    bank_name: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_swift_bic: Optional[str] = None
    mobile_money_number: Optional[str] = None
    payment_instructions: Optional[str] = None

    default_currency: str = "USD"
    default_tax_rate: Decimal = Decimal("0.00")
    default_tax_inclusive: bool = False
    default_terms: Optional[str] = None
    default_notes: Optional[str] = None
    default_cover_letter: Optional[str] = None

    primary_color: str = "#2563eb"
    secondary_color: str = "#1e293b"
    template_name: str = "modern"
    is_default: bool = False


class BusinessCreate(BusinessBase):
    pass


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    trading_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_number: Optional[str] = None

    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province_state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    logo_path: Optional[str] = None
    signature_path: Optional[str] = None
    signature_label: Optional[str] = None
    stamp_path: Optional[str] = None

    bank_name: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_swift_bic: Optional[str] = None
    mobile_money_number: Optional[str] = None
    payment_instructions: Optional[str] = None

    default_currency: Optional[str] = None
    default_tax_rate: Optional[Decimal] = None
    default_tax_inclusive: Optional[bool] = None
    default_terms: Optional[str] = None
    default_notes: Optional[str] = None
    default_cover_letter: Optional[str] = None

    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    template_name: Optional[str] = None
    is_default: Optional[bool] = None


class BusinessResponse(BusinessBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    sequences: List[DocumentSequenceConfig] = []
