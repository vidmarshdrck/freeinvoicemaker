
Continue implementing the remaining UI workflows before committing anything.

Do NOT finish the git rebase or create a commit yet. We will handle version control after the application workflows are complete and tested.

Use the customer workflow that has just been implemented as the standard pattern for the rest of Free Invoice Maker.

The customer implementation now demonstrates the desired interaction model:

- Application-native modals
- Application-native confirmation dialogs
- Toast notifications
- No browser prompt()
- No browser alert()
- No browser confirm()
- No raw API pages exposed to normal users
- Create/Edit/View/Delete handled inside the FIM interface
- Tables update after successful operations

Apply this same interaction pattern consistently throughout the application.

==================================================
1. BUSINESS PROFILE WORKFLOW
==================================================

Replace any remaining browser-native prompts, alerts, or confirmations used for business management.

Implement:

- Add Business
- Edit Business
- View Business
- Delete Business where appropriate
- Switch Business

Use proper FIM modals or dedicated application pages.

The Add Business form should collect all necessary information in one coherent interface.

Include where supported:

- Business name
- Trading name
- Email
- Phone
- Website
- Address
- City
- Country
- Registration number
- Tax/VAT number
- Currency
- Payment information
- Logo

After saving:

1. Save to the backend/database.
2. Close the modal.
3. Show a FIM toast.
4. Refresh the business list/switcher.
5. Make the newly created business immediately available.

==================================================
2. PRODUCTS
==================================================

Replace browser-native interaction for:

- Add Product
- Edit Product
- View Product
- Delete Product

Use the same modal and confirmation pattern used for Customers.

After creation/edit/deletion, update the products table immediately.

Products must belong to the currently selected business.

==================================================
3. SERVICES
==================================================

Implement the same pattern for:

- Add Service
- Edit Service
- View Service
- Delete Service

Use application-native modals and confirmations.

Do not use browser prompts.

==================================================
4. INVOICES
==================================================

Review the invoice workflow.

Remove any browser-native prompts, alerts, or confirmations.

Creating an invoice should use a proper FIM application page rather than a browser prompt.

The invoice workflow should provide a structured interface for:

- Customer
- Invoice number
- Issue date
- Due date
- Currency
- Products/services
- Quantity
- Unit price
- Tax
- Discount
- Subtotal
- Total
- Payment information
- Notes
- Terms
- Signature
- Stamp

Provide:

- Save Draft
- Preview
- Create Invoice

Use FIM toast notifications for success/error states.

==================================================
5. QUOTATIONS
==================================================

Review quotation creation/editing.

Use a proper FIM application workflow.

Support:

- Create
- Edit
- View
- Delete
- Preview
- Convert to Invoice

Use themed confirmations and toast notifications.

==================================================
6. ESTIMATES
==================================================

Apply the same pattern to Estimates.

Support:

- Create
- Edit
- View
- Delete
- Preview

Do not use browser-native dialogs.

==================================================
7. RECEIPTS
==================================================

Apply the same pattern to Receipts.

Support:

- Create
- View
- Edit where appropriate
- Delete where appropriate
- Generate PDF
- Print

Use FIM-native UI.

==================================================
8. PAYMENTS
==================================================

Review payment-related workflows.

Any:

- Record Payment
- Edit Payment
- Delete Payment
- Confirm Payment

actions should use FIM-native UI.

Do not use browser confirm().

After a payment is successfully recorded:

- Update invoice status.
- Update paid amount.
- Update outstanding amount.
- Update dashboard statistics.
- Show a success toast.

==================================================
9. BULK CUSTOMER IMPORT
==================================================

Implement the customer import workflow using the same visual system.

Do NOT use browser prompts or alerts.

Clicking:

Import Customers

should open a proper FIM modal, drawer, or dedicated import page.

Clearly state accepted formats:

CSV
Excel (.xlsx)

If .xls is supported by the current implementation, list it as well.

The interface should show:

- Accepted file formats
- File selection
- File name
- Number of rows
- Data preview
- Column mapping
- Validation results
- Import button
- Import results

Example:

Import Customers

Supported files:
CSV and Excel spreadsheets.

[Choose File]

After selecting:

File:
customers.xlsx

Rows:
250

Then show column mapping and preview.

After import:

243 customers imported
5 duplicates skipped
2 rows contain errors

Use a FIM toast or results panel.

Do not use browser alerts.

==================================================
10. GENERIC CONFIRMATION SYSTEM
==================================================

The existing showConfirm() implementation should become the standard confirmation system throughout FIM.

Reuse it wherever destructive or important actions require confirmation.

Examples:

Delete Customer
Delete Product
Delete Service
Delete Invoice
Delete Quotation
Delete Estimate
Delete Receipt
Delete Business
Remove Logo
Remove Signature
Remove Stamp

