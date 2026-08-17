# Free Invoice Maker (FIM)

Free Invoice Maker is a local-first FastAPI application for creating and
managing invoices, quotations, estimates, receipts, customers, products,
payments, and business profiles.

It includes a responsive single-page web interface and a versioned REST API,
with SQLite storage by default.

## Features

- Dashboard with business and document overview
- Invoice, quotation, estimate, and receipt workflows
- Customer, product/service, payment, and business management
- PDF document generation
- Document numbering and templates
- Backup, import/export, and API key endpoints
- API documentation at `/api/docs`
- Local SQLite persistence, uploads, and generated document storage

## Quick start

```bash
git clone https://github.com/vidmarshdrck/freeinvoicemaker.git
cd freeinvoicemaker
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000> in a browser. On Windows, activate the virtual
environment with:

```powershell
.\.venv\Scripts\Activate.ps1
```

For complete Windows, Linux, macOS, Docker, and systemd instructions, see
[SETUP.md](SETUP.md).

## Configuration

FIM reads optional settings from a `.env` file in the project root. Before
network or production use, configure a unique `SECRET_KEY`, a strong
`DEFAULT_ADMIN_PASSWORD`, and an appropriate `CORS_ORIGINS` value.

```dotenv
APP_ENV=production
DEBUG=false
SECRET_KEY=replace-with-a-long-random-secret
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=replace-with-a-strong-password
DATABASE_URL=sqlite:///storage/invoice_maker.db
```

The application initializes the SQLite database and administrator account at
first startup. Back up the complete `storage/` directory regularly.

## Frontend UI design

The full FIM frontend is committed with the application:

| Asset | Purpose |
| --- | --- |
| `app/templates/index.html` | Responsive single-page application markup, navigation, forms, and modals |
| `app/static/css/style.css` | Core visual design and layout |
| `app/static/css/ui-enhancements.css` | Responsive, focus, and accessibility enhancements |
| `app/static/js/app.js` | UI behavior and API integration |
| `app/static/js/ui-enhancements.js` | Sidebar and quick-search UI enhancements |
| `app/static/js/signature-pad.js` | Signature capture support |

The interface includes responsive navigation, accessible focus states, a skip
link, quick search, and modal forms for creating and editing records.

## Project structure

```text
app/
  api/v1/        REST API endpoints
  core/          Application configuration and security
  database/      SQLAlchemy database setup
  models/        Database models
  schemas/       Request and response schemas
  services/      PDF, backup, import/export, and business logic
  static/        Frontend CSS and JavaScript
  templates/     Frontend HTML templates
storage/         SQLite database, uploads, and generated documents
systemd/         Linux service definition
scripts/         Service installation helper
```

## API

Start the application and visit:

- Interactive API docs: <http://127.0.0.1:8000/api/docs>
- Alternative API docs: <http://127.0.0.1:8000/api/redoc>
- OpenAPI schema: <http://127.0.0.1:8000/openapi.json>

Versioned API routes are exposed under `/api/v1`.

## Deployment

Build and run with Docker:

```bash
docker build -t freeinvoicemaker .
docker run --rm --env-file .env -p 8000:8000 \
  -v "$(pwd)/storage:/app/storage" freeinvoicemaker
```

For a persistent Linux service, configure
`systemd/freeinvoicemaker.service` for your user and project location, then
enable it with `systemctl`. Detailed instructions are in
[SETUP.md](SETUP.md).
