import test from 'node:test';
import assert from 'node:assert/strict';
import {createScheme,normalizeSeed,normalizeMode,effectiveMode,tokenCSS,PRESETS} from '../src/palette.mjs';
function rgb(hex){return hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255);}
function luminance(hex){const [r,g,b]=rgb(hex).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){let x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function mix(a,b,opacity){return '#'+rgb(a).map((v,i)=>Math.round((v*opacity+rgb(b)[i]*(1-opacity))*255).toString(16).padStart(2,'0')).join('');}
test('Custom seeds retain accessible text across themes and used state layers',()=>{
 const seeds=[...PRESETS.map(p=>p.seed),'#000000','#FFFFFF','#FF0000','#00FF00','#0000FF'];
 let value=12345678;
 for(let i=0;i<64;i++){value=(Math.imul(value,1664525)+1013904223)>>>0;seeds.push('#'+(value&0xffffff).toString(16).padStart(6,'0'));}
 const pairs=[['onSurface','surface'],['onSurfaceVariant','surface'],['onPrimary','primary'],['onSecondaryContainer','secondaryContainer'],['onErrorContainer','errorContainer'],['inverseOnSurface','inverseSurface'],...['surfaceContainerLowest','surfaceContainer','surfaceContainerLow','surfaceContainerHigh','surfaceContainerHighest'].flatMap(b=>[['onSurface',b],['onSurfaceVariant',b]])];
 for(const seed of seeds)for(const dark of [false,true]){
  const scheme=createScheme(seed,dark);
  assert.ok(dark?luminance(scheme.surfaceContainerLowest)<luminance(scheme.surfaceContainer):luminance(scheme.surfaceContainerLowest)>luminance(scheme.surfaceContainer),`side tone ${seed}/${dark}`);
  for(const [foreground,background]of pairs)assert.ok(contrast(scheme[foreground],scheme[background])>=4.5,`${seed}/${dark}/${foreground}/${background}`);
  for(const [fg,bg]of [['onSecondaryContainer','secondaryContainer'],['onPrimary','primary']])for(const opacity of [.08,.12])assert.ok(contrast(scheme[fg],mix(scheme[fg],scheme[bg],opacity))>=4.5,`state text ${seed}/${dark}/${fg}/${opacity}`);
 }
});
test('Invalid preferences cannot inject CSS or silently become another color',()=>{
 for(const seed of ['red','#fff','#123456;display:none','var(--x)','',null])assert.throws(()=>normalizeSeed(seed));
 assert.equal(normalizeSeed(' #abcDEF '),'#ABCDEF');assert.throws(()=>normalizeMode('night'));
 assert.equal(effectiveMode('system',true),'dark');assert.equal(effectiveMode('system',false),'light');assert.equal(effectiveMode('light',true),'light');
 assert.match(tokenCSS(createScheme('#123456',true)),/--zmt-surface-container-high:/);
});
