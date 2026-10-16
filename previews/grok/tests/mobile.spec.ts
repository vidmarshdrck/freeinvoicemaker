import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
for(const width of [360,390,1440]) test(`DEMO creation totals receipt payments paper and responsive layout ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},colorScheme:'dark'});
 const page=await context.newPage(); const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 await expect(page.getByText('DEMO · Browser-local sandbox',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('tablist',{name:'Document types'})).toBeVisible();
 for(const [plural,type] of [['Invoices','Invoice'],['Receipts','Receipt'],['Estimates','Estimate']]){
  await page.getByRole('tab',{name:plural,exact:true}).click();
  await page.getByRole('button',{name:`New ${type}`,exact:true}).first().click();
  await page.getByLabel('Business name',{exact:true}).fill('DEMO Studio');
  await page.getByLabel('Client name',{exact:true}).fill('DEMO Customer');
  await page.getByLabel('Item',{exact:true}).fill('DEMO service');
  await page.getByLabel('Quantity',{exact:true}).fill('2');
  await page.getByLabel('Rate',{exact:true}).fill('100');
  await page.getByLabel('Tax percent').fill('10');
  await expect(page.getByText('$220.00',{exact:true}).last()).toBeVisible();
  if(type==='Receipt'){
   await page.getByRole('button',{name:'Record payment',exact:true}).click();
   await page.getByRole('button',{name:'Add payment',exact:true}).click();
   await expect(page.getByText('Paid in full.',{exact:true})).toBeVisible();
  }
  await page.getByRole('button',{name:width<768?'PDF':'Export PDF',exact:true}).click();
  const paper=page.locator('.paper');
  await expect(paper).toBeVisible();
  if(width<768) await expect(paper).toHaveCSS('padding-left','16px');
  await expect(paper).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(paper).toHaveCSS('color','rgb(0, 0, 0)');
  await expect(paper).toContainText('DEMO Customer');
  await expect(paper.locator('tbody td').nth(3)).toHaveCSS('white-space','nowrap');
  await page.screenshot({path:`/home/shadrickvidmar/paperclip-handoffs/fim-grok-${width}-${type.toLowerCase()}-paper.png`});
  await page.pdf({path:`/home/shadrickvidmar/paperclip-handoffs/fim-grok-${width}-${type.toLowerCase()}.pdf`,format:'A4'});
  await page.getByRole('button',{name:'Close',exact:true}).click();
 }
 await expect(page.locator('body')).toHaveJSProperty('scrollWidth',width);
 await page.reload();
 await expect(page.getByRole('heading',{name:'Estimate',exact:true})).toBeVisible();
 expect(errors).toEqual([]);
 await page.screenshot({path:`/home/shadrickvidmar/paperclip-handoffs/fim-grok-after-${width}-dark.png`});
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 await page.screenshot({path:`/home/shadrickvidmar/paperclip-handoffs/fim-grok-after-${width}-light.png`});
 await context.close();
});
