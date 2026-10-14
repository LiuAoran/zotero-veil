const c=Zotero.MaterialThemeMD3,out=[],beforeLocale=Services.locale.requestedLocales.slice();
Zotero.Utilities.Internal.openPreferences('zmt-material-theme');await Zotero.Promise.delay(400);
const prefs=Services.wm.getMostRecentWindow('zotero:pref');await prefs.Zotero_Preferences.waitForFirstPaneLoad();
const root=prefs.document.getElementById('zmt-settings');
const locale=Services.locale.appLocaleAsBCP47,zh=locale.startsWith('zh'),language=zh?'zh-CN':'en-US';
const strings=JSON.parse(await IOUtils.readUTF8(project+'/src/strings.json'));
const check=(name,ok,details)=>{if(!ok)throw Error(name+': '+JSON.stringify(details));out.push({name,passed:true,details});};
for(const node of root.querySelectorAll('[data-veil-text]')){
 if(['zmt-glass-status','zmt-feedback'].includes(node.id))continue;
 const key=node.getAttribute('data-veil-text');check(key+' text',node.textContent===strings[key][language]);
}
for(const node of root.querySelectorAll('[data-veil-label]')){
 const key=node.getAttribute('data-veil-label');check(key+' accessibility label',node.getAttribute('aria-label')===strings[key][language]);
}
check('Dynamic glass status localized',['glass-off','glass-accessibility','glass-unavailable','glass-active','glass-main-only'].some(key=>root.querySelector('#zmt-glass-status').textContent===strings['zotero-veil-'+key][language]));
check('Own pane label localized',Zotero.PreferencePanes.pluginPanes.find(p=>p.id==='zmt-material-theme').rawLabel===strings['zotero-veil-pane'][language]);
const sentinel=prefs.document.createElement('div');sentinel.textContent='Other plugin 保持原样';sentinel.setAttribute('lang','fr');prefs.document.documentElement.append(sentinel);
const documentLanguage=prefs.document.documentElement.getAttribute('lang');const saved=c.readSettings();
const input=root.querySelector('#zmt-seed-text');input.value='invalid';input.dispatchEvent(new prefs.Event('input',{bubbles:true}));
check('Invalid color uses localized feedback',root.querySelector('#zmt-feedback').textContent===strings['zotero-veil-seed-error'][language]);
check('Invalid color does not overwrite saved seed',c.readSettings().seed===saved.seed);
input.value='#006A6A';input.dispatchEvent(new prefs.Event('input',{bubbles:true}));
check('Valid color saved with localized confirmation',c.readSettings().seed==='#006A6A'&&root.querySelector('#zmt-feedback').textContent===strings['zotero-veil-saved'][language]);
c.setSetting('seed',saved.seed);
root.querySelector('[data-mode-choice="system"]').click();check('Mode button preserves stored enum',c.readSettings().mode==='system');
const motion=root.querySelector('#zmt-reduce-motion');motion.checked=!saved.reduceMotion;motion.dispatchEvent(new prefs.Event('change',{bubbles:true}));check('Motion setting saves',c.readSettings().reduceMotion===!saved.reduceMotion);
const glass=root.querySelector('#zmt-glass');glass.checked=!saved.glass;glass.dispatchEvent(new prefs.Event('change',{bubbles:true}));check('Glass switch saves',c.readSettings().glass===!saved.glass);
for(const key of ['mode','reduceMotion','glass'])c.setSetting(key,saved[key]);c.refresh();
check('Sibling text and language unchanged',sentinel.textContent==='Other plugin 保持原样'&&sentinel.getAttribute('lang')==='fr');
check('Document language unchanged',documentLanguage===prefs.document.documentElement.getAttribute('lang'));
check('Host locale preferences unchanged',JSON.stringify(beforeLocale)===JSON.stringify(Services.locale.requestedLocales));
sentinel.remove();
if(win.ZMTTest){win.ZMTTest.directory=project+'/docs/validation/current';await win.ZMTTest.snapshot('settings-'+locale.toLowerCase(),prefs);}
await IOUtils.writeJSON(project+'/docs/validation/current/i18n-'+locale+'.json',out);
return {locale,checks:out.length,passed:true};
