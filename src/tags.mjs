// Zotero 10's virtualized TagList measures text independently of CSS padding.
// Adapt only this window's instance and restore every method on disable.
export function attachTagSpacing(win){
  const host=win.document.getElementById('zotero-tag-selector');
  if(!host||!win.MutationObserver)return ()=>{};
  const records=new Map();let active=true;
  const refresh=t=>{
    if(win.closed||!t.tagListRef?.current)return;
    const font=t.getFontInfo(),tag=host.querySelector('.tag-selector-item');
    if(active&&tag)font.lineHeight=win.getComputedStyle(tag).lineHeight;
    t.setState({...font,...t.getContainerDimensions()});
  };
  const restore=(list,r)=>{
    if(r.t.getFontInfo===r.font)r.t.getFontInfo=r.fontInfo;
    if(r.t.getWidth===r.measured)r.t.getWidth=r.width;
    if(r.t.getContainerDimensions===r.sized)r.t.getContainerDimensions=r.dimensions;
    if(list.updatePositions===r.spaced)list.updatePositions=r.positions;
  };
  const attach=()=>{
    if(!active)return;
    const t=win.ZoteroPane?.tagSelector,list=t?.tagListRef?.current;
    if(!list||records.has(list)||typeof t.getWidth!=='function'||typeof t.getContainerDimensions!=='function'||typeof t.getFontInfo!=='function'||typeof list.updatePositions!=='function')return;
    // A list can remount while its container instance survives. Never stack wrappers.
    for(const [oldList,record] of records){if(record.t===t){restore(oldList,record);records.delete(oldList);}}
    const width=t.getWidth,dimensions=t.getContainerDimensions,fontInfo=t.getFontInfo,positions=list.updatePositions;
    const font=function(...args){const info=fontInfo.apply(this,args),tag=host.querySelector('.tag-selector-item');if(tag)info.lineHeight=win.getComputedStyle(tag).lineHeight;return info;};
    const measured=function(...args){return width.apply(this,args)+16;};
    const sized=function(...args){const size=dimensions.apply(this,args);return {...size,width:Math.max(0,size.width-8)};};
    const spaced=function(...args){const result=positions.apply(this,args);let previous=null,row=-1;for(const position of this.positions){const y=position[1];if(y!==previous){row++;previous=y;}position[1]+=row*4;}return result;};
    t.getWidth=measured;t.getContainerDimensions=sized;t.getFontInfo=font;list.updatePositions=spaced;
    records.set(list,{t,width,dimensions,fontInfo,font,positions,measured,sized,spaced});
    host.setAttribute('data-zmt-tags','spacious');refresh(t);
  };
  const observer=new win.MutationObserver(attach);observer.observe(host,{childList:true,subtree:true});
  const sheet=win.document.getElementById('zmt-theme-sheet');
  const loaded=()=>{attach();for(const {t} of records.values())refresh(t);};
  sheet?.addEventListener('load',loaded,{once:true});
  attach();
  return ()=>{
    active=false;observer.disconnect();sheet?.removeEventListener('load',loaded);host.removeAttribute('data-zmt-tags');
    for(const [list,r] of records){
      restore(list,r);
      // Controller removes its stylesheet synchronously after this cleanup.
      Promise.resolve().then(()=>refresh(r.t)).catch(error=>win.Zotero?.logError(error));
    }
    records.clear();
  };
}
