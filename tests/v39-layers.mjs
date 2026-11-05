import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const source=file=>readFileSync(resolve(root,file),'utf8');
function build(file){
 const text=source(file);
 const result=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,strict:true}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`Syntax error: ${file}`);
 return result.outputText;
}
function moduleFor(file){const m={exports:{}};new Function('module','exports','require',build(file))(m,m.exports,name=>{if(['./layer-effects','./vector-shapes','./vector-path'].includes(name))return moduleFor(`src/lib/creative/${name.slice(2)}.ts`);throw Error('Unmocked import: '+name)});return m.exports}
const node=(id,role,other={})=>({id,kind:'rect',role,x:0,y:0,w:100,h:100,angle:0,opacity:1,...other});
test('cenas não bloqueiam seleção pelo Canvas; elementos do layout continuam editáveis',()=>{
 const {canSelectOnCanvas}=moduleFor('src/lib/creative/node-actions.ts');
 assert.equal(canSelectOnCanvas(node('1','foreground')),false);
 assert.equal(canSelectOnCanvas(node('2','background')),false);
 assert.equal(canSelectOnCanvas(node('3','template')),true);
 assert.equal(canSelectOnCanvas(node('4','mockup')),true);
 assert.equal(canSelectOnCanvas(node('5','mockup',{visible:false})),false);
 assert.equal(canSelectOnCanvas(node('6','mockup',{locked:true})),false);
});
test('ordem e espelhamento não reescrevem os outros elementos',()=>{
 const {reorderNodes,mirrorNode}=moduleFor('src/lib/creative/node-actions.ts');
 const data=[node('bg','background',{locked:true}),node('mug','mockup'),node('hands','foreground')];
 assert.deepEqual(reorderNodes(data,'mug','front').map(n=>n.id),['bg','hands','mug']);
 assert.deepEqual(reorderNodes(data,'hands','back').map(n=>n.id),['hands','bg','mug']);
 assert.deepEqual(data.map(n=>n.id),['bg','mug','hands']);
 assert.equal(mirrorNode(data[1],'horizontal').flipX,true);
});
test('documentos locais preservam visibilidade e bloqueio válidos e recusam tipos inválidos',()=>{
 const {validateProjectDocument}=moduleFor('src/lib/creative/validate-project.ts');
 const valid={width:2480,height:1122,background:'#fff',nodes:[node('m','mockup',{visible:false,locked:true})]};
 assert.doesNotThrow(()=>validateProjectDocument(valid));
 for(const key of ['visible','locked'])assert.throws(()=>validateProjectDocument({...valid,nodes:[node('m','mockup',{[key]:'false'})]}));
});
test('a tela de camadas tem comandos reais; a renderização filtra camadas ocultas',()=>{
 const e=source('src/components/creative/creative-editor.tsx');const d=source('src/lib/creative/design.ts');
 assert.match(e,/panel==='layers'/);
 assert.match(e,/toggleLayer\(node.id,'visible'\)/);
 assert.match(e,/toggleLayer\(node.id,'locked'\)/);
 assert.match(e,/moveLayerById\(node.id,'forward'\)/);
 assert.match(e,/canSelectOnCanvas\(n\)/);
 assert.match(e,/disabled=\{!!active.locked\}/);
 assert.match(d,/filter\(n=>n.visible!==false\)/);
 build('src/components/creative/creative-editor.tsx');
});
test('Camadas possui traduções em inglês e espanhol',()=>{
 const langs=source('src/components/platform/language-provider.tsx');
 assert.ok(langs.includes("'Camadas':['Layers','Capas']"));
});

test('pré-impressão avisa sobre texto fora da área segura, vídeo omitido e projeto vazio',()=>{
 const {checkBeforeExport}=moduleFor('src/lib/creative/print-check.ts');
 const a={width:2480,height:1122,background:'#fff',nodes:[{...node('txt','content',{kind:'text',text:'Feliz aniversário',size:60}),x:0,y:10}]};
 assert.ok(checkBeforeExport(a).some(n=>n.kind==='warning'&&n.message.includes('área visível')));
 assert.ok(checkBeforeExport({...a,nodes:[],video:{src:'data:video/mp4;base64,AA==',name:'x',start:0}}).some(n=>n.message.includes('não inclui o vídeo')));
 assert.ok(checkBeforeExport({...a,nodes:[]}).some(n=>n.message.includes('sem objetos visíveis')));
 assert.ok(checkBeforeExport({...a,nodes:[{...a.nodes[0],x:300,y:300,w:100,h:80}]}).some(n=>n.kind==='success'));
});
test('gestos preservam snapshots imutáveis sem duplicar arquivos base64 a cada movimento',()=>{
 const editor=source('src/components/creative/creative-editor.tsx');
 assert.doesNotMatch(editor,/before:structuredClone\(doc\)/);
 assert.doesNotMatch(editor,/const result=structuredClone\(current.history\[current.step\]\)/);
 assert.match(editor,/const result=current.history\[current.step\]/);
});
