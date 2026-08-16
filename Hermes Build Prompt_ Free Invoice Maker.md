# Free Invoice Maker
## Autonomous Build Specification for Hermes Agent

/go

You are going to build a complete, working, open-source application called **Free Invoice Maker**.

**Author:** Shadrick Vidmar  
**GitHub repository:** `free-invoice-maker`  
**License:** MIT  
**Primary goal:** Build a free, self-hostable, local-first invoice/document management application that can be installed on a desktop computer or deployed on a VPS and controlled through a REST API.

Do not merely design the application.

**Build it. Run it. Test it. Fix it. Document it. Keep working until the core application is functional end-to-end.**

The first release does not need to compete with every feature of Refrens. It needs to be reliable, useful, clean, self-hostable, open source, and especially easy for AI agents to control through an API.

---

# 1. PRODUCT VISION

Free Invoice Maker is a simple invoicing and business-document application that allows a person or an AI agent to:

- Create and manage business profiles
- Create and manage customers
- Create invoices
- Create quotations
- Create estimates
- Create receipts
- Convert quotations/estimates into invoices
- Manage products/services
- Generate professional PDF documents
- Add business logos
- Add signatures
- Add stamps
- Add business contact information
- Add payment information
- Add terms and conditions
- Add notes
- Add cover letters / introductory text
- Customize document appearance
- Store document history
- Generate documents through a REST API
- Allow external AI agents such as Hermes Agent to perform these actions programmatically

The application must work without requiring a cloud subscription.

The user owns the data.

The application should work:

1. On a local desktop/laptop
2. On a local server
3. On a VPS
4. Inside Docker
5. Through the web browser when hosted
6. Through an API
7. Without requiring an external SaaS service

---

# 2. IMPORTANT PRODUCT PRINCIPLE

**API FIRST.**

The graphical interface is important, but the API is one of the most important parts of this project.

An AI agent should be able to perform normal business operations without interacting with the graphical interface.

For example, Hermes should be able to say internally:

> Create an invoice for customer John Banda for 3 website maintenance services at K500 each, using Vidmar AI as the business profile, due in 14 days.

Hermes should be able to call the Free Invoice Maker API and receive a structured response containing the created invoice and document ID.

It should then be able to request:

- PDF generation
- invoice status
- customer information
- invoice information
- quotation conversion
- receipt creation

without needing a human to operate the GUI.

---

# 3. RECOMMENDED ARCHITECTURE

Use a simple, maintainable architecture.

Prefer:

- Python
- FastAPI
- SQLite for the default database
- SQLAlchemy or SQLModel
- Pydantic
- HTML/CSS/JavaScript or a lightweight modern frontend
- Jinja2 for document templates where appropriate
- A reliable PDF generation solution
- Docker
- Docker Compose
- REST API
- OpenAPI/Swagger documentation

The application must not require Kubernetes.

Do not introduce unnecessary microservices.

Do not introduce Redis unless there is an actual requirement.

Do not introduce PostgreSQL as a mandatory dependency.

The default installation should be extremely simple.

Ideally:

```bash
docker compose up -d
```

should be enough to start the application.

There should also be a simple non-Docker development mode.

---

# 4. APPLICATION STRUCTURE

Organize the project professionally.

Suggested structure:

```text
free-invoice-maker/
│
├── app/
│   ├── api/
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── templates/
│   ├── static/
│   └── main.py
│
├── frontend/
│
├── tests/
│
├── docs/
│
├── migrations/
│
├── storage/
│
├── scripts/
│
├── docker/
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── pyproject.toml
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── CHANGELOG.md
```

You may modify the structure if there is a technically better approach.

Do not create unnecessary complexity simply to make the repository look impressive.

---

# 5. BUSINESS ACCOUNTS

Users must be able to create multiple business profiles.

Example:

```text
Business 1:
Vidmar AI

Business 2:
Vidmar Entertainment

Business 3:
Example Construction Ltd
```

Each business must maintain its own:

