const c=Zotero.MaterialThemeMD3,out=[],check=win.ZMTTest.check;
win.ZMTTest.directory=project+'/docs/validation/current';
const attachmentID=win.ZMTTest.fixtures.attachment;await Zotero.Reader.open(attachmentID);
const r=Zotero.Reader._readers.find(r=>r.itemID===attachmentID);await r._initPromise;win.Zotero_Tabs.select(r.tabID);
const d=r._internalReader._primaryView._iframeWindow.document;
c.setSetting('glass',false);await Zotero.Promise.delay(200);
const bg=s=>d.defaultView.getComputedStyle(d.querySelector(s)).backgroundColor;
const original={body:bg('body'),viewport:bg('#viewerContainer'),page:bg('.page'),canvas:bg('canvas')};

const path=await Zotero.Items.get(attachmentID).getFilePathAsync(),bytes=await IOUtils.read(path);
for(const mode of ['light','dark']){
 c.setSetting('mode',mode);c.setSetting('glass',false);await Zotero.Promise.delay(1000);
 const canvas=d.querySelector('canvas'),pixels=canvas.toDataURL(),pageColor=bg('.page'),canvasColor=bg('canvas');
 c.setSetting('glass',true);c.setSetting('glassTransparency',100);await Zotero.Promise.delay(250);
 out.push(check(mode+' page exterior is transparent',bg('body')==='rgba(0, 0, 0, 0)'&&bg('#viewerContainer')==='rgba(0, 0, 0, 0)'));
 out.push(check(mode+' paper and canvas paint unchanged',bg('.page')===pageColor&&bg('canvas')===canvasColor&&canvas.toDataURL()===pixels));
 out.push(check(mode+' soft side separation retained',win.getComputedStyle(win.document.getElementById('zotero-context-pane-inner')).backgroundColor.includes('/ 0.08)')));
 await win.ZMTTest.snapshot(mode+'-pdf-transparent-margin');
}
c.setSetting('glass',false);await Zotero.Promise.delay(100);
out.push(check('Glass off restores original PDF margin',bg('body')===original.body&&bg('#viewerContainer')===original.viewport&&!d.getElementById('zmt-pdf-margin-sheet')));
c.setSetting('glass',true);const addon=await AddonManager.getAddonByID('material-theme-md3@zotero-theme.local');await addon.disable();
out.push(check('Disable removes PDF stylesheet and restores margin',!d.getElementById('zmt-pdf-margin-sheet')&&bg('body')===original.body));
await addon.enable();await Zotero.Promise.delay(150);
out.push(check('Reenable attaches exactly one margin stylesheet',d.querySelectorAll('#zmt-pdf-margin-sheet').length===1));
const after=await IOUtils.read(path);out.push(check('PDF file bytes unchanged',bytes.length===after.length&&bytes.every((v,i)=>after[i]===v)));
return win.ZMTTest.record('pdf-margin',out);
