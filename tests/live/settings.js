Zotero.Utilities.Internal.openPreferences('zmt-material-theme');
await Zotero.Promise.delay(700);
const prefs=Services.wm.getMostRecentWindow('zotero:pref');
await prefs.Zotero_Preferences.waitForFirstPaneLoad();
const root=prefs.document.getElementById('zmt-settings');
const controller=Zotero.MaterialThemeMD3;
return {window:!!prefs,markup:root?.outerHTML.slice(0,1800),mounted:controller.settings.size,styles:prefs.document.documentElement.getAttribute('data-zmt-mode'),panes:[...prefs.Zotero_Preferences.panes.keys()],rootExists:!!root};
