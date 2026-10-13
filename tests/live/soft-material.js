const c=Zotero.MaterialThemeMD3,out=[],check=win.ZMTTest.check;win.ZMTTest.directory=project+'/docs/validation/current';
win.Zotero_Tabs.select('zotero-pane');c.setSetting('glass',true);c.setSetting('glassTransparency',100);
for(const mode of ['light','dark']){
 c.setSetting('mode',mode);await Zotero.Promise.delay(200);
 const row=win.document.querySelector('#zotero-collections-tree .row:not(.selected)');
 out.push(check(mode+' ordinary navigation has no individual backing',win.getComputedStyle(row).backgroundColor==='rgba(0, 0, 0, 0)'));
 const item=win.document.querySelector('#zotero-items-tree .row:not(.selected)');if(item)out.push(check(mode+' ordinary item has no individual backing',win.getComputedStyle(item).backgroundColor==='rgba(0, 0, 0, 0)'));
 out.push(check(mode+' continuous side tone retained',win.getComputedStyle(win.document.getElementById('zotero-collections-pane')).backgroundColor.includes('/ 0.08)')));
 out.push(check(mode+' native blur preserved',c.nativeGlass.f.double(c.nativeGlass.records.get(win).effect,c.nativeGlass.sel('alphaValue'))===1));
 await win.ZMTTest.snapshot(mode+'-soft-library');
}
const addon=await AddonManager.getAddonByID('material-theme-md3@zotero-theme.local');await addon.disable();out.push(check('Disable restores original chrome',!win.document.documentElement.hasAttribute('data-zmt')&&c.nativeGlass.records.size===0));await addon.enable();await Zotero.Promise.delay(100);out.push(check('Reenable attaches one stylesheet',win.document.querySelectorAll('#zmt-theme-sheet').length===1));return win.ZMTTest.record('soft-material',out);