- Business name
- Trading name
- Registration number
- Tax/VAT number
- Address
- City
- Country
- Phone
- Email
- Website
- Logo
- Signature
- Stamp
- Bank details
- Payment instructions
- Default currency
- Default tax settings
- Default terms and conditions
- Default notes
- Document numbering settings
- Branding settings

Switching business profiles must not mix their data.

Customers, documents, products, numbering and branding should be correctly associated with the selected business.

---

# 6. USER ACCOUNT / AUTHENTICATION

Implement basic authentication.

The application should support a local administrator account.

At minimum:

- Create admin account
- Login
- Logout
- Change password
- Password hashing
- Session/token authentication

Do not build enterprise identity management for version 1.

The goal is a secure, functional local application.

---

# 7. API KEY SYSTEM

This is extremely important.

Users must be able to create API keys from the application.

Example:

```text
API Keys

Name:
Hermes Agent

Permissions:
[x] Read Customers
[x] Create Customers
[x] Update Customers
[x] Delete Customers
[x] Read Documents
[x] Create Documents
[x] Update Documents
[x] Generate PDFs
[x] Read Products
[x] Create Products
```

The API key should only be displayed in full when created.

Store API keys securely, preferably hashed.

Support:

- Create API key
- Revoke API key
- Delete API key
- Rename API key
- Permission scopes
- Last used timestamp
- Creation timestamp

Authentication should support:

```http
Authorization: Bearer YOUR_API_KEY
```

---

# 8. API DOCUMENTATION

The application must automatically expose OpenAPI documentation.

Provide:

```text
/api/docs
/api/redoc
/openapi.json
```

The API must be documented clearly enough that an AI agent can understand it.

Every endpoint should have:

- Description
- Parameters
- Request schema
- Response schema
- Authentication requirements
- Example request
- Example response
- Error responses

---

# 9. CUSTOMER MANAGEMENT

Create a complete but simple customer system.

Customer fields:

- Customer ID
- Customer type
- First name
- Last name
- Company name
- Email
- Phone
- Alternative phone
- Address
- City
- Province/state
- Country
- Tax/VAT number
- Notes
- Created date
- Updated date

Support:

- Create customer
- View customer
- Update customer
- Delete customer
- Search customers
- List customers
- Customer document history

API examples:

```http
POST /api/v1/customers
GET /api/v1/customers
GET /api/v1/customers/{id}
PATCH /api/v1/customers/{id}
DELETE /api/v1/customers/{id}
```

---

# 10. PRODUCT / SERVICE MANAGEMENT

Allow businesses to maintain reusable products and services.

Fields:

- Product/service ID
- Name
- Description
- SKU
- Unit
- Price
- Currency
- Tax rate
- Active/inactive
- Created date
- Updated date

Support:

- Create
- Read
- Update
- Delete
- Search
- List

This allows an AI agent to reuse known products instead of manually recreating every line item.

---

# 11. DOCUMENT TYPES

Version 1 must support:

### Invoice

### Quotation

### Estimate

### Payment Receipt

### Proforma Invoice

The architecture should make it easy to add later:

- Credit Note
- Debit Note
- Purchase Order
- Delivery Note
- Expense
- Sales Order

Do not implement every possible accounting document now.

Build a clean document architecture that can grow.

---

# 12. DOCUMENT NUMBERING

Each business must have configurable numbering.

Example:

```text
Invoice:
INV-00001
INV-00002
INV-00003
```

Quotation:

```text
QUO-00001
QUO-00002
```

Receipt:

```text
REC-00001
```

Allow the business to configure:

- Prefix
- Starting number
- Number length
- Optional year
- Optional month

Prevent duplicate document numbers within the same business/document type.

---

# 13. INVOICE FEATURES

Invoice fields should include:

- Invoice number
- Issue date
- Due date
- Business
- Customer
- Customer address
- Line items
- Quantity
- Unit
- Unit price
- Discount
- Tax
- Subtotal
- Total discount
- Total tax
- Grand total
- Currency
- Payment status
- Payment instructions
- Bank details
- Notes
- Terms and conditions
- Signature
- Stamp
- Attachments where practical

Support invoice statuses:

