import test from 'node:test';
import assert from 'node:assert/strict';
import {attachTagSpacing} from '../src/tags.mjs';
function fixture(){
 let mutation;const attrs=new Map();
 const host={setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),querySelector:()=>({})};
 const makeList=()=>({updatePositions(){this.positions=[[8,9],[30,9],[8,30]];}});
 const selector={tagListRef:{current:makeList()},getWidth:()=>80,getContainerDimensions:()=>({width:200,height:160}),getFontInfo:()=>({lineHeight:'16px'}),setState(state){this.state=state;}};
 const win={document:{getElementById:id=>id==='zotero-tag-selector'?host:null},ZoteroPane:{tagSelector:selector},getComputedStyle:()=>({lineHeight:attrs.size?'22px':'16px'}),MutationObserver:class{constructor(fn){mutation=fn;}observe(){}disconnect(){mutation=()=>{};}}};
 return {win,selector,attrs,makeList,mutate:()=>mutation()};
}
test('Tag list remounts and mutation deliveries cannot accumulate spacing; disable restores native measurements',async()=>{
 const f=fixture(),original=f.selector.getWidth,stop=attachTagSpacing(f.win),width=f.selector.getWidth('tag');
 f.mutate();f.mutate();assert.equal(f.selector.getWidth('tag'),width);
 f.selector.tagListRef.current=f.makeList();f.mutate();assert.equal(f.selector.getWidth('tag'),width);
 stop();await Promise.resolve();assert.equal(f.selector.getWidth,original);assert.equal(f.selector.getContainerDimensions().width,200);assert.equal(f.attrs.size,0);
});
test('Unsupported tag selector remains untouched',()=>{
 const f=fixture();f.selector.getWidth=null;const stop=attachTagSpacing(f.win);assert.equal(f.attrs.size,0);stop();
});