Do not duplicate confirmation implementations unnecessarily.

Create reusable components/functions where practical.

==================================================
11. TOAST SYSTEM
==================================================

Use the existing toast-friendly flow consistently.

Create reusable toast types:

Success
Error
Warning
Info

Examples:

Customer created successfully.

Customer updated successfully.

Invoice created successfully.

Business profile saved.

PDF generated successfully.

Unable to save customer.

Import completed with warnings.

Do not use alert().

==================================================
12. TABLE REFRESHING
==================================================

After every successful CRUD operation:

Create
Update
Delete
Import

the relevant table/list should update immediately.

Do not require the user to refresh the browser.

Use the existing frontend state/API architecture.

For example:

Create Customer
→ API request
→ successful response
→ update customer state/list
→ close modal
→ toast
→ customer appears immediately

==================================================
13. VIEW VS EDIT
==================================================

Where appropriate, provide:

View
Edit
Delete

actions.

View should be read-only.

Edit should reuse the same form where practical.

Do not create unnecessarily different forms for View and Edit.

The existing Customer View → Edit workflow should be treated as the reference implementation.

==================================================
14. ERROR HANDLING
==================================================

Do not expose raw backend errors directly to normal users.

For example, do not simply display:

Authentication required
Provide an API key or Bearer token

unless the error is genuinely being shown in the developer/API interface.

For normal GUI operations, translate errors into useful messages.

Example:

Unable to save customer.

Please check the required fields and try again.

If authentication/session handling is the actual problem:

Your session has expired. Please sign in again.

Do not ask ordinary users to manually enter an API key simply to use the GUI.

==================================================
15. API AUTHENTICATION SEPARATION
==================================================

Maintain a clear separation:

HUMAN GUI:

FIM handles authentication internally.

EXTERNAL API:

Developers and AI agents authenticate using API keys/Bearer tokens.

The normal user should never have to manually provide an API key when clicking Add Customer, Add Invoice, Add Business, etc.

==================================================
16. NAVIGATION
==================================================

Continue improving the existing sidebar.

The hamburger menu must remain at the top-left.

When opened, the sidebar should clearly show:

Dashboard

Invoices
Quotations
Estimates
Receipts

Customers
Products & Services
Payments

Business Profile
Customize

API Keys
API Documentation

Settings

Use icons plus proper text labels.

Do not rely on symbols alone.

The existing visual design should remain intact.

==================================================
17. BUSINESS SWITCHER
==================================================

Keep the existing business switcher in the top-right.

It should remain easy to understand.

When a business is switched, all relevant application data should change to that business.

Verify that customers, products, services, invoices and other documents do not leak between businesses.

==================================================
18. DATABASE PERSISTENCE
==================================================

Continue using one SQLite database for FIM V1.

Do not create a separate database for each business.

Use business_id to isolate records.

The current UI work must continue using the existing persistence layer rather than temporary frontend-only data.

Test that newly created customers, businesses, products and documents remain available after restarting the application.

==================================================
19. DO NOT IMPLEMENT INVENTORY YET
==================================================

Do not start implementing full inventory management.

FIM V2 will eventually support:

- Stock levels
- Barcodes
- Barcode scanning
- Stock receiving
- Stock deductions
- Expiry dates
- Batch tracking
- Low-stock alerts

For now, only make sure the Product architecture does not prevent these future capabilities.

==================================================
20. DO NOT IMPLEMENT CLOUD YET
==================================================

Do not implement cloud storage, synchronization, mobile apps, or automatic cloud backups yet.

Those belong to FIM V3.

The current application should remain local-first.

==================================================
21. API KEYS
==================================================

Keep API key functionality available in the free/local version.

API keys are not a paid feature.

Users should eventually be able to generate an API key and connect:

- Hermes Agent
- n8n
- Other AI agents
- External applications

The API should continue working independently of the GUI.

==================================================
22. FINAL QUALITY CHECK
==================================================

Before stopping, inspect the entire GUI for remaining browser-native:

- prompt()
- alert()
- confirm()

Replace them with the appropriate FIM-native interaction.

Search the project codebase for these calls rather than assuming they are all visible in the current workflow.

Check all major pages.

The final application should feel consistent:

Customer workflow
Business workflow
Product workflow
Service workflow
Invoice workflow
Quotation workflow
Estimate workflow
Receipt workflow
Payment workflow
Import workflow

All should use the same design language.

==================================================
23. DO NOT COMMIT YET
==================================================

Do not commit changes.

Do not finish the current git rebase unless it is absolutely required to continue development.

Continue implementing and testing the application first.

When these UI workflows are complete, stop and provide a concise summary of:

- Files changed
- Features implemented
- Browser-native interactions removed
- Remaining issues
- Tests performed

Do not create a git commit yet.