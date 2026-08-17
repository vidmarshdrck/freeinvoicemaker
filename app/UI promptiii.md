
Continue development from the current implementation.

Do NOT commit anything yet.

The Customer, Business, and Product/Service workflows now use the correct FIM-native modal, confirmation, and toast interaction pattern.

The next task is to finish applying that same pattern across the ENTIRE application.

==================================================
1. SEARCH THE ENTIRE FRONTEND
==================================================

Before making changes, search the entire frontend codebase for:

prompt(
alert(
confirm(

Also search for equivalent browser-native dialog implementations.

Identify every remaining occurrence.

Do not assume the previously identified locations are the only ones.

Create a complete list internally, then replace them systematically.

==================================================
2. DOCUMENT ACTIONS
==================================================

Replace browser-native dialogs for document operations.

This includes, where applicable:

- Delete Invoice
- Delete Quotation
- Delete Estimate
- Delete Receipt
- Convert Quotation → Invoice
- Convert Estimate → Invoice
- Duplicate Document
- Cancel Document
- Mark as Paid
- Send/Share Document
- Generate PDF

Use FIM-native modals and confirmation dialogs.

For destructive actions:

showConfirm()

For successful actions:

FIM toast notification.

Example:

Delete Invoice?

Are you sure you want to delete INV-0001?

[Cancel] [Delete Invoice]

Do not use window.confirm().

==================================================
3. DOCUMENT CONVERSION
==================================================

If the application supports converting:

Quotation → Invoice
Estimate → Invoice

do not use browser prompts.

Use a proper confirmation modal.

Example:

Convert Quotation

Convert this quotation into an invoice?

Customer:
John Banda

Quotation:
QT-00024

[Cancel] [Convert to Invoice]

After successful conversion:

- Close modal
- Show success toast
- Refresh relevant document lists
- Show the newly created invoice
- Update dashboard statistics

==================================================
4. PAYMENT WORKFLOWS
==================================================

Replace browser dialogs used for:

- Record Payment
- Delete Payment
- Edit Payment
- Confirm Payment
- Mark Invoice Paid

Use proper FIM forms/modals.

Record Payment should contain fields such as:

Customer
Invoice
Payment Amount
Payment Date
Payment Method
Payment Reference
Notes

Buttons:

[Cancel] [Record Payment]

After saving:

- Update payment record
- Update invoice status
- Update paid amount
- Update outstanding amount
- Refresh invoice
- Refresh payment list
- Refresh dashboard
- Show success toast

==================================================
5. API KEY MANAGEMENT
==================================================

Replace browser-native confirmation for:

- Revoke API Key
- Delete API Key

Use showConfirm().

Example:

Revoke API Key?

Hermes Agent

This will prevent the application using this key from accessing FIM.

[Cancel] [Revoke Key]

After successful revocation:

- Update API key table
- Show success toast

When creating an API key, use an application-native modal.

Show the generated API key clearly.

Explain that the complete key should be copied immediately if it will only be displayed once.

==================================================
6. BACKUP AND RESTORE
==================================================

Replace browser-native dialogs for:

- Backup
- Restore
- Delete Backup
- Import Backup

Use FIM-native interfaces.

For restore operations, use a strong confirmation modal.

Example:

Restore Backup?

Restoring this backup may replace current FIM data.

Current database:
fim.db

Backup:
fim-backup-2026-08-17.db

[Cancel] [Restore Backup]

If the application supports it, automatically create a safety backup before restoring.

Show progress where appropriate.

Do not use browser confirm().

==================================================
7. FILE UPLOADS
==================================================

Review file upload workflows.

Especially:

- Business logo
- Signature
- Stamp
- Customer CSV
- Customer Excel
- Backup files

Do not use browser prompts.

Use proper application file inputs.

Clearly show:

Selected file
File type
File size
Validation status

For unsupported files, show an FIM error notification.

==================================================
8. BUSINESS LOGO / SIGNATURE / STAMP
==================================================

The Business Profile workflow currently supports the fields but verify whether uploaded files are actually being submitted.

If file upload is not currently implemented:

Implement it using the appropriate FormData/multipart request supported by the backend.

Do not break existing business creation/edit functionality.

Support:

Logo
Signature
Stamp

After upload:

- Save the file
- Associate it with the correct business
- Display it in the UI
- Use it when generating documents where applicable

Do not store unnecessary base64 data in the database if the existing architecture supports filesystem storage.

==================================================
9. SAVE BUTTON STATES
==================================================

Improve all forms.

When the user clicks Save:

Disable the Save button while the API request is running.

Show a loading state.

Example:

Saving...

or:

[spinner] Saving Customer

Prevent double submissions.

After success:

- Re-enable button
- Close modal
- Show toast
- Refresh relevant data

After error:

- Re-enable button
- Preserve the user's entered data
- Show useful error message

==================================================
10. GENERIC MODAL SYSTEM
==================================================

Reuse existing modal infrastructure wherever possible.

Do not create a completely separate modal implementation for every page.

Create reusable patterns for:

- Create
- Edit
- View
- Confirm
- File import
- File upload
- Important warnings

The existing Customer modal and showConfirm() should serve as the reference implementation.

==================================================
11. GENERIC TOAST SYSTEM
==================================================

Use the same toast notification system everywhere.

Examples:

Invoice deleted successfully.

Quotation converted to invoice.

Payment recorded successfully.

API key revoked.

Backup restored successfully.

Unable to generate PDF.

File format not supported.

Do not use alert().

==================================================
12. API ERRORS
==================================================

Normal GUI users should not see raw API authentication messages such as:

"Authentication required"
"Provide an API key or Bearer token"

unless they are specifically using the developer/API interface.

The normal frontend should handle its own authentication/session mechanism.

External API clients must continue using:

API Key
Bearer authentication where appropriate

Do not mix the two workflows.

==================================================
13. DELETE BEHAVIOR
==================================================

Every destructive operation should follow this pattern:

User clicks Delete
↓
FIM confirmation modal
↓
User confirms
↓
API request
↓
Button enters loading state
↓
Backend confirms deletion
↓
Table/list refreshes
↓
Modal closes
↓
Success toast

If deletion fails:

Keep the existing record visible.

Show a useful error message.

Do not silently fail.

==================================================
14. VIEW / EDIT CONSISTENCY
==================================================

Where a record supports:

View
Edit
Delete

maintain the same pattern used for Customers and Products.

View:

Read-only.

Edit:

Editable fields.

Delete:

Confirmation.

Avoid duplicate UI implementations where possible.

==================================================
15. RESPONSIVE BEHAVIOR
==================================================

Verify that modals work correctly on:

- Desktop
- Laptop
- Tablet
- Mobile browser

Large forms should scroll inside the modal/page rather than causing the entire interface to become unusable.

Buttons should remain accessible.

==================================================
16. NO BROWSER-NATIVE DIALOGS
==================================================

After implementation, search the project again.

There should be no application workflow relying on:

window.prompt()
window.alert()
window.confirm()

unless there is a very specific technical reason that cannot reasonably be replaced.

The normal FIM interface must use:

FIM modals
FIM forms
FIM confirmation dialogs
FIM toast notifications

==================================================
17. DO NOT CHANGE THE EXISTING VISUAL LANGUAGE
==================================================

Keep the existing FIM visual design.

Do not redesign the dashboard.

Do not introduce a new color system.

Continue using the established:

- Blue/indigo branding
- Cards
- Buttons
- Tables
- Modals
- Typography
- Icons
- Spacing
- Toasts

The goal is consistency, not another redesign.

==================================================
18. DATABASE BEHAVIOR
==================================================

Continue using the existing SQLite architecture.

Do not introduce Supabase.

Do not introduce PostgreSQL.

Do not create a separate database per business.

Ensure every operation continues respecting:

business_id

The active business must determine which data is displayed.

==================================================
19. DO NOT BUILD V2 INVENTORY
==================================================

Do not implement:

- Barcode scanning
- Stock management
- Stock movements
- Expiry tracking
- Batch management
- Reorder alerts

Those belong to FIM V2.

Only make minor architectural adjustments if necessary to keep V2 possible later.

==================================================
20. DO NOT BUILD V3 CLOUD
==================================================

Do not implement:

- Cloud synchronization
- Cloud storage
- Mobile application
- Automatic cloud backups
- Hosted infrastructure

Those belong to FIM V3.

Local backup functionality can remain.

==================================================
21. TEST THE APPLICATION
==================================================

After implementation, run the application.

Test:

1. Add Customer
2. Edit Customer
3. View Customer
4. Delete Customer

5. Add Business
6. Edit Business
7. View Business
8. Delete Business where supported
9. Switch Business

10. Add Product
11. Edit Product
12. View Product
13. Delete Product

14. Add Service
15. Edit Service
16. View Service
17. Delete Service

18. Create Invoice
19. Delete Invoice
20. Preview Invoice
21. Generate Invoice PDF

22. Create Quotation
23. Convert Quotation to Invoice
24. Delete Quotation

25. Create Estimate
26. Convert Estimate if supported
27. Delete Estimate

28. Create Receipt
29. Delete Receipt

30. Record Payment
31. Update invoice payment status

32. Create API Key
33. Revoke API Key

34. Backup
35. Restore Backup

36. Import CSV
37. Import Excel

Verify:

- No browser prompts
- No browser alerts
- No browser confirms
- No unnecessary page reloads
- Tables refresh after changes
- Toasts appear
- Loading states work
- Data persists after restarting the application

==================================================
22. FINAL CODEBASE SEARCH
==================================================

After all changes are complete, search again for:

prompt(
alert(
confirm(

Report any remaining occurrences.

If any are legitimate and intentionally retained, explain why.

==================================================
23. DO NOT COMMIT
==================================================

Do not commit.

Do not push to GitHub.

Do not finish unrelated git operations unless required to run/test the application.

Continue working until the remaining browser-native interaction problems have been addressed.

At the end, provide a concise summary containing:

- Files changed
- Dialogs replaced
- Workflows completed
- File upload status
- Testing performed
- Any remaining issues
- Remaining prompt/alert/confirm occurrences

Then stop.