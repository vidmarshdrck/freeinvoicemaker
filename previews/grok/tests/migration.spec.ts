import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test.use({viewport:{width:390,height:844}});
async function settings(page:any){await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();}
test('legacy migration retains IDs type notes amounts and original backup with optional fields empty',async({page})=>{
 await page.goto(url);await page.getByLabel('Client name',{exact:true}).fill('Legacy client');
 const legacy=await page.evaluate(()=>{
 const data=JSON.parse(localStorage.getItem('fim-grok-preview-sandbox-v1')!);data.version=0;
 delete data.state.profiles;delete data.state.currentBusinessId;delete data.state.usedNumbers;
 delete data.state.business.phone;delete data.state.business.taxNumber;
 data.state.documents.forEach((d:any)=>{delete d.issuer;delete d.businessId;d.notes='';});
 const raw=JSON.stringify(data); localStorage.setItem('fim-grok-preview-sandbox-v1',raw);return raw;
 });
 await page.reload();await expect(page.getByLabel('Notes / Terms')).toHaveValue('');
 const migrated=await page.evaluate(()=>({current:JSON.parse(localStorage.getItem('fim-grok-preview-sandbox-v1')!),backup:localStorage.getItem('fim-grok-preview-legacy-backup-v1')}));
 expect(migrated.backup).toBe(legacy);expect(migrated.current.version).toBe(2);
 const previous=JSON.parse(legacy).state;
 expect(migrated.current.state.documents.map(({issuer,businessId,...doc}:any)=>doc)).toEqual(previous.documents);
 expect(migrated.current.state.business.phone).toBe('');expect(migrated.current.state.business.taxNumber).toBe('');
 await settings(page);await expect(page.getByLabel('Phone',{exact:true})).toHaveValue('');await expect(page.getByLabel('Tax number',{exact:true})).toHaveValue('');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download pre-upgrade backup',exact:true}).click();
 const raw=await fs.readFile((await (await download).path())!,'utf8'); expect(raw).toBe(legacy);
 await page.locator('input[accept="application/json"]').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(raw)});
 await expect(page.getByRole('heading',{name:'Invoice',exact:true})).toBeVisible();
 await expect(page.getByLabel('Notes / Terms')).toHaveValue('');
});
test('business backup contains only selected profile and preserves schema identity and sequence reservations',async({page})=>{
 await page.goto(url);await settings(page);await page.getByRole('button',{name:'Add business',exact:true}).click();
 await page.getByLabel('Name',{exact:true}).fill('Isolated Business');
 await page.getByLabel('Default note',{exact:true}).fill('Optional custom terms');
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Download backup',exact:true}).click();
 const download=await promise;const data=JSON.parse(await fs.readFile((await download.path())!,'utf8'));
 expect(data.schemaVersion).toBe(2);expect(data.businessId).toMatch(/^business-/);expect(data.usedNumbers).toEqual([]);
 expect(data.business.name).toBe('Isolated Business');expect(data.documents).toEqual([]);expect(data.clients).toEqual([]);expect(data.items).toEqual([]);expect(data.profiles).toBeUndefined();
 await page.getByLabel('Current business',{exact:true}).selectOption({label:'Acme Studio'});
 await page.locator('input[accept="application/json"]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.getByRole('heading',{name:'No document open',exact:true})).toBeVisible();
 await settings(page);await expect(page.getByText('0 documents on this device.',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Current business',{exact:true}).locator('option')).toHaveCount(2);
});
