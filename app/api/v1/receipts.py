from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import ApiResponse
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.api.deps import AuthContext, require_scope
from app.api.v1.payments import (
    list_payments,
    record_payment,
    get_payment,
    get_receipt_pdf_file,
)

router = APIRouter(prefix="/receipts", tags=["Receipts"])


@router.get("", response_model=ApiResponse[List[PaymentResponse]])
def get_receipts(
    business_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    auth: AuthContext = Depends(require_scope("payments:read")),
    db: Session = Depends(get_db),
):
    """List all payment receipts."""
    return list_payments(
        business_id=business_id,
        customer_id=customer_id,
        auth=auth,
        db=db,
    )


@router.post("", response_model=ApiResponse[PaymentResponse], status_code=status.HTTP_201_CREATED)
def create_receipt(
    payment_in: PaymentCreate,
    auth: AuthContext = Depends(require_scope("payments:write")),
    db: Session = Depends(get_db),
):
    """Create a new payment receipt."""
    return record_payment(payment_in=payment_in, auth=auth, db=db)


@router.get("/{id}", response_model=ApiResponse[PaymentResponse])
def get_receipt_by_id(
    id: str,
    auth: AuthContext = Depends(require_scope("payments:read")),
    db: Session = Depends(get_db),
):
    """Get single receipt details."""
    return get_payment(id=id, auth=auth, db=db)


@router.get("/{id}/pdf")
def get_receipt_pdf(
    id: str,
    auth: AuthContext = Depends(require_scope("payments:read")),
    db: Session = Depends(get_db),
):
    """Download receipt PDF."""
    return get_receipt_pdf_file(id=id, auth=auth, db=db)
