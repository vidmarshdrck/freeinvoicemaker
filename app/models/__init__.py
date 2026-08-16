import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(64), nullable=False)
    key_hash = Column(String(64), unique=True, index=True, nullable=False)
    scopes = Column(Text, nullable=False, default="*")  # Comma-separated or JSON list
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    business = relationship("Business", back_populates="api_keys")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    trading_name = Column(String(255), nullable=True)
    registration_number = Column(String(100), nullable=True)
    tax_number = Column(String(100), nullable=True)

    # Contact & Address
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    province_state = Column(String(100), nullable=True)
    postal_code = Column(String(50), nullable=True)
    country = Column(String(100), default="Zambia", nullable=False)

    # Branding Assets (Paths in storage)
    logo_path = Column(String(500), nullable=True)
    signature_path = Column(String(500), nullable=True)
    signature_label = Column(String(100), default="Authorised Signatory", nullable=True)
    stamp_path = Column(String(500), nullable=True)

    # Bank & Payment Info
    bank_name = Column(String(255), nullable=True)
    bank_account_name = Column(String(255), nullable=True)
    bank_account_number = Column(String(100), nullable=True)
    bank_branch = Column(String(100), nullable=True)
    bank_swift_bic = Column(String(100), nullable=True)
    mobile_money_number = Column(String(100), nullable=True)
    payment_instructions = Column(Text, nullable=True)

    # Defaults & Document Settings
    default_currency = Column(String(10), default="USD", nullable=False)
    default_tax_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    default_tax_inclusive = Column(Boolean, default=False, nullable=False)
    default_terms = Column(Text, nullable=True)
    default_notes = Column(Text, nullable=True)
    default_cover_letter = Column(Text, nullable=True)

    # Visual Style
    primary_color = Column(String(20), default="#2563eb", nullable=False)
    secondary_color = Column(String(20), default="#1e293b", nullable=False)
    template_name = Column(String(50), default="modern", nullable=False)  # classic, modern, minimal
    is_default = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    customers = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="business", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="business", cascade="all, delete-orphan")
    sequences = relationship("DocumentSequence", back_populates="business", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="business")


class DocumentSequence(Base):
    __tablename__ = "document_sequences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), nullable=False)  # invoice, quotation, estimate, receipt, proforma
    prefix = Column(String(20), default="INV-", nullable=False)
    next_number = Column(Integer, default=1, nullable=False)
    padding_length = Column(Integer, default=5, nullable=False)
    include_year = Column(Boolean, default=False, nullable=False)
    include_month = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    business = relationship("Business", back_populates="sequences")

    __table_args__ = (
        UniqueConstraint("business_id", "document_type", name="uq_business_doc_type_sequence"),
    )


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_type = Column(String(20), default="business", nullable=False)  # business, individual
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    company_name = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(100), nullable=True)
    alt_phone = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    province_state = Column(String(100), nullable=True)
    postal_code = Column(String(50), nullable=True)
    country = Column(String(100), default="Zambia", nullable=False)
    tax_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    business = relationship("Business", back_populates="customers")
    documents = relationship("Document", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sku = Column(String(100), nullable=True)
    unit = Column(String(50), default="unit", nullable=False)  # hrs, items, pcs, days, etc.
    price = Column(Numeric(12, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    business = relationship("Business", back_populates="products")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    document_type = Column(String(50), default="invoice", nullable=False, index=True)  # invoice, quotation, estimate, receipt, proforma
    document_number = Column(String(100), nullable=False, index=True)
    reference_number = Column(String(100), nullable=True)

    # Dates
    issue_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    due_date = Column(String(20), nullable=True)     # YYYY-MM-DD
    expiry_date = Column(String(20), nullable=True)  # YYYY-MM-DD for quotes/estimates

    # Status
    # Invoices: draft, sent, partially_paid, paid, overdue, cancelled
    # Quotes/Estimates: draft, sent, accepted, rejected, expired, converted
    # Receipts: issued, cancelled
    status = Column(String(50), default="draft", nullable=False, index=True)

    # Financials (Decimal precision)
    currency = Column(String(10), default="USD", nullable=False)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_type = Column(String(20), default="fixed", nullable=False)  # fixed, percentage
    discount_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_discount = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_type = Column(String(20), default="exclusive", nullable=False)  # exclusive, inclusive
    total_tax = Column(Numeric(12, 2), default=0.00, nullable=False)
    shipping_fee = Column(Numeric(12, 2), default=0.00, nullable=False)
    grand_total = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_paid = Column(Numeric(12, 2), default=0.00, nullable=False)
    amount_due = Column(Numeric(12, 2), default=0.00, nullable=False)

    # Text & Content
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    cover_letter_enabled = Column(Boolean, default=False, nullable=False)
    cover_letter_title = Column(String(255), nullable=True)
    cover_letter_body = Column(Text, nullable=True)
    payment_instructions_override = Column(Text, nullable=True)
    bank_details_override = Column(Text, nullable=True)

    # Visual Customization
    template_name = Column(String(50), default="modern", nullable=False)
    primary_color = Column(String(20), default="#2563eb", nullable=False)
    signature_enabled = Column(Boolean, default=True, nullable=False)
    stamp_enabled = Column(Boolean, default=True, nullable=False)

    # Lineage / Conversion
    converted_from_id = Column(String(36), nullable=True)
    converted_to_invoice_id = Column(String(36), nullable=True)

    # Generated PDF file path
    pdf_path = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="documents")
    customer = relationship("Customer", back_populates="documents")
    items = relationship("DocumentItem", back_populates="document", cascade="all, delete-orphan", order_by="DocumentItem.item_order")
    payments = relationship("Payment", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("business_id", "document_type", "document_number", name="uq_business_doc_number"),
    )


class DocumentItem(Base):
    __tablename__ = "document_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    item_order = Column(Integer, default=0, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(50), default="unit", nullable=False)
    quantity = Column(Numeric(10, 2), default=1.00, nullable=False)
    unit_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False)

    document = relationship("Document", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    receipt_number = Column(String(100), nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    payment_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    payment_method = Column(String(50), default="Bank Transfer", nullable=False)  # Cash, Bank Transfer, Mobile Money, Card, Cheque, Other
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    business = relationship("Business", back_populates="payments")
    document = relationship("Document", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")
