import test from 'node:test';
import assert from 'node:assert/strict';
import {ThemeController} from '../src/controller.mjs';
test('Event and browser wrappers share one reader sheet and the same native owner',()=>{
 const uri='resource://zotero/reader/reader.html',sheets=[];
 const media={matches:false,addEventListener(){},removeEventListener(){}};
 const readerWin={closed:false,matchMedia:()=>media,addEventListener(){},removeEventListener(){}};
 const doc={documentURI:uri,defaultView:readerWin,head:{append:sheet=>sheets.push(sheet)},createElement:()=>({textContent:'',remove(){}})};
 const wrapper={documentURI:uri,wrappedJSObject:doc};
 const mainWin={document:{querySelectorAll:()=>[{contentDocument:wrapper}]}};
 const c=new ThemeController({zotero:{Prefs:{get:key=>key.endsWith('.glass')?true:undefined},logError(){}},rootURI:'file:///test/',id:'test',version:'test'});
 c.active=true;c.windows.set(mainWin,{win:mainWin,root:{getAttribute:()=> 'native'}});
 c.attachReader(doc);c.attachReader(wrapper);
 assert.equal(sheets.length,1);assert.equal(c.readers.size,1);
 assert.ok(sheets[0].textContent.includes('#reader-ui .toolbar{background:transparent}'));
 c.detachReader(doc);assert.equal(c.readers.size,0);
});

test('Reader style load cannot recursively refresh; frames and settings still update',()=>{
 const loads=[],queue=[];let writes=0,text='',seed='#6750A4';
 const sheet={localName:'style',get textContent(){return text;},set textContent(value){text=value;writes++;queue.push({target:this});},remove(){}};
 const media={matches:false,addEventListener(){},removeEventListener(){}};
 const win={closed:false,matchMedia:()=>media,addEventListener(){},removeEventListener(){}};
 const doc={documentURI:'resource://zotero/reader/reader.html',defaultView:win,head:{append(){}},createElement:()=>sheet,
  addEventListener(type,fn){if(type==='load')loads.push(fn);},removeEventListener(type,fn){const i=loads.indexOf(fn);if(i>=0)loads.splice(i,1);},querySelectorAll:()=>[]};
 const c=new ThemeController({zotero:{Prefs:{get:key=>key.endsWith('.seed')?seed:undefined},logError(){}},rootURI:'file:///test/',id:'test',version:'test'});
 c.active=true;let calls=0;const apply=c.applyReader;c.applyReader=function(r){calls++;return apply.call(this,r);};
 c.attachReader(doc);
 const drain=()=>{for(let i=0;queue.length&&i<10;i++){const event=queue.shift();for(const fn of loads)fn(event);}assert.equal(queue.length,0,'style loads must settle');};
 drain();assert.equal(calls,1);assert.equal(writes,1);
 loads[0]({target:{localName:'img'}});assert.equal(calls,1);
 loads[0]({target:{localName:'iframe'}});assert.equal(calls,2);assert.equal(writes,1,'unchanged frame load must not rewrite styles');
 const old=text;seed='#008577';c.refresh();drain();assert.notEqual(text,old);assert.equal(writes,2);
 c.refresh();drain();assert.equal(writes,2,'unchanged refresh must be idempotent');
 c.detachReader(doc);assert.equal(loads.length,0);
});