```text
Draft
Sent
Partially Paid
Paid
Overdue
Cancelled
```

Do not implement payment gateways in version 1.

The application is a document generator and management system, not a bank.

---

# 14. QUOTATIONS AND ESTIMATES

Allow users to create professional quotations and estimates.

Support:

- Customer
- Items
- Quantity
- Pricing
- Discounts
- Taxes
- Expiry date
- Terms
- Notes
- Signature
- Logo
- Business branding

Quotation statuses:

```text
Draft
Sent
Accepted
Rejected
Expired
Converted
```

Most importantly:

**A quotation must be convertible into an invoice.**

The conversion should preserve:

- Customer
- Items
- Quantities
- Prices
- Discounts
- Taxes
- Notes
- Relevant document metadata

Generate a new invoice number rather than reusing the quotation number.

---

# 15. RECEIPTS

Allow creation of payment receipts.

A receipt should be associated with:

- Customer
- Business
- Invoice, if applicable
- Payment amount
- Payment date
- Payment method
- Reference number
- Notes

Payment methods should be configurable but initially include:

```text
Cash
Bank Transfer
Mobile Money
Card
Cheque
Other
```

A receipt should be exportable as PDF.

---

# 16. COVER LETTER / INTRODUCTION

Documents should optionally support a cover letter or introductory message.

Example:

```text
Dear John,

Thank you for giving us the opportunity to provide this quotation.

Please find below our proposed pricing for the requested services.

We look forward to working with you.
```

This should be configurable per document.

Allow:

- Enable/disable cover letter
- Custom heading
- Custom body
- Business default cover letter

The cover letter should appear professionally in the generated document.

---

# 17. LOGOS AND BRANDING

Businesses must be able to upload:

- Logo
- Signature
- Stamp

Supported common image formats:

- PNG
- JPG/JPEG
- WebP

The system should resize or constrain images appropriately rather than allowing enormous images to destroy PDF layouts.

The logo should appear on generated documents.

---

# 18. SIGNATURES

Support:

1. Uploaded signature image
2. Simple signature drawing pad

Allow a signature label such as:

```text
Authorised Signatory
```

or

```text
Managing Director
```

The saved signature should automatically be available for future documents.

This follows the useful part of Refrens' signature workflow without needing expensive digital-signature infrastructure.

Do not implement certified digital signatures in version 1.

---

# 19. STAMPS

Allow businesses to upload a stamp image.

Example:

```text
Company Stamp
```

The stamp can optionally appear next to or below the signature.

---

# 20. TERMS AND CONDITIONS

Allow businesses to create reusable default terms.

Example:

```text
Payment is due within 14 days.
All prices are subject to applicable taxes.
Goods and services remain subject to the terms stated above.
```

Allow:

- Default business terms
- Document-specific terms
- Enable/disable terms

---

# 21. NOTES

Support notes on documents.

Examples:

```text
Thank you for your business.
```

or:

```text
Please quote invoice number when making payment.
```

---

# 22. PAYMENT DETAILS

Businesses should be able to store:

- Bank name
- Account name
- Account number
- Branch
- SWIFT/BIC
- Mobile money number
- Payment instructions

Allow users to select which payment details appear on each document.

---

# 23. TAX SUPPORT

Version 1 should provide simple tax configuration.

Support:

- Tax name
- Tax percentage
- Multiple tax rates
- Tax-inclusive pricing
- Tax-exclusive pricing
- Optional tax per line item

Do not build country-specific tax compliance engines yet.

Do not claim that Free Invoice Maker is automatically compliant with every country's tax law.

It should simply provide configurable calculations.

---

# 24. CURRENCY

Support multiple currencies.

At minimum:

```text
ZMW
USD
EUR
GBP
ZAR
```

Allow custom currencies.

Do not require live exchange rates.

Users can manually set the currency.

---

# 25. PDF GENERATION

PDF generation is a core feature.

Every document must be exportable as a professional PDF.

The PDF should contain:

- Business branding
- Customer details
- Document title
- Document number
- Dates
- Line items
- Totals
- Taxes
- Payment information
- Notes
- Terms
- Signature
- Stamp
- Footer

