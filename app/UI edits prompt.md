
/go

Continue developing the existing Free Invoice Maker (FIM) application from the current implementation.

Do not rebuild the application from scratch.

Do not replace the existing dashboard design.

Do not create a completely different visual system.

Continue the same workflow, visual language, navigation structure, colors, typography, components, and application style that has already been established.

The objective now is to complete the application workflows, improve the application navigation, implement proper data persistence, eliminate browser-native prompts/notifications, and prepare the architecture for future FIM versions.

==================================================
1. PRODUCT VISION
==================================================

Free Invoice Maker (FIM) is intended to be:

- Free
- Open source
- Local-first
- Self-hostable
- Usable without AI
- Usable without cloud services
- Usable on Windows
- Usable on Linux
- Usable on a VPS
- Accessible through a web UI
- Accessible through a REST API
- Accessible by AI agents and automation tools

A normal human should be able to open FIM and use it entirely through the graphical interface.

An AI agent such as Hermes should be able to access FIM through its API using an API key.

The GUI and API must use the same underlying application and database.

The API must remain available independently of the GUI.

==================================================
2. FIM VERSION ROADMAP
==================================================

Design the current architecture around these future versions.

FIM V1:
INVOICING

Core functionality:

- Multiple business profiles
- Business switching
- Customers
- Customer CSV/Excel import
- Products
- Services
- Invoices
- Quotations
- Estimates
- Receipts
- Payments
- PDF generation
- Business logos
- Signatures
- Stamps
- Cover letters
- Templates
- Payment information
- Dashboard
- Local database
- REST API
- API keys
- Self-hosting

FIM V2:
INVENTORY

Future functionality:

- Stock-tracked products
- SKU
- Barcode
- Barcode scanning
- Stock receiving
- Stock deductions
- Stock adjustments
- Stock movements
- Purchase cost
- Selling price
- Quantity
- Low-stock alerts
- Expiry dates
- Batch tracking
- Perishable inventory
- Inventory reports

Do not build the complete inventory system now.

However, design V1's database and product architecture so that inventory can be added later without requiring a complete rewrite.

FIM V3:
CLOUD

Future paid services:

- Cloud storage
- Automatic backups
- Cloud recovery
- Multi-device synchronization
- Remote access
- Mobile application synchronization
- Email notifications
- Cloud-hosted deployment
- Optional cloud database
- Optional hosted API infrastructure

The free local application should remain useful without these services.

==================================================
3. FREE VS PAID ARCHITECTURE
==================================================

Do NOT put AI agents behind the paid cloud tier.

API access and API keys are part of FIM Core.

A user should be able to:

1. Install FIM locally.
2. Create a business.
3. Generate an API key.
4. Give the API endpoint and API key to Hermes or another agent.
5. Allow the agent to create invoices, customers, receipts, etc.

This should work completely free and locally.

The API is a core feature.

The future paid cloud version should monetize infrastructure rather than basic API access.

FREE LOCAL FIM:

- Local database
- Local documents
- Local PDF generation
- Multiple businesses
- Customers
- Products/services
- Invoices
- Quotations
- Estimates
- Receipts
- Payments
- CSV/Excel import
- API
- API keys
- AI-agent access
- Self-hosting

PAID CLOUD FIM:

- Cloud storage
- Automatic backups
- Cloud recovery
- Multi-device synchronization
- Remote access
- Mobile synchronization
- Email notifications
- Hosted infrastructure
- Optional cloud database
- Optional hosted API

Do not artificially cripple the local version.

==================================================
4. DATABASE ARCHITECTURE
==================================================

Use ONE local SQLite database for the entire FIM installation.

Do NOT create a separate database every time a new business profile is created.

Example:

data/
    fim.db

The database contains all businesses and their associated records.

Every business-owned record must contain a business_id.

Conceptually:

businesses
    id
    name
    ...

customers
    id
    business_id
    name
    ...

products
    id
    business_id
    name
    ...

services
    id
    business_id
    name
    ...

invoices
    id
    business_id
    customer_id
    ...

invoice_items
    id
    invoice_id
    product_id
    service_id
    ...

quotations
    id
    business_id
    ...

estimates
    id
    business_id
    ...

receipts
    id
    business_id
    ...

