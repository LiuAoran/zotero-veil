import test from 'node:test';
import assert from 'node:assert/strict';
import {pdfMarginCSS,syncPDFMargins,clearPDFMargins,PDF_VIEWER_URI} from '../src/reader.mjs';
import {glassTokens} from '../src/glass.mjs';
test('PDF margin scope excludes paper and other documents, deduplicates and restores',()=>{
 assert.equal(pdfMarginCSS(),'html,body,#viewerContainer{background:transparent !important;}');
 let added=0,removed=0;const sheets=[];
 const doc={documentURI:PDF_VIEWER_URI,head:{append:s=>{added++;sheets.push(s);}},createElement:()=>({remove:()=>removed++})};
 const unrelated={documentURI:'resource://zotero/note.html',head:{append:()=>assert.fail('Unrelated document')}};
 let frames=[];const record={doc:{querySelectorAll:()=>frames}};
 syncPDFMargins(record,true);assert.equal(added,0);
 frames=[{contentDocument:doc},{contentDocument:unrelated}];
 syncPDFMargins(record,true);syncPDFMargins(record,true);assert.equal(added,1);
 syncPDFMargins(record,false);assert.equal(removed,1);
 syncPDFMargins(record,true);clearPDFMargins(record);assert.equal(removed,2);assert.equal(record.pdfSheets.size,0);
});
test('Unified material preserves side distinction and continuous contrast protection',()=>{
 assert.ok(glassTokens('balanced',100).includes('lowest) 8%,transparent)'));
 assert.ok(glassTokens('balanced',90).includes('lowest) 8%,transparent)'));
 assert.ok(glassTokens('balanced',0).includes('lowest) 8%,transparent)'));
 assert.ok(glassTokens('balanced',100).includes('container) 86%,transparent)'));
});

test('Transparency mapping retains the low range and reaches the intended upper endpoint',()=>{
 assert.ok(glassTokens('balanced',100).includes('--zmt-glass-window-opacity:43.875%'));
 assert.ok(glassTokens('balanced',80).includes('--zmt-glass-window-opacity:82.4%'));
});
