import base64
import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundException, BadRequestException
from app.database.session import get_db
from app.models import Business, DocumentSequence
from app.schemas.common import ApiResponse
from app.schemas.business import (
    BusinessCreate,
    BusinessUpdate,
    BusinessResponse,
    DocumentSequenceConfig,
    DocumentSequenceUpdate,
)
from app.api.deps import get_current_auth, AuthContext, require_scope
from app.services.number_generator import get_or_create_sequence, DEFAULT_PREFIXES

router = APIRouter(prefix="/businesses", tags=["Businesses"])


def init_default_sequences(db: Session, business_id: str):
    """Ensure all default document sequences exist for a business."""
    for doc_type, prefix in DEFAULT_PREFIXES.items():
        get_or_create_sequence(db, business_id, doc_type)


@router.get("", response_model=ApiResponse[List[BusinessResponse]])
def list_businesses(
    auth: AuthContext = Depends(get_current_auth),
    db: Session = Depends(get_db),
):
    """List all business profiles."""
    query = db.query(Business)
    if auth.business_id:
        query = query.filter(Business.id == auth.business_id)
    businesses = query.order_by(Business.created_at.asc()).all()

    # Ensure sequences exist on each
    for b in businesses:
        init_default_sequences(db, b.id)

    return ApiResponse(
        success=True,
        data=[BusinessResponse.model_validate(b) for b in businesses],
    )


@router.post("", response_model=ApiResponse[BusinessResponse], status_code=status.HTTP_201_CREATED)
def create_business(
    biz_in: BusinessCreate,
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Create a new business profile."""
    # Check if first business, make default
    count = db.query(Business).count()
    is_default = biz_in.is_default or (count == 0)

    if is_default:
        db.query(Business).update({Business.is_default: False})

    biz = Business(**biz_in.model_dump())
    biz.is_default = is_default
    db.add(biz)
    db.commit()
    db.refresh(biz)

    # Initialize default sequences
    init_default_sequences(db, biz.id)
    db.refresh(biz)

    return ApiResponse(
        success=True,
        message="Business profile created.",
        data=BusinessResponse.model_validate(biz),
    )


@router.get("/{id}", response_model=ApiResponse[BusinessResponse])
def get_business(
    id: str,
    auth: AuthContext = Depends(get_current_auth),
    db: Session = Depends(get_db),
):
    """Get a single business profile."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    init_default_sequences(db, biz.id)
    db.refresh(biz)

    return ApiResponse(
        success=True,
        data=BusinessResponse.model_validate(biz),
    )


@router.patch("/{id}", response_model=ApiResponse[BusinessResponse])
def update_business(
    id: str,
    biz_in: BusinessUpdate,
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Update business details."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    update_data = biz_in.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(Business).filter(Business.id != id).update({Business.is_default: False})

    for field, val in update_data.items():
        setattr(biz, field, val)

    db.commit()
    db.refresh(biz)

    return ApiResponse(
        success=True,
        message="Business profile updated.",
        data=BusinessResponse.model_validate(biz),
    )


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_business(
    id: str,
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Delete a business profile."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    db.delete(biz)
    db.commit()

    return ApiResponse(
        success=True,
        message="Business profile deleted.",
        data={"deleted_id": id},
    )


@router.post("/{id}/logo", response_model=ApiResponse[BusinessResponse])
async def upload_logo(
    id: str,
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Upload business logo image."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise BadRequestException("Invalid image format. Allowed: PNG, JPG, JPEG, WEBP.")

    logo_dir = Path(settings.STORAGE_PATH) / "uploads" / "logos"
    logo_dir.mkdir(parents=True, exist_ok=True)

    filename = f"logo_{biz.id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = logo_dir / filename

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    biz.logo_path = str(dest_path)
    db.commit()
    db.refresh(biz)

    return ApiResponse(
        success=True,
        message="Logo uploaded successfully.",
        data=BusinessResponse.model_validate(biz),
    )


@router.post("/{id}/signature", response_model=ApiResponse[BusinessResponse])
async def upload_signature(
    id: str,
    file: Optional[UploadFile] = File(None),
    signature_data: Optional[str] = Form(None),
    label: Optional[str] = Form(None),
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Upload signature image or save drawn signature base64 data."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    sig_dir = Path(settings.STORAGE_PATH) / "uploads" / "signatures"
    sig_dir.mkdir(parents=True, exist_ok=True)

    filename = f"sig_{biz.id}_{uuid.uuid4().hex[:8]}.png"
    dest_path = sig_dir / filename

    if file:
        ext = Path(file.filename).suffix.lower()
        if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
            raise BadRequestException("Invalid image format.")
        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)
    elif signature_data:
        # Base64 data from HTML canvas signature pad: "data:image/png;base64,..."
        try:
            if "," in signature_data:
                signature_data = signature_data.split(",")[1]
            image_bytes = base64.b64decode(signature_data)
            with open(dest_path, "wb") as f:
                f.write(image_bytes)
        except Exception:
            raise BadRequestException("Invalid base64 signature data.")
    else:
        raise BadRequestException("Either file or signature_data is required.")

    biz.signature_path = str(dest_path)
    if label:
        biz.signature_label = label
    db.commit()
    db.refresh(biz)

    return ApiResponse(
        success=True,
        message="Signature saved successfully.",
        data=BusinessResponse.model_validate(biz),
    )


@router.post("/{id}/stamp", response_model=ApiResponse[BusinessResponse])
async def upload_stamp(
    id: str,
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Upload business stamp image."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise BadRequestException("Invalid image format.")

    stamp_dir = Path(settings.STORAGE_PATH) / "uploads" / "stamps"
    stamp_dir.mkdir(parents=True, exist_ok=True)

    filename = f"stamp_{biz.id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = stamp_dir / filename

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    biz.stamp_path = str(dest_path)
    db.commit()
    db.refresh(biz)

    return ApiResponse(
        success=True,
        message="Stamp uploaded successfully.",
        data=BusinessResponse.model_validate(biz),
    )


@router.patch("/{id}/sequences/{doc_type}", response_model=ApiResponse[DocumentSequenceConfig])
def update_sequence(
    id: str,
    doc_type: str,
    seq_in: DocumentSequenceUpdate,
    auth: AuthContext = Depends(require_scope("businesses:write")),
    db: Session = Depends(get_db),
):
    """Configure document numbering pattern for this business."""
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise NotFoundException("Business", id)

    seq = get_or_create_sequence(db, biz.id, doc_type.lower())
    for field, val in seq_in.model_dump(exclude_unset=True).items():
        setattr(seq, field, val)

    db.commit()
    db.refresh(seq)

    return ApiResponse(
        success=True,
        message=f"Sequence for '{doc_type}' updated.",
        data=DocumentSequenceConfig.model_validate(seq),
    )
