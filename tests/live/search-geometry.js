const c=Zotero.MaterialThemeMD3,out=[],check=win.ZMTTest.check;
win.ZMTTest.directory=project+'/docs/validation/current';win.Zotero_Tabs.select('zotero-pane');win.ZoteroPane.toggleAdvancedSearchState('open');
const original={width:win.outerWidth,height:win.outerHeight};
try{
 for(const mode of ['light','dark'])for(const width of [900,1200,1500]){
  c.setSetting('mode',mode);win.resizeTo(width,750);await Zotero.Promise.delay(150);
  const deck=win.document.getElementById('zotero-advanced-search-pane-deck'),bound=deck.getBoundingClientRect();
  const rows=[...deck.querySelectorAll('.search-condition')];const overflow=[];
  for(const row of rows){const rect=row.getBoundingClientRect();if(rect.right>bound.right+1)overflow.push('row');
   for(const child of row.children){const r=child.getBoundingClientRect();if(r.width>0&&(r.right>bound.right+1||r.left<bound.left-1))overflow.push(child.id);}
  }
  out.push(check(mode+'/'+width+' conditions stay inside their pane',overflow.length===0,{actualWidth:win.innerWidth,paneWidth:bound.width,overflow}));
  await win.ZMTTest.snapshot(mode+'-search-width-'+width);
 }
}finally{win.resizeTo(original.width,original.height);win.ZoteroPane.toggleAdvancedSearchState('closed');}
return win.ZMTTest.record('search-geometry',out);
