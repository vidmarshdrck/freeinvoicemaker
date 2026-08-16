from datetime import datetime
from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.exceptions import BadRequestException
from app.schemas.common import ApiResponse
from app.api.deps import AuthContext, require_scope
from app.services.backup_service import backup_service

router = APIRouter(prefix="/backups", tags=["Backups & Restore"])


@router.get("/export")
def export_backup(auth: AuthContext = Depends(require_scope("admin"))):
    """Download a complete backup archive containing SQLite database, uploaded assets, and metadata."""
    zip_buffer = backup_service.create_backup_archive()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"free_invoice_maker_backup_{timestamp}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/restore", response_model=ApiResponse[dict])
async def restore_backup(
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_scope("admin")),
):
    """Restore database and storage assets from an uploaded backup ZIP archive."""
    if not file.filename.endswith(".zip"):
        raise BadRequestException("Backup file must be a .zip archive.")

    content = await file.read()
    try:
        res = backup_service.restore_backup_archive(content)
        return ApiResponse(
            success=True,
            message="Backup restored successfully. Please refresh the page.",
            data=res,
        )
    except Exception as e:
        raise BadRequestException(f"Failed to restore backup: {str(e)}")
