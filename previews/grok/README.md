# Grok UI isolated preview

Selectively imported original Grok components and design tokens. Existing FastAPI application in ../../app is untouched. The TanStack/Grok auth, server and generated scaffold are deliberately not imported: these components are browser-local Zustand and have no backend dependency.

Run `npm ci --ignore-scripts`, `npm run dev`; build `npm run build`. Public base path `/freeinvoicemaker/grok/`. No real customer data; sample workspace only. API keys/cloud controls in the source are demonstrations, not connected services. PDF uses browser Print / Save as PDF, not a server download.

## Template inventory and mobile regression checks

The original backend exposes Modern Clean (`modern`), Classic Professional (`classic`), and Minimal Pure (`minimal`) in `app/api/v1/templates.py`. `app/services/pdf_generator.py` renders invoices, quotations, estimates and receipts with ReportLab, including a separate payment receipt renderer. These are backend templates, not imported into this isolated React application.

This UI has its own Ledger, Classic (`paper`) and Signal template choices in `src/lib/invoice-store.ts`, rendered by `src/components/paper.tsx`. No QR generator or QR placeholder was found in these sources or the fetched repository branches/history inspected. This does not establish where any separately created Claude templates live.

Mobile document actions are viewport-fixed, reserve their own scroll space, include safe-area padding, and track visual viewport changes for keyboard avoidance. Desktop header actions are unchanged. Document deletion uses a native modal with explicit Cancel/Delete, initially focused Cancel, Escape/backdrop dismissal and focus restoration. Data remains in this browser; no cloud sync is connected.

Run `npm test -- --workers=2` with the dev server on port 5176, or set `PREVIEW_URL` to test the published site. Regression coverage includes mobile action positions, simulated visual viewport/keyboard changes (not a physical phone keyboard), last-field visibility, save/reload, cancellation without mutation, and selected-only confirmed deletion.
