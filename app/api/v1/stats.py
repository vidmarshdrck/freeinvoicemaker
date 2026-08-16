from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.database.session import get_db
from app.models import Business, Document, Customer, Product, Payment
from app.schemas.common import ApiResponse
from app.schemas.stats import DashboardStatsResponse
from app.schemas.document import DocumentResponse
from app.api.deps import AuthContext, get_current_auth

router = APIRouter(prefix="/stats", tags=["Dashboard & Statistics"])


@router.get("/dashboard", response_model=ApiResponse[DashboardStatsResponse])
def get_dashboard_stats(
    business_id: Optional[str] = Query(None),
    auth: AuthContext = Depends(get_current_auth),
    db: Session = Depends(get_db),
):
    """Retrieve overview metrics and recent activity for the selected business."""
    target_biz_id = auth.business_id or business_id
    biz = None

    if target_biz_id:
        biz = db.query(Business).filter(Business.id == target_biz_id).first()

    if not biz:
        # Fallback to default business or first business
        biz = db.query(Business).filter(Business.is_default == True).first()
        if not biz:
            biz = db.query(Business).first()

    if not biz:
        # No businesses yet, return empty stats
        return ApiResponse(
            success=True,
            data=DashboardStatsResponse(
                business_id="none",
                business_name="No Business Configured",
                currency="USD",
            ),
        )

    today_str = date.today().isoformat()

    # Query documents for this business
    docs = db.query(Document).filter(Document.business_id == biz.id).all()
    invoices = [d for d in docs if d.document_type == "invoice" and d.status != "cancelled"]

    total_invoiced = sum((d.grand_total for d in invoices), Decimal("0.00"))
    total_paid = sum((d.total_paid for d in invoices), Decimal("0.00"))
    total_outstanding = sum((d.amount_due for d in invoices if d.status not in ["paid"]), Decimal("0.00"))

    # Overdue calculation: due_date < today and amount_due > 0
    overdue_invoices = [
        d for d in invoices
        if d.due_date and d.due_date < today_str and d.amount_due > Decimal("0.00") and d.status not in ["paid", "cancelled"]
    ]
    total_overdue = sum((d.amount_due for d in overdue_invoices), Decimal("0.00"))

    paid_invoices = [d for d in invoices if d.status == "paid" or d.amount_due == Decimal("0.00")]
    unpaid_invoices = [d for d in invoices if d.status not in ["paid"] and d.amount_due > Decimal("0.00")]

    count_quotes = len([d for d in docs if d.document_type == "quotation"])
    count_estimates = len([d for d in docs if d.document_type == "estimate"])
    count_receipts = db.query(Payment).filter(Payment.business_id == biz.id).count()
    count_customers = db.query(Customer).filter(Customer.business_id == biz.id).count()
    count_products = db.query(Product).filter(Product.business_id == biz.id).count()

    # Recent documents
    recent_docs = (
        db.query(Document)
        .filter(Document.business_id == biz.id)
        .order_by(Document.created_at.desc())
        .limit(8)
        .all()
    )

    recent_responses = []
    for d in recent_docs:
        resp = DocumentResponse.model_validate(d)
        resp.pdf_url = f"/api/v1/documents/{d.id}/pdf"
        recent_responses.append(resp)

    stats = DashboardStatsResponse(
        business_id=biz.id,
        business_name=biz.trading_name or biz.name,
        currency=biz.default_currency,
        total_invoiced=total_invoiced,
        total_paid=total_paid,
        total_outstanding=total_outstanding,
        total_overdue=total_overdue,
        count_invoices=len(invoices),
        count_paid_invoices=len(paid_invoices),
        count_unpaid_invoices=len(unpaid_invoices),
        count_overdue_invoices=len(overdue_invoices),
        count_quotations=count_quotes,
        count_estimates=count_estimates,
        count_receipts=count_receipts,
        count_customers=count_customers,
        count_products=count_products,
        recent_documents=recent_responses,
    )

    return ApiResponse(
        success=True,
        data=stats,
    )
