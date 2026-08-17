# Free Invoice Maker
## Premium Human-Facing UI and UX

The **Free Invoice Maker** project has been initialized and the application is running locally.

The API documentation is currently accessible through:

```text id="k1u8zq"
http://localhost:8000/api/docs
```

The available API documentation indicates that the application already has or is being developed around functionality such as:

- Health
- Authentication
- Businesses
- Customers
- Products and Services
- Invoices
- Quotations
- Estimates
- Receipts
- Other business-document functionality

The current interface available through `/api/docs` is useful as a **developer/API interface**, but it is not intended to be the primary interface for normal users.

The application now needs a **complete, polished, human-facing graphical interface**.

The goal is to turn Free Invoice Maker into a professional invoicing application that an ordinary business owner can open, understand, and use without knowing anything about APIs, programming, HTTP, JSON, Swagger, or AI agents.

The API should remain available for developers and AI agents.

The normal application should have its own modern UI.

---

# 1. PRODUCT GOAL

Build the human-facing interface for:

**Free Invoice Maker**

The application should allow a normal human being to:

- Create and manage businesses
- Switch between businesses
- Add customers
- Add products
- Add services
- Create invoices
- Create quotations
- Create estimates
- Create receipts
- Record payments
- Track paid invoices
- Track unpaid invoices
- Track overdue invoices
- See upcoming payment deadlines
- Generate professional PDFs
- Download PDFs
- Print documents
- Customize business branding
- Add logos
- Add signatures
- Add stamps
- Manage templates
- Manage payment information
- Manage API keys
- Back up data

The user should not need an AI agent to do any of this.

**AI agents are an additional capability through the API.**

---

# 2. TWO INTERFACES

Free Invoice Maker should ultimately have two distinct interfaces.

### Human interface

```text id="8e7y1u"
http://localhost:8000/
```

This should open the actual Free Invoice Maker application.

### Developer/API interface

```text id="4ys7eu"
http://localhost:8000/api/docs
```

This should remain available for:

- Developers
- Hermes Agent
- n8n
- Python scripts
- Other AI agents
- External applications

Do not replace the API documentation.

Simply make the normal root application a proper business application rather than a developer API console.

---

# 3. OVERALL UX DIRECTION

The UI should feel comparable to modern premium invoicing and business-management software.

Use products such as **Refrens** as a general feature and UX benchmark.

Do not copy Refrens' design, branding, code, assets, or exact templates.

Instead, take inspiration from the general quality level of established products.

The application should feel:

- Premium
- Professional
- Clean
- Modern
- Fast
- Simple
- Trustworthy
- Business-oriented

It should **not** feel like:

- Swagger
- A developer console
- A raw database interface
- A basic CRUD application
- A generic admin dashboard
- An unfinished prototype

---

# 4. BRAND DIRECTION

Use a professional **blue-first** visual identity.

The preferred direction is:

- Blue as the primary brand color
- Indigo/blue-purple as a secondary accent where appropriate
- White surfaces
- Very light neutral backgrounds
- Dark navy/charcoal text
- Cool gray secondary text

Use color intelligently.

Do not make every element blue.

Use the primary color for:

- Primary actions
- Active navigation
- Links
- Important highlights
- Selected states
- Brand elements

Use subtle indigo/purple accents where they improve the visual hierarchy.

Avoid:

- Neon colors
- Excessive gradients
- Excessive shadows
- Excessive animations
- Unnecessary visual effects

The product should feel premium because of **good design**, not because of decoration.

---

# 5. APPLICATION SHELL

The application should have a modern desktop application layout.

Use:

```text id="3s8p7k"
┌────────────────────────────────────────────────────────────┐
│ Top Bar                                                    │
├────────────────┬───────────────────────────────────────────┤
│                │                                           │
│   Sidebar      │            Main Application               │
│                │                                           │
│                │                                           │
└────────────────┴───────────────────────────────────────────┘
```

