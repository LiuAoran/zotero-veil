import {Hct, SchemeTonalSpot, MaterialDynamicColors, argbFromHex, hexFromArgb} from '@material/material-color-utilities';

export const DEFAULTS = Object.freeze({mode:'system',seed:'#6750A4',reduceMotion:false,glass:false,glassLevel:'balanced',glassTransparency:-1});
export const PRESETS = Object.freeze([{name:'鸢尾紫',seed:'#6750A4'},{name:'青绿',seed:'#006A6A'},{name:'苔绿',seed:'#386A20'}]);

export function normalizeSeed(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.trim())) throw new Error('请输入 #RRGGBB 格式的种子色');
  return value.trim().toUpperCase();
}
export function normalizeMode(value) {
  if (!['light','dark','system'].includes(value)) throw new Error('无效的外观模式');
  return value;
}
export function effectiveMode(mode, systemDark) { return normalizeMode(mode)==='system' ? (systemDark?'dark':'light') : mode; }
export function createScheme(seed,isDark) {
  const scheme=new SchemeTonalSpot(Hct.fromInt(argbFromHex(normalizeSeed(seed))),!!isDark,0);
  return Object.fromEntries(Object.entries(MaterialDynamicColors).filter(([,role])=>typeof role?.getArgb==='function').map(([name,role])=>[name,hexFromArgb(role.getArgb(scheme))]));
}
export function roleName(name) { return '--zmt-'+name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()); }
export function tokenCSS(roles) { return Object.entries(roles).map(([name,value])=>`${roleName(name)}:${value};`).join(''); }
