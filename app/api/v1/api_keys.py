from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.core.security import generate_api_key
from app.database.session import get_db
from app.models import ApiKey
from app.schemas.common import ApiResponse
from app.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyUpdate,
    ApiKeyResponse,
    ApiKeyCreatedResponse,
)
from app.api.deps import AuthContext, require_scope

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.get("", response_model=ApiResponse[List[ApiKeyResponse]])
def list_api_keys(
    auth: AuthContext = Depends(require_scope("admin")),
    db: Session = Depends(get_db),
):
    """List all configured API keys (masked)."""
    keys = db.query(ApiKey).order_by(ApiKey.created_at.desc()).all()
    return ApiResponse(
        success=True,
        data=[ApiKeyResponse.model_validate(k) for k in keys],
    )


@router.post("", response_model=ApiResponse[ApiKeyCreatedResponse], status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_in: ApiKeyCreate,
    auth: AuthContext = Depends(require_scope("admin")),
    db: Session = Depends(get_db),
):
    """
    Generate a new API key.
    The raw key is returned ONLY in this response and cannot be retrieved again.
    """
    raw_key, key_prefix, key_hash = generate_api_key()

    api_key = ApiKey(
        name=key_in.name,
        key_prefix=key_prefix,
        key_hash=key_hash,
        scopes=key_in.scopes or "*",
        business_id=key_in.business_id,
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    resp_data = ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        scopes=api_key.scopes,
        business_id=api_key.business_id,
        is_active=api_key.is_active,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        raw_key=raw_key,
    )

    return ApiResponse(
        success=True,
        message="API Key created successfully. Store the raw key safely as it will not be displayed again.",
        data=resp_data,
    )


@router.patch("/{id}", response_model=ApiResponse[ApiKeyResponse])
def update_api_key(
    id: str,
    key_in: ApiKeyUpdate,
    auth: AuthContext = Depends(require_scope("admin")),
    db: Session = Depends(get_db),
):
    """Update API key name, scopes, or active status."""
    key = db.query(ApiKey).filter(ApiKey.id == id).first()
    if not key:
        raise NotFoundException("API Key", id)

    update_data = key_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(key, field, val)

    db.commit()
    db.refresh(key)

    return ApiResponse(
        success=True,
        message="API key updated.",
        data=ApiKeyResponse.model_validate(key),
    )


@router.delete("/{id}", response_model=ApiResponse[dict])
def revoke_api_key(
    id: str,
    auth: AuthContext = Depends(require_scope("admin")),
    db: Session = Depends(get_db),
):
    """Revoke and delete an API key."""
    key = db.query(ApiKey).filter(ApiKey.id == id).first()
    if not key:
        raise NotFoundException("API Key", id)

    db.delete(key)
    db.commit()

    return ApiResponse(
        success=True,
        message="API key revoked and deleted.",
        data={"deleted_id": id},
    )