The generated PDF must be printable.

It should not contain Free Invoice Maker advertising or watermarks.

---

# 26. DOCUMENT TEMPLATES

Provide at least 3 professional templates.

For example:

```text
Classic
Modern
Minimal
```

Templates should support:

- Logo
- Business details
- Customer details
- Item table
- Totals
- Signature
- Footer
- Terms
- Notes

Allow basic customization:

- Primary color
- Secondary color
- Font
- Logo position
- Footer text

Do not spend weeks building a drag-and-drop document designer.

That is not version 1.

---

# 27. DASHBOARD

Create a simple dashboard showing:

```text
Businesses
Customers
Invoices
Quotations
Receipts
Estimates
Products
API Keys
```

For the selected business show basic statistics:

- Total invoices
- Paid invoices
- Unpaid invoices
- Overdue invoices
- Total invoiced
- Total paid
- Outstanding amount
- Recent documents

Keep this simple.

---

# 28. DOCUMENT SEARCH

Allow users to search documents by:

- Document number
- Customer
- Date
- Status
- Document type

Provide filters.

---

# 29. CUSTOMER DOCUMENT HISTORY

Opening a customer should show:

```text
Customer Details

Invoices
Quotations
Estimates
Receipts
Total billed
Total paid
Outstanding
```

---

# 30. FILE STORAGE

Use local storage by default.

Suggested:

```text
storage/
├── uploads/
│   ├── logos/
│   ├── signatures/
│   └── stamps/
│
└── documents/
    ├── invoices/
    ├── quotations/
    ├── estimates/
    └── receipts/
```

Do not make cloud storage mandatory.

---

# 31. DATABASE

SQLite should be the default database.

Create proper relationships between:

```text
Users
Businesses
Customers
Products
Documents
DocumentItems
Payments
APIKeys
Templates
Attachments
Settings
```

Use migrations.

Do not store everything in JSON files.

Use a proper relational database structure.

---

# 32. API ENDPOINTS

Create a coherent REST API.

At minimum:

```text
/api/v1/businesses
/api/v1/customers
/api/v1/products
/api/v1/invoices
/api/v1/quotations
/api/v1/estimates
/api/v1/receipts
/api/v1/payments
/api/v1/templates
/api/v1/api-keys
```

Examples:

```http
POST /api/v1/invoices
GET /api/v1/invoices
GET /api/v1/invoices/{id}
PATCH /api/v1/invoices/{id}
DELETE /api/v1/invoices/{id}
GET /api/v1/invoices/{id}/pdf
```

Quotation:

```http
POST /api/v1/quotations
GET /api/v1/quotations
GET /api/v1/quotations/{id}
POST /api/v1/quotations/{id}/convert-to-invoice
GET /api/v1/quotations/{id}/pdf
```

Receipt:

```http
POST /api/v1/receipts
GET /api/v1/receipts
GET /api/v1/receipts/{id}
GET /api/v1/receipts/{id}/pdf
```

Customer:

```http
POST /api/v1/customers
GET /api/v1/customers
GET /api/v1/customers/{id}
PATCH /api/v1/customers/{id}
DELETE /api/v1/customers/{id}
```

---

# 33. AI AGENT FRIENDLINESS

This is one of the defining features.

Design API responses so an AI agent can easily understand them.

Use predictable JSON.

Example:

```json
{
  "success": true,
  "data": {
    "invoice_id": "inv_123",
    "invoice_number": "INV-00042",
    "customer_id": "cus_123",
    "status": "draft",
    "total": 1500,
    "currency": "ZMW",
    "pdf_url": "/api/v1/invoices/inv_123/pdf"
  }
}
```

