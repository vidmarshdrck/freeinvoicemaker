import { useMemo, useState } from 'react';
import { useStore, money } from '@/lib/invoice-store';
import { monthRange, summarize } from '@/lib/summary';
export function SummariesView() {
 const documents = useStore(s=>s.documents), business = useStore(s=>s.business), businessId = useStore(s=>s.currentBusinessId);
 const [offset,setOffset] = useState(0); const [range,setRange] = useState(()=>monthRange());
 const valid = !!range.start && !!range.end && range.start <= range.end;
 const groups = useMemo(()=>valid ? summarize(documents,range.start,range.end,businessId,business.currency):[],[documents,range.start,range.end,businessId,business.currency,valid]);
 function move(delta:number) { const next=offset+delta; setOffset(next); setRange(monthRange(next)); }
 return <section className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8" aria-label="Financial summaries">
  <h1 className="font-display text-2xl font-semibold">Summaries</h1><p className="mt-1 text-sm text-muted">{business.name || 'Current business'} · Saved on this device</p>
  <div className="my-5 flex flex-wrap items-end gap-3">
   <button type="button" className="rounded-lg border border-line px-3 py-3" onClick={()=>move(-1)} aria-label="Previous month">←</button>
   <button type="button" className="rounded-lg border border-line px-3 py-3" onClick={()=>{setOffset(0);setRange(monthRange());}}>Current month</button>
   <button type="button" className="rounded-lg border border-line px-3 py-3" onClick={()=>move(1)} aria-label="Next month">→</button>
   <label className="flex flex-col gap-1 text-sm">From<input aria-label="Summary start date" className="rounded-lg border border-line bg-surface p-2" type="date" value={range.start} onChange={e=>setRange({...range,start:e.target.value})}/></label>
   <label className="flex flex-col gap-1 text-sm">To<input aria-label="Summary end date" className="rounded-lg border border-line bg-surface p-2" type="date" value={range.end} onChange={e=>setRange({...range,end:e.target.value})}/></label>
  </div>
  {!valid && <p role="alert">Choose a valid start and end date.</p>}
  <p className="mb-4 text-sm text-muted">Payments use recorded payment dates. Balances include invoices issued on or before the selected end date, less recorded payments through that date. Drafts, voids, estimates and quotations are excluded. Different currencies are never combined.</p>
  {valid && !groups.length && <p className="rounded-xl border border-line bg-surface p-5">No issued invoices or receipts to summarize.</p>}
  {groups.map(g=><div key={g.currency} className="mb-6 rounded-xl border border-line bg-surface p-4">
   <h2 className="mb-3 text-lg font-semibold">{g.currency}</h2>
   <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {([['Payments received',g.collected],['Outstanding at period end',g.outstanding],['Overdue at period end',g.overdue],['Invoiced in period',g.invoiced],['Receipts in period (separate)',g.standaloneReceipts]] as const).map(([label,value])=><div key={label} className="min-w-0 rounded-lg border border-line p-3"><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 break-words text-xl font-semibold tabular-nums">{money(value,g.currency)}</dd></div>)}
   </dl><p className="mt-4 text-sm">{g.invoiceCount} invoices issued · {g.paidCount} fully paid by period end · {g.overdueCount} overdue invoices</p>
   <p className="mt-2 text-xs text-muted">Receipt totals are shown separately and are not added to payments received: receipts may document an existing invoice payment. These figures are not profit.</p>
   {!!(g.missingPaymentDates+g.unverifiedPaid) && <p className="mt-3 text-sm text-warning">Review needed: {g.missingPaymentDates} invalid or undated payment records; {g.unverifiedPaid} invoices marked paid without sufficient dated payments. No payment dates or amounts were invented.</p>}
  </div>)}
 </section>;
}