The sidebar should be collapsible.

On desktop:

- Sidebar can remain visible.

On mobile:

- Sidebar becomes a navigation drawer.

---

# 6. TOP-LEFT MENU

The application should have a clean menu/hamburger control in the upper-left area.

The navigation should never feel overwhelming.

The sidebar should contain logical groups.

Suggested structure:

```text id="f8cs8y"
Dashboard

CREATE
  Invoice
  Quotation
  Estimate
  Receipt

MANAGE
  Customers
  Products
  Services

DOCUMENTS
  Invoices
  Quotations
  Estimates
  Receipts
  Payments

BUSINESS
  Business Profile
  Templates
  Settings

SYSTEM
  API Keys
  Backups
```

You may improve the exact organization if there is a better UX solution.

---

# 7. BUSINESS SWITCHER

The **first major element in the sidebar should be the active business/entity selector.**

A user may have several businesses.

For example:

```text id="r7c0n9"
┌────────────────────────────┐
│ [Logo]                     │
│ Vidmar AI              ▼   │
│ Business                   │
└────────────────────────────┘
```

Clicking it should open a business-selection menu.

Example:

```text id="n3v1kh"
Your Businesses

✓ Vidmar AI

  Vidmar Entertainment

  Example Construction Ltd

────────────────────

+ Add New Business

Manage Businesses
```

The user should be able to:

- Select an existing business
- Add a new business
- Manage businesses

---

# 8. BUSINESS ISOLATION

Every business should have its own:

- Customers
- Products
- Services
- Invoices
- Quotations
- Estimates
- Receipts
- Payments
- Branding
- Templates
- Document numbering
- Business information

Switching businesses must update the application context.

A user must never accidentally see Business A's invoices while viewing Business B.

The currently selected business must always be obvious.

---

# 9. DASHBOARD AS THE HOME SCREEN

When the user opens:

```text id="b5uvnz"
http://localhost:8000/
```

the first screen should be:

**Dashboard**

Not Swagger.

Not a raw API endpoint.

Not a blank page.

Not a list of database entities.

The dashboard should give the business owner a quick understanding of what is happening.

---

# 10. DASHBOARD HEADER

Use a structure similar to:

```text id="0jtb1m"
Dashboard

Good morning, Shadrick
Here's what's happening with your business today.

[+ Create Invoice]
```

The greeting should be dynamic based on the time of day.

The active business should be clearly identified.

---

# 11. DASHBOARD SUMMARY CARDS

The dashboard should contain useful summary cards.

For example:

```text id="u8cx8f"
Total Invoiced
K24,500

Paid
K18,200

Outstanding
K6,300

Overdue
K2,100
```

These values must come from actual application data.

Do not use fake statistics once the backend is available.

For a new business, show:

```text id="w9k11g"
K0
```

rather than fake information.

---

# 12. DOCUMENT STATISTICS

Show useful document counts.

For example:

```text id="p1n9x5"
Invoices
24

Quotations
12

Estimates
7

Receipts
31
```

The purpose is to let the user understand activity at a glance.

---

# 13. PAYMENT OVERVIEW

Provide a clear payment overview.

For example:

```text id="l7s8d0"
Payment Overview

Paid
K18,200

Outstanding
K6,300

Overdue
K2,100
```

A small visual chart may be used if it genuinely improves understanding.

Do not add charts merely to make the dashboard look complicated.

---

# 14. OVERDUE INVOICES

The dashboard should clearly show customers who have not paid by the deadline.

Example:

```text id="7y2j7w"
Overdue Invoices

Invoice       Customer       Due Date       Amount

INV-0042      John Banda     Aug 10         K1,500
INV-0038      ABC Ltd        Aug 12         K4,200
```

Include:

```text id="x9b8u0y"
View All Overdue
```

---

# 15. UPCOMING DEADLINES

Show invoices that are approaching their payment deadline.