payments
    id
    business_id
    ...

api_keys
    id
    business_id
    ...

This gives one database while maintaining strict business data isolation.

When a business is selected, every relevant query must use the active business_id.

Never display records belonging to another business.

==================================================
5. DATABASE CONFIGURATION
==================================================

SQLite is the default database for FIM V1.

The application must work without:

- Supabase
- Firebase
- PostgreSQL installation
- Cloud database
- Internet access
- External database account

The application must automatically create and initialize the SQLite database on first launch.

Example:

data/
    fim.db

The database must survive application restarts.

Test:

Create customer
→ close application
→ reopen application
→ customer still exists.

Do the same for businesses, invoices, products, quotations, receipts and payments.

==================================================
6. FUTURE DATABASE SUPPORT
==================================================

Prepare the application architecture so that the database layer can eventually support alternative backends.

Potential future backends:

- SQLite
- PostgreSQL
- Cloud database adapters

Do not implement fake database options.

Do not add a Supabase/PostgreSQL selector that does nothing.

Only expose a database option in Settings when the corresponding adapter is actually implemented.

For now:

Database:
SQLite

Future versions may expose advanced database configuration.

==================================================
7. APPLICATION NAVIGATION
==================================================

The hamburger menu must be located at the absolute top-left of the application.

It should remain clearly visible.

Clicking it should expand/collapse the main navigation sidebar.

The sidebar should contain both icons and proper labels.

Do not rely on icons alone.

Use clear names such as:

Dashboard

Invoices

Quotations

Estimates

Receipts

Customers

Products & Services

Payments

Business Profiles

Customize

API Keys

Settings

The active page should have a clear visual state.

The sidebar should use the same blue/indigo visual language already established.

==================================================
8. SIDEBAR STRUCTURE
==================================================

Use a clean structure similar to:

MAIN

Dashboard

DOCUMENTS

Invoices
Quotations
Estimates
Receipts

MANAGEMENT

Customers
Products & Services
Payments

BUSINESS

Business Profile
Customize

DEVELOPER

API Keys
API Documentation

SYSTEM

Settings
Backups

Do not make the sidebar unnecessarily complicated.

The exact grouping may be adjusted if the current UI has a better structure.

==================================================
9. BUSINESS SWITCHER
==================================================

Keep the existing business switcher in the top-right area.

The user must be able to:

- View current business
- Switch businesses
- Add business
- Manage businesses

Example:

Businesses

✓ Vidmar AI

Vidmar Entertainment

ABC Construction

+ Add Business

When a business is switched:

- Dashboard updates
- Customers update
- Products update
- Services update
- Documents update
- Payments update
- Statistics update

Never mix data from different businesses.

==================================================
10. ADD CUSTOMER WORKFLOW
==================================================

When the user clicks:

Add Customer

do NOT use:

window.prompt()
window.alert()
window.confirm()

Do NOT navigate to a raw API endpoint.

Do NOT show browser-native input dialogs.

Instead, open a proper FIM application modal or drawer.

Example:

Add Customer

Customer Name
[________________________]

Company
[________________________]

Email
[________________________]

Phone
[________________________]

Address
[________________________]

City
[________________________]

Country
[________________________]

Tax/VAT Number
[________________________]

Notes
[________________________]

[Cancel] [Save Customer]

The exact fields should follow the current backend model.

After saving:

1. Validate data.
2. Save to SQLite.
3. Return successful response.
4. Close modal.
5. Refresh customer list.
6. Display customer immediately.
7. Show a themed FIM success notification.

No browser notification.

==================================================
11. APPLICATION NOTIFICATIONS
==================================================

Replace browser-native notifications with themed FIM notifications.

Do not use:

window.alert()
window.confirm()

Create a reusable notification/toast system.

Examples:

Customer created successfully.

Invoice created successfully.

Business profile updated.

PDF generated successfully.

Unable to save customer.

The notification should visually match the application.

Use appropriate:

- Success
- Error
- Warning
- Information

states.

==================================================
12. EDIT CUSTOMER
==================================================

Clicking Edit Customer should open the same style of application modal.

Populate all existing values.

Allow editing.

Save changes to SQLite.

Immediately update the customer table.

==================================================
13. DELETE CUSTOMER
==================================================

Use a FIM confirmation modal.

Example:

Delete Customer?

Are you sure you want to delete John Banda?

[Cancel] [Delete]

Do not use browser confirm().

If deletion is prevented because the customer has associated documents, explain the issue clearly.

==================================================
14. BULK CUSTOMER IMPORT
==================================================

Implement a proper application workflow for importing customers in bulk.

When the user selects:

Import Customers

open a dedicated FIM import page or large modal.

Do not use browser prompts.

The import interface should clearly explain supported file formats.

Supported formats:

- CSV
- Excel (.xlsx)
- Excel (.xls) if supported by the implementation

Clearly display:

Supported files:
CSV and Excel spreadsheets.

Provide:

[Choose File]

After selecting a file:

Show:

- File name
- File type
- Number of rows
- Detected columns
- Validation status

Then provide a column mapping interface.

Example:

FIM FIELD             IMPORT COLUMN

Customer Name         [Name ▼]

Company               [Company ▼]

Email                 [Email ▼]

Phone                 [Phone ▼]

Address               [Address ▼]

Country               [Country ▼]

Allow the user to map columns before importing.

==================================================
15. CSV/EXCEL VALIDATION
==================================================

Before importing:

Validate the data.

Detect:

- Missing required fields
- Invalid email addresses
- Duplicate customers
- Empty rows
- Unsupported columns
- Invalid file format

Show a preview before importing.

Example:

Preview

Rows detected: 250

Valid: 243
Warnings: 5
Errors: 2

[Cancel] [Import 243 Customers]

Do not silently import broken data.

==================================================
16. BULK IMPORT RESULTS
==================================================

After import:

Show a proper results screen/modal.

Example:

Import Complete

243 customers imported

5 duplicates skipped

2 rows contained errors

Provide:

[View Errors]
[Done]

Imported customers should immediately appear in the customer table.

No page refresh should be required.

==================================================
17. PRODUCTS AND SERVICES
==================================================

Create proper application workflows for:

Add Product
Edit Product
Delete Product

Add Service
Edit Service
Delete Service

Use the same themed modal/drawer system.

Products and services must belong to the active business.

==================================================
18. PREPARATION FOR FUTURE INVENTORY
==================================================

For V1, products do not need complete inventory management.

However, structure products so future versions can add:

- SKU
- Barcode
- Cost price
- Selling price
- Quantity
- Reorder level
- Expiry tracking
- Batch tracking

Do not build barcode scanning and stock management in V1.

The architecture should simply avoid making those future features impossible.

==================================================
19. INVOICE WORKFLOW
==================================================

Clicking New Invoice must open a proper application page.

The workflow should include:

Customer
Invoice Number
Issue Date
Due Date
Currency

Items

Product/service
Quantity
Unit price
Tax
Discount

Subtotal
Tax
Discount
Total

Payment Information
Notes
Terms
Signature
Stamp

Buttons:

Save Draft
Preview
Create Invoice

The invoice must be saved to SQLite.

==================================================
20. QUOTATION WORKFLOW
==================================================

Create a proper application page.

Include:

Customer
Items
Pricing
Tax
Discount
Cover Letter
Notes
Terms
Signature
Stamp
Logo

Save to SQLite.

Allow conversion from quotation to invoice.

==================================================
21. ESTIMATE WORKFLOW
==================================================

Create a proper application page.

Use the same design system as invoices and quotations.

Save estimates to SQLite.

==================================================
22. RECEIPT WORKFLOW
==================================================

Create a proper application page.

Fields:

Customer
Related Invoice
Payment Amount
Payment Method
Payment Date
Payment Reference
Notes

Generate receipt.

Save receipt and payment information.

==================================================
23. PDF GENERATION
==================================================

Generated documents should use the active business information.

Include where appropriate:

- Business logo
- Business name
- Address
- Contact details
- Customer information
- Document number
- Dates
- Items
- Totals
- Payment information
- Terms
- Cover letter
- Signature
- Stamp
- Branding

The PDF should be generated locally.

Do not require cloud services.

==================================================
24. BUSINESS PROFILE
==================================================

Create a proper application page/modal for business profiles.

Fields should include:

Business name
Trading name
Email
Phone
Website
Address
City
Country
Registration number
Tax/VAT number
Currency

Allow:

