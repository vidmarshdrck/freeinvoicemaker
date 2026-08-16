import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Free Invoice Maker"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False

    SECRET_KEY: str = "default-insecure-secret-key-change-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_PATH: str = str(Path(__file__).resolve().parent.parent.parent / "storage")
    DATABASE_URL: str = f"sqlite:///{Path(__file__).resolve().parent.parent.parent / 'storage' / 'invoice_maker.db'}"

    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    # Default admin credentials
    DEFAULT_ADMIN_EMAIL: str = "admin@freeinvoicemaker.local"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    @property
    def uploads_dir(self) -> Path:
        p = Path(self.STORAGE_PATH) / "uploads"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def documents_dir(self) -> Path:
        p = Path(self.STORAGE_PATH) / "documents"
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
