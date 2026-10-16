import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test('receipt starts with paid-on today and receipt-specific terms',async({page})=>{
 await page.goto(url);await page.getByRole('tab',{name:'Receipts',exact:true}).click();await page.getByRole('button',{name:'New Receipt',exact:true}).first().click();
 await expect(page.getByLabel('Notes / Terms')).toHaveValue('Received with thanks.');
 const dates=page.locator('input[type=date]');expect(await dates.nth(0).inputValue()).toBe(await dates.nth(1).inputValue());
});
