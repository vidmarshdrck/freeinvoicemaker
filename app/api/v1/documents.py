import os
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, BadRequestException
from app.database.session import get_db
from app.models import Document, DocumentItem, Business, Customer
from app.schemas.common import ApiResponse
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentDetailResponse,
    ConvertQuotationRequest,
)
from app.api.deps import get_current_auth, AuthContext, require_scope
from app.services.calculator import calculate_line_item, calculate_document_totals
from app.services.number_generator import generate_next_document_number
from app.services.pdf_generator import pdf_service

router = APIRouter(prefix="/documents", tags=["Documents"])


def process_document_items_and_totals(
    db: Session,
    doc: Document,
    items_in: List,
    business: Business,
    discount_type: str,
    discount_rate: Decimal,
    discount_amount: Decimal,
    tax_type: str,
    shipping_fee: Decimal,
):
    """Calculate and populate all line items and document totals."""
    # Delete existing items
    db.query(DocumentItem).filter(DocumentItem.document_id == doc.id).delete()

    calculated_items = []
    items_calc_data = []

    for idx, it in enumerate(items_in):
        item_data = it if isinstance(it, dict) else it.model_dump()
        calc = calculate_line_item(
            quantity=item_data.get("quantity", Decimal("1.00")),
            unit_price=item_data.get("unit_price", Decimal("0.00")),
            discount_rate=item_data.get("discount_rate", Decimal("0.00")),
            tax_rate=item_data.get("tax_rate", Decimal("0.00")),
            tax_inclusive=(tax_type == "inclusive"),
        )
        items_calc_data.append(calc)

        doc_item = DocumentItem(
            document_id=doc.id,
            product_id=item_data.get("product_id"),
            item_order=item_data.get("item_order", idx),
            name=item_data["name"],
            description=item_data.get("description"),
            unit=item_data.get("unit", "unit"),
            quantity=item_data.get("quantity", Decimal("1.00")),
            unit_price=item_data.get("unit_price", Decimal("0.00")),
            discount_rate=item_data.get("discount_rate", Decimal("0.00")),
            discount_amount=calc["discount_amount"],
            tax_rate=item_data.get("tax_rate", Decimal("0.00")),
            tax_amount=calc["tax_amount"],
            total_amount=calc["total_amount"],
        )
        db.add(doc_item)
        calculated_items.append(doc_item)

    # Document Level Totals
    totals = calculate_document_totals(
        items_data=items_calc_data,
        global_discount_type=discount_type,
        global_discount_rate=discount_rate,
        global_discount_amount=discount_amount,
        tax_type=tax_type,
        shipping_fee=shipping_fee,
        total_paid=doc.total_paid or Decimal("0.00"),
    )

    doc.subtotal = totals["subtotal"]
    doc.discount_amount = totals["discount_amount"]
    doc.total_discount = totals["total_discount"]
    doc.total_tax = totals["total_tax"]
    doc.shipping_fee = totals["shipping_fee"]
    doc.grand_total = totals["grand_total"]
    doc.amount_due = totals["amount_due"]

    db.commit()
    db.refresh(doc)


@router.get("", response_model=ApiResponse[List[DocumentResponse]])
def list_documents(
    document_type: Optional[str] = Query(None, description="invoice, quotation, estimate, receipt, proforma"),
    business_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search document number or reference"),
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """List documents with filtering and search."""
    query = db.query(Document)

    effective_biz = auth.business_id or business_id
    if effective_biz:
        query = query.filter(Document.business_id == effective_biz)

    if document_type:
        query = query.filter(Document.document_type == document_type.lower())

    if customer_id:
        query = query.filter(Document.customer_id == customer_id)

    if status:
        query = query.filter(Document.status == status.lower())

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Document.document_number.ilike(search),
                Document.reference_number.ilike(search),
            )
        )

    docs = query.order_by(Document.created_at.desc()).all()

    # Add pdf_url to response
    results = []
    for d in docs:
        resp = DocumentResponse.model_validate(d)
        resp.pdf_url = f"/api/v1/documents/{d.id}/pdf"
        results.append(resp)

    return ApiResponse(
        success=True,
        data=results,
    )


