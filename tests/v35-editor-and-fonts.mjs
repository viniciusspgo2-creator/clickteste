/** Standalone regression tests (no npm install required): node tests/v35-editor-and-fonts.mjs */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root=new URL('../',import.meta.url);
function get(file){return readFileSync(new URL(file,root),'utf8');}
const changed=['src/lib/creative/browser-fonts.ts','src/lib/creative/design.ts','src/components/creative/creative-editor.tsx','src/components/creative/font-library.tsx','src/components/platform/language-provider.tsx','src/components/creative/template-gallery.tsx','src/components/tools/mockup/scene/mug-geometry.ts','src/components/tools/mockup/lib/handle-styles.ts','src/components/tools/mockup/state/store.ts','src/components/tools/mockup/ui/workspace.tsx','src/components/tools/mockup/ui/handle-controls.tsx','src/components/admin/creative-assets-panel.tsx','src/components/creative/studio-concierge.tsx'];
for(const f of changed){const source=get(f),result=ts.transpileModule(source,{fileName:f,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,'Syntax failed: '+f);}
const editor=get('src/components/creative/creative-editor.tsx');
assert(!editor.includes('slice(-70)'),'Undo history still capped to 70');
assert(editor.includes("g.initial.kind==='text'"),'Text drag does not preserve aspect');
assert(editor.includes('size:Math.max(8,(g.initial.size||72)'),'Text is not scaling font size');
assert(editor.includes('Ctrl+Y'),'Redo keyboard shortcut missing');
const design=get('src/lib/creative/design.ts');
assert(!design.includes('Math.max(5,n.w)'),'Text may still be artificially squashed by Canvas maxWidth');
const handle=get('src/components/tools/mockup/scene/mug-geometry.ts');
assert(handle.includes("style === 'livesub' ? 0.46"),'Photo handle cross-section missing');
assert(get('src/components/tools/mockup/state/store.ts').includes('handleStyle: "livesub"'),'New mugs lack photo profile');
assert(get('src/components/platform/language-provider.tsx').includes('extraWords'),'Missing expanded locale map');
const fontSource=get('src/lib/creative/browser-fonts.ts');
const fontJS=ts.transpileModule(fontSource,{fileName:'browser-fonts.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const output={};const context={exports:output,require,Buffer,Uint8Array,DataView,Map,ArrayBuffer,Error};vm.runInNewContext(fontJS,context);
const sys='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
if(existsSync(sys)){const b=readFileSync(sys),arr=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),check=output.classifyLocalTypeface(arr);assert.equal(check.status,'pt-br-completo',`Unexpected PT-BR coverage: ${JSON.stringify(check)}`);}
console.log('PASS: 13 TypeScript sources parse, font classifier, text scaling, uncapped undo, reference handle, translation dictionary');
