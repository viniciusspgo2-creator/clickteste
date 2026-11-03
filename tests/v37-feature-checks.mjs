import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=path.resolve(import.meta.dirname,'..');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
const parse=p=>{
 const ext=p.endsWith('.tsx')?ts.JsxEmit.ReactJSX:ts.JsxEmit.Preserve;
 const transpile=ts.transpileModule(source(p),{fileName:p,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ext,esModuleInterop:true}});
 const errs=(transpile.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
 assert.equal(errs.length,0,`${p}: ${errs.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; ')}`);
 return transpile.outputText;
};
const files=['src/lib/creative/design.ts','src/lib/creative/animation.ts','src/lib/creative/psd-import.ts','src/lib/creative/pdf-layers.ts','src/lib/creative/smart-templates.ts','src/lib/creative/video-templates.ts','src/components/creative/creative-editor.tsx','src/components/creative/studio-concierge.tsx','src/components/creative/template-gallery.tsx','src/components/tools/mockup/scene/studio.tsx','src/components/tools/mockup/scene/studio-scene.tsx','src/components/tools/mockup/ui/shadow-presets.tsx','src/app/api/creative-assistant/route.ts'];
test('13 módulos alterados têm sintaxe TypeScript/TSX válida',()=>{for(const f of files)parse(f)});
test('Animações suportam posição, tamanho, opacidade e interpolação',()=>{
 const js=parse('src/lib/creative/animation.ts'),mod={exports:{}};
 new Function('module','exports','require',js)(mod,mod.exports,()=>({}));
 const a=mod.exports,n={id:'a',kind:'image',x:100,y:20,w:50,h:50,angle:0,opacity:1};
 const keyframes=a.motionPreset(n,'zoom',4);assert.equal(keyframes.length,2);
 const at0=a.animateDesignNode({...n,keyframes},0),at2=a.animateDesignNode({...n,keyframes},2),at4=a.animateDesignNode({...n,keyframes},4);
 assert.equal(at4.w,50);assert.ok(at0.w<at2.w&&at2.w<at4.w);
 assert.equal(at0.opacity,0);assert.ok(at2.opacity>0&&at2.opacity<1);
 const stored=a.withMotionPoint({...n,keyframes},3);assert.equal(stored.keyframes.length,3);
});
test('Importador PSD documenta ZIP e predição além de raw/RLE',()=>{const s=source('src/lib/creative/psd-import.ts');for(const part of ['compression===0','compression===1','compression===2||compression===3',"DecompressionStream('deflate')",'compression===3'])assert.ok(s.includes(part),part)});
test('Editor permite selecionar página PDF, animações e ajustes de máscara',()=>{
 const s=source('src/components/creative/creative-editor.tsx');for(const part of ['window.prompt(`PDF com ${extracted.pages} páginas','cr-motion-timeline','motionPreset(active,key','readMask','smartTemplate?.slot'])assert.ok(s.includes(part),part);
 const design=source('src/lib/creative/design.ts');assert.ok(design.includes('if(tint||n.maskSrc)'));assert.ok(design.includes('animateDesignNode'));
});
test('Templates inteligentes preservam encaixe com máscara e proporção',()=>{
 const s=source('src/lib/creative/smart-templates.ts');assert.ok(s.includes('slot.x+(slot.w-mug.w)/2'));assert.ok(s.includes('smartTemplate:slot?{slot,maskSrc:mask}'));
});
test('MP4 mantém WebCodecs e anima objeto a cada quadro',()=>{
 const s=source('src/lib/creative/video-templates.ts');for(const part of ['start+20',"codec:'avc'",'await drawDesign(run.canvas,{...outputDoc,nodes:run.nodes},i/fps)','new VideoEncoder'])assert.ok(s.includes(part),part);
});
test('Proteção do agente restringe ações ao módulo e bloqueia origem externa',async()=>{
 const js=parse('src/app/api/creative-assistant/route.ts');const mod={exports:{}};
 const api={NextResponse:{json:(body,opts={})=>({body,status:opts.status??200})}};
 const responder=async(_url,opts)=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({reply:'Ok',action:JSON.parse(opts.body).messages[1].content.includes('editor')?'models':'models',label:'Produto'})}}]})});
 new Function('module','exports','require','process','fetch',js)(mod,mod.exports,()=>api,{env:{OPENAI_API_KEY:'test-mock-not-real'}},responder);
 const req=(area,origin)=>({headers:{get:k=>k==='origin'?origin:k==='x-forwarded-for'?`test-${area}-${origin}`:null},nextUrl:{host:'clickgruda.test'},json:async()=>({area,locale:'pt',question:'Abra produto'})});
 const invalid=await mod.exports.POST(req('editor','https://evil.test'));assert.equal(invalid.status,403);
 const editor=await mod.exports.POST(req('editor','https://clickgruda.test'));assert.equal(editor.body.action,null);
 const studio=await mod.exports.POST(req('studio','https://clickgruda.test'));assert.equal(studio.body.action,'models');
});
test('Configuração 3D tem viés de sombra reduzido e permite sombra ajustável',()=>{
 const scene=source('src/components/tools/mockup/scene/studio.tsx');assert.ok(scene.includes('shadow-normalBias={0.007}'));assert.ok(scene.includes('shadowShiftX'));assert.ok(scene.includes('StudioContactShadows'));
});
