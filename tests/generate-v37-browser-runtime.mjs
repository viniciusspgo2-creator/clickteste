import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const parts=[];
parts.push(`window.cgModules={}; window.cgModules['./typefaces']={ensureDesignFonts:async()=>{}};window.cgModules['jszip']={loadAsync:()=>window.cgFixtureArchive};`);
for(const [name,file] of [['./animation','src/lib/creative/animation.ts'],['./design','src/lib/creative/design.ts'],['./psd-import','src/lib/creative/psd-import.ts'],['./smart-templates','src/lib/creative/smart-templates.ts']]){
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 parts.push(`{const mod={exports:{}};const req=(id)=>{if(window.cgModules[id])return window.cgModules[id];throw Error('Browser test require: '+id)};(new Function('module','exports','require',${JSON.stringify(code)}))(mod,mod.exports,req);window.cgModules[${JSON.stringify(name)}]=mod.exports;}`);
}
parts.push('window.cgBrowserV37={...window.cgModules["./design"],...window.cgModules["./psd-import"],...window.cgModules["./animation"],...window.cgModules["./smart-templates"]};');
fs.writeFileSync(path.join(root,'tests/fixtures/v37-browser-runtime.js'),parts.join('\n'));
console.log('Generated test runtime');
