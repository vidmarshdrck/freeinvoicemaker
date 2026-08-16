from fastapi import APIRouter
from app.api.v1 import (
    health,
    auth,
    businesses,
    customers,
    products,
    documents,
    invoices,
    quotations,
    estimates,
    receipts,
    payments,
    api_keys,
    templates,
    stats,
    backups,
    import_export,
)

api_router = APIRouter(prefix="/api/v1")

# Include all sub-routers
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(businesses.router)
api_router.include_router(customers.router)
api_router.include_router(products.router)
api_router.include_router(documents.router)
api_router.include_router(invoices.router)
api_router.include_router(quotations.router)
api_router.include_router(estimates.router)
api_router.include_router(receipts.router)
api_router.include_router(payments.router)
api_router.include_router(api_keys.router)
api_router.include_router(templates.router)
api_router.include_router(stats.router)
api_router.include_router(backups.router)
api_router.include_router(import_export.router)