Example:

```text id="z4e9m2"
Due Soon

INV-0045
Sarah Ltd
Due in 2 days
K2,500

INV-0046
John Banda
Due in 5 days
K1,200
```

Allow the dashboard to surface:

- Due today
- Due this week
- Overdue

---

# 16. RECENT ACTIVITY

Show recent activity.

Examples:

```text id="k0l4cb"
Recent Activity

Invoice INV-0045 created
2 hours ago

Payment received for INV-0042
Yesterday

Quotation QUO-0021 accepted
Yesterday

Receipt REC-0018 generated
2 days ago
```

Use real application events where possible.

---

# 17. QUICK ACTIONS

Make the most common actions immediately accessible.

Example:

```text id="d9d5te"
Quick Actions

[ + Invoice ]
[ + Quotation ]
[ + Estimate ]
[ + Receipt ]
[ + Customer ]
[ + Product ]
```

The main primary action should be:

**Create Invoice**

---

# 18. EMPTY DASHBOARD

When a business has no data, the dashboard should still look intentional.

Example:

```text id="d5b2xj"
Welcome to Free Invoice Maker

Your business doesn't have any documents yet.

Create your first invoice to get started.

[Create Invoice]
```

Statistics should show:

```text id="p9a3z2"
Total Invoiced     K0
Paid               K0
Outstanding        K0
Overdue            0
```

Do not leave huge empty white spaces with nothing explaining what the user should do next.

---

# 19. CREATE INVOICE EXPERIENCE

Creating an invoice should feel like using professional invoicing software.

Do not present one giant unstructured form.

Break it into logical sections.

Example:

```text id="r1n2c5"
Create Invoice

Customer
────────────────────────
[ Select Customer ]

Invoice Details
────────────────────────
Invoice Number
Issue Date
Due Date
Currency

Items
────────────────────────

Item              Qty     Price      Tax       Total

Website Design     1      K2,500      0%       K2,500

[ + Add Item ]

Subtotal                              K2,500
Discount                                 K0
Tax                                      K0
────────────────────────────────────────────
Total                                 K2,500

Payment Information

Notes

Terms & Conditions

Signature

[Save Draft] [Preview] [Create Invoice]
```

---

# 20. LIVE DOCUMENT PREVIEW

Where practical, show the invoice preview alongside the creation form.

Desktop:

```text id="6z6v73"
┌────────────────────┬────────────────────────┐
│ Invoice Form       │ Document Preview       │
│                    │                        │
│ Customer           │       LOGO             │
│ Invoice Details    │                        │
│ Items              │       INVOICE          │
│ Payment             │                        │
│ Notes              │       Items            │
│ Terms              │       Totals           │
│                    │       Signature        │
└────────────────────┴────────────────────────┘
```

The preview should closely represent the final PDF.

---

# 21. DOCUMENT TYPES

The UI should make the supported documents obvious.

Users should be able to create:

- Invoice
- Quotation
- Estimate
- Receipt

Later functionality may include additional business documents.

---

# 22. DOCUMENT MANAGEMENT

Each document type should have a clean management page.

For example:

```text id="9v4s1q"
Invoices

[Search invoices...]

[+ Create Invoice]

Invoice     Customer       Date       Due       Amount      Status

INV-0042    John Banda     Aug 10     Aug 24     K1,500     Paid
INV-0043    Sarah Ltd      Aug 12     Aug 26     K2,500     Pending
INV-0044    ABC Ltd        Aug 13     Aug 20     K4,200     Overdue
```

Provide:

- Search
- Filters
- Sorting
- Status
- Date filtering
- View
- Edit
- Duplicate
- Delete where appropriate
- PDF
- Print

---

# 23. CUSTOMER MANAGEMENT

Create a dedicated customer section.

Example:

```text id="j7e5p8"
Customers

[Search customers...]

[+ Add Customer]

Name          Company       Email              Phone

John Banda    —             john@email.com     ...
Sarah Ltd     Sarah Ltd     info@sarah.com     ...
```

Support:

- Search
- Add
- Edit
- Delete
- View
- Document history

---

# 24. CUSTOMER PROFILE

A customer profile should provide useful business information.

Example:

```text id="q8p5e1"
John Banda

john@example.com
+260...

Customer Summary

Total Invoiced       K8,500
Total Paid           K6,500
Outstanding          K2,000

Documents

Invoices
Quotations
Receipts

Recent Activity
```

---

# 25. PRODUCTS AND SERVICES

Provide a dedicated Products & Services section.

Allow the user to add:

- Products
- Services

Example:

```text id="v7x1p0"
Products & Services

[Search...]

[+ Add Product]
[+ Add Service]

Website Hosting     Service     K500
Laptop              Product     K8,500
Consultation        Service     K300
```

These should be reusable when creating documents.

---

# 26. RECEIPT EXPERIENCE

Creating a receipt should be simple.

Allow:

- Customer
- Related invoice
- Payment amount
- Payment method
- Payment date
- Payment reference
- Notes

Then:

```text id="6t3e2z"
[Preview]
[Generate Receipt]
[Download PDF]
[Print]
```

---

# 27. PAYMENT TRACKING

The application should allow users to record payments against invoices.

The dashboard should then calculate:

- Paid
- Partially paid
- Outstanding
- Overdue

The user should be able to see which invoices have been paid and which have not.

---

# 28. QUOTATIONS

Quotations should have their own section.

Support:

- Create
- Edit
- Preview
- PDF
- Duplicate
- Delete
- Mark accepted
- Mark rejected
- Convert to invoice

The **Convert to Invoice** action should be prominent.

---

# 29. ESTIMATES

Estimates should use the same visual language as quotations and invoices.

The user should not feel like every document type comes from a completely different application.

---

# 30. BUSINESS PROFILE

Create a proper business profile/settings page.

Allow users to enter:

- Business name
- Trading name
- Logo
- Address
- Phone
- Email
- Website
- Registration number
- Tax/VAT number
- Country
- Currency
- Bank details
- Mobile money details
- Payment instructions
- Default terms
- Default notes

---

# 31. LOGO

Allow users to upload a company logo.

Support common formats such as:

- PNG
- JPG/JPEG
- WebP

Show a preview.

Allow:

```text id="1r5u0z"
Replace Logo
Remove Logo
```

The logo should appear on generated documents.

---

# 32. SIGNATURE

Provide two options:

```text id="8u4w0r"
Upload Signature

or

Draw Signature
```

The drawing interface should work with:

- Mouse
- Touch
- Stylus

Provide:

```text id="8u8n3q"
Clear
Save Signature
```

---

# 33. COMPANY STAMP

Allow the user to upload a company stamp.

Show a preview.

Allow replacing/removing it.

Allow the stamp to appear on supported documents.

---

# 34. PAYMENT DETAILS

Allow business owners to configure:

- Bank
- Account name
- Account number
- Branch
- SWIFT/BIC
- Mobile money
- Other payment instructions

Allow these details to appear on generated documents.

---

# 35. TERMS AND CONDITIONS

Allow reusable business terms.

Example:

```text id="y0d7w6"
Payment is due within 14 days.
Please quote the invoice number when making payment.
```

Allow document-specific overrides.

---

# 36. COVER LETTER

Support an optional cover letter/introduction for quotations and appropriate documents.

Example:

```text id="0q8z8x"
Dear John,

Thank you for giving us the opportunity to provide this quotation.

Please find our proposed pricing below.
```

Allow the user to:

- Enable/disable it
- Set a heading
- Write custom text
- Save a default cover letter

---

# 37. TEMPLATES

Provide several professional document templates.

At minimum:

```text id="0u3x7e"
Classic
Modern
Minimal
```