Upload Logo
Upload Signature
Upload Stamp

All information should be saved to SQLite.

==================================================
25. MULTIPLE BUSINESSES
==================================================

A single FIM installation may contain multiple business profiles.

Example:

Business A
Business B
Business C

All are stored in the same SQLite database.

Each business has isolated:

- Customers
- Products
- Services
- Invoices
- Quotations
- Estimates
- Receipts
- Payments
- Branding
- Settings

Switching businesses changes the active business context.

==================================================
26. DASHBOARD
==================================================

Keep the existing dashboard design.

The dashboard should use real database data.

Show:

- Total invoices
- Total quotations
- Total estimates
- Total receipts
- Paid
- Outstanding
- Overdue
- Recent documents
- Upcoming deadlines
- Recent activity

For a new business with no records:

Show zeros and useful empty states.

Do not use fake statistics.

==================================================
27. API KEYS
==================================================

API keys are FREE and part of FIM Core.

Create:

Settings
→ API Keys

Allow users to:

- Create API key
- Name API key
- View active keys
- Revoke keys
- Delete keys
- View created date
- View last-used date

Example:

Hermes Agent
Status: Active
Created: Aug 17
Last Used: Just now

When creating a key:

Show the complete key only once.

Provide:

[Copy API Key]

Explain:

Keep this key private. It allows applications and AI agents to access your FIM account.

==================================================
28. AI AGENT ACCESS
==================================================

AI agents are not a paid cloud feature.

A locally installed FIM instance can expose its API.

Example:

FIM running locally:

http://localhost:8000

API:

http://localhost:8000/api

API documentation:

http://localhost:8000/api/docs

Hermes can use the API key to perform authorized operations.

For example:

Create customer
Create invoice
Create quotation
Create receipt
Find customer
Find invoice
Record payment

The API should remain available even if the human is using the GUI.

==================================================
29. AUTHENTICATION
==================================================

The human-facing UI must not ask users to manually enter:

Bearer tokens
Authorization headers
API keys

when performing normal operations.

The frontend must handle authentication/session management internally.

External applications and AI agents should authenticate using API keys.

Do not expose API keys unnecessarily in the frontend.

==================================================
30. API DOCUMENTATION
==================================================

Keep:

/api/docs

available.

It is for:

- Developers
- Hermes
- n8n
- AI agents
- External applications
- Testing

The normal user should not be forced to interact with it.

==================================================
31. DATA REFRESH
==================================================

After any successful operation:

Create
Update
Delete
Import
Payment
Document generation

update the UI immediately.

Do not require:

Ctrl + R
Browser refresh
Restarting the application

The user should see the change immediately.

==================================================
32. LOCAL FILE STORAGE
==================================================

Store local user assets appropriately.

For example:

data/
    fim.db

uploads/
    logos/
    signatures/
    stamps/

documents/
    invoices/
    quotations/
    estimates/
    receipts/

Use the existing project architecture if it has a better equivalent.

The important requirement is that the user's data is stored locally.

==================================================
33. BACKUPS
==================================================

For V1, provide a simple local backup capability if practical.

Allow the user to export/backup the local FIM data.

The paid cloud version will later provide:

- Automatic cloud backups
- Cloud recovery
- Multi-device synchronization

Do not require cloud infrastructure for local backup.

==================================================
34. FUTURE CLOUD ARCHITECTURE
==================================================

Design the application so that cloud services can be added later.

Future:

Local FIM
    ↓
Optional cloud synchronization
    ↓
Cloud storage
    ↓
Automatic backups
    ↓
Remote access
    ↓
Mobile synchronization
    ↓
Email notifications

The cloud version should not break local installations.

==================================================
35. EMAIL NOTIFICATIONS
==================================================

Do not build complex notifications in V1 unless already supported.

For the future cloud version, consider notifications such as:

- Invoice overdue
- Payment received
- Product running low
- Product approaching expiry
- Backup completed
- Important account notifications

Email can be the first notification channel.

Mobile push notifications can come later.

==================================================
36. FUTURE INVENTORY
==================================================

Do not implement the full inventory system now.

However, document the intended future model.

A future inventory item may contain:

Product
SKU
Barcode
Cost price
Selling price
Quantity
Reorder level
Expiry date
Batch number

