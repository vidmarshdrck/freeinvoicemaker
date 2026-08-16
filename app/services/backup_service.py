import io
import json
import os
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO, Dict, Any

from app.core.config import settings
from app.database.session import engine


class BackupService:
    @staticmethod
    def create_backup_archive() -> io.BytesIO:
        """Create a complete ZIP archive of SQLite database and uploaded assets."""
        buffer = io.BytesIO()
        storage_path = Path(settings.STORAGE_PATH)

        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Database file
            db_file = storage_path / "invoice_maker.db"
            if db_file.exists():
                zf.write(db_file, arcname="invoice_maker.db")

            # 2. Uploads folder
            uploads_dir = storage_path / "uploads"
            if uploads_dir.exists():
                for root, _, files in os.walk(uploads_dir):
                    for file in files:
                        full_path = Path(root) / file
                        arc_rel = full_path.relative_to(storage_path)
                        zf.write(full_path, arcname=str(arc_rel))

            # 3. Metadata
            meta = {
                "app_name": settings.APP_NAME,
                "version": settings.APP_VERSION,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            zf.writestr("backup_metadata.json", json.dumps(meta, indent=2))

        buffer.seek(0)
        return buffer

    @staticmethod
    def restore_backup_archive(zip_bytes: bytes) -> Dict[str, Any]:
        """Restore database and storage assets from uploaded ZIP archive."""
        buffer = io.BytesIO(zip_bytes)
        storage_path = Path(settings.STORAGE_PATH)
        storage_path.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(buffer, "r") as zf:
            # Verify required metadata or database
            namelist = zf.namelist()
            if "invoice_maker.db" not in namelist:
                raise ValueError("Invalid backup archive: missing 'invoice_maker.db'.")

            # Dispose existing engine connections before replacing file
            engine.dispose()

            # Extract database
            zf.extract("invoice_maker.db", path=str(storage_path))

            # Extract uploads
            for member in namelist:
                if member.startswith("uploads/"):
                    zf.extract(member, path=str(storage_path))

            meta_data = {}
            if "backup_metadata.json" in namelist:
                try:
                    meta_data = json.loads(zf.read("backup_metadata.json").decode("utf-8"))
                except Exception:
                    pass

        return {
            "success": True,
            "message": "Backup restored successfully.",
            "metadata": meta_data,
        }


backup_service = BackupService()
