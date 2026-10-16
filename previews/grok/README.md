# Grok UI isolated preview

Selectively imported original Grok components and design tokens. Existing FastAPI application in ../../app is untouched. The TanStack/Grok auth, server and generated scaffold are deliberately not imported: these components are browser-local Zustand and have no backend dependency.

Run `npm ci --ignore-scripts`, `npm run dev`; build `npm run build`. Public base path `/freeinvoicemaker/grok/`. No real customer data; sample workspace only. API keys/cloud controls in the source are demonstrations, not connected services. PDF uses browser Print / Save as PDF, not a server download.

## Template inventory and mobile regression checks

The original backend exposes Modern Clean (`modern`), Classic Professional (`classic`), and Minimal Pure (`minimal`) in `app/api/v1/templates.py`. `app/services/pdf_generator.py` renders invoices, quotations, estimates and receipts with ReportLab, including a separate payment receipt renderer. These are backend templates, not imported into this isolated React application.

This UI has its own Ledger, Classic (`paper`) and Signal template choices in `src/lib/invoice-store.ts`, rendered by `src/components/paper.tsx`. No QR generator or QR placeholder was found in these sources or the fetched repository branches/history inspected. This does not establish where any separately created Claude templates live.

Document actions (Save, Download PDF and type-aware New) are in normal scroll flow at the very end of the document, after editable Notes / Terms—not fixed or sticky. No reserved viewport action padding or keyboard positioning is used. Type category tabs appear only in the list; an open document cannot be converted by a dropdown. Back to Documents restores the list tabs. Duplicate and an accessible 44px trash button remain in the editor. Deletion uses a native modal with explicit Cancel/Delete, initially focused Cancel, Escape/backdrop dismissal and focus restoration.

## Business profiles and data policy

Settings supports adding and switching businesses without an application-imposed count limit. Documents, clients, catalog, defaults, demonstration API keys, waitlist state and number reservations are isolated per stable business ID. This is logical separation within one browser, not multi-user access control or cloud storage. Browser storage limits still apply. Telephone and tax number are optional free text; a separate optional legal name and a local PNG/JPEG/WebP logo (up to 200 KB) are supported. New profiles have no invented contact, tax or banking details.

The existing `fim-grok-preview-sandbox-v1` storage key now uses persisted schema version 2. Legacy records migrate to the stable `business-default` profile without changing document IDs, types, numbers, notes, amounts or recipient details. The exact original payload is retained at `fim-grok-preview-legacy-backup-v1`, downloadable in Settings and importable through Import backup. Missing optional phone/tax fields become empty strings.

Every document holds its own issuer snapshot (including currency, contact, legal name, logo, tax and payment instructions). Settings edits affect future documents, not existing documents—even drafts. Explicit edits in a document's From section affect that document only. Switching businesses closes the active document. Duplicate stays in the same business/type, copies notes and issuer, creates a distinct ID and next number, and clears payments. Deleted generated numbers remain reserved. Notes may replace the initial terms or be cleared; a saved blank is not repopulated.

Download backup exports only the selected business, with schema/business identity and used-number reservations. Import and sample reset affect only the selected business; other profiles remain intact. Import is an explicit replacement of that selected workspace and retains document issuer snapshots. Keep a downloaded backup per business; browser Save is local persistence, not a downloaded document.

PDF preview/print retains white paper, black base text, restrained Grok-blue accents and rounded line-item table borders. ZMW codes and tabular amounts have explicit spacing and can wrap separately on narrow screens; mobile paper uses labelled line-item rows rather than squeezing five columns. Print uses the full table. The suggested PDF filename includes document type/number, issuer and recipient (sanitized, Unicode-aware and byte-bounded); native print dialogs may still let the user choose another name. JSON backup filenames identify the selected business.

Run `npm test -- --workers=2` with the dev server on port 5176, or set `PREVIEW_URL` to test the published site. Coverage includes profile creation/edit/switch/reload/isolation, migration and recovery, number reservations, correct typed creation/duplication, custom/blank notes, normal-flow bottom actions at 360/390/1440 widths and short viewports, Cancel/Delete focus and mutation behavior, optional identity/logo fields, large ZMW values, JSON download and real browser PDF generation. Browser emulation is not a physical-phone test. Backend/API/MCP implementation is outside this isolated preview.
