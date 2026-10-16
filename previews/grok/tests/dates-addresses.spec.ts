import { test, expect } from '@playwright/test';
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
for (const width of [360,390,1440]) test(`editable dates and side by side billing addresses at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto(url);
 const issue=page.getByLabel('Invoice Date',{exact:true}),due=page.getByLabel('Due Date',{exact:true});
 await expect(issue).toHaveCSS('opacity','1');await expect(due).toHaveCSS('opacity','1');
 await issue.fill('2026-10-02');await due.fill('2026-11-15');
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();
 await expect(issue).toHaveValue('2026-10-02');await expect(due).toHaveValue('2026-11-15');
 await page.getByRole('button',{name:'Download PDF',exact:true}).click();
 const from=page.getByRole('region',{name:'Billed by',exact:true});const to=page.getByRole('region',{name:'Bill to',exact:true});
 const a=await from.boundingBox(),b=await to.boundingBox();expect(a).not.toBeNull();expect(b).not.toBeNull();expect(Math.abs(a!.y-b!.y)).toBeLessThan(3);expect(a!.x+a!.width).toBeLessThanOrEqual(b!.x+1);
 await page.emulateMedia({media:'print'});
 const ap=await from.boundingBox(),bp=await to.boundingBox();expect(Math.abs(ap!.y-bp!.y)).toBeLessThan(3);expect(ap!.x+ap!.width).toBeLessThanOrEqual(bp!.x+1);
 await expect(page.locator('.paper')).toContainText('November 15, 2026');
});
