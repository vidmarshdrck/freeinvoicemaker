from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.document import DocumentResponse


class DashboardStatsResponse(BaseModel):
    business_id: str
    business_name: str
    currency: str
    total_invoiced: Decimal = Decimal("0.00")
    total_paid: Decimal = Decimal("0.00")
    total_outstanding: Decimal = Decimal("0.00")
    total_overdue: Decimal = Decimal("0.00")

    count_invoices: int = 0
    count_paid_invoices: int = 0
    count_unpaid_invoices: int = 0
    count_overdue_invoices: int = 0
    count_quotations: int = 0
    count_estimates: int = 0
    count_receipts: int = 0
    count_customers: int = 0
    count_products: int = 0

    recent_documents: List[DocumentResponse] = []
