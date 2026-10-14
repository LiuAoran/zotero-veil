import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const root=process.cwd();
await fs.mkdir('dist',{recursive:true});
await fs.rm('build',{recursive:true,force:true});
await fs.cp('addon','build',{recursive:true});
const strings=JSON.parse(await fs.readFile('src/strings.json','utf8'));
for(const locale of ['en-US','zh-CN']){
  const folder=path.join('build','locale',locale);await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,'zotero-veil.ftl'),Object.entries(strings).map(([key,text])=>`${key} = ${text[locale]}`).join('\n')+'\n');
}
await build({entryPoints:['src/controller.mjs'],outfile:'build/content/theme.js',bundle:true,format:'iife',globalName:'ZMTBundle',target:'firefox140',minify:false,legalComments:'eof'});
await fs.cp('licenses','build/licenses',{recursive:true});
await fs.copyFile('LICENSE','build/LICENSE');
const manifest=JSON.parse(await fs.readFile('addon/manifest.json','utf8'));
const artifact=path.join(root,'dist',`zotero-veil-${manifest.version}.xpi`);
execFileSync('python3',['-c',`import zipfile,pathlib\nr=pathlib.Path('build')\nwith zipfile.ZipFile(${JSON.stringify(artifact)},'w',zipfile.ZIP_DEFLATED) as z:\n for p in sorted(r.rglob('*')):\n  if p.is_file(): z.write(p,p.relative_to(r))`],{stdio:'inherit'});
console.log(artifact);