The template selection screen should show visual previews.

Do not make template selection just a plain dropdown.

---

# 38. BRAND CUSTOMIZATION

Allow basic document branding:

- Primary color
- Secondary color
- Logo position
- Font
- Footer
- Signature
- Stamp

Keep customization simple enough that an ordinary user can understand it.

Do not build a complex drag-and-drop design editor for version 1.

---

# 39. API KEY MANAGEMENT

Create a proper API key page.

Explain:

> API keys allow AI agents, automation tools and external applications to interact with Free Invoice Maker.

Allow:

- Create key
- Name key
- Set permissions
- Revoke key
- Delete key
- See creation date
- See last-used date

Example:

```text id="x2x8l7"
API Keys

Hermes Agent
Created Aug 16
Last used Just now

n8n
Created Aug 15
Last used Yesterday

[+ Create API Key]
```

When a key is created, show it once with a copy button.

---

# 40. BACKUPS

Create a simple backup interface.

Allow:

```text id="0x4p9r"
[Create Backup]
[Restore Backup]
```

Show previous backups.

Make it clear that the user's business data belongs to them.

---

# 41. SETTINGS

Organize settings into categories.

Suggested:

```text id="m4p7p2"
Business
Documents
Templates
Tax
Currency
Payment Details
Signature
Stamp
Security
API Keys
Backups
```

Do not place every setting on one giant page.

---

# 42. RESPONSIVE DESIGN

The UI must work on:

- Desktop
- Laptop
- Tablet
- Mobile browser

On mobile:

- Sidebar becomes a drawer
- Forms become single-column
- Tables become responsive
- Buttons remain usable
- Document previews remain accessible

Do not simply shrink the desktop layout.

---

# 43. ACCESSIBILITY

Use:

- Semantic HTML
- Proper labels
- Keyboard navigation
- Focus states
- Accessible buttons
- Good contrast
- Accessible forms

---

# 44. LOADING STATES

API operations should provide clear feedback.

For example:

```text id="5r0x3x"
Generating PDF...
```

Prevent duplicate submissions.

---

# 45. ERROR STATES

Normal users should receive useful messages.

For example:

```text id="c4z9zy"
Unable to generate invoice

Something went wrong while creating the document.

[Try Again]
```

Do not display raw stack traces to users.

---

# 46. FIRST-RUN EXPERIENCE

If the user has no business configured, show a simple setup screen.

Example:

```text id="v0h4l4"
Welcome to Free Invoice Maker

Let's create your first business.

Business Name
[________________]

Email
[________________]

Phone
[________________]

Country
[________________]

Currency
[ ZMW ▼ ]

[Create Business]
```

After creation:

```text id="4a4f7n"
Your business is ready.

[Go to Dashboard]
```

Do not create a ridiculous 20-step onboarding process.

---

# 47. EMPTY STATES

Every major section should have a meaningful empty state.

Customers:

```text id="6p0k3q"
No customers yet.

Add your first customer to start creating invoices.

[+ Add Customer]
```

Invoices:

```text id="k7v5a0"
No invoices yet.

Create your first invoice.

[+ Create Invoice]
```

Products:

```text id="q4c5y1"
No products or services yet.

Add the things you commonly sell.

[+ Add Product]
[+ Add Service]
```

---

# 48. VISUAL CONSISTENCY

Use one consistent design system throughout the application.

Maintain consistency in:

- Buttons
- Cards
- Forms
- Tables
- Typography
- Icons
- Spacing
- Colors
- Status badges
- Modals
- Notifications

Do not design each page independently.

The entire application should feel like one product.

---

# 49. PREMIUM QUALITY BAR

The finished interface should be good enough that a business owner could reasonably compare it with paid invoicing software and say:

> "This looks like a real product."

Use established invoicing software such as Refrens as a **quality benchmark**, particularly for:

- Business profiles
- Multiple businesses
- Customers
- Products/services
- Invoices
- Quotations
- Estimates
- Receipts
- Branding
- Signatures
- Templates
- Payment tracking
- PDF generation

Do not attempt to implement every premium feature from Refrens.

Focus on excellent execution of the core functionality.

---

# 50. DO NOT BREAK THE BACKEND

The existing project may already contain important backend functionality.

Before making major changes:

1. Inspect the project structure.
2. Identify existing routes.
3. Identify database models.
4. Identify authentication.
5. Identify document generation.
6. Identify available API endpoints.
7. Identify existing frontend components.

Reuse working functionality wherever possible.

Do not rewrite working backend systems simply to change the appearance.

If the UI requires an API endpoint that does not exist, implement it cleanly.

---

# 51. DO NOT BUILD A STATIC MOCKUP

This must be a functional application.

For example:

The business switcher must actually switch businesses.

The dashboard must use real data.

The customer list must use real customer data.

The invoice form must create real invoices.

The PDF button must generate real PDFs.

The payment system must update invoice payment status.

The dashboard must reflect those changes.

The API must continue functioning independently.

---

# 52. UI TESTING

After implementation, test the complete human workflow:

```text id="5k5v8c"
Open application
↓
Create business
↓
Upload logo
↓
Add signature
↓
Add stamp
↓
Add customer
↓
Add product/service
↓
Create quotation
↓
Preview quotation
↓
Generate quotation PDF
↓
Convert quotation to invoice
↓
Generate invoice PDF
↓
Record payment
↓
Create receipt
↓
Generate receipt PDF
↓
Return to dashboard
↓
Verify statistics
↓
Verify payment status
↓
Verify customer history
```

Also test:

```text id="n2z3r4"
Create second business
↓
Switch business
↓
Verify data isolation
↓
Return to first business
↓
Verify original data
```

---

# 53. API MUST REMAIN AVAILABLE

Keep:

```text id="s6x7x4"
http://localhost:8000/api/docs
```

working.

The API remains the machine interface for:

- Hermes Agent
- n8n
- Other AI agents
- External software
- Developers

The GUI is the human interface.

Both should operate against the same underlying application.

---

# 54. FINAL PRODUCT ARCHITECTURE

The finished application should conceptually look like:

```text id="1x9g8r"
                     FREE INVOICE MAKER
                             │
             ┌───────────────┴────────────────┐
             │                                │
       HUMAN INTERFACE                   API INTERFACE
             │                                │
        Dashboard                         REST API
        Businesses                       API Keys
        Customers                         OpenAPI
        Invoices                             │
        Quotations                           │
        Receipts                             │
        Settings                             │
             │                                │
             └───────────────┬────────────────┘
                             │
                       Application Core
                             │
                 ┌───────────┼───────────┐
                 │           │           │
              Database    Documents    PDF Engine
```

A human can use the application without AI.

An AI agent can use the application without the GUI.

Both use the same underlying system.

---

# 55. IMPLEMENTATION INSTRUCTION

Now implement this UI direction in the existing Free Invoice Maker project.

First inspect the current project and determine what functionality is already available.

Then build the human-facing application around it.

Do not merely create a visual mockup.

Do not merely create placeholder cards.

Connect the UI to the actual backend functionality.

Run the application locally.

Test the major workflows.

Fix functional issues.

Fix visual issues.

Make the dashboard the default home screen.

Make the sidebar the primary navigation.

Make the business switcher prominent.

Make invoice creation straightforward.

Make document management intuitive.

Make the entire application responsive.

Keep `/api/docs` available for developers and AI agents.

The finished product should feel like a **real, polished invoicing application**, not a developer API page wearing a few buttons.

The standard to aim for is:

**Simple enough for an ordinary small-business owner.**

**Powerful enough for an AI agent.**

**Professional enough to compete visually with paid invoicing software.**

**Open source and self-hostable by design.**