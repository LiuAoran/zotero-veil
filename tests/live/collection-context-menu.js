let seen=false,closed=false;
const watcher={observe(subject,topic){if(topic!=='domwindowopened')return;const d=subject;d.addEventListener('load',()=>{if(!d.location.href.includes('newCollectionDialog'))return;seen=true;d.setTimeout(()=>{closed=true;d.document.querySelector('dialog').cancelDialog();},250);},{once:true});}};
Services.ww.registerNotification(watcher);
try{
 await win.ZoteroPane.collectionsView.selectCollection(1);
 await win.ZoteroPane.buildCollectionContextMenu();
 const popup=win.document.getElementById('zotero-collectionmenu');
 popup.openPopup(win.document.getElementById('zotero-collections-tree'),'after_start',0,0,true,false);
 await Zotero.Promise.delay(200);
 const node=popup.querySelectorAll('.zotero-menuitem-new-collection')[1];
 node.doCommand();popup.hidePopup();await Zotero.Promise.delay(350);
 return {seen,closed};
}finally{Services.ww.unregisterNotification(watcher);}
