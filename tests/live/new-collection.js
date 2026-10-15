// Actual Zotero modal dialog with programmatic accept/cancel, isolated library only.
const results=[],parent=await Zotero.Collections.getAsync(1),created=[];
const saved=Object.fromEntries(['mode','glass'].map(k=>[k,Zotero.Prefs.get('materialThemeMD3.'+k)]));
await IOUtils.makeDirectory(project+'/docs/validation/current',{ignoreExisting:true});
try{
 for(const mode of ['light','dark'])for(const glass of [false,true])for(const accept of [false,true]){
  Zotero.Prefs.set('materialThemeMD3.mode',mode);Zotero.Prefs.set('materialThemeMD3.glass',glass);await Zotero.Promise.delay(150);
  await win.ZoteroPane.collectionsView.selectCollection(1);
  let seen=false,operated=false;
  const observer={observe(subject,topic){if(topic!=='domwindowopened')return;const dialog=subject;dialog.addEventListener('load',()=>{if(!dialog.location.href.includes('newCollectionDialog'))return;seen=true;dialog.setTimeout(()=>{operated=true;const element=dialog.document.querySelector('dialog');if(accept){dialog.document.getElementById('name').value='Veil isolated modal regression';element.acceptDialog();}else element.cancelDialog();},150);},{once:true});}};
  Services.ww.registerNotification(observer);let id;
  try{id=await win.ZoteroPane.newCollection(parent.key);}finally{Services.ww.unregisterNotification(observer);}
  if(id){created.push(id);await win.ZoteroPane.collectionsView.selectCollection(id);}
  await Zotero.Promise.delay(200);
  const valid=seen&&operated&&(accept?!!id&&(await Zotero.Collections.getAsync(id)).parentID===parent.id:id===null);
  if(!valid)throw new Error('Modal regression failed');
  results.push({mode,glass,action:accept?'accept':'cancel',passed:true,dialogLoaded:seen,childID:id});
 }
 return results;
}finally{
 await win.ZoteroPane.collectionsView.selectCollection(1);
 for(const id of created){const collection=await Zotero.Collections.getAsync(id);await collection.eraseTx();}
 for(const [key,value]of Object.entries(saved))Zotero.Prefs.set('materialThemeMD3.'+key,value);
 await IOUtils.writeJSON(project+'/docs/validation/current/new-collection.json',results);
}
