import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test.use({viewport:{width:390,height:844}});
test('top type tabs select a category before creating a correctly typed document',async({page})=>{
 await page.goto(url);
 const tabs=page.getByRole('tablist',{name:'Document types'});
 for(const [plural,singular,date] of [['Invoices','Invoice','Due Date'],['Receipts','Receipt','Paid on'],['Estimates','Estimate','Valid until'],['Quotations','Quotation','Valid until']]){
 await tabs.getByRole('tab',{name:plural,exact:true}).click();
 await expect(tabs.getByRole('tab',{name:plural,exact:true})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:`New ${singular}`,exact:true}).last().click();
 await expect(page.getByRole('heading',{name:singular,exact:true})).toBeVisible();
 await expect(page.getByText(date,{exact:true})).toBeVisible();
 }
 await page.reload();
 await expect(page.getByRole('heading',{name:'Quotation',exact:true})).toBeVisible();
 await expect(tabs.getByRole('tab',{name:'Quotations',exact:true})).toHaveAttribute('aria-selected','true');
});
