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
