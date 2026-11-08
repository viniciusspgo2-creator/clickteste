import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const get=file=>readFileSync(resolve(root,file),'utf8');
function transpile(file){const result=ts.transpileModule(get(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});assert.deepEqual(result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)||[],[]);return result.outputText}
function moduleFor(file,dependencies={}){const m={exports:{}};new Function('module','exports','require',transpile(file))(m,m.exports,s=>{if(['./layer-effects','./vector-shapes','./vector-path'].includes(s))return moduleFor(`src/lib/creative/${s.slice(2)}.ts`);if(s in dependencies)return dependencies[s];throw Error('Módulo não esperado no teste: '+s)});return m.exports;}
test('PDF usa somente parâmetros aceitos da versão do pdfjs-dist',()=>{const s=get('src/lib/creative/pdf-layers.ts');assert.doesNotMatch(s,/isEvalSupported:/);assert.match(s,/pdfjs\.getDocument\(\{data:/);transpile('src/lib/creative/pdf-layers.ts')});
test('Encoder não recebe config indefinida (TS2769)',()=>{const s=get('src/lib/creative/video-templates.ts');assert.match(s,/const supportedConfig=await chooseH264Config\(w,h,fps\)/);assert.match(s,/result\.supported&&result\.config/);assert.match(s,/encoder\.configure\(supportedConfig\)/);assert.doesNotMatch(s,/encoder\.configure\(supported\.config\)/);transpile('src/lib/creative/video-templates.ts')});
test('Validador rejeita dados malformados e aceita projeto legítimo',()=>{
 const v=moduleFor('src/lib/creative/validate-project.ts').validateProjectDocument;
 const valid={width:2480,height:1122,background:'#fff',nodes:[{id:'a',kind:'text',x:10,y:20,w:500,h:60,angle:0,opacity:1,text:'Café & coração',size:60}]};
 assert.doesNotThrow(()=>v(valid));
 for(const bad of [{...valid,width:-1},{...valid,nodes:[{...valid.nodes[0],opacity:2}]},{...valid,nodes:[{...valid.nodes[0],kind:'image',src:'javascript:alert(1)'}]},{...valid,nodes:[{...valid.nodes[0],kind:'image',src:'data:text/html;base64,PHNjcmlwdD4='}]}])assert.throws(()=>v(bad));
 const svg='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fff"/></svg>');
 assert.doesNotThrow(()=>v({...valid,nodes:[{id:'b',kind:'image',x:0,y:0,w:100,h:100,angle:0,opacity:1,src:svg}]}));
 const unsafe='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg onload="alert(1)"></svg>');
 assert.throws(()=>v({...valid,nodes:[{id:'b',kind:'image',x:0,y:0,w:100,h:100,angle:0,opacity:1,src:unsafe}]}));
});
test('Editor preserva handoff e respeita bloqueio de camadas',()=>{const e=get('src/components/creative/creative-editor.tsx');const h=get('src/lib/creative/handoff.ts');assert.match(e,/params\.get\('from'\)==='mockup'\?await readEditorHandoff\(\):null/);assert.match(e,/if\(n&&!n\.locked\)/);assert.match(e,/if\(evt\.button!==0\|\|n\.locked\)return/);assert.match(e,/validateProjectDocument\(d\)/);assert.match(h,/readonly/);assert.doesNotMatch(h,/objectStore\(STORE\)\.delete/)});
test('Verificação de fontes integra a etapa de build',()=>{const p=JSON.parse(get('package.json'));assert.match(p.scripts.build,/verify-source/);assert.match(p.scripts['verify:creative'],/v38-stability/)});