Errors should also be machine-readable:

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer does not exist."
  }
}
```

Use stable error codes.

---

# 34. HERMES INTEGRATION

Do not hard-code Hermes Agent into Free Invoice Maker.

Free Invoice Maker must remain an independent application.

Hermes should connect through the public REST API.

The README must contain an example showing how an AI agent can interact with the application.

Example:

```text
1. Start Free Invoice Maker.
2. Create a business.
3. Generate an API key.
4. Give the API base URL and API key to Hermes.
5. Hermes can then create customers, invoices, quotations and receipts.
```

Provide examples using:

- curl
- Python
- JavaScript

---

# 35. EXAMPLE HERMES WORKFLOW

The documentation should demonstrate:

```text
User
 ↓
Hermes Agent
 ↓
Free Invoice Maker API
 ↓
Database
 ↓
PDF Generator
 ↓
Invoice PDF
```

Example:

```text
User:
"Create an invoice for John for the website maintenance package."

Hermes:
1. Find John.
2. Find the website maintenance product.
3. Create invoice.
4. Request PDF.
5. Return invoice number and PDF location.
```

The application itself does not need an AI model.

It should simply provide excellent tools for AI agents.

---

# 36. SECURITY

Implement basic but real security.

Requirements:

- Password hashing
- API key hashing
- Authentication
- Authorization
- Permission scopes
- Input validation
- SQL injection protection
- File upload validation
- Path traversal protection
- Secure filenames
- CORS configuration
- Environment-based secrets
- No hard-coded credentials
- Safe error responses

Do not expose secrets in logs.

---

# 37. BACKUP AND RESTORE

Implement simple local backup.

Allow the user to export:

```text
Database
Business data
Customers
Products
Documents
Settings
```

into a backup archive.

Provide restore functionality.

The goal is that someone running the application on a VPS can back up their entire invoicing system without needing another service.

---

# 38. IMPORT / EXPORT

Provide basic CSV import/export.

At minimum:

### Customers

### Products

### Documents where practical

Example:

```text
customers.csv
products.csv
```

This makes migration easier.

---

# 39. DESKTOP EXPERIENCE

The application must be usable as a desktop application.

The initial architecture may use a local web application.

If practical, package it later using a lightweight desktop wrapper such as:

- Tauri
- Electron

Prefer Tauri if it can be implemented cleanly.

However:

**Do not delay the working application because of desktop packaging.**

The first functional version can run locally at:

```text
http://localhost:8000
```

and later be packaged as a native desktop application.

The same application must also be deployable to a VPS.

---

# 40. DOCKER

Create a working Docker configuration.

Requirements:

```bash
docker compose up -d
```

starts the application.

Persist:

- Database
- Uploaded files
- Generated documents

through Docker volumes.

The application must survive container restarts.

---

# 41. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

with configuration for:

```text
APP_NAME
APP_ENV
APP_HOST
APP_PORT
SECRET_KEY
DATABASE_URL
STORAGE_PATH
CORS_ORIGINS
```

Never commit actual secrets.

---

# 42. INSTALLATION

The README must explain:

### Local Python installation

```bash
git clone ...
cd free-invoice-maker
python -m venv .venv
...
```

### Docker installation

```bash
docker compose up -d
```

### VPS installation

Explain:

```text
VPS
 ↓
Ubuntu
 ↓
Docker
 ↓
Free Invoice Maker
 ↓
Reverse Proxy
 ↓
