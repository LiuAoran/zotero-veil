// Run only through the isolated-profile bridge, against existing synthetic tags.
const results=[],t=win.ZoteroPane.tagSelector,host=win.document.getElementById('zotero-tag-selector');
win.ZMTTest.directory=project+'/docs/validation/current';
const saved=Object.fromEntries(['mode','seed','glass'].map(key=>[key,Zotero.Prefs.get('materialThemeMD3.'+key)]));
const pause=()=>Zotero.Promise.delay(300);
try{
 Zotero.Prefs.set('materialThemeMD3.glass',false);
 for(const mode of ['light','dark']){
  Zotero.Prefs.set('materialThemeMD3.mode',mode);await pause();
  const nodes=[...host.querySelectorAll('.tag-selector-item')],rects=nodes.map(n=>n.getBoundingClientRect());
  let overlap=false;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top))overlap=true;}
  results.push(win.ZMTTest.check(mode+' roomy chips wrap without overlap',nodes.length>=8&&!overlap&&nodes.every(n=>parseFloat(win.getComputedStyle(n).paddingInlineStart)===10)&&new Set(rects.map(r=>r.top)).size>1,{count:nodes.length}));
  const bounds=host.getBoundingClientRect();results.push(win.ZMTTest.check(mode+' outside inset',rects.every(r=>r.left>=bounds.left+10&&r.right<=bounds.right-8),{}));
  const node=nodes[0];node.click();await pause();results.push(win.ZMTTest.check(mode+' native filter selection',host.querySelector('.tag-selector-item.selected')?.textContent===node.textContent,{}));host.querySelector('.tag-selector-item.selected').click();await pause();
  const backgrounds=[];for(const seed of ['#6750A4','#006C4C']){Zotero.Prefs.set('materialThemeMD3.seed',seed);await pause();backgrounds.push(win.getComputedStyle(host.querySelector('.tag-selector-item')).backgroundColor);}
  results.push(win.ZMTTest.check(mode+' background follows seed',backgrounds[0]!==backgrounds[1],{backgrounds}));
  await win.ZMTTest.snapshot('tag-spacing-'+mode);
 }
 const label=host.querySelector('.tag-selector-item').textContent,width=t.getWidth(label);
 const addon=await AddonManager.getAddonByID('material-theme-md3@zotero-theme.local');await addon.disable();await pause();
 results.push(win.ZMTTest.check('disable restores measurements and spacing marker',Math.abs(width-t.getWidth(label)-16)<.01&&!host.hasAttribute('data-zmt-tags'),{}));
 await addon.enable();await pause();results.push(win.ZMTTest.check('enable reapplies spacing once',Math.abs(width-t.getWidth(label))<.01&&host.getAttribute('data-zmt-tags')==='spacious',{}));
 return await win.ZMTTest.record('tag-spacing',results);
}finally{for(const [key,value]of Object.entries(saved))Zotero.Prefs.set('materialThemeMD3.'+key,value);}
