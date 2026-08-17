import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.security import hash_password
from app.database.session import engine, Base, SessionLocal
from app.models import User, Business, DocumentSequence
from app.api.v1.api import api_router
from app.services.number_generator import get_or_create_sequence, DEFAULT_PREFIXES

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("free_invoice_maker")


def init_database():
    """Create database tables and default admin account if not already created."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == settings.DEFAULT_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                full_name="Default Administrator",
                is_superuser=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"Created default admin user: {settings.DEFAULT_ADMIN_EMAIL}")

        # Check if default business exists
        biz = db.query(Business).first()
        if not biz:
            biz = Business(
                name="My Business Ltd",
                trading_name="My Business",
                email="info@mybusiness.local",
                phone="+260 97 000 0000",
                address="123 Business Way",
                city="Lusaka",
                country="Zambia",
                default_currency="USD",
                default_terms="Payment is due within 14 days of invoice date.\nAll payments should reference the invoice number.",
                default_notes="Thank you for your business!",
                default_cover_letter="Dear Customer,\n\nPlease find attached the requested document for your review and records.\n\nBest regards,\nManagement",
                is_default=True,
            )
            db.add(biz)
            db.commit()
            db.refresh(biz)

            # Create default document sequences
            for doc_type in DEFAULT_PREFIXES:
                get_or_create_sequence(db, biz.id, doc_type)
            logger.info(f"Created default business profile: {biz.name}")

    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_database()
    yield
    # Shutdown
    logger.info(f"Stopping {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Local-first, open-source, API-first invoicing and document management application.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        errors.append(f"{loc}: {err.get('msg')}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": errors,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.DEBUG else "An unexpected error occurred.",
            },
        },
    )


# Include API v1 Router
app.include_router(api_router)

# Mount Static Files & Templates
base_dir = Path(__file__).resolve().parent
static_path = base_dir / "static"
templates_path = base_dir / "templates"

if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

templates = Jinja2Templates(directory=str(templates_path))


# GUI Route
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def index_view(request: Request):
    """Serve the single-page GUI for humans as a safe static HTML response to avoid Jinja2 caching issues."""
    index_file = templates_path / "index.html"
    if index_file.exists():
        try:
            content = index_file.read_text(encoding="utf-8")
            return HTMLResponse(content)
        except Exception:
            # Fallback to TemplateResponse if reading fails
            pass

    # Fallback to templating (rare)
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "app_name": settings.APP_NAME,
            "app_version": settings.APP_VERSION,
        },
    )