HTTPS
```

Do not make a particular hosting provider mandatory.

---

# 43. REVERSE PROXY

Document deployment behind:

- Caddy
- Nginx

Do not require either for local operation.

---

# 44. OPEN SOURCE REQUIREMENTS

The repository must contain:

```text
LICENSE
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
CHANGELOG.md
```

Use MIT licensing unless there is a compelling technical/legal reason not to.

Do not include proprietary Refrens code.

Do not copy Refrens branding.

Do not copy their templates pixel-for-pixel.

Refrens is being used only as a feature benchmark.

---

# 45. REFRÉNS BENCHMARK

Use Refrens as a reference for the level of functionality expected in a professional invoicing application.

Relevant features observed in Refrens include:

- Custom business branding
- Logos
- Custom colors
- Custom templates
- Custom columns
- Customer management
- Multiple businesses
- Payment receipts
- Quotations
- Estimates
- Invoice conversion
- Signatures
- Terms and conditions
- Notes
- Payment details
- PDF generation
- Document history
- Basic reporting

Refrens also has substantially more advanced features such as team permissions, recurring documents, payment integrations, tax/e-invoicing functionality, bulk uploads, OCR, accounting, workflows and AI features. Those are **not required for Free Invoice Maker version 1**.

The objective is:

**Build the useful 20% first.**

---

# 46. THINGS NOT REQUIRED FOR VERSION 1

Do NOT allow scope creep to destroy this project.

Do not require:

- Payment gateway
- Online payment processing
- Banking integrations
- Government tax API integrations
- GST e-invoicing
- OCR
- AI assistant
- CRM
- Payroll
- Full accounting system
- Inventory management
- Advanced analytics
- Email marketing
- WhatsApp integration
- SMS integration
- Team collaboration
- Enterprise SSO
- Complex workflow engines
- Subscription billing
- Cloud SaaS infrastructure

These can be considered later.

---

# 47. DATA OWNERSHIP

The user must own their data.

No mandatory cloud account.

No mandatory telemetry.

No mandatory external API.

No mandatory subscription.

No artificial limits on the number of invoices in the open-source version.

No watermark on generated documents.

---

# 48. USER INTERFACE

The interface should be clean and practical.

Primary navigation:

```text
Dashboard
Businesses
Customers
Products & Services
Invoices
Quotations
Estimates
Receipts
Payments
Templates
API Keys
Settings
Backups
```

Use clear forms.

Avoid excessive animations.

Avoid unnecessary dashboards full of meaningless graphs.

This is an invoicing application, not a spaceship control panel.

---

# 49. DOCUMENT CREATION UX

Creating an invoice should be straightforward.

Example flow:

```text
Create Invoice
 ↓
Select Business
 ↓
Select Customer
 ↓
Add Items
 ↓
Apply Discount/Tax
 ↓
Set Dates
 ↓
Add Notes/Terms
 ↓
Select Template
 ↓
Preview
 ↓
Save
 ↓
Generate PDF
```

Provide a live or near-live preview if practical.

---

# 50. VALIDATION

Validate:

- Required fields
- Numeric values
- Dates
- Currency
- Tax rates
- Customer IDs
- Business IDs
- Product IDs

Prevent invalid totals.

All financial calculations should be performed using decimal-safe arithmetic rather than floating-point arithmetic.

---

# 51. TESTING

Create automated tests.

At minimum test:

### Authentication

### API key authentication

### Business creation

### Customer CRUD

### Product CRUD

### Invoice creation

### Invoice calculations

### Tax calculation

### Discount calculation

### Quotation creation

### Quotation-to-invoice conversion

### Receipt creation

### PDF generation

### API permissions

### Backup and restore

### Database migrations

Include integration tests for the major API workflows.

---

# 52. TEST THE ACTUAL APPLICATION

Do not stop after writing tests.

Actually start the application.

Create test data.

Perform this workflow:

```text
Create Business
 ↓
Create Customer
 ↓
Create Product
 ↓
Create Quotation
 ↓
Convert Quotation to Invoice
 ↓
Generate PDF
 ↓
Create Receipt
 ↓
Verify Customer History
 ↓
Export Backup
 ↓
