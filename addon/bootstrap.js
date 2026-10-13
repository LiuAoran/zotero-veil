var controller;
var bundleScope;
var lifecycleGeneration=0;
async function startup({id,rootURI,version}) {
  const generation=++lifecycleGeneration;
  await Zotero.initializationPromise;
  if(generation!==lifecycleGeneration)return;
  bundleScope={};
  Services.scriptloader.loadSubScriptWithOptions(rootURI+'content/theme.js',{target:bundleScope,charset:'UTF-8',ignoreCache:true});
  controller=new bundleScope.ZMTBundle.ThemeController({zotero:Zotero,rootURI,id,version,nativeEnvironment:{services:Services,chromeUtils:ChromeUtils,ci:Ci}});
  Zotero.MaterialThemeMD3=controller;
  try {await controller.start();}
  catch(error){delete Zotero.MaterialThemeMD3;controller=null;bundleScope=null;throw error;}
}
function shutdown() {
  ++lifecycleGeneration;
  if(!controller)return;
  try{controller.stop();}
  finally{
    if(Zotero.MaterialThemeMD3===controller)delete Zotero.MaterialThemeMD3;
    controller=null;bundleScope=null;
  }
}
function onMainWindowLoad({window}) {controller?.attachWindow(window);}
function onMainWindowUnload({window}) {controller?.detachWindow(window);}
function install() {}
function uninstall({id}={}) {
  try{shutdown();}
  finally{
    // Zotero calls shutdown before uninstall. unregister() reloads settings even
    // when the pane is absent, so never repeat it after successful shutdown.
    if(Zotero.PreferencePanes.pluginPanes?.some(pane=>pane.id==='zmt-material-theme'&&pane.pluginID===id)){
      Zotero.PreferencePanes.unregister('zmt-material-theme');
    }
  }
}
