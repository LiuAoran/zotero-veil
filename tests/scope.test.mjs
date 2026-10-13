import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readerCSS} from '../src/reader.mjs';
import {createScheme} from '../src/palette.mjs';
test('Reader rules remain confined to application chrome and respect reduced motion',()=>{
 const css=readerCSS(createScheme('#6750A4',true),true,{glass:true,transparency:82});
 assert.ok(css.includes('transition:none'));
 const selectors=[...css.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim());
 assert.ok(selectors.every(s=>s.split(',').every(part=>part.trim().startsWith('#reader-ui .toolbar')||part.trim().startsWith('#reader-ui .sidebar-toolbar')||part.trim().startsWith('#reader-ui #sidebarContent')||part.trim().startsWith('#reader-ui #sidebarContainer'))));
 assert.ok(!/canvas|textLayer|annotationLayer|body\s*\{|:root|color-scheme/.test(css));
});
test('Production archive inputs contain no test bridge or item mutation calls',()=>{
 const controller=fs.readFileSync('src/controller.mjs','utf8');
 assert.ok(!/eval\(|IOUtils|\.saveTx\(|\.setField\(|Zotero\.Items/.test(controller));
 const metadata=JSON.parse(fs.readFileSync('addon/manifest.json'));
 assert.equal(metadata.applications.zotero.strict_max_version,'10.0.*');
 assert.ok(metadata.applications.zotero.update_url.endsWith('/updates.json'));
});
