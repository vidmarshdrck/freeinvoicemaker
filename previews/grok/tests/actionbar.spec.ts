import { test, expect } from '@playwright/test';
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
for (const [width, height] of [[360,844],[390,844],[390,568],[1440,844]]) {
 test(`document actions remain anchored ${width}x${height}`, async ({browser}) => {
  const context = await browser.newContext({viewport:{width,height}});
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole('tab',{name:'Receipts',exact:true}).click();
  await page.getByRole('button',{name:'New Receipt',exact:true}).first().click();
  const save = page.getByRole('button',{name:'Save',exact:true});
  const initial = await save.boundingBox();
  const scroll = page.getByLabel('Notes / Terms').locator('xpath=ancestor::div[contains(@class,"overflow-y-auto")][1]');
  await scroll.evaluate(el => el.scrollTop = el.scrollHeight);
  await page.screenshot({path:`/home/shadrickvidmar/paperclip-handoffs/fim-actionbar-${process.env.QA_STAGE || 'before'}-${width}-${height}.png`});
  const end = await save.boundingBox();
  console.log(JSON.stringify({width,height,initial,end}));
  expect(end!.y).toBeCloseTo(initial!.y,0);
  if (width < 768) {
   const bar = save.locator('..');
   await expect(bar).toHaveCSS('position','fixed');
   const box = await bar.boundingBox();
   expect(box!.y + box!.height).toBeCloseTo(height,0);
   for (const button of await bar.getByRole('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
   const notes = await page.getByLabel('Notes / Terms').boundingBox();
   expect(notes!.y + notes!.height).toBeLessThanOrEqual(box!.y);
   // Emulated keyboard-sized viewport: not a physical keyboard test.
   await page.setViewportSize({width,height:460});
   await page.getByLabel('Notes / Terms').focus();
   const small = await bar.boundingBox();
   expect(small!.y + small!.height).toBeCloseTo(460,0);
   // Simulate visual viewport shrinking without layout viewport resize (mobile keyboard).
   await page.evaluate(() => {
    Object.defineProperty(window.visualViewport!, 'height', {configurable:true,value:300});
    window.visualViewport!.dispatchEvent(new Event('resize'));
   });
   await expect.poll(async () => {
    const keyboardBox = await bar.boundingBox();
    return Math.round(keyboardBox!.y + keyboardBox!.height);
   }).toBe(300);
   await page.evaluate(() => {
    delete (window.visualViewport as unknown as Record<string,unknown>).height;
    window.visualViewport!.dispatchEvent(new Event('resize'));
   });
  }
  await page.getByLabel('Notes / Terms').fill('Action bar persistence test');
  await save.click();
  await expect(page.locator('[data-sonner-toast]').getByText('Saved on this device',{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Notes / Terms')).toHaveValue('Action bar persistence test');
  await context.close();
 });
}
