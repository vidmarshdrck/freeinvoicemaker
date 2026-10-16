import { test, expect } from '@playwright/test';
import { seedWorkspace } from '../src/lib/invoice-store';
import { summarize, monthRange } from '../src/lib/summary';
test('fresh examples use current month and show invoice collections',()=>{
 const state=seedWorkspace(), range=monthRange();expect(state.documents.every(d=>d.issueDate>=range.start&&d.issueDate<=range.end)).toBeTruthy();
 const groups=summarize(state.documents,range.start,range.end,state.currentBusinessId,state.business.currency);
 expect(groups.some(g=>g.collected>0&&g.paidCount>0&&g.standaloneReceipts>0)).toBeTruthy();
});
test('example business preserves existing workspace',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5176/freeinvoicemaker/grok/');
 await page.getByLabel('Business name',{exact:true}).fill('Keep My Business');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Summaries',exact:true}).click();
 await page.getByRole('button',{name:'Try current-month examples',exact:true}).click();await expect(page.getByText(/Example business · fictional data/)).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fim-grok-preview-sandbox-v1')!).state);expect(Object.values(saved.profiles).some((p:any)=>p.documents.some((d:any)=>d.issuer?.name==='Keep My Business'))).toBeTruthy();
 await page.reload();await expect(page.getByRole('heading',{name:'Summaries'})).toBeVisible();
});
