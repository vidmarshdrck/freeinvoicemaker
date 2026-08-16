from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import ApiResponse
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentDetailResponse,
    ConvertQuotationRequest,
)
from app.api.deps import AuthContext, require_scope
from app.api.v1.documents import (
    list_documents,
    create_document,
    get_document,
    update_document,
    delete_document,
    get_document_pdf,
    convert_to_invoice,
)

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.get("", response_model=ApiResponse[List[DocumentResponse]])
def get_quotations(
    business_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """List all quotations with filtering."""
    return list_documents(
        document_type="quotation",
        business_id=business_id,
        customer_id=customer_id,
        status=status,
        q=q,
        auth=auth,
        db=db,
    )


@router.post("", response_model=ApiResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
def create_quotation(
    doc_in: DocumentCreate,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Create a new quotation."""
    doc_in.document_type = "quotation"
    return create_document(doc_in=doc_in, auth=auth, db=db)


@router.get("/{id}", response_model=ApiResponse[DocumentDetailResponse])
def get_quotation_by_id(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Get single quotation details."""
    return get_document(id=id, auth=auth, db=db)


@router.patch("/{id}", response_model=ApiResponse[DocumentResponse])
def update_quotation_by_id(
    id: str,
    doc_in: DocumentUpdate,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Update quotation."""
    return update_document(id=id, doc_in=doc_in, auth=auth, db=db)


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_quotation_by_id(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Delete quotation."""
    return delete_document(id=id, auth=auth, db=db)


@router.get("/{id}/pdf")
def get_quotation_pdf_file(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Download quotation PDF."""
    return get_document_pdf(id=id, auth=auth, db=db)


@router.post("/{id}/convert-to-invoice", response_model=ApiResponse[DocumentResponse])
def convert_quotation_action(
    id: str,
    convert_req: Optional[ConvertQuotationRequest] = None,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Convert quotation into an invoice."""
    return convert_to_invoice(id=id, convert_req=convert_req, auth=auth, db=db)
