Free Invoice Maker — Code Overview and Important Parts

This file gives a concise two-line explanation for each main area of the project so new contributors and AI agents can quickly understand the structure.

1) app/main.py
- Entrypoint for the FastAPI application; configures logging, CORS, exception handlers and mounts static/templates.
- On startup it initializes the SQLite database schema and creates a default admin and default business/profile if missing.

2) app/api/v1/* (router modules)
- Collection of versioned REST API routers (auth, businesses, customers, documents, invoices, products, templates, api_keys, etc.).
- Each router implements CRUD endpoints and uses dependency injection (get_db, auth deps) for request-scoped DB sessions and permission checks.

3) app/api/deps.py
- Provides authentication and authorization dependencies used across API endpoints (token and API-key handling, scope enforcement).
- Centralizes logic for resolving the current user, active business context, and API key scopes.

4) app/database/session.py
- Configures SQLAlchemy engine, Base metadata and SessionLocal factory bound to DATABASE_URL.
- Exposes get_db FastAPI dependency (yields DB sessions and ensures proper close/rollback behavior).

5) app/models/*
- SQLAlchemy ORM model definitions representing Users, Businesses, Customers, Products, Documents, DocumentItems, Payments, APIKeys, Templates, and other domain entities.
- Models include timestamps, relationships, and constraints used by services and API layers.

6) app/schemas/*
- Pydantic v2 models for request validation and response serialization (UserCreate, DocumentCreate, CustomerResponse, etc.).
- Schemas ensure stable, machine-readable API shapes for AI agents and other clients.

7) app/services/*
- Business logic helpers: number/sequence generation, PDF generation, calculations, CSV import/export, and backup/restore.
- Services are intentionally thin and pure-function oriented so the API layer can remain small and testable.

8) app/core/*
- Configuration, security utilities (password hashing, JWT creation/verification), and custom exceptions used across the app.
- settings read from .env (pydantic-settings) with safe defaults for local development.

9) app/templates/ and app/static/
- Jinja2 HTML template for the single-page GUI (index.html) and static CSS/JS assets that implement the frontend SPA.
- The SPA calls the REST API and requires no separate build step; static files are mounted by FastAPI for local hosting.

10) storage/
- Local file storage for uploads and the SQLite database by default. This directory is persisted for Docker volumes and local installations.
- Do NOT commit secrets or the database to version control in production; use .env to override storage paths.

11) requirements.txt and .env example
- Lists Python dependencies and optional extras required for PDF, image handling and server runtime.
- Environment variables control APP_HOST/PORT, SECRET_KEY, DATABASE_URL, and STORAGE_PATH.

12) tests/
- Automated tests (unit and integration) should exercise auth, API key flows, business creation, CRUD for customers/products/documents, and PDF generation.
- Run with pytest from the project root using the project's virtualenv.

13) Docker (docker-compose)
- A docker-compose setup is recommended to run the app and persist volumes for storage and database; the app is designed to be self-hostable.
- Keep the service single-process and simple — no external cloud services are required for basic operation.

If you want these comments added inline as code comments in specific files as well (e.g., top of app/main.py, database/session.py, or services/pdf_generator.py), say which files and I'll add short two-line header comments there too.