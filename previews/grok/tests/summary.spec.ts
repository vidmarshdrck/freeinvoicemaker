import { test, expect } from '@playwright/test';
import { summarize, monthRange } from '../src/lib/summary';
import type { Doc } from '../src/lib/invoice-store';
const doc = (patch: Partial<Doc> = {}): Doc => ({id:'a',businessId:'one',type:'invoice',number:'INV1',status:'sent',clientId:null,billTo:{name:'Client',address:'',cityLine:'',email:'',phone:''},issueDate:'2026-10-01',dueDate:'2026-10-10',taxRate:0,template:'ledger',notes:'',lines:[{id:'l',name:'Work',description:'',qty:1,rate:100}],payments:[],...patch});
test('month ranges handle leap years and year rollover',()=>{expect(monthRange(0,new Date(2024,1,12))).toEqual({start:'2024-02-01',end:'2024-02-29'});expect(monthRange(1,new Date(2026,11,12))).toEqual({start:'2027-01-01',end:'2027-01-31'});});
test('summaries isolate business, receipt totals and dated invoice payments',()=>{
 const docs=[doc({payments:[{id:'p',amount:40,date:'2026-10-02',method:'cash',reference:''},{id:'p2',amount:20,date:'2026-11-02',method:'cash',reference:''}]}),doc({id:'receipt',type:'receipt',status:'issued'}),doc({id:'other',businessId:'two'}),doc({id:'estimate',type:'estimate',status:'accepted'}),doc({id:'void',status:'void'}),doc({id:'draft',status:'draft'})];
 const [r]=summarize(docs,'2026-10-01','2026-10-31','one','ZMW');expect(r).toMatchObject({collected:40,outstanding:60,overdue:60,invoiced:100,standaloneReceipts:100,invoiceCount:1,paidCount:0,overdueCount:1});
});
test('paid labels do not fabricate cash, prior invoices and period endpoints are honoured',()=>{
 const [r]=summarize([doc({issueDate:'2026-09-01',status:'paid',payments:[{id:'p',amount:25,date:'2026-10-31',method:'',reference:''}]}),doc({id:'future',issueDate:'2026-11-01'})],'2026-10-01','2026-10-31','one','USD');expect(r).toMatchObject({collected:25,outstanding:75,unverifiedPaid:1,invoiceCount:0});
});
test('separate currencies and invalid dated payments remain explicit',()=>{
 const docs=[doc({payments:[{id:'p',amount:50,date:'',method:'',reference:''}]}),doc({id:'eur',issuer:{name:'A',currency:'EUR'} as Doc['issuer']})];const r=summarize(docs,'2026-10-01','2026-10-31','one','ZMW');expect(r).toHaveLength(2);expect(r[0].missingPaymentDates).toBe(1);expect(r[0].collected).toBe(0);
});
test('summary view supports mobile navigation and period selection',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/');await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Summaries',exact:true}).click();await expect(page.getByRole('heading',{name:'Summaries'})).toBeVisible();const now=monthRange();await expect(page.getByLabel('Summary start date')).toHaveValue(now.start);await page.getByLabel('Summary start date').fill('2026-01-01');await page.getByLabel('Summary end date').fill('2026-01-31');await expect(page.getByLabel('Summary end date')).toHaveValue('2026-01-31');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
