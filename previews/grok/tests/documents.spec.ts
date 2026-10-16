import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test.use({viewport:{width:390,height:844}});
test('editor hides type switches; back restores typed creation without conversion',async({page})=>{
 await page.goto(url);
 await expect(page.getByRole('tablist',{name:'Document types'})).toHaveCount(0);
 await expect(page.getByLabel('Document type',{exact:true})).toHaveCount(0);
 const trash=page.getByRole('button',{name:'Delete',exact:true});
 expect((await trash.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 await expect(trash).toHaveAttribute('title','Delete document');
 const tabs=page.getByRole('tablist',{name:'Document types'});
 for(const [plural,singular,date] of [['Invoices','Invoice','Due Date'],['Receipts','Receipt','Paid on'],['Estimates','Estimate','Valid until'],['Quotations','Quotation','Valid until']]){
 await page.getByRole('button',{name:'Documents',exact:true}).filter({visible:true}).click();
 await tabs.getByRole('tab',{name:plural,exact:true}).click();
 await page.getByRole('button',{name:`New ${singular}`,exact:true}).last().click();
 await expect(page.getByRole('heading',{name:singular,exact:true})).toBeVisible();
 await expect(page.getByText(date,{exact:true})).toBeVisible();
 await expect(tabs).toHaveCount(0);
 }
 await page.reload();
 await expect(page.getByRole('heading',{name:'Quotation',exact:true})).toBeVisible();
 await expect(tabs).toHaveCount(0);
});