Restore Backup
```

Fix every failure encountered.

---

# 53. API ACCEPTANCE TEST

The following should work after installation:

```bash
curl http://localhost:8000/api/v1/health
```

Expected:

```json
{
  "status": "ok"
}
```

Then authenticate with an API key.

Create a customer.

Create an invoice.

Generate the PDF.

Download the PDF.

The entire workflow must work without touching the GUI.

---

# 54. HEALTH ENDPOINT

Provide:

```http
GET /api/v1/health
```

Return:

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

This is useful for Docker, VPS monitoring and AI agents.

---

# 55. VERSIONING

Version the API:

```text
/api/v1/
```

Do not create unversioned endpoints that will make future upgrades painful.

---

# 56. LOGGING

Provide useful application logs.

Logs should identify:

- Startup
- Shutdown
- API errors
- Authentication failures
- Document creation
- PDF generation failures
- Database errors

Never log:

- Passwords
- API keys
- Secrets
- Full sensitive customer information unnecessarily

---

# 57. ERROR HANDLING

The application must fail gracefully.

A PDF generation error should not crash the entire server.

An invalid customer ID should return a clear API error.

A duplicate invoice number should return a clear error.

A missing logo should not prevent invoice generation.

---

# 58. DOCUMENT STORAGE

When generating PDFs, maintain predictable filenames.

Example:

```text
INV-00042-John-Banda.pdf
```

Do not allow user-provided filenames to escape the document storage directory.

---

# 59. README

The README should explain:

```text
What is Free Invoice Maker?
Why does it exist?
Features
Screenshots
Installation
Docker
Desktop/local usage
VPS deployment
API
API authentication
API examples
Hermes Agent integration
Database
Backup
Development
Testing
Contributing
License
Roadmap
```

Clearly explain that Free Invoice Maker is:

**Local-first, open source, self-hostable, API-first invoicing software.**

---

# 60. API EXAMPLES IN README

Include examples.

### Create customer

```bash
curl -X POST http://localhost:8000/api/v1/customers \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Banda",
    "email": "john@example.com"
  }'
```

### Create invoice

Provide a complete working example.

### Generate PDF

Provide a complete working example.

### Convert quotation

Provide a complete working example.

---

# 61. AI AGENT DOCUMENTATION

Create:

```text
docs/ai-agent-integration.md
```

Explain how an AI agent can use the API.

Include:

- Authentication
- Available endpoints
- Permission scopes
- Common workflows
- Error handling
- Example curl requests
- Example Python client
- Example agent workflow

The documentation should be written so that an AI agent developer can understand it quickly.

---

# 62. FUTURE ROADMAP

Create a roadmap but do not implement everything.

Possible future versions:

### v1.0
Core invoicing application.

### v1.1
Better templates and desktop packaging.

### v1.2
Recurring invoices.

### v1.3
Advanced reporting.

### v1.4
Email and sharing.

### v2.0
Team accounts and permissions.

### v2.x
Optional payment integrations.

### Future commercial edition
One-time purchase desktop application with additional premium functionality.

The open-source project should remain useful independently.

---

# 63. COMMERCIAL FUTURE

Do not implement subscriptions.

The long-term commercial model may be:

```text
Free Invoice Maker
        │
        ├── Open Source Edition
        │      Free
        │      Self-hosted
        │      API
        │      Local
        │
        └── Commercial Edition
               One-time purchase
               Desktop installer
               Additional convenience features
```

Do not build licensing/payment infrastructure now.

Do not let the future commercial model interfere with the open-source MVP.

---

# 64. BRANDING

Application name:

**Free Invoice Maker**

Author:

**Shadrick Vidmar**

Do not call it:

- Vidma Invoice Maker
- Vidmar Invoice SaaS
- VAI Invoice SaaS

The project should stand independently as an open-source developer project.

Vidmar AI can use it.

Hermes can use it.

Other developers can use it.

But the application should not be artificially locked to Vidmar AI.

---

# 65. GITHUB QUALITY

The final repository should look like a serious open-source project.

Include:

- Clean README
- Installation instructions
- Screenshots
- API documentation
- Architecture documentation
- Tests
- Issue templates
- Pull request template
- Contribution guide
- Security policy
- Changelog
- MIT license

Use sensible commit messages.

Do not commit:

- `.env`
- passwords
- API keys
- generated secrets
- personal customer data
- unnecessary build artifacts

---

# 66. DEVELOPMENT PRINCIPLE

Prioritize:

```text
WORKING > COMPLEX

RELIABLE > FANCY

SIMPLE > OVERENGINEERED

API ACCESS > LOCK-IN

LOCAL DATA > REQUIRED CLOUD

