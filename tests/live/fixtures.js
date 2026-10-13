if((await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).length)throw new Error('Fixture setup requires an empty isolated library');
const collection=new Zotero.Collection();collection.name='Material 主题测试';await collection.saveTx();
const empty=new Zotero.Collection();empty.name='空分类';await empty.saveTx();
const titles=['Designing accessible interfaces for long-duration scholarly work — A study of bilingual reference-management workflows and keyboard navigation','高密度科研文献列表中的长标题可读性：语义颜色、键盘焦点与批量整理的实证研究','Adaptive navigation for personal digital libraries','Beyond color: focus and selection in large virtualized tables'];
const ids=[];
for(let i=0;i<70;i++){
 const item=new Zotero.Item('journalArticle');item.setField('title',i<4?titles[i]:'Research workflow study '+String(i+1).padStart(2,'0')+' — Information organization and reading efficiency');item.setField('date',String(2020+i%6));item.setField('publicationTitle','Isolated Research Fixture Journal');item.setField('abstractNote','此条目为隔离测试的合成数据。用于验证详情编辑、长标题与标签显示。');item.setCreators([{firstName:'Test',lastName:['Chen','Wang','Li','Zhang'][i%4],creatorType:'author'}]);item.setTags([{tag:i%2?'交互设计':'可访问性'}]);item.setCollections([collection.id]);ids.push(await item.saveTx());
}
const note=new Zotero.Item('note');note.parentID=ids[0];note.setNote('<div data-schema-version="9"><p>隔离测试笔记。This is a synthetic note fixture.</p></div>');await note.saveTx();
win.ZMTTest.fixtures={ids,collection:collection.id,emptyCollection:empty.id,note:note.id};
await IOUtils.writeJSON(base+'/fixtures.json',win.ZMTTest.fixtures);
await win.ZoteroPane.collectionsView.selectCollection(collection.id);await win.ZoteroPane.selectItem(ids[0]);
return {items:ids.length,collection:collection.id,note:note.id,rowHeight:win.ZoteroPane.itemsView.tree._rowHeight};
