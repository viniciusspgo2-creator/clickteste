import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const load=(path,stubs={})=>{
 const name=resolve(root,path),source=readFileSync(name,'utf8');
 const compiled=ts.transpileModule(source,{fileName:name,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}});
 assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
 const mod={exports:{}};
 new Function('module','exports','require',compiled.outputText)(mod,mod.exports,key=>{
  if(['./layer-effects','./vector-shapes','./vector-path'].includes(key))return load(`src/lib/creative/${key.slice(2)}.ts`);
  if(key in stubs)return stubs[key];throw new Error('Unexpected import '+key);
 });return mod.exports;
};
const smart=()=>load('src/lib/creative/smart-templates.ts',{'./template-archive':{},'./design':{uid:()=>'asset'}});
const cache=()=>load('src/lib/creative/effect-cache.ts');
const validator=()=>load('src/lib/creative/validate-project.ts');
const mug={id:'mug',kind:'image',role:'mockup',x:100,y:50,w:400,h:200,angle:15,opacity:1,shadow:20,shadowX:12,shadowY:24,blur:8,strokeWidth:4,maskSrc:'data:image/png;base64,AA==',maskMode:'alpha',maskInvert:true};
const slot={x:300,y:100,w:200,h:100};
test('Reencaixar preserva máscara manual quando novo cenário não fornece máscara',()=>{
 const out=smart().fitMockupIntoSlot(mug,slot);
 assert.equal(out.maskSrc,mug.maskSrc);assert.equal(out.maskMode,'alpha');assert.equal(out.maskInvert,true);
 assert.equal(out.w,200);assert.equal(out.h,100);assert.equal(out.angle,0);
 assert.equal(out.shadow,10);assert.equal(out.shadowX,6);assert.equal(out.shadowY,12);assert.equal(out.blur,4);assert.equal(out.strokeWidth,2);
 assert.equal(mug.shadow,20);
});
test('Manifesto aceita máscaras alpha / luminosidade e recusa tipos inválidos',()=>{
 const base={format:'clickgruda-smart-template',version:1,name:'Foto',width:1080,height:1350,mask:'mask.png',maskMode:'alpha',maskInvert:true,slot:{x:.2,y:.2,w:.4,h:.5}};
 assert.equal(smart().validateSmartManifest(base).maskMode,'alpha');
 assert.throws(()=>smart().validateSmartManifest({...base,maskMode:'execute'}));
 assert.throws(()=>smart().validateSmartManifest({...base,maskInvert:'yes'}));
});
test('Nova máscara de template substitui antiga e configura o modo indicado',()=>{
 const fitted=smart().fitMockupIntoSlot(mug,slot,'data:image/png;base64,NEW==',1,'luminance',false);
 assert.equal(fitted.maskMode,'luminance');assert.equal(fitted.maskInvert,false);assert.equal(fitted.maskSrc,'data:image/png;base64,NEW==');
});
test('Cache considera modo e inversão: não reutiliza a máscara com resultado diferente',()=>{
 const {effectKey}=cache();const base={src:'data:image/png;base64,PHOTO==',maskSrc:'data:image/png;base64,MASK==',w:40,h:30,sx:0,sy:0,sw:80,sh:60};
 const normal=effectKey({...base,maskMode:'luminance',maskInvert:false});
 assert.notEqual(normal,effectKey({...base,maskMode:'alpha',maskInvert:false}));
 assert.notEqual(normal,effectKey({...base,maskMode:'luminance',maskInvert:true}));
});
test('Validação do projeto protege novos campos de máscara',()=>{
 const {validateProjectDocument}=validator();
 const document={width:1080,height:1350,background:'#fff',nodes:[{...mug,src:'data:image/png;base64,AA=='}]};
 assert.doesNotThrow(()=>validateProjectDocument(document));
 assert.throws(()=>validateProjectDocument({...document,nodes:[{...document.nodes[0],maskMode:'script'}]}));
 assert.throws(()=>validateProjectDocument({...document,nodes:[{...document.nodes[0],maskInvert:'yes'}]}));
});
