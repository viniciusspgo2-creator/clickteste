/** Staging validation runnable without npm dependencies (uses globally installed TypeScript). */
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
const files=[
 'src/components/creative/creative-editor.tsx',
 'src/lib/creative/design.ts',
 'src/lib/creative/node-actions.ts',
 'src/lib/creative/browser-projects.ts',
 'src/app/layout.tsx',
 'src/components/platform/language-provider.tsx',
 'src/components/platform/platform-announcements.tsx',
 'src/app/api/public-announcements/route.ts',
 'src/components/tools/mockup/exporters/frame-capture.ts',
 'src/components/tools/mockup/exporters/image-exporter.ts',
 'src/components/tools/mockup/ui/panels.tsx',
 'src/components/tools/mockup/ui/workspace.tsx',
 'src/components/creative/studio-concierge.tsx',
 'src/components/admin/announcements-panel.tsx',
 ];
for(const f of files){
 const src=readFileSync(f,'utf8');
 const parsed=ts.createSourceFile(f,src,ts.ScriptTarget.ES2022,true,f.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 assert.equal(parsed.parseDiagnostics.length,0,`${f}: ${parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('; ')}`);
}
const src=readFileSync('src/lib/creative/node-actions.ts','utf8');
const js=ts.transpileModule(src,{fileName:'node-actions.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};vm.runInNewContext(js,{exports});
const nodes=['fundo','caneca','logo','texto'].map(id=>({id,kind:'image',x:0,y:0,w:100,h:100,angle:0,opacity:1}));
const ids=a=>a.map(n=>n.id).join(',');
assert.equal(ids(exports.reorderNodes(nodes,'caneca','front')),'fundo,logo,texto,caneca');
assert.equal(ids(exports.reorderNodes(nodes,'logo','back')),'logo,fundo,caneca,texto');
assert.equal(ids(exports.reorderNodes(nodes,'caneca','forward')),'fundo,logo,caneca,texto');
assert.equal(ids(exports.reorderNodes(nodes,'caneca','backward')),'caneca,fundo,logo,texto');
assert.equal(ids(nodes),'fundo,caneca,logo,texto','Original not mutated');
const flipped=exports.mirrorNode(nodes[1],'horizontal');
assert.equal(flipped.flipX,true);assert.equal(flipped.flipY,undefined);
assert.equal(exports.mirrorNode(flipped,'horizontal').flipX,false);
assert.equal(exports.mirrorNode(flipped,'vertical').flipY,true);
assert.equal(nodes[1].flipX,undefined,'Original object preserved');
const design=readFileSync('src/lib/creative/design.ts','utf8');
assert.ok(design.indexOf('ctx.scale(n.flipX?-1:1,n.flipY?-1:1);')<design.indexOf("if(n.kind==='image'&&n.src)"));
assert.equal(design.split('ctx.scale(n.flipX?-1:1,n.flipY?-1:1);').length-1,1);
const frame=readFileSync('src/components/tools/mockup/exporters/frame-capture.ts','utf8');
assert.match(frame,/opts.hideGroundShadow && session.usingTransparent/);
assert.match(readFileSync('src/components/tools/mockup/ui/panels.tsx','utf8'),/hideGroundShadow: true/);
console.log(`PASSOU: sintaxe de ${files.length} arquivos, reordenação em 4 direções, espelhamento nos 2 eixos e sombra removida do handoff.`);
