import {deferredWindowRefresh} from './window-refresh.mjs';
import {englishFallback,localizeSettings} from './i18n.mjs';
export {loadTranslator} from './i18n.mjs';
import {DEFAULTS,PRESETS,normalizeSeed,normalizeMode,effectiveMode,createScheme,tokenCSS} from './palette.mjs';
import {readerCSS,syncPDFMargins,clearPDFMargins} from './reader.mjs';
import {NativeGlass} from './native-glass.mjs';
import {normalizeGlassLevel,glassPolicy,glassTokens,normalizeTransparency,presetTransparency} from './glass.mjs';

const XHTML='http://www.w3.org/1999/xhtml';
const PREF='materialThemeMD3.';
const ROOT_ATTRIBUTES=['data-zmt','data-zmt-mode','data-zmt-motion','data-zmt-glass'];
export const PANE_ID='zmt-material-theme';

/** Owns only plugin preferences, scoped sheets and listeners. No item APIs. */
export class ThemeController {
  constructor({zotero,rootURI,id,version,nativeEnvironment,translate=englishFallback}) {
    this.t=translate;this.zotero=zotero;this.rootURI=rootURI;this.id=id;this.version=version;
    this.windows=new Map();this.settings=new Map();this.readers=new Map();this.observers=[];this.paneID=null;this.active=false;this.cache=new Map();
    this.readerListener=({doc})=>this.attachReader(doc);
    this.generation=0;this.startPending=false;
    // A same-version reinstall must not reuse a cached chrome stylesheet.
    // Stable within one controller lifetime; never regenerated on refresh.
    this.styleRevision=Date.now().toString(36)+Math.random().toString(36).slice(2);
    this.nativeGlass=new NativeGlass({...nativeEnvironment,logError:error=>this.zotero.logError(error)});
  }
  cleanup(tasks) {
    for(const task of tasks){try{task();}catch(error){try{this.zotero.logError(error);}catch{}}}
  }
  readSettings() {
    const get=(key)=>this.zotero.Prefs.get(PREF+key);
    let mode,seed;
    try {mode=normalizeMode(get('mode')??DEFAULTS.mode);}catch{mode=DEFAULTS.mode;}
    try {seed=normalizeSeed(get('seed')??DEFAULTS.seed);}catch{seed=DEFAULTS.seed;}
    let glassLevel;try{glassLevel=normalizeGlassLevel(get('glassLevel')??DEFAULTS.glassLevel);}catch{glassLevel=DEFAULTS.glassLevel;}
    let glassTransparency;try{glassTransparency=normalizeTransparency(get('glassTransparency'));}catch{glassTransparency=presetTransparency(glassLevel);}
    return {mode,seed,reduceMotion:get('reduceMotion')===true,glass:get('glass')===true,glassLevel,glassTransparency};
  }
  setSetting(key,value) {
    if (!this.active) throw new Error('主题已禁用');
    if(key==='seed') value=normalizeSeed(value);
    else if(key==='mode') value=normalizeMode(value);
    else if(key==='reduceMotion') {if(typeof value!=='boolean')throw new Error('无效动态效果设置');}
    else if(key==='glass'){if(typeof value!=='boolean')throw new Error('无效材质设置');}
    else if(key==='glassLevel'){value=normalizeGlassLevel(value);this.zotero.Prefs.set(PREF+'glassTransparency',presetTransparency(value));}
    else if(key==='glassTransparency')value=normalizeTransparency(value);
    else throw new Error('未知主题设置');
    this.zotero.Prefs.set(PREF+key,value);
    // Pref observers apply to every window, including existing settings windows.
    this.refresh();
  }
  async start() {
    if(this.active||this.startPending)throw new Error('主题已启动或正在启动');
    const generation=++this.generation;this.startPending=true;
    this.active=true;
    try {
      for(const key of Object.keys(DEFAULTS))this.observers.push(this.zotero.Prefs.registerObserver(PREF+key,()=>this.refresh()));
      const paneID=await this.zotero.PreferencePanes.register({pluginID:this.id,id:PANE_ID,label:this.t('zotero-veil-pane'),src:this.rootURI+'content/preferences.xhtml',image:this.rootURI+'assets/icon.svg'});
      if(!this.active||this.generation!==generation){this.cleanup([()=>this.zotero.PreferencePanes.unregister(paneID)]);return;}
      this.paneID=paneID;
      this.zotero.Reader.registerEventListener('renderToolbar',this.readerListener,this.id);
      for(const win of this.zotero.getMainWindows())this.attachWindow(win);
    }catch(error){this.stop();throw error;}
    finally{this.startPending=false;}
  }
  attachWindow(win) {
    if(!this.active||this.windows.has(win)||win.closed)return;
    const doc=win.document,root=doc.documentElement;
    const record={win,root,attributes:new Map(ROOT_ATTRIBUTES.map(key=>[key,root.getAttribute(key)])),cleanups:[]};
    const sheet=doc.createElementNS(XHTML,'link');sheet.rel='stylesheet';sheet.href=this.rootURI+'content/theme.css?v='+encodeURIComponent(this.version)+'&instance='+this.styleRevision;sheet.id='zmt-theme-sheet';
    const tokens=doc.createElementNS(XHTML,'style');tokens.id='zmt-theme-tokens';
    record.sheet=sheet;record.tokens=tokens;
    record.dark=win.matchMedia('(prefers-color-scheme: dark)');record.motion=win.matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>this.applyWindow(record);
    for(const query of [record.dark,record.motion]){query.addEventListener('change',changed);record.cleanups.push(()=>query.removeEventListener('change',changed));}
    const unloaded=()=>this.detachWindow(win);
    win.addEventListener('unload',unloaded,{once:true});record.cleanups.push(()=>win.removeEventListener('unload',unloaded));
    // Native accessibility preferences are rechecked when returning to a window.
    const focusRefresh=deferredWindowRefresh(win,()=>this.refresh());
    win.addEventListener('activate',focusRefresh.listener);record.cleanups.push(()=>win.removeEventListener('activate',focusRefresh.listener),focusRefresh.dispose);
    record.transparency=win.matchMedia('(prefers-reduced-transparency: reduce)');
    const transparencyChanged=()=>this.refresh();
    record.transparency.addEventListener('change',transparencyChanged);record.cleanups.push(()=>record.transparency.removeEventListener('change',transparencyChanged));
    this.windows.set(win,record);
    root.append(tokens,sheet);
    this.applyWindow(record);
    // Existing reader tabs, excluding the library's attachment preview.
    for(const frame of doc.querySelectorAll('browser[src="resource://zotero/reader/reader.html"]')){
      if(!frame.closest('#zotero-pane')&&frame.contentDocument)this.attachReader(frame.contentDocument);
    }
    const loadError=()=>this.zotero.logError(new Error('Material theme stylesheet failed to load'));
    sheet.addEventListener('error',loadError,{once:true});record.cleanups.push(()=>sheet.removeEventListener('error',loadError));
    const loaded=()=>{this.applyWindow(record);for(const reader of this.readers.values())this.applyReader(reader);};sheet.addEventListener('load',loaded);record.cleanups.push(()=>sheet.removeEventListener('load',loaded));
  }
  applyWindow(record) {
    if(!this.active||record.win.closed)return;
    const settings=this.readSettings(),mode=effectiveMode(settings.mode,record.dark.matches);
    const key=settings.seed+mode;
    if(!this.cache.has(key)){if(this.cache.size>=16)this.cache.clear();this.cache.set(key,createScheme(settings.seed,mode==='dark'));}
    record.tokens.textContent=`:root[data-zmt]{${tokenCSS(this.cache.get(key))}${glassTokens(settings.glassLevel,settings.glassTransparency)}}`;
    record.root.setAttribute('data-zmt','');record.root.setAttribute('data-zmt-mode',mode);
    record.root.setAttribute('data-zmt-motion',settings.reduceMotion||record.motion.matches?'reduce':'normal');
    // Only the library main window gets native material. Other preference pages
    // and independent reader windows remain outside this increment's scope.
    const eligible=record.root.id==='main-window'&&!!record.win.document.getElementById('zotero-pane');
    let native={available:false};
    if(eligible&&settings.glass)try{native=this.nativeGlass.accessibility();}catch(error){this.zotero.logError(error);}
    let policy=glassPolicy({enabled:settings.glass,...native,reducedTransparency:native.reducedTransparency||record.transparency.matches,level:settings.glassLevel});
    if(eligible&&policy.active&&!this.nativeGlass.apply(record.win,mode,settings.glassTransparency))policy=glassPolicy({enabled:true,available:false,level:settings.glassLevel});
    record.glassStatus=this.t(policy.reasonKey);
    if(record.glassFrame){record.win.cancelAnimationFrame(record.glassFrame);record.glassFrame=null;}
    if(eligible&&policy.active){
      record.root.setAttribute('data-zmt-glass','native');
      record.glassFrame=record.win.requestAnimationFrame(()=>{
        record.glassFrame=null;
        if(this.active&&this.windows.get(record.win)===record&&record.root.getAttribute('data-zmt-glass')==='native'){
          if(!this.nativeGlass.apply(record.win,mode,settings.glassTransparency)){
            record.root.removeAttribute('data-zmt-glass');record.glassStatus=this.t('zotero-veil-glass-unavailable');
            for(const reader of this.readers.values())this.applyReader(reader);
            for(const [root,settingsRecord] of this.settings)if(root.isConnected)settingsRecord.update();
          }
        }
      });
    }
    else{record.root.removeAttribute('data-zmt-glass');this.nativeGlass.detach(record.win);}
  }
  detachWindow(win) {
    const record=this.windows.get(win);if(!record)return;
    this.windows.delete(win);
    this.cleanup([...record.cleanups,()=>{if(record.glassFrame)win.cancelAnimationFrame(record.glassFrame);},()=>this.nativeGlass.detach(win),()=>record.sheet.remove(),()=>record.tokens.remove(),...[...record.attributes].map(([key,value])=>()=>{if(value===null)record.root.removeAttribute(key);else record.root.setAttribute(key,value);})]);
  }
  refresh() {
    if(!this.active)return;
    for(const record of this.windows.values())this.applyWindow(record);
    for(const record of this.readers.values())this.applyReader(record);
    for(const [root,record] of this.settings){if(root.isConnected)record.update();else this.unmountSettings(root);}
  }
  mountSettings(root) {
    if(!this.active||this.settings.has(root))return;
    localizeSettings(root,this.t);
    const win=root.ownerDocument.defaultView;
    this.attachWindow(win);
    const cleanup=[],listen=(node,event,handler)=>{node.addEventListener(event,handler);cleanup.push(()=>node.removeEventListener(event,handler));};
    const query=(id)=>root.querySelector('#'+id),message=query('zmt-feedback');
    const report=(text,error=false)=>{message.textContent=text;message.dataset.error=String(error);message.setAttribute('role',error?'alert':'status');};
    const update=()=>{
      const settings=this.readSettings();
      root.querySelectorAll('[data-mode-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.modeChoice===settings.mode)));
      if(root.ownerDocument.activeElement!==query('zmt-seed-text'))query('zmt-seed-text').value=settings.seed;
      query('zmt-seed-color').value=settings.seed;
      query('zmt-reduce-motion').checked=settings.reduceMotion;
      query('zmt-glass').checked=settings.glass;
      query('zmt-glass-level').value=settings.glassTransparency===presetTransparency(settings.glassLevel)?settings.glassLevel:'custom';query('zmt-glass-level').disabled=!settings.glass;
      query('zmt-glass-transparency').value=settings.glassTransparency;query('zmt-glass-transparency').disabled=!settings.glass;
      query('zmt-glass-transparency-value').textContent=settings.glassTransparency+'%';
      query('zmt-glass-status').textContent=[...this.windows.values()].find(record=>record.root.id==='main-window')?.glassStatus??this.t('zotero-veil-glass-main-only');
      root.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===settings.seed)));
    };
    const save=(key,value)=>{try{this.setSetting(key,value);report(this.t('zotero-veil-saved'));return true;}catch(error){const errors={seed:'seed-error',mode:'mode-error',reduceMotion:'motion-error',glass:'glass-error',glassLevel:'level-error',glassTransparency:'transparency-error'};report(this.t('zotero-veil-'+(errors[key]??'save-error')),true);this.zotero.logError(error);return false;}};
    for(const button of root.querySelectorAll('[data-mode-choice]'))listen(button,'click',()=>save('mode',button.dataset.modeChoice));
    // Arrow keys move within this single-choice group; Tab remains native.
    listen(root.querySelector('.zmt-segmented'),'keydown',event=>{
      const buttons=[...root.querySelectorAll('[data-mode-choice]')];
      const index=buttons.indexOf(event.target);if(index<0)return;
      let next;
      if(event.key==='ArrowRight')next=(index+1)%buttons.length;
      else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=buttons.length-1;
      else return;
      event.preventDefault();buttons[next].focus();buttons[next].click();
    });
    for(const [i,preset] of PRESETS.entries()) {
      const button=query('zmt-preset-'+i);button.dataset.preset=preset.seed;button.textContent=this.t('zotero-veil-'+['preset-iris','preset-teal','preset-moss'][i]);
      listen(button,'click',()=>save('seed',preset.seed));
    }
    const text=query('zmt-seed-text');
    listen(text,'input',()=>{if(/^#[0-9a-f]{6}$/i.test(text.value.trim())){text.removeAttribute('aria-invalid');save('seed',text.value);}else{text.setAttribute('aria-invalid','true');report(this.t('zotero-veil-seed-error'),true);}});
    listen(text,'change',()=>{if(!save('seed',text.value))text.setAttribute('aria-invalid','true');else text.removeAttribute('aria-invalid');});
    listen(query('zmt-seed-color'),'input',event=>{text.removeAttribute('aria-invalid');save('seed',event.target.value);});
    listen(query('zmt-reduce-motion'),'change',event=>save('reduceMotion',event.target.checked));
    listen(query('zmt-glass'),'change',event=>save('glass',event.target.checked));
    listen(query('zmt-glass-level'),'change',event=>save('glassLevel',event.target.value));
    listen(query('zmt-glass-transparency'),'input',event=>save('glassTransparency',Number(event.target.value)));
    const unmounted=()=>this.unmountSettings(root);
    listen(root,'unload',unmounted);listen(win,'unload',unmounted);
    this.settings.set(root,{update,cleanup});update();
  }
  unmountSettings(root) {const record=this.settings.get(root);if(!record)return;this.settings.delete(root);this.cleanup(record.cleanup);}
  attachReader(doc) {
    if(!this.active||doc.documentURI!=='resource://zotero/reader/reader.html')return;
    // renderToolbar supplies a waived Xray document, whereas browser access
    // returns an Xray. Normalize identity so restart and event paths agree.
    doc=doc.wrappedJSObject??doc;if(this.readers.has(doc))return;
    const win=doc.defaultView,sheet=doc.createElement('style');sheet.id='zmt-reader-sheet';
    const record={doc,win,sheet,dark:win.matchMedia('(prefers-color-scheme:dark)'),motion:win.matchMedia('(prefers-reduced-motion:reduce)'),cleanups:[]};
    const changed=()=>this.applyReader(record);
    // Gecko dispatches load for inline styles too. Listening to our own sheet
    // would repeatedly replace it and schedule another load indefinitely.
    const frameLoaded=event=>{if(event.target?.localName==='iframe')this.applyReader(record);};
    doc.addEventListener?.('load',frameLoaded,true);record.cleanups.push(()=>doc.removeEventListener?.('load',frameLoaded,true));
    for(const media of [record.dark,record.motion]){media.addEventListener('change',changed);record.cleanups.push(()=>media.removeEventListener('change',changed));}
    const unload=()=>this.detachReader(doc);win.addEventListener('unload',unload,{once:true});record.cleanups.push(()=>win.removeEventListener('unload',unload));
    this.readers.set(doc,record);doc.head.append(sheet);this.applyReader(record);
  }
  applyReader(record) {
    if(!this.active||record.win.closed)return;
    const settings=this.readSettings(),mode=effectiveMode(settings.mode,record.dark.matches);
    const owner=[...this.windows.values()].find(({win})=>[...win.document.querySelectorAll('browser[src="resource://zotero/reader/reader.html"]')].some(frame=>(frame.contentDocument?.wrappedJSObject??frame.contentDocument)===record.doc));
    const glass=owner?.root.getAttribute('data-zmt-glass')==='native';
    syncPDFMargins(record,glass);
    const css=readerCSS(createScheme(settings.seed,mode==='dark'),settings.reduceMotion||record.motion.matches,{glass,level:settings.glassLevel,transparency:settings.glassTransparency});
    if(record.sheet.textContent!==css)record.sheet.textContent=css;
  }
  detachReader(doc) {const record=this.readers.get(doc);if(!record)return;this.readers.delete(doc);this.cleanup([...record.cleanups,()=>clearPDFMargins(record),()=>record.sheet.remove()]);}
  stop() {
    this.active=false;++this.generation;
    const paneID=this.paneID;this.paneID=null;
    const observers=this.observers;this.observers=[];this.cache.clear();
    this.cleanup([
      // Unregister first: a failed listener cleanup must never keep the pane.
      ...((paneID||this.startPending)?[()=>this.zotero.PreferencePanes.unregister(paneID??PANE_ID)]:[]),
      ...[...this.settings.keys()].map(root=>()=>this.unmountSettings(root)),
      ...[...this.windows.keys()].map(win=>()=>this.detachWindow(win)),
      ...[...this.readers.keys()].map(doc=>()=>this.detachReader(doc)),
      ()=>this.nativeGlass.stop(),
      ()=>this.zotero.Reader.unregisterEventListener('renderToolbar',this.readerListener),
      ...observers.map(observer=>()=>this.zotero.Prefs.unregisterObserver(observer))
    ]);
  }
}
