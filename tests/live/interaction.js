win.ZMTTest.directory=project+'/docs/validation/current';
Services.wm.getMostRecentWindow('zotero:pref')?.close();
const results=[],check=win.ZMTTest.check,doc=win.document,fixtures=win.ZMTTest.fixtures;
win.Zotero_Tabs.select('zotero-pane');await win.ZoteroPane.collectionsView.selectCollection(fixtures.collection);await win.ZoteroPane.selectItem(fixtures.ids[0]);
function mouse(target,type,x,y,buttons){target.dispatchEvent(new win.MouseEvent(type,{view:win,bubbles:true,cancelable:true,button:0,buttons,clientX:x,clientY:y}));}
for(const mode of ['light','dark']){
 Zotero.MaterialThemeMD3.setSetting('mode',mode);await Zotero.Promise.delay(100);
 const header=doc.querySelector('#zotero-items-tree .virtualized-table-header'),title=header.querySelector('.cell.title'),creator=header.querySelector('.cell.firstCreator');
 const resizer=creator.querySelector('.resizer'),r=resizer.getBoundingClientRect(),before=title.getBoundingClientRect().width;
 results.push(check(mode+' column drag handle retains hit region',r.width>=5&&r.height>10,{width:r.width,height:r.height}));
 const x=r.left+r.width/2,y=r.top+r.height/2;
 mouse(resizer,'mousedown',x,y,1);await Zotero.Promise.delay(50);
 mouse(doc,'mousemove',x-24,y,1);await Zotero.Promise.delay(50);
 mouse(doc,'mouseup',x-24,y,0);await Zotero.Promise.delay(50);
 const after=title.getBoundingClientRect().width;
 results.push(check(mode+' original DOM mouse handlers resize the column',Math.abs(before-after)>10,{before,after,input:'synthetic MouseEvent, not physical input'}));
 // Restore through the same event path, rather than invoking column internals.
 const restore=creator.querySelector('.resizer').getBoundingClientRect();
 const start=restore.left+restore.width/2;
 mouse(creator.querySelector('.resizer'),'mousedown',start,y,1);await Zotero.Promise.delay(50);
 mouse(doc,'mousemove',start+(before-after),y,1);await Zotero.Promise.delay(50);
 mouse(doc,'mouseup',start+(before-after),y,0);await Zotero.Promise.delay(50);
 const tree=doc.querySelector('#zotero-items-tree .virtualized-table');tree.focus();
 tree.dispatchEvent(new win.KeyboardEvent('keydown',{key:'a',code:'KeyA',keyCode:65,metaKey:true,bubbles:true}));await Zotero.Promise.delay(50);
 results.push(check(mode+' Cmd+A handler selects all entries',win.ZoteroPane.getSelectedItems().length===70));await win.ZoteroPane.selectItem(fixtures.ids[0]);
 const search=doc.getElementById('zotero-tb-search');search.value='Research workflow study 05';await win.ZoteroPane.search();
 results.push(check(mode+' quick search still narrows the view',win.ZoteroPane.itemsView.getSortedItems().length===1));search.value='';await win.ZoteroPane.search();await win.ZoteroPane.selectItem(fixtures.ids[0]);await Zotero.Promise.delay(100);
 const expectedTitle=Zotero.Items.get(fixtures.ids[0]).getField('title');
 const fullTitle=doc.querySelector('#zotero-items-tree .row.selected .cell-text');
 const textRect=fullTitle.getBoundingClientRect();mouse(fullTitle,'mouseover',textRect.left+4,textRect.top+4,0);
 const truncated=fullTitle.offsetWidth<fullTitle.scrollWidth;
 results.push(check(mode+' native hover preserves readable full title',fullTitle.textContent===expectedTitle&&(!truncated||fullTitle.getAttribute('title')===expectedTitle),{truncated,tooltip:fullTitle.getAttribute('title')}));
 await win.ZMTTest.snapshot(mode+'-interaction');
}
const splitter=doc.getElementById('zotero-collections-splitter'),splitRect=splitter.getBoundingClientRect();
results.push(check('Panel splitter retains native element and visible hit region',splitter.localName==='splitter'&&splitRect.width>0&&splitRect.height>0,{width:splitRect.width,height:splitRect.height,physicalDrag:'not verified: no isolated native input tool available'}));
return await win.ZMTTest.record('interaction',results);
