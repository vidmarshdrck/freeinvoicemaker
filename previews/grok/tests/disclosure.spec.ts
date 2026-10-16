import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test('clean workspace with honest local storage disclosure',async({page})=>{
 await page.setViewportSize({width:390,height:844}); await page.goto(url);
 await expect(page.getByText('DEMO · Browser-local sandbox',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Open menu'}).click();
 await expect(page.getByText('Saved on this device',{exact:true}).filter({visible:true})).toBeVisible();
 await expect(page.getByText('No cloud sync',{exact:true}).filter({visible:true})).toBeVisible();
 await expect(page.getByText('Secure & private',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await expect(page.getByText('Cloud sync is not connected. Download a backup to keep a separate copy.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Reset to sample workspace',exact:true})).toBeVisible();
});
