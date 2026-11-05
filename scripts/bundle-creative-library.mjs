/** Reproduce the offline library from the pinned Tabler package and approved assets.
 * npm pack @tabler/icons@3.46.0; tar -xzf tabler-icons-3.46.0.tgz -C /tmp/tabler
 * NODE_USE_ENV_PROXY=1 node scripts/bundle-creative-library.mjs /tmp/tabler/package
 * Failures preserve already bundled assets. Never disable TLS verification.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const packageRoot=process.argv[2];
if(!packageRoot)throw Error('Provide the extracted @tabler/icons@3.46.0 package directory.');
const packageInfo=JSON.parse(await fs.readFile(path.join(packageRoot,'package.json'),'utf8'));
if(packageInfo.name!=='@tabler/icons'||packageInfo.version!=='3.46.0')throw Error('Unexpected package version');
const output='public/creative-library';
await fs.mkdir(output,{recursive:true});
const source=await fs.readFile('src/lib/creative/library-manifest.ts','utf8');
const uploadedItems=JSON.parse(await fs.readFile('src/lib/creative/uploaded-library.json','utf8'));
const backgroundCatalog=JSON.parse(await fs.readFile('src/lib/creative/background-catalog.json','utf8'));
const context={exports:{},require:specifier=>{if(specifier==='./background-catalog.json')return {default:backgroundCatalog};if(specifier==='./uploaded-library.json')return {default:uploadedItems};throw Error(`Unexpected dependency: ${specifier}`);}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const manifest=context.exports;
const index=JSON.parse(await fs.readFile(path.join(packageRoot,'icons.json'),'utf8'));
const icons=Object.entries(index).filter(([,item])=>item.styles?.outline).map(([name,item])=>({name,label:`${name.replaceAll('-',' ')} ${(item.tags||[]).filter(t=>typeof t==='string').join(' ')}`,category:item.category}));
const chosen=manifest.curatedFromTabler(icons);
const included=new Set(chosen.map(item=>item.arquivo));
await fs.writeFile(path.join(output,'tabler-catalog.json'),JSON.stringify(icons.filter(icon=>included.has(icon.name)))+'\n');
const files=Object.fromEntries(uploadedItems.map(item=>[item.id,item.arquivo]));
for(const item of chosen){
 const file=`${item.id}.svg`;
 await fs.copyFile(path.join(packageRoot,'icons/outline',`${item.arquivo}.svg`),path.join(output,file));
 files[item.id]=file;
}
await fs.copyFile(path.join(packageRoot,'LICENSE'),path.join(output,'LICENSE-Tabler.txt'));
const revisions=manifest.LIBRARY_RELEASE;
const bases={
 'microsoft/fluentui-emoji':`https://cdn.jsdelivr.net/gh/${revisions.fluent}/`,
 'googlefonts/noto-emoji':`https://cdn.jsdelivr.net/gh/${revisions.noto}/`,
 'lucide-icons/lucide':`https://cdn.jsdelivr.net/gh/${revisions.lucide}/icons/`,
 'phosphor-icons/core':`https://cdn.jsdelivr.net/gh/${revisions.phosphor}/assets/regular/`,
};
const queue=manifest.STATIC_MANIFEST.filter(item=>bases[item.origem]);
const failed=[];
const download=async(url,destination)=>{
 try{if((await fs.stat(destination)).size>0)return;}catch{}
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`${response.status} ${url}`);
 const data=new Uint8Array(await response.arrayBuffer());
 if(!data.length||data.length>8*1024*1024)throw Error('Unexpected asset size');
 await fs.writeFile(destination,data);
};
await Promise.all(Array.from({length:6},async()=>{
 while(queue.length){
  const item=queue.shift(),ext=item.formato.toLowerCase(),file=`${item.id}.${ext}`;
  const remotePath=item.arquivo+(item.origem==='lucide-icons/lucide'||item.origem==='phosphor-icons/core'?'.svg':'');
  try{await download(bases[item.origem]+remotePath.split('/').map(encodeURIComponent).join('/'),path.join(output,file));files[item.id]=file;}
  catch(error){failed.push(`${item.id}: ${error.message}`);}
 }
}));
for(const [name,url] of Object.entries({
 'LICENSE-Fluent.txt':bases['microsoft/fluentui-emoji']+'LICENSE',
 'LICENSE-Noto.txt':bases['googlefonts/noto-emoji']+'svg/LICENSE',
 'LICENSE-Lucide.txt':`https://cdn.jsdelivr.net/gh/${revisions.lucide}/LICENSE`,
 'LICENSE-Phosphor.txt':`https://cdn.jsdelivr.net/gh/${revisions.phosphor}/LICENSE`,
}))await download(url,path.join(output,name));
await fs.writeFile('src/lib/creative/bundled-library.json',JSON.stringify(Object.fromEntries(Object.entries(files).sort()),null,2)+'\n');
console.log(`${Object.keys(files).length} local assets (${chosen.length} Tabler), ${failed.length} unavailable.`);
if(failed.length){console.error(failed.join('\n'));process.exitCode=1;}
