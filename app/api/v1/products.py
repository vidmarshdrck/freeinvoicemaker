from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.database.session import get_db
from app.models import Product, Business
from app.schemas.common import ApiResponse
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.api.deps import get_current_auth, AuthContext, require_scope

router = APIRouter(prefix="/products", tags=["Products & Services"])


@router.get("", response_model=ApiResponse[List[ProductResponse]])
def list_products(
    business_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search by name or SKU"),
    auth: AuthContext = Depends(require_scope("products:read")),
    db: Session = Depends(get_db),
):
    """List and search products and services."""
    query = db.query(Product)

    effective_biz = auth.business_id or business_id
    if effective_biz:
        query = query.filter(Product.business_id == effective_biz)

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search),
                Product.sku.ilike(search),
                Product.description.ilike(search),
            )
        )

    products = query.order_by(Product.name.asc()).all()
    return ApiResponse(
        success=True,
        data=[ProductResponse.model_validate(p) for p in products],
    )


@router.post("", response_model=ApiResponse[ProductResponse], status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    auth: AuthContext = Depends(require_scope("products:write")),
    db: Session = Depends(get_db),
):
    """Create a new product or service."""
    biz_id = auth.business_id or prod_in.business_id
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise NotFoundException("Business", biz_id)

    prod_data = prod_in.model_dump()
    prod_data["business_id"] = biz_id

    prod = Product(**prod_data)
    db.add(prod)
    db.commit()
    db.refresh(prod)

    return ApiResponse(
        success=True,
        message="Product created successfully.",
        data=ProductResponse.model_validate(prod),
    )


@router.get("/{id}", response_model=ApiResponse[ProductResponse])
def get_product(
    id: str,
    auth: AuthContext = Depends(require_scope("products:read")),
    db: Session = Depends(get_db),
):
    """Get product details."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise NotFoundException("Product", id)

    return ApiResponse(
        success=True,
        data=ProductResponse.model_validate(prod),
    )


@router.patch("/{id}", response_model=ApiResponse[ProductResponse])
def update_product(
    id: str,
    prod_in: ProductUpdate,
    auth: AuthContext = Depends(require_scope("products:write")),
    db: Session = Depends(get_db),
):
    """Update product details."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise NotFoundException("Product", id)

    update_data = prod_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(prod, field, val)

    db.commit()
    db.refresh(prod)

    return ApiResponse(
        success=True,
        message="Product updated successfully.",
        data=ProductResponse.model_validate(prod),
    )


@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_product(
    id: str,
    auth: AuthContext = Depends(require_scope("products:write")),
    db: Session = Depends(get_db),
):
    """Delete product."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise NotFoundException("Product", id)

    db.delete(prod)
    db.commit()

    return ApiResponse(
        success=True,
        message="Product deleted.",
        data={"deleted_id": id},
    )
