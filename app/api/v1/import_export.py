from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, BadRequestException
from app.database.session import get_db
from app.models import Business, Customer, Product
from app.schemas.common import ApiResponse
from app.api.deps import AuthContext, require_scope
from app.services.csv_service import csv_service

router = APIRouter(prefix="/import-export", tags=["Import / Export"])


@router.get("/customers/csv")
def export_customers_csv(
    business_id: str = Query(..., description="Business ID to export from"),
    auth: AuthContext = Depends(require_scope("customers:read")),
    db: Session = Depends(get_db),
):
    """Export customers to CSV file."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise NotFoundException("Business", business_id)

    customers = db.query(Customer).filter(Customer.business_id == business_id).all()
    csv_content = csv_service.export_customers_csv(customers)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=customers_{biz.name.lower().replace(' ', '_')}.csv"},
    )


@router.post("/customers/csv", response_model=ApiResponse[dict])
async def import_customers_csv(
    business_id: str = Query(..., description="Business ID to import into"),
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_scope("customers:write")),
    db: Session = Depends(get_db),
):
    """Import customers from uploaded CSV file."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise NotFoundException("Business", business_id)

    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    created, updated, errors = csv_service.import_customers_csv(db, business_id, csv_text)

    return ApiResponse(
        success=True,
        message=f"Import completed: {created} created, {updated} updated.",
        data={
            "created": created,
            "updated": updated,
            "errors": errors,
        },
    )


@router.get("/products/csv")
def export_products_csv(
    business_id: str = Query(..., description="Business ID to export from"),
    auth: AuthContext = Depends(require_scope("products:read")),
    db: Session = Depends(get_db),
):
    """Export products/services to CSV file."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise NotFoundException("Business", business_id)

    products = db.query(Product).filter(Product.business_id == business_id).all()
    csv_content = csv_service.export_products_csv(products)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=products_{biz.name.lower().replace(' ', '_')}.csv"},
    )


@router.post("/products/csv", response_model=ApiResponse[dict])
async def import_products_csv(
    business_id: str = Query(..., description="Business ID to import into"),
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_scope("products:write")),
    db: Session = Depends(get_db),
):
    """Import products/services from uploaded CSV file."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise NotFoundException("Business", business_id)

    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    created, updated, errors = csv_service.import_products_csv(db, business_id, csv_text)

    return ApiResponse(
        success=True,
        message=f"Import completed: {created} created, {updated} updated.",
        data={
            "created": created,
            "updated": updated,
            "errors": errors,
        },
    )
