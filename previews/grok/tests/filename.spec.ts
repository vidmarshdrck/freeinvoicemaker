import {test,expect} from '@playwright/test';
import {safeFilePart, documentFilename, seedWorkspace} from '../src/lib/invoice-store';
test('filenames retain Unicode safely within filesystem byte limits',()=>{
 const state=seedWorkspace();const doc=state.documents[0];
 doc.number='INV:001/\\?';doc.billTo.name='客戶'.repeat(100);doc.issuer={...state.business,name:'商業'.repeat(100)};
 const filename=documentFilename(doc,state.business)+'.pdf';
 expect(Buffer.byteLength(filename)).toBeLessThanOrEqual(220);
 expect(filename).not.toMatch(/[<>:"/\\|?*\u0000-\u001f]/);
 expect(safeFilePart('CON')).toBe('_CON');
 expect(safeFilePart('  ..  ')).toBe('Untitled');
 expect(safeFilePart('équipe / Client:*?')).toBe('équipe-Client');
 expect(safeFilePart('a'.repeat(41)+'.trailing')).not.toMatch(/[. ]$/);
});
