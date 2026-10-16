# Grok UI isolated preview

Selectively imported original Grok components and design tokens. Existing FastAPI application in ../../app is untouched. The TanStack/Grok auth, server and generated scaffold are deliberately not imported: these components are browser-local Zustand and have no backend dependency.

Run `npm ci --ignore-scripts`, `npm run dev`; build `npm run build`. Public base path `/freeinvoicemaker/grok/`. No real customer data; sample workspace only. API keys/cloud controls in the source are demonstrations, not connected services. PDF uses browser Print / Save as PDF, not a server download.
