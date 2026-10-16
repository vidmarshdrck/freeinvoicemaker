import { money } from "@/components/money";
import type { ReactNode } from "react";
import {
  DOC_LABEL,
  longDate,
  totals,
  type Business,
  type Doc,
} from "@/lib/invoice-store";

export function Paper({ doc, business }: { doc: Doc; business: Business }) {
  const figures = totals(doc);
  const dueLabel =
    doc.type === "quotation" || doc.type === "estimate" ? "Valid until" : "Due";

  return (
    <article className="paper w-full max-w-3xl rounded-lg px-8 py-10 shadow-2xl" data-template={doc.template}>
      <header className="mb-8">
        {doc.template === "signal" ? (
          <div className="paper-banner -mx-8 -mt-10 mb-6 flex items-start justify-between gap-4 rounded-t-lg px-8 py-6">
            <p className="font-display text-2xl font-semibold">{business.name || "Your business"}</p>
            <div className="text-right">
              <p className="font-display text-xl font-semibold tracking-wide">
                {DOC_LABEL[doc.type].toUpperCase()}
              </p>
              <p className="mt-1 text-sm">{doc.number}</p>
            </div>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-6 border-b border-rule pb-6">
          <div className="min-w-0">
            {business.logo && /^data:image\/(png|jpeg|webp);base64,/.test(business.logo) ? <img src={business.logo} alt="Business logo" className="mb-3 h-14 max-w-36 object-contain" /> : null}
            {doc.template === "signal" ? null : <p className="font-display text-2xl font-semibold">{business.name || "Your business"}</p>}
          </div>
          <div className="text-right">
            {doc.template === "signal" ? null : (
              <>
                <p className="font-display text-xl font-semibold tracking-wide">
                  {DOC_LABEL[doc.type].toUpperCase()}
                </p>
                <p className="mt-1 text-sm">{doc.number}</p>
              </>
            )}
            <p className="mt-3 text-sm text-ink-soft">Issued {longDate(doc.issueDate)}</p>
            {doc.type !== "receipt" ? (
              <p className="text-sm text-ink-soft">
                {dueLabel} {longDate(doc.dueDate)}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="billing-addresses mb-8 grid grid-cols-2 items-start gap-4">
        <section aria-label="Billed by" className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-xs font-semibold tracking-wide text-ink-soft">BILLED BY</p>
          <p className="mt-1 font-medium">{business.name || "Your business"}</p>
          {business.legalName && business.legalName !== business.name ? <p className="text-sm">{business.legalName}</p> : null}
          {business.address ? <p className="text-sm">{business.address}</p> : null}
          {business.cityLine ? <p className="text-sm">{business.cityLine}</p> : null}
          {business.email ? <p className="text-sm">{business.email}</p> : null}
          {business.phone ? <p className="text-sm">{business.phone}</p> : null}
          {business.website ? <p className="text-sm">{business.website}</p> : null}
          {business.taxNumber ? <p className="text-sm">Tax {business.taxNumber}</p> : null}
        </section>
        <section aria-label="Bill to" className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-xs font-semibold tracking-wide text-ink-soft">BILL TO</p>
          <p className="mt-1 font-medium">{doc.billTo.name || "Client"}</p>
          {doc.billTo.address ? <p className="text-sm">{doc.billTo.address}</p> : null}
          {doc.billTo.cityLine ? <p className="text-sm">{doc.billTo.cityLine}</p> : null}
          {doc.billTo.email ? <p className="text-sm">{doc.billTo.email}</p> : null}
          {doc.billTo.phone ? <p className="text-sm">{doc.billTo.phone}</p> : null}
        </section>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-ink-soft">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-rule">
              <td data-label="Item" className="py-3 pr-3 align-top font-medium">{line.name}</td>
              <td data-label="Description" className="py-3 pr-3 align-top text-ink-soft">{line.description}</td>
              <td data-label="Qty" className="py-3 text-right align-top tabular-nums">{line.qty}</td>
              <td data-label="Rate" className="py-3 text-right align-top tabular-nums">
                {money(line.rate, business.currency)}
              </td>
              <td data-label="Amount" className="py-3 text-right align-top tabular-nums">
                {money(line.qty * line.rate, business.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-64 text-sm">
        <Row label="Subtotal" value={money(figures.subtotal, business.currency)} />
        <Row
          label={`Tax (${doc.taxRate}%)`}
          value={money(figures.tax, business.currency)}
        />
        <p className="mt-2 flex items-baseline justify-between border-t border-rule pt-2 font-display text-lg font-semibold">
          <span>Total</span>
          <span className={doc.template === "paper" ? "" : "text-primary-strong"}>
            {money(figures.total, business.currency)}
          </span>
        </p>
        {doc.payments.length > 0 ? (
          <>
            <Row label="Paid" value={money(figures.paid, business.currency)} />
            <Row label="Balance" value={money(figures.balance, business.currency)} />
          </>
        ) : null}
      </div>

      {doc.notes ? (
        <section className="mt-8 border-t border-rule pt-4">
          <p className="text-xs font-semibold tracking-wide text-ink-soft">NOTES</p>
          <p className="mt-1 text-sm">{doc.notes}</p>
        </section>
      ) : null}

      {business.paymentInfo ? (
        <section className="mt-4">
          <p className="text-xs font-semibold tracking-wide text-ink-soft">PAYMENT</p>
          <p className="mt-1 text-sm">{business.paymentInfo}</p>
        </section>
      ) : null}

      <p className="mt-10 text-xs text-ink-soft">
        Prepared locally with Free Invoice Maker. This file was not uploaded anywhere.
      </p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="flex justify-between py-0.5 text-ink-soft">
      <span>{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </p>
  );
}
