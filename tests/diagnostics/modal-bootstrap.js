var veilDiagnosticCleanups=[];
var veilDiagnosticWindows=new Set();
function veilTrace(stage){
 try{
  const file=Services.dirsvc.get('TmpD',Ci.nsIFile);file.append('zotero-veil-modal-diagnostic.log');
  const stream=Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
  stream.init(file,0x02|0x08|0x10,0o600,0);
  const line=new Date().toISOString()+' '+stage+'\n';stream.write(line,line.length);stream.close();
 }catch(e){Zotero.logError(e);}
}
function veilTraceWindow(win){
 if(veilDiagnosticWindows.has(win)||!win.ZoteroPane)return;
 veilDiagnosticWindows.add(win);veilTrace('window.instrumented');
 const pane=win.ZoteroPane;
 for(const name of ['newCollection','buildCollectionContextMenu']){
  const original=pane[name];if(typeof original!=='function')continue;
  const wrapped=function(...args){
   veilTrace(name+'.enter');
   try{const result=original.apply(this,args);return Promise.resolve(result).then(value=>{veilTrace(name+'.resolved');return value;},error=>{veilTrace(name+'.rejected');throw error;});}
   catch(error){veilTrace(name+'.throw');throw error;}
  };
  pane[name]=wrapped;veilDiagnosticCleanups.push(()=>{if(pane[name]===wrapped)pane[name]=original;});
 }
 const original=win.openDialog;
 const wrapped=function(...args){
  const relevant=String(args[0]).includes('newCollectionDialog');
  if(relevant)veilTrace('openDialog.enter');
  try{const result=original.apply(this,args);if(relevant)veilTrace('openDialog.return');return result;}
  catch(error){if(relevant)veilTrace('openDialog.throw');throw error;}
 };
 win.openDialog=wrapped;veilDiagnosticCleanups.push(()=>{if(win.openDialog===wrapped)win.openDialog=original;});
}
var veilDiagnosticWatcher={observe(subject,topic){
 if(topic!=='domwindowopened')return;veilTrace('window.opened');
 const child=subject;
 const log=stage=>{try{if(child.location.href.includes('newCollectionDialog'))veilTrace(stage);}catch{}};
 child.addEventListener('DOMContentLoaded',()=>log('dialog.DOMContentLoaded'),{once:true});
 child.addEventListener('load',()=>log('dialog.load'),{once:true});
 child.addEventListener('unload',()=>log('dialog.unload'),{once:true});
}};
