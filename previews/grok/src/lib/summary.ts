import { totals, round2, type Doc } from './invoice-store';
export function monthRange(offset = 0, now = new Date()) {
 const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
 const iso = (v: Date) => `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
 return { start: iso(d), end: iso(new Date(d.getFullYear(), d.getMonth()+1, 0)) };
}
export function summarize(documents: Doc[], start: string, end: string, businessId: string, fallbackCurrency: string) {
 const groups: Record<string, { currency: string; collected: number; outstanding: number; overdue: number; invoiced: number; standaloneReceipts: number; invoiceCount: number; paidCount: number; overdueCount: number; missingPaymentDates: number; unverifiedPaid: number }> = {};
 const inside = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= start && date <= end;
 for (const doc of documents) {
  if (doc.businessId && doc.businessId !== businessId) continue;
  if (doc.status === 'draft' || doc.status === 'void') continue;
  if (doc.type !== 'invoice' && doc.type !== 'receipt') continue;
  const currency = doc.issuer?.currency || fallbackCurrency;
  const g = groups[currency] ??= {currency, collected:0, outstanding:0, overdue:0, invoiced:0, standaloneReceipts:0, invoiceCount:0, paidCount:0, overdueCount:0, missingPaymentDates:0, unverifiedPaid:0};
  const total = totals(doc).total;
  if (doc.type === 'receipt') { if (inside(doc.issueDate)) g.standaloneReceipts += total; continue; }
  if (!doc.issueDate || doc.issueDate > end) continue;
  const dated = doc.payments.filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.amount) && p.amount >= 0);
  const paidAtEnd = dated.filter(p => p.date <= end).reduce((sum,p)=>sum+p.amount,0);
  const balance = Math.max(0, round2(total - paidAtEnd));
  g.collected += dated.filter(p => inside(p.date)).reduce((sum,p)=>sum+p.amount,0);
  g.missingPaymentDates += doc.payments.length - dated.length;
  if (doc.status === 'paid' && balance > 0) g.unverifiedPaid++;
  g.outstanding += balance;
  if (doc.dueDate && doc.dueDate < end && balance > 0) { g.overdue += balance; g.overdueCount++; }
  if (inside(doc.issueDate)) { g.invoiced += total; g.invoiceCount++; if (balance === 0) g.paidCount++; }
 }
 return Object.values(groups).map(g => ({...g, collected:round2(g.collected), outstanding:round2(g.outstanding), overdue:round2(g.overdue), invoiced:round2(g.invoiced), standaloneReceipts:round2(g.standaloneReceipts)}));
}