OPEN SOURCE > SUBSCRIPTION
```

If there is a choice between implementing ten mediocre features and five excellent core features:

**Implement the five excellent features.**

---

# 67. MVP DEFINITION

The MVP is complete when a user can:

1. Install Free Invoice Maker.
2. Start the application.
3. Create an account.
4. Create a business.
5. Add the business logo.
6. Add business information.
7. Add a signature.
8. Add a stamp.
9. Add payment details.
10. Add a customer.
11. Add products/services.
12. Create a quotation.
13. Export the quotation to PDF.
14. Convert the quotation into an invoice.
15. Export the invoice to PDF.
16. Create a payment receipt.
17. View customer history.
18. Create an API key.
19. Authenticate with the API.
20. Create a customer through the API.
21. Create an invoice through the API.
22. Generate an invoice PDF through the API.
23. Run the application through Docker.
24. Back up the database.
25. Restore the database.

If all of these work, the MVP is successful.

---

# 68. BUILD ORDER

Build in this order:

### Phase 1
Project foundation.

### Phase 2
Database and models.

### Phase 3
Authentication.

### Phase 4
Business profiles.

### Phase 5
Customers.

### Phase 6
Products/services.

### Phase 7
Document engine.

### Phase 8
Invoices.

### Phase 9
Quotations and estimates.

### Phase 10
Receipts.

### Phase 11
PDF generation.

### Phase 12
Branding, logos, signatures and stamps.

### Phase 13
REST API.

### Phase 14
API keys and permissions.

### Phase 15
Dashboard/UI.

### Phase 16
Backups.

### Phase 17
Docker.

### Phase 18
Automated tests.

### Phase 19
End-to-end testing.

### Phase 20
Documentation.

### Phase 21
Final cleanup.

---

# 69. AUTONOMOUS EXECUTION RULE

Do not stop after each phase to ask for permission.

Continue working through the phases.

If something fails:

1. Diagnose it.
2. Fix it.
3. Test it again.
4. Continue.

If a dependency causes problems, choose a reasonable alternative.

If a feature is technically unnecessary for MVP, simplify it rather than becoming blocked.

Do not spend excessive time perfecting visual details before the core application works.

---

# 70. FINAL ACCEPTANCE CHECK

Before declaring the project complete, verify:

```text
[ ] Application starts
[ ] Database initializes
[ ] Authentication works
[ ] Business creation works
[ ] Multiple businesses work
[ ] Customer CRUD works
[ ] Product CRUD works
[ ] Invoice creation works
[ ] Invoice calculations are correct
[ ] Quotation creation works
[ ] Quotation conversion works
[ ] Receipt creation works
[ ] PDF generation works
[ ] Logo upload works
[ ] Signature works
[ ] Stamp works
[ ] Terms work
[ ] Notes work
[ ] Cover letter works
[ ] Multiple currencies work
[ ] Tax calculation works
[ ] Document numbering works
[ ] Customer history works
[ ] API authentication works
[ ] API key creation works
[ ] API permissions work
[ ] Customer API works
[ ] Invoice API works
[ ] PDF API works
[ ] Health endpoint works
[ ] OpenAPI documentation works
[ ] Docker deployment works
[ ] Data persists after restart
[ ] Backup works
[ ] Restore works
[ ] Automated tests pass
[ ] End-to-end workflow passes
[ ] README is complete
[ ] API documentation is complete
[ ] No secrets are committed
[ ] No proprietary Refrens code/assets are used
[ ] Repository is clean
```

---

# 71. FINAL INSTRUCTION

**Build Free Invoice Maker now.**

Do not produce a proposal describing what you would build.

Actually create the project files.

Actually implement the backend.

Actually implement the database.

Actually implement the frontend.

Actually implement the API.

Actually implement PDF generation.

Actually run the application.

Actually test the complete workflow.

Actually fix the errors.

Actually document the installation and API.

Continue until the MVP acceptance criteria are satisfied.

At the end, provide a concise completion report containing:

```text
Project status
Implemented features
Technology stack
How to run locally
How to run with Docker
API base URL
API documentation URL
Test results
Known limitations
Files/folders created
Recommended next development step
```

The goal is not to make the most sophisticated invoicing platform on Earth.

The goal is to make a **working, free, open-source, local-first invoice maker that a human can use and an AI agent can control through an API.**

Build it.