import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadTranslator,localizeSettings,englishFallback} from '../src/i18n.mjs';
const strings=JSON.parse(fs.readFileSync('src/strings.json','utf8'));
test('Both languages cover every marked label and accessible name',()=>{
 for(const [key,value]of Object.entries(strings)){assert.match(key,/^zotero-veil-/);assert.ok(value['en-US']&&value['zh-CN']);}
 const markup=fs.readFileSync('addon/content/preferences.xhtml','utf8');
 for(const [,key]of markup.matchAll(/data-veil-(?:text|label)="([^"]+)"/g))assert.ok(strings[key]);
 assert.ok(!/[\u4e00-\u9fff]/.test(markup));
});
test('Private Fluent translator caches async values and falls back to English',async()=>{
 let calls=0;
 class Localization{constructor(resources){assert.deepEqual(resources,['zotero-veil.ftl']);}async formatValues(keys){calls++;return keys.map(key=>key==='zotero-veil-light'?'浅色':null);}}
 const t=await loadTranslator(Localization,'zh-CN');assert.equal(t('zotero-veil-light'),'浅色');assert.equal(t('zotero-veil-dark'),'Dark');assert.equal(t.language,'zh-CN');
 t('zotero-veil-light');assert.equal(calls,1);
 const fallback=await loadTranslator(Localization,'fr-FR');assert.equal(fallback.language,'en-US');assert.equal(englishFallback('zotero-veil-seed-error'),strings['zotero-veil-seed-error']['en-US']);
});
test('Translation modifies only explicitly marked nodes in the owned settings root',()=>{
 const text={getAttribute:()=> 'zotero-veil-light'},label={getAttribute:()=> 'zotero-veil-mode-label',setAttribute:(key,value)=>{label[key]=value;}};
 const root={id:'zmt-settings',setAttribute:(key,value)=>{root[key]=value;},querySelectorAll:selector=>selector==='[data-veil-text]'?[text]:[label]};
 localizeSettings(root,englishFallback);assert.equal(text.textContent,'Light');assert.equal(label['aria-label'],'Appearance mode');assert.equal(root.lang,'en-US');
 assert.throws(()=>localizeSettings({...root,id:'other-plugin'},englishFallback));
});
test('Localization never writes host locale preferences or shared document language',()=>{
 const source=fs.readFileSync('src/i18n.mjs','utf8')+fs.readFileSync('addon/bootstrap.js','utf8');
 assert.ok(!/requestedLocales\s*=|intl\.locale|setRequestedLocales|documentElement\.setAttribute\(['"]lang|document\.l10n/.test(source));
});
