import test from 'node:test';
import assert from 'node:assert/strict';
import {deferredWindowRefresh} from '../src/window-refresh.mjs';
function harness(){let focused=true,calls=0,id=0;const pending=new Map(),win={closed:false,document:{hasFocus:()=>focused},setTimeout:fn=>{pending.set(++id,fn);return id;},clearTimeout:n=>pending.delete(n)};const deferred=deferredWindowRefresh(win,()=>calls++);return{win,deferred,blur:()=>focused=false,calls:()=>calls,flush(){for(const [id,fn]of pending){pending.delete(id);fn();}}};}
test('Modal activation never refreshes synchronously or while the main window is inactive',()=>{const h=harness();h.deferred.listener({target:h.win});assert.equal(h.calls(),0);h.blur();h.flush();assert.equal(h.calls(),0);});
test('Activation bursts coalesce, child activation is ignored and teardown cancels pending work',()=>{const h=harness();h.deferred.listener({target:{}});h.flush();assert.equal(h.calls(),0);h.deferred.listener({target:h.win});h.deferred.listener({target:h.win});h.flush();assert.equal(h.calls(),1);h.deferred.listener({target:h.win});h.deferred.dispose();h.flush();assert.equal(h.calls(),1);});
