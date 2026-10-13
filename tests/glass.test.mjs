import test from 'node:test';
import assert from 'node:assert/strict';
import {glassPolicy,GLASS_LEVELS,normalizeGlassLevel,normalizeTransparency} from '../src/glass.mjs';
import {createScheme,PRESETS} from '../src/palette.mjs';
import {NativeGlass} from '../src/native-glass.mjs';
import {ThemeController} from '../src/controller.mjs';
const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
const luminance=rgb=>rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('Legacy glass preferences migrate without losing their appearance; unsafe numeric values are rejected',()=>{
 const prefs={glassLevel:'quiet',glassTransparency:-1};
 const controller=new ThemeController({zotero:{Prefs:{get:key=>prefs[key.split('.').at(-1)]}},id:'test',rootURI:'file:///test/',version:'test'});
 assert.equal(controller.readSettings().glassTransparency,64);
 prefs.glassTransparency=0;assert.equal(controller.readSettings().glassTransparency,0);
 prefs.glassTransparency=100;assert.equal(controller.readSettings().glassTransparency,100);
 for(const value of [-1,101,NaN,Infinity,'50;display:none',null])assert.throws(()=>normalizeTransparency(value));
});
test('Material text stays readable over extreme backgrounds, including hover and pressed layers',()=>{
 const seeds=[...PRESETS.map(p=>p.seed),'#000000','#FFFFFF','#FF0000','#00FF00','#0000FF'];
 let value=12345678;for(let i=0;i<64;i++){value=(Math.imul(value,1664525)+1013904223)>>>0;seeds.push('#'+(value&0xffffff).toString(16).padStart(6,'0'));}
 for(const seed of seeds)for(const dark of [false,true])for(const alpha of Object.values(GLASS_LEVELS)){
  const roles=createScheme(seed,dark),base=rgb(roles.surfaceContainer),fg=rgb(roles.onSurface),secondary=rgb(roles.onSurfaceVariant);
  for(const wall of [0,1])for(const state of [0,.08,.12]){
   const composite=base.map((v,i)=>(v*alpha+wall*(1-alpha))*(1-state)+fg[i]*state);
   for(const text of [fg,secondary])assert.ok(contrast(text,composite)>=4.5,`${seed}/${dark}/${alpha}/${wall}/${state}`);
  }
 }
});
test('System accessibility and unavailable native rendering always fall back to solid material',()=>{
 assert.equal(glassPolicy({enabled:true,available:true}).active,true);
 for(const extra of [{enabled:false},{reducedTransparency:true},{increasedContrast:true},{available:false}])assert.equal(glassPolicy({enabled:true,available:true,...extra}).active,false);
 assert.throws(()=>normalizeGlassLevel('balanced;opacity:0'));
});
test('Native cleanup continues restoring window attributes after a failed view removal',()=>{
 const bridge=new NativeGlass(),win={},calls=[];
 bridge.records.set(win,{window:'window',background:'background',opaque:true,effect:'effect'});
 bridge.sel=name=>name;bridge.f={void:()=>{throw Error('view failure');},setBool:(...args)=>calls.push(args)};
 bridge.id=(...args)=>calls.push(args);bridge.setID=(...args)=>calls.push(args);bridge.detach(win);
 assert.equal(bridge.records.size,0);assert.ok(calls.some(args=>args[1]==='setOpaque:'&&args[2]===1));
 assert.ok(calls.some(args=>args[1]==='setBackgroundColor:'&&args[2]==='background'));
 assert.ok(calls.some(args=>args[0]==='window'&&args[1]==='release'));
 assert.ok(calls.some(args=>args[0]==='effect'&&args[1]==='release'));
});

test('Native material preserves blur across transparency settings',async()=>{
 const {nativeMaterialAlpha}=await import('../src/glass.mjs');
 let previous=1;
 for(let t=0;t<=100;t++){const alpha=nativeMaterialAlpha(t);assert.ok(alpha<=previous&&alpha>=.35&&alpha<=1);previous=alpha;}
 assert.equal(nativeMaterialAlpha(60),1);assert.equal(nativeMaterialAlpha(80),1);assert.equal(nativeMaterialAlpha(100),1);
 assert.throws(()=>nativeMaterialAlpha(NaN));
});

test('78 percent reference backing keeps strong text contrast; higher transparency is not covered',()=>{
 for(const preset of PRESETS)for(const dark of [false,true]){const roles=createScheme(preset.seed,dark),base=rgb(roles.surfaceContainer),fg=rgb(roles.onSurface);
 for(const wall of [0,1])for(const state of [0,.08,.12]){const composite=base.map((v,i)=>(v*.78+wall*.22)*(1-state)+fg[i]*state);assert.ok(contrast(fg,composite)>=4.5);}}
});
