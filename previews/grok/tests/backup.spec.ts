import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test.use({viewport:{width:390,height:844}});
test('Documents menu and real JSON backup download',async({page})=>{
 await page.goto(url);await page.getByRole('button',{name:'Open menu'}).click();
 await expect(page.getByRole('navigation',{name:'Primary'}).getByRole('button',{name:'Documents',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download backup',exact:true}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('free-invoice-maker-backup.json');
 await download.saveAs('/home/shadrickvidmar/paperclip-handoffs/fim-grok-demo-backup.json');
 expect(await download.failure()).toBeNull();
});
