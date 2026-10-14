const c=Zotero.MaterialThemeMD3,out=[],check=win.ZMTTest.check,doc=win.document;
win.ZMTTest.directory=project+'/docs/validation/current';win.Zotero_Tabs.select('zotero-pane');c.setSetting('glass',true);c.setSetting('glassTransparency',100);
const lookup=doc.getElementById('zotero-lookup-panel'),deck=doc.getElementById('zotero-advanced-search-pane-deck');
const originalLocale=Services.locale.requestedLocales.slice();
for(const mode of ['light','dark']){
 c.setSetting('mode',mode);await Zotero.Promise.delay(150);
 const main=win.getComputedStyle(doc.documentElement).backgroundColor;
 lookup.hidePopup();await Zotero.Promise.delay(100);lookup.openPopup(doc.getElementById('zotero-tb-lookup'),'after_start',0,0,false,false);lookup.panelContent.getBoundingClientRect();await Zotero.Promise.delay(300);
 out.push(check(mode+' lookup paints rounded content without outer fill',lookup.state!=='closed'&&win.getComputedStyle(lookup).backgroundColor==='rgba(0, 0, 0, 0)'&&win.getComputedStyle(lookup.panelContent).backgroundColor.startsWith('rgb('),{state:lookup.state,host:win.getComputedStyle(lookup).backgroundColor,part:win.getComputedStyle(lookup.panelContent).backgroundColor}));
 const input=doc.getElementById('zotero-lookup-textbox');input.value='test input';input.dispatchEvent(new win.Event('input',{bubbles:true}));
 out.push(check(mode+' identifier field remains editable',input.value==='test input'&&input.getBoundingClientRect().width>0));input.value='';lookup.hidePopup();
 win.ZoteroPane.toggleAdvancedSearchState('open');await Zotero.Promise.delay(150);
 out.push(check(mode+' advanced search has an opaque surface',!deck.hidden&&win.getComputedStyle(deck).backgroundColor.startsWith('rgb(')));
 out.push(check(mode+' main window glass is unchanged',win.getComputedStyle(doc.documentElement).backgroundColor===main));
 await win.ZMTTest.snapshot(mode+'-advanced-search-surface');win.ZoteroPane.toggleAdvancedSearchState('closed');
 out.push(check(mode+' search can close normally',deck.hidden&&lookup.state==='closed'));
}
out.push(check('Popup styling does not change language',JSON.stringify(originalLocale)===JSON.stringify(Services.locale.requestedLocales)));
const before=win.getComputedStyle(deck).backgroundColor;const addon=await AddonManager.getAddonByID('material-theme-md3@zotero-theme.local');await addon.disable();
out.push(check('Disable removes popup overrides',win.getComputedStyle(deck).backgroundColor!==before&&!doc.getElementById('zmt-theme-sheet')));await addon.enable();
return win.ZMTTest.record('popup-surfaces',out);
