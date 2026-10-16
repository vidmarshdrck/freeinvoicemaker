import {test,expect} from '@playwright/test';
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:5176/freeinvoicemaker/grok/';
test('pending uses orange paid green overdue red',async({page})=>{
 await page.goto(url);const status=page.getByRole('combobox',{name:/^Status/});
 await expect(status).toHaveClass(/text-warning/);
 await status.selectOption('paid');await expect(status).toHaveClass(/text-success/);
 await status.selectOption('overdue');await expect(status).toHaveClass(/text-danger/);
});
