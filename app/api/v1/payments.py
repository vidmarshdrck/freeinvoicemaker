import os
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, BadRequestException
from app.database.session import get_db
from app.models import Payment, Document, Business, Customer
from app.schemas.common import ApiResponse
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from app.api.deps import AuthContext, require_scope
from app.services.number_generator import generate_next_document_number
from app.services.pdf_generator import pdf_service

router = APIRouter(prefix="/payments", tags=["Payments & Receipts"])


@router.get("", response_model=ApiResponse[List[PaymentResponse]])
def list_payments(
    business_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    document_id: Optional[str] = Query(None),
    auth: AuthContext = Depends(require_scope("payments:read")),
    db: Session = Depends(get_db),
):
    """List all recorded payments and receipts."""
    query = db.query(Payment)

    effective_biz = auth.business_id or business_id
    if effective_biz:
        query = query.filter(Payment.business_id == effective_biz)

    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)

    if document_id:
        query = query.filter(Payment.document_id == document_id)

    payments = query.order_by(Payment.payment_date.desc(), Payment.created_at.desc()).all()

    results = []
    for p in payments:
        resp = PaymentResponse.model_validate(p)
        resp.pdf_url = f"/api/v1/payments/{p.id}/pdf"
        results.append(resp)

    return ApiResponse(
        success=True,
        data=results,
    )


@router.post("", response_model=ApiResponse[PaymentResponse], status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_in: PaymentCreate,
    auth: AuthContext = Depends(require_scope("payments:write")),
    db: Session = Depends(get_db),
):
    """Record a payment and generate receipt."""
    biz_id = auth.business_id or payment_in.business_id
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise NotFoundException("Business", biz_id)

    # If linked to invoice
    doc = None
    customer_id = payment_in.customer_id

    if payment_in.document_id:
        doc = db.query(Document).filter(Document.id == payment_in.document_id).first()
        if not doc:
            raise NotFoundException("Document", payment_in.document_id)
        customer_id = doc.customer_id

    if not customer_id:
        raise BadRequestException("Customer ID is required when no document is specified.")

    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise NotFoundException("Customer", customer_id)

    # Generate receipt number
    receipt_number = generate_next_document_number(db, biz_id, "receipt")

    payment = Payment(
        business_id=biz_id,
        customer_id=customer_id,
        document_id=payment_in.document_id,
        receipt_number=receipt_number,
        amount=payment_in.amount,
        currency=payment_in.currency or (doc.currency if doc else biz.default_currency),
        payment_date=payment_in.payment_date,
        payment_method=payment_in.payment_method,
        reference_number=payment_in.reference_number,
        notes=payment_in.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # If linked to invoice, update invoice totals & status
    if doc and doc.document_type == "invoice":
        all_payments = db.query(Payment).filter(Payment.document_id == doc.id).all()
        total_paid = sum((p.amount for p in all_payments), Decimal("0.00"))
        doc.total_paid = total_paid
        doc.amount_due = max(Decimal("0.00"), doc.grand_total - total_paid)

        if doc.amount_due == Decimal("0.00") and doc.total_paid >= doc.grand_total:
            doc.status = "paid"
        elif doc.total_paid > Decimal("0.00"):
            doc.status = "partially_paid"

        # Regenerate invoice PDF with updated totals
        try:
            pdf_service.generate_document_pdf(doc)
        except Exception:
            pass

        db.commit()

    # Generate Receipt PDF
    try:
        pdf_path = pdf_service.generate_receipt_pdf(payment)
        payment.pdf_path = pdf_path
        db.commit()
        db.refresh(payment)
    except Exception:
        pass

    resp = PaymentResponse.model_validate(payment)
    resp.pdf_url = f"/api/v1/payments/{payment.id}/pdf"

    return ApiResponse(
        success=True,
        message="Payment recorded and receipt generated.",
        data=resp,
    )


@router.get("/{id}", response_model=ApiResponse[PaymentResponse])
def get_payment(
    id: str,
    auth: AuthContext = Depends(require_scope("payments:read")),
    db: Session = Depends(get_db),
):
    """Get single payment details."""
    p = db.query(Payment).filter(Payment.id == id).first()
    if not p:
        raise NotFoundException("Payment", id)

    resp = PaymentResponse.model_validate(p)
    resp.pdf_url = f"/api/v1/payments/{p.id}/pdf"
    return ApiResponse(success=True, data=resp)


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_payment(
    id: str,
    auth: AuthContext = Depends(require_scope("payments:write")),
    db: Session = Depends(get_db),
):
    """Delete a payment record and re-adjust invoice balances."""
    p = db.query(Payment).filter(Payment.id == id).first()
    if not p:
        raise NotFoundException("Payment", id)

    doc_id = p.document_id
    if p.pdf_path and os.path.exists(p.pdf_path):
        try:
            os.remove(p.pdf_path)
        except Exception:
            pass

    db.delete(p)
    db.commit()

    if doc_id:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc and doc.document_type == "invoice":
            all_payments = db.query(Payment).filter(Payment.document_id == doc.id).all()
            total_paid = sum((p.amount for p in all_payments), Decimal("0.00"))
            doc.total_paid = total_paid
            doc.amount_due = max(Decimal("0.00"), doc.grand_total - total_paid)

            if doc.amount_due == Decimal("0.00") and doc.total_paid >= doc.grand_total:
                doc.status = "paid"
            elif doc.total_paid > Decimal("0.00"):
                doc.status = "partially_paid"
            else:
                doc.status = "draft" if doc.status in ["paid", "partially_paid"] else doc.status

            db.commit()

    return ApiResponse(
        success=True,
        message="Payment deleted and balances re-adjusted.",
        data={"deleted_id": id},
    )


@router.get("/{id}/pdf")
def get_receipt_pdf_file(
    id: str,
    auth: AuthContext = Depends(require_scope("payments:read")),
    db: Session = Depends(get_db),
):
    """Download receipt PDF."""
    p = db.query(Payment).filter(Payment.id == id).first()
    if not p:
        raise NotFoundException("Payment", id)

    pdf_path = pdf_service.generate_receipt_pdf(p)
    p.pdf_path = pdf_path
    db.commit()

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        content_disposition_type="inline",
    )
