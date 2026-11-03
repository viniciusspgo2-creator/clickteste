import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const base=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,base),'utf8');
const editor=read('src/components/creative/creative-editor.tsx');
const presets=read('src/lib/creative/presets.ts');

test('regressão TS2345: origem de recorte estreitada antes da chamada assíncrona',()=>{
 assert.match(editor,/const node=active,source=active\.src,session=/);
 assert.match(editor,/imageFor\(source\)/);
 assert.doesNotMatch(editor,/imageFor\(node\.src\)/);
});
test('fluxo guiado mantém os quatro passos e as opções avançadas',()=>{
 assert.match(editor,/cr-guided-flow/);
 for(const label of ['Modelo ou fundo','Foto e texto','Ajustar','Conferir e exportar','Outros formatos'])assert.ok(editor.includes(label),label);
 assert.match(editor,/advancedFormats\|\|doc\.width!==2480/);
});
test('enquadramento: diálogo sem distorcer e botão de restauração',()=>{
 assert.match(editor,/matchingAspect/);
 for(const label of ['Preencher 21 × 9,5','Caber inteiro','Manter original','Enquadrar 21 × 9,5','Importar meu fundo'])assert.ok(editor.includes(label),label);
 assert.match(editor,/backgroundFit\(image\.naturalWidth,image\.naturalHeight,d\.width,d\.height/);
});
test('modelos usam tela padrão de impressão e IDs originais, com novas ocasiões',()=>{
 assert.match(presets,/const W=2480,H=1122/);
 for(const id of ['elite','minimal','natal','oferta','aniversario','maes','profissao','gospel','infantil','casal'])assert.ok(presets.includes(`id:'${id}'`),id);
 assert.doesNotMatch(presets,/width:1080,height:1350/);
});
test('cálculo real do enquadramento: cover, contain, original, tolerância e centralização',()=>{
 const path=new URL('../src/lib/creative/background-fit.ts',import.meta.url).href;
 const script=`import {backgroundFit,matchingAspect} from ${JSON.stringify(path)};
 const ok=(v,msg)=>{if(!v)throw new Error(msg)};
 let r=backgroundFit(2480,1122,2480,1122,'cover');ok(r.x===0&&r.y===0&&r.w===2480&&r.h===1122,'exato');
 r=backgroundFit(1000,1000,2480,1122,'cover');ok(r.w>=2480&&r.h>=1122&&r.x===0&&r.y<0,'preencher');
 r=backgroundFit(1000,1000,2480,1122,'contain');ok(r.h===1122&&r.w===1122&&r.x>0&&r.y===0,'caber');
 r=backgroundFit(1000,1000,2480,1122,'original');ok(r.w===1000&&r.h===1000&&r.x===740&&r.y===61,'original');
 ok(matchingAspect(4000,1810,2480,1122),'tolerância');ok(!matchingAspect(1000,1000,2480,1122),'diferente');
 `;
 execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','--eval',script],{stdio:'pipe',timeout:15000});
});
