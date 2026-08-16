from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=ApiResponse[dict])
def health_check():
    """Health check endpoint for Docker, uptime monitoring, and AI agent verification."""
    return ApiResponse(
        success=True,
        data={
            "status": "ok",
            "version": settings.APP_VERSION,
            "app_name": settings.APP_NAME,
            "environment": settings.APP_ENV,
        },
    )
