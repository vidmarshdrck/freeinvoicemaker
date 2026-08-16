from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, BadRequestException
from app.database.session import get_db
from app.models import Customer, Document, Payment, Business
from app.schemas.common import ApiResponse
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerDetailResponse,
    CustomerHistorySummary,
)
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_auth, AuthContext, require_scope

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=ApiResponse[List[CustomerResponse]])
def list_customers(
    business_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search by name, email, or company"),
    auth: AuthContext = Depends(require_scope("customers:read")),
    db: Session = Depends(get_db),
):
    """List and search customers."""
    query = db.query(Customer)

    effective_biz = auth.business_id or business_id
    if effective_biz:
        query = query.filter(Customer.business_id == effective_biz)

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Customer.display_name.ilike(search),
                Customer.company_name.ilike(search),
                Customer.email.ilike(search),
                Customer.phone.ilike(search),
            )
        )

    customers = query.order_by(Customer.display_name.asc()).all()
    return ApiResponse(
        success=True,
        data=[CustomerResponse.model_validate(c) for c in customers],
    )


@router.post("", response_model=ApiResponse[CustomerResponse], status_code=status.HTTP_201_CREATED)
def create_customer(
    cust_in: CustomerCreate,
    auth: AuthContext = Depends(require_scope("customers:write")),
    db: Session = Depends(get_db),
):
    """Create a new customer."""
    # Verify business
    biz_id = auth.business_id or cust_in.business_id
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise NotFoundException("Business", biz_id)

    cust_data = cust_in.model_dump()
    cust_data["business_id"] = biz_id

    # Compute display_name if needed
    if not cust_data.get("display_name"):
        if cust_data.get("company_name"):
            cust_data["display_name"] = cust_data["company_name"]
        elif cust_data.get("first_name") or cust_data.get("last_name"):
            cust_data["display_name"] = f"{cust_data.get('first_name', '')} {cust_data.get('last_name', '')}".strip()
        else:
            cust_data["display_name"] = "Valued Customer"

    cust = Customer(**cust_data)
    db.add(cust)
    db.commit()
    db.refresh(cust)

    return ApiResponse(
        success=True,
        message="Customer created successfully.",
        data=CustomerResponse.model_validate(cust),
    )


@router.get("/{id}", response_model=ApiResponse[CustomerDetailResponse])
def get_customer(
    id: str,
    auth: AuthContext = Depends(require_scope("customers:read")),
    db: Session = Depends(get_db),
):
    """Get customer details along with financial history summary."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    if not cust:
        raise NotFoundException("Customer", id)

    # Compute summary stats
    docs = db.query(Document).filter(Customer.id == id).all()
    inv_docs = [d for d in docs if d.document_type == "invoice"]

    total_invoiced = sum((d.grand_total for d in inv_docs if d.status != "cancelled"), Decimal("0.00"))
    total_paid = sum((d.total_paid for d in inv_docs if d.status != "cancelled"), Decimal("0.00"))
    outstanding = sum((d.amount_due for d in inv_docs if d.status not in ["paid", "cancelled"]), Decimal("0.00"))

    summary = CustomerHistorySummary(
        total_invoiced=total_invoiced,
        total_paid=total_paid,
        outstanding_amount=outstanding,
        invoice_count=len(inv_docs),
        quotation_count=len([d for d in docs if d.document_type == "quotation"]),
        estimate_count=len([d for d in docs if d.document_type == "estimate"]),
        receipt_count=db.query(Payment).filter(Payment.customer_id == id).count(),
    )

    resp_data = CustomerDetailResponse.model_validate(cust)
    resp_data.summary = summary

    return ApiResponse(
        success=True,
        data=resp_data,
    )


@router.patch("/{id}", response_model=ApiResponse[CustomerResponse])
def update_customer(
    id: str,
    cust_in: CustomerUpdate,
    auth: AuthContext = Depends(require_scope("customers:write")),
    db: Session = Depends(get_db),
):
    """Update customer details."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    if not cust:
        raise NotFoundException("Customer", id)

    update_data = cust_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(cust, field, val)

    db.commit()
    db.refresh(cust)

    return ApiResponse(
        success=True,
        message="Customer updated successfully.",
        data=CustomerResponse.model_validate(cust),
    )


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_customer(
    id: str,
    auth: AuthContext = Depends(require_scope("customers:write")),
    db: Session = Depends(get_db),
):
    """Delete customer."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    if not cust:
        raise NotFoundException("Customer", id)

    # Check if active documents prevent deletion
    doc_count = db.query(Document).filter(Document.customer_id == id).count()
    if doc_count > 0:
        # Soft delete or return message
        cust.is_active = False
        db.commit()
        return ApiResponse(
            success=True,
            message="Customer has existing documents and was deactivated.",
            data={"id": id, "deactivated": True},
        )

    db.delete(cust)
    db.commit()
    return ApiResponse(
        success=True,
        message="Customer deleted.",
        data={"deleted_id": id},
    )


@router.get("/{id}/documents", response_model=ApiResponse[List[DocumentResponse]])
def get_customer_documents(
    id: str,
    doc_type: Optional[str] = Query(None),
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Get all documents created for a specific customer."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    if not cust:
        raise NotFoundException("Customer", id)

    query = db.query(Document).filter(Document.customer_id == id)
    if doc_type:
        query = query.filter(Document.document_type == doc_type.lower())

    docs = query.order_by(Document.created_at.desc()).all()
    return ApiResponse(
        success=True,
        data=[DocumentResponse.model_validate(d) for d in docs],
    )
