// Isolated engine browser checks. Run via python tests/v36-browser.py with Playwright and Chromium.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
let source='const ensureDesignFonts=async()=>{};\n';
for(const path of ['src/lib/creative/design.ts','src/lib/creative/psd-import.ts']){
 const code=fs.readFileSync(path,'utf8').replace(/^import[^\n]+\n/gm,'').replace(/\bexport\s+/g,'');
 source+=ts.transpileModule(code,{fileName:path,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText+'\n';
}
source+='\nwindow.cgBrowserTest={importPsdLayers,drawDesign};';
process.stdout.write(source);
