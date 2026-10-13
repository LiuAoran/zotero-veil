import test from 'node:test';
import assert from 'node:assert/strict';
import {ThemeController,PANE_ID} from '../src/controller.mjs';

function environment(register=async()=>PANE_ID){
 const calls=[],live=new Set(),panes=new Set();
 const zotero={Prefs:{get:()=>undefined,registerObserver:()=>{const id=Symbol();live.add(id);return id;},unregisterObserver:id=>{live.delete(id);calls.push('observer');}},PreferencePanes:{register:async options=>{panes.add(options.id);return register();},unregister:id=>{panes.delete(id);calls.push('pane');}},Reader:{registerEventListener:()=>calls.push('reader-register'),unregisterEventListener:()=>calls.push('reader-unregister')},getMainWindows:()=>[],logError:error=>calls.push('error:'+error.message)};
 return {controller:new ThemeController({zotero,id:'test',rootURI:'file:///test/',version:'test'}),calls,live,panes};
}
test('A cleanup exception cannot leave the pane or remaining listeners registered',async()=>{
 const {controller,calls,live,panes}=environment();await controller.start();
 controller.settings.set({}, {cleanup:[()=>{throw new Error('unload failure');},()=>calls.push('settings-next')]});
 const win={},root={removeAttribute:key=>calls.push('attribute:'+key)};
 controller.windows.set(win,{cleanups:[()=>{throw new Error('media failure');}],sheet:{remove:()=>calls.push('sheet')},tokens:{remove:()=>calls.push('tokens')},root,attributes:new Map([['data-zmt',null]])});
 controller.stop();
 assert.equal(panes.size,0);assert.equal(live.size,0);assert.equal(controller.windows.size,0);assert.equal(controller.settings.size,0);
 assert.ok(calls.indexOf('pane')<calls.indexOf('settings-next'));
 assert.ok(calls.includes('sheet')&&calls.includes('tokens')&&calls.includes('reader-unregister')&&calls.includes('attribute:data-zmt'));
 controller.stop();assert.equal(live.size,0);
});
test('Stopping during asynchronous pane registration cannot resurrect the plugin',async()=>{
 let resolve;const {controller,live,panes,calls}=environment(()=>new Promise(r=>{resolve=r;}));
 const start=controller.start();await assert.rejects(controller.start(),/正在启动/);
 controller.stop();resolve(PANE_ID);await start;
 assert.equal(panes.size,0);assert.equal(live.size,0);assert.equal(controller.active,false);assert.equal(controller.startPending,false);
 assert.ok(!calls.includes('reader-register'));
});
test('Registration failure rolls back already registered preference observers',async()=>{
 const {controller,live}=environment(async()=>{throw new Error('pane unavailable');});
 await assert.rejects(controller.start(),/pane unavailable/);assert.equal(live.size,0);assert.equal(controller.active,false);
});
