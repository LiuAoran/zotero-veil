const results=[];
const panes=Zotero.PreferencePanes,original=panes._refreshPreferences;
try{
 for(let cycle=0;cycle<3;cycle++){
  const file=Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
  file.initWithPath(project+'/dist/zotero-veil-1.0.1.xpi');
  await(await AddonManager.getInstallForFile(file)).install();
  Zotero.MaterialThemeMD3.setSetting('glass',true);
  await Zotero.Reader.open(72);
  Zotero.Utilities.Internal.openPreferences('zmt-material-theme');
  await Zotero.Promise.delay(400);
  const controller=Zotero.MaterialThemeMD3;
  let reloads=0;panes._refreshPreferences=function(){reloads++;return original.apply(this,arguments);};
  const addon=await AddonManager.getAddonByID('material-theme-md3@zotero-theme.local');
  const start=Date.now();await addon.uninstall();await Zotero.Promise.delay(400);
  const result={cycle:cycle+1,reloads,elapsed:Date.now()-start,
    removed:!(await AddonManager.getAddonByID(addon.id)),
    resourcesCleared:controller.windows.size===0&&controller.readers.size===0&&controller.settings.size===0&&controller.nativeGlass.records.size===0,
    paneRemoved:!panes.pluginPanes.some(p=>p.id==='zmt-material-theme'),
    bridgeResponsive:true};
  if(reloads!==1||!result.removed||!result.resourcesCleared||!result.paneRemoved)throw Error(JSON.stringify(result));
  results.push(result);panes._refreshPreferences=original;
 }
 await IOUtils.writeJSON(project+'/docs/validation/current/uninstall.json',results);
 return results;
}finally{panes._refreshPreferences=original;}