@router.post("", response_model=ApiResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
def create_document(
    doc_in: DocumentCreate,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Create a new invoice, quotation, estimate, receipt, or proforma."""
    biz_id = auth.business_id or doc_in.business_id
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise NotFoundException("Business", biz_id)

    cust = db.query(Customer).filter(Customer.id == doc_in.customer_id).first()
    if not cust:
        raise NotFoundException("Customer", doc_in.customer_id)

    doc_type = doc_in.document_type.lower()
    doc_number = generate_next_document_number(db, biz_id, doc_type, doc_in.document_number)

    # Set default status based on type
    default_status = "draft"
    if doc_type in ["quotation", "estimate"]:
        default_status = "sent" if doc_in.status == "sent" else "draft"
    elif doc_type == "receipt":
        default_status = "issued"

    doc = Document(
        business_id=biz_id,
        customer_id=doc_in.customer_id,
        document_type=doc_type,
        document_number=doc_number,
        reference_number=doc_in.reference_number,
        issue_date=doc_in.issue_date,
        due_date=doc_in.due_date,
        expiry_date=doc_in.expiry_date,
        status=doc_in.status or default_status,
        currency=doc_in.currency or biz.default_currency,
        discount_type=doc_in.discount_type or "fixed",
        discount_rate=doc_in.discount_rate or Decimal("0.00"),
        discount_amount=doc_in.discount_amount or Decimal("0.00"),
        tax_type=doc_in.tax_type or ("inclusive" if biz.default_tax_inclusive else "exclusive"),
        shipping_fee=doc_in.shipping_fee or Decimal("0.00"),
        notes=doc_in.notes or biz.default_notes,
        terms=doc_in.terms or biz.default_terms,
        cover_letter_enabled=doc_in.cover_letter_enabled,
        cover_letter_title=doc_in.cover_letter_title,
        cover_letter_body=doc_in.cover_letter_body or biz.default_cover_letter,
        payment_instructions_override=doc_in.payment_instructions_override,
        bank_details_override=doc_in.bank_details_override,
        template_name=doc_in.template_name or biz.template_name,
        primary_color=doc_in.primary_color or biz.primary_color,
        signature_enabled=doc_in.signature_enabled,
        stamp_enabled=doc_in.stamp_enabled,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Add items and calculate totals
    process_document_items_and_totals(
        db=db,
        doc=doc,
        items_in=doc_in.items,
        business=biz,
        discount_type=doc.discount_type,
        discount_rate=doc.discount_rate,
        discount_amount=doc.discount_amount,
        tax_type=doc.tax_type,
        shipping_fee=doc.shipping_fee,
    )

    # Generate initial PDF
    try:
        pdf_path = pdf_service.generate_document_pdf(doc)
        doc.pdf_path = pdf_path
        db.commit()
        db.refresh(doc)
    except Exception as e:
        # Don't fail document creation if PDF gen hits a soft warning
        pass

    resp = DocumentResponse.model_validate(doc)
    resp.pdf_url = f"/api/v1/documents/{doc.id}/pdf"

    return ApiResponse(
        success=True,
        message=f"{doc_type.capitalize()} created successfully.",
        data=resp,
    )


@router.get("/{id}", response_model=ApiResponse[DocumentDetailResponse])
def get_document(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Get complete document details."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise NotFoundException("Document", id)

    resp = DocumentDetailResponse.model_validate(doc)
    resp.pdf_url = f"/api/v1/documents/{doc.id}/pdf"
    return ApiResponse(
        success=True,
        data=resp,
    )


@router.patch("/{id}", response_model=ApiResponse[DocumentResponse])
def update_document(
    id: str,
    doc_in: DocumentUpdate,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Update document properties and line items."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise NotFoundException("Document", id)

    update_data = doc_in.model_dump(exclude_unset=True)
    items_to_update = update_data.pop("items", None)

    for field, val in update_data.items():
        setattr(doc, field, val)

    if items_to_update is not None:
        process_document_items_and_totals(
            db=db,
            doc=doc,
            items_in=items_to_update,
            business=doc.business,
            discount_type=doc.discount_type,
            discount_rate=doc.discount_rate,
            discount_amount=doc.discount_amount,
            tax_type=doc.tax_type,
            shipping_fee=doc.shipping_fee,
        )
    else:
        # Recalculate with existing items in case discount/tax settings changed
        existing_items = db.query(DocumentItem).filter(DocumentItem.document_id == doc.id).all()
        process_document_items_and_totals(
            db=db,
            doc=doc,
            items_in=existing_items,
            business=doc.business,
            discount_type=doc.discount_type,
            discount_rate=doc.discount_rate,
            discount_amount=doc.discount_amount,
            tax_type=doc.tax_type,
            shipping_fee=doc.shipping_fee,
        )

    # Regenerate PDF
    try:
        pdf_path = pdf_service.generate_document_pdf(doc)
        doc.pdf_path = pdf_path
        db.commit()
    except Exception:
        pass

    db.refresh(doc)
    resp = DocumentResponse.model_validate(doc)
    resp.pdf_url = f"/api/v1/documents/{doc.id}/pdf"

    return ApiResponse(
        success=True,
        message="Document updated successfully.",
        data=resp,
    )


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_document(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Delete document and its generated PDF."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise NotFoundException("Document", id)

    if doc.pdf_path and os.path.exists(doc.pdf_path):
        try:
            os.remove(doc.pdf_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    return ApiResponse(
        success=True,
        message="Document deleted.",
        data={"deleted_id": id},
    )


@router.get("/{id}/pdf")
def get_document_pdf(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Generate and download document PDF."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise NotFoundException("Document", id)

    # Generate or refresh PDF
    pdf_path = pdf_service.generate_document_pdf(doc)
    doc.pdf_path = pdf_path
    db.commit()

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        content_disposition_type="inline",
    )


@router.post("/{id}/convert-to-invoice", response_model=ApiResponse[DocumentResponse])
def convert_to_invoice(
    id: str,
    convert_req: Optional[ConvertQuotationRequest] = None,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Convert quotation or estimate into an invoice with a fresh invoice number."""
    source_doc = db.query(Document).filter(Document.id == id).first()
    if not source_doc:
        raise NotFoundException("Document", id)

    if source_doc.document_type not in ["quotation", "estimate"]:
        raise BadRequestException(f"Cannot convert '{source_doc.document_type}' to invoice. Only quotations and estimates are convertible.")

    # Generate fresh invoice number
    new_inv_num = generate_next_document_number(db, source_doc.business_id, "invoice")

    issue_date = (convert_req and convert_req.issue_date) or source_doc.issue_date
    due_date = convert_req and convert_req.due_date

    invoice = Document(
        business_id=source_doc.business_id,
        customer_id=source_doc.customer_id,
        document_type="invoice",
        document_number=new_inv_num,
        reference_number=source_doc.document_number,
        issue_date=issue_date,
        due_date=due_date,
        status="draft",
        currency=source_doc.currency,
        discount_type=source_doc.discount_type,
        discount_rate=source_doc.discount_rate,
        discount_amount=source_doc.discount_amount,
        tax_type=source_doc.tax_type,
        shipping_fee=source_doc.shipping_fee,
        notes=(convert_req and convert_req.notes) or source_doc.notes,
        terms=(convert_req and convert_req.terms) or source_doc.terms,
        cover_letter_enabled=False,
        template_name=source_doc.template_name,
        primary_color=source_doc.primary_color,
        signature_enabled=source_doc.signature_enabled,
        stamp_enabled=source_doc.stamp_enabled,
        converted_from_id=source_doc.id,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Copy items
    source_items = db.query(DocumentItem).filter(DocumentItem.document_id == source_doc.id).order_by(DocumentItem.item_order).all()
    items_data = []
    for item in source_items:
        items_data.append({
            "product_id": item.product_id,
            "item_order": item.item_order,
            "name": item.name,
            "description": item.description,
            "unit": item.unit,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount_rate": item.discount_rate,
            "tax_rate": item.tax_rate,
        })

    process_document_items_and_totals(
        db=db,
        doc=invoice,
        items_in=items_data,
        business=source_doc.business,
        discount_type=invoice.discount_type,
        discount_rate=invoice.discount_rate,
        discount_amount=invoice.discount_amount,
        tax_type=invoice.tax_type,
        shipping_fee=invoice.shipping_fee,
    )

    # Update source quotation status
    source_doc.status = "converted"
    source_doc.converted_to_invoice_id = invoice.id
    db.commit()

    # Generate invoice PDF
    try:
        pdf_path = pdf_service.generate_document_pdf(invoice)
        invoice.pdf_path = pdf_path
        db.commit()
        db.refresh(invoice)
    except Exception:
        pass

    resp = DocumentResponse.model_validate(invoice)
    resp.pdf_url = f"/api/v1/documents/{invoice.id}/pdf"

    return ApiResponse(
        success=True,
        message=f"Successfully converted {source_doc.document_type} '{source_doc.document_number}' to Invoice '{invoice.document_number}'.",
        data=resp,
    )
