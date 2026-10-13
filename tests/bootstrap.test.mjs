import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync('addon/bootstrap.js','utf8');
function setup(){
 let reloads=0,stops=0;
 const panes=[{id:'zmt-material-theme',pluginID:'veil'}];
 const context=vm.createContext({Zotero:{PreferencePanes:{pluginPanes:panes,unregister(){panes.length=0;reloads++;}}}});
 vm.runInContext(source,context);
 context.controller={stop(){stops++;context.Zotero.PreferencePanes.unregister();}};
 context.Zotero.MaterialThemeMD3=context.controller;
 return {context,counts:()=>({reloads,stops})};
}
test('Shutdown followed by uninstall reloads settings only once',()=>{
 const {context,counts}=setup();context.shutdown();context.uninstall({id:'veil'});context.shutdown();
 assert.deepEqual(counts(),{reloads:1,stops:1});assert.equal(context.Zotero.MaterialThemeMD3,undefined);
});
test('Uninstall without a controller cleans an owned orphan pane once',()=>{
 const {context,counts}=setup();context.controller=null;context.uninstall({id:'veil'});context.uninstall({id:'veil'});
 assert.deepEqual(counts(),{reloads:1,stops:0});
});
test('Shutdown during Zotero initialization cannot start a removed plugin',async()=>{
 const {context}=setup();context.controller=null;let resolve;
 context.Zotero.initializationPromise=new Promise(r=>resolve=r);
 const starting=context.startup({id:'veil'});context.shutdown();resolve();await starting;
 assert.equal(context.controller,null);
});
