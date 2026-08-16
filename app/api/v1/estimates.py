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

router = APIRouter(prefix="/estimates", tags=["Estimates"])


@router.get("", response_model=ApiResponse[List[DocumentResponse]])
def get_estimates(
    business_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """List all estimates with filtering."""
    return list_documents(
        document_type="estimate",
        business_id=business_id,
        customer_id=customer_id,
        status=status,
        q=q,
        auth=auth,
        db=db,
    )


@router.post("", response_model=ApiResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
def create_estimate(
    doc_in: DocumentCreate,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Create a new estimate."""
    doc_in.document_type = "estimate"
    return create_document(doc_in=doc_in, auth=auth, db=db)


@router.get("/{id}", response_model=ApiResponse[DocumentDetailResponse])
def get_estimate_by_id(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Get single estimate details."""
    return get_document(id=id, auth=auth, db=db)


@router.patch("/{id}", response_model=ApiResponse[DocumentResponse])
def update_estimate_by_id(
    id: str,
    doc_in: DocumentUpdate,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Update estimate."""
    return update_document(id=id, doc_in=doc_in, auth=auth, db=db)


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_estimate_by_id(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Delete estimate."""
    return delete_document(id=id, auth=auth, db=db)


@router.get("/{id}/pdf")
def get_estimate_pdf_file(
    id: str,
    auth: AuthContext = Depends(require_scope("documents:read")),
    db: Session = Depends(get_db),
):
    """Download estimate PDF."""
    return get_document_pdf(id=id, auth=auth, db=db)


@router.post("/{id}/convert-to-invoice", response_model=ApiResponse[DocumentResponse])
def convert_estimate_action(
    id: str,
    convert_req: Optional[ConvertQuotationRequest] = None,
    auth: AuthContext = Depends(require_scope("documents:write")),
    db: Session = Depends(get_db),
):
    """Convert estimate into an invoice."""
    return convert_to_invoice(id=id, convert_req=convert_req, auth=auth, db=db)