Future stock movements:

Stock received
Stock sold
Stock adjusted
Stock damaged
Stock expired
Stock returned

Future barcode workflow:

Scan barcode
→ identify product
→ add/update stock
→ record stock movement

The barcode scanner can eventually be:

- USB barcode scanner
- Bluetooth scanner
- Phone camera
- Mobile FIM application

Do not require physical barcode hardware for V1.

==================================================
37. MOBILE BARCODE SCANNING
==================================================

Do not implement this now.

Design future APIs so that a mobile device can eventually scan a barcode using its camera and send the barcode to FIM.

==================================================
38. UI QUALITY
==================================================

Every interaction must feel like part of the same premium application.

Use consistent:

- Blue/indigo branding
- Buttons
- Forms
- Cards
- Modals
- Tables
- Notifications
- Headings
- Icons
- Spacing
- Status indicators

Do not use browser-native dialogs.

Do not use raw API responses as the user interface.

Do not show developer errors to ordinary users.

==================================================
39. RESPONSIVE DESIGN
==================================================

The application should work on:

- Desktop
- Laptop
- Tablet
- Mobile browser

The sidebar should collapse into a drawer on smaller screens.

The hamburger menu must remain accessible.

Forms must become responsive.

Tables must remain usable on smaller screens.

==================================================
40. SECURITY
==================================================

Never expose API keys unnecessarily.

Store API keys securely.

Do not store raw secrets in frontend code.

Validate API requests.

Respect business_id boundaries.

A user/API key belonging to Business A must not be able to access Business B's data unless explicitly authorized by the application architecture.

==================================================
41. TESTING
==================================================

Test the following complete workflows.

TEST 1:

Create Business
→ Business appears in switcher
→ Select business
→ Dashboard updates

TEST 2:

Add Customer
→ Customer saved
→ Modal closes
→ Customer immediately appears in table
→ Restart application
→ Customer still exists

TEST 3:

Import CSV
→ Select CSV
→ Preview rows
→ Map columns
→ Validate
→ Import
→ Customers appear immediately

TEST 4:

Import Excel
→ Select XLSX
→ Preview
→ Map columns
→ Validate
→ Import
→ Customers appear immediately

TEST 5:

Create Product
→ Product saved
→ Product appears immediately

TEST 6:

Create Invoice
→ Invoice saved
→ PDF generated
→ Invoice appears in recent documents
→ Dashboard updates

TEST 7:

Record Payment
→ Payment saved
→ Invoice status changes
→ Dashboard updates

TEST 8:

Create second business
→ Switch business
→ Verify first business data is not visible
→ Add data to second business
→ Switch back
→ Verify original data remains intact

TEST 9:

Generate API key
→ Copy key
→ Authenticate external API request
→ Verify authorized operation works

TEST 10:

Restart application
→ Database persists
→ Businesses persist
→ Customers persist
→ Documents persist

==================================================
42. DO NOT IMPLEMENT UNNECESSARY FEATURES
==================================================

Do not turn FIM V1 into an ERP.

Do not implement full inventory now.

Do not implement cloud synchronization now.

Do not implement mobile applications now.

Do not implement team collaboration unless required by the existing architecture.

Do not require Supabase.

Do not require PostgreSQL for normal operation.

Do not add unnecessary complexity.

Prioritize reliability and usability.

==================================================
43. FINAL TARGET
==================================================

The final FIM V1 experience should be:

Install FIM
↓
Open FIM
↓
Create business
↓
Dashboard
↓
Add customers
↓
Add products/services
↓
Create invoices
↓
Create quotations
↓
Create estimates
↓
Create receipts
↓
Generate PDFs
↓
Track payments
↓
Use API
↓
Connect Hermes or another AI agent
↓
Everything persists locally

No cloud account required.

No Supabase required.

No external database required.

No browser prompts.

No browser-native confirmation dialogs.

No manual API authentication for ordinary UI operations.

Everything should feel like one cohesive application.

The GUI is for humans.

The REST API is for developers, automation and AI agents.

Both use the same FIM backend and database.

Continue implementing the existing application until these workflows function end-to-end.

Do not stop at UI mockups.

Do not use placeholder functionality where real functionality can be implemented.

Run the application and test the workflows after implementation.