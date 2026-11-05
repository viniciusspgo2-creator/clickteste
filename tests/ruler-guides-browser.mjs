import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {toolRequire,startCreativeHarness} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright'),harness=await startCreativeHarness();
const browser=await chromium.launch({executablePath:process.env.STUDIO_TEST_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let checks=0;const errors=[];const pass=label=>{checks++;console.log(`PASS ${checks}: ${label}`);};
try{
 const context=await browser.newContext({viewport:{width:1600,height:1100},reducedMotion:'reduce',acceptDownloads:true});
 await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto(harness.url);
 const canvas=page.locator('canvas').first();await canvas.waitFor();
 const project=async()=>{const pending=page.waitForEvent('download');await page.getByTitle('Criar backup portátil com os arquivos do projeto',{exact:true}).click();const download=await pending;return JSON.parse(await fs.readFile(await download.path(),'utf8')).document;};
 const line=axis=>page.locator(`.cr-manual-guide[data-guide-axis="${axis}"]`).first();
 const pull=async(axis,fraction)=>{
  const ruler=page.getByRole('button',{name:axis==='x'?'Puxar guia vertical da régua lateral':'Puxar guia horizontal da régua superior',exact:true});
  const r=await ruler.boundingBox(),c=await canvas.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();
  await page.mouse.move(axis==='x'?c.x+c.width*fraction:c.x+c.width*.2,axis==='y'?c.y+c.height*fraction:c.y+c.height*.2,{steps:8});await page.mouse.up();
 };
 await pull('y',.41);let doc=await project();assert.equal(doc.guides.length,1);assert.equal(doc.guides[0].axis,'y');assert.ok(Math.abs(doc.guides[0].position-1122*.41)<.1);pass('puxar da régua superior cria uma guia horizontal na coordenada correta');
 await page.keyboard.press('Control+z');assert.equal((await project()).guides?.length||0,0);await page.keyboard.press('Control+Shift+z');assert.equal((await project()).guides.length,1);pass('criação da guia é uma única etapa de desfazer e refazer');
 await pull('x',.31);doc=await project();assert.equal(doc.guides.length,2);assert.ok(Math.abs(doc.guides.find(g=>g.axis==='x').position-2480*.31)<.1);pass('puxar da régua lateral cria uma guia vertical');
 let c=await canvas.boundingBox(),v=await line('x').boundingBox();
 await page.mouse.move(v.x+v.width/2,c.y+c.height*.7);await page.mouse.down();await page.mouse.move(c.x+c.width*.42,c.y+c.height*.7,{steps:6});await page.mouse.up();
 doc=await project();const vertical=doc.guides.find(g=>g.axis==='x');assert.ok(Math.abs(vertical.position-2480*.42)<.1);pass('linha existente pode ser reposicionada sem criar cópias');
 await page.getByRole('button',{name:/^Guias livres/}).click();await page.getByRole('button',{name:'Travar todas',exact:true}).click();doc=await project();assert.ok(doc.guides.every(g=>g.locked));pass('guias podem ser travadas para editar os objetos sem arrastá-las');
 await page.getByRole('button',{name:'Elementos',exact:true}).click();await page.getByRole('button',{name:'Retângulo',exact:true}).click();
 const width=page.getByRole('spinbutton',{name:'Largura',exact:true});await width.fill('300');await width.press('Tab');doc=await project();
 const dragObject=async targetX=>{
  const d=await project(),n=d.nodes[0];c=await canvas.boundingBox();const y=c.y+(n.y+n.h/2)*c.height/d.height;
  await page.mouse.move(c.x+(n.x+n.w/2)*c.width/d.width,y);await page.mouse.down();await page.mouse.move(c.x+targetX*c.width/d.width,y,{steps:10});await page.mouse.up();
 };
 c=await canvas.boundingBox();await dragObject(vertical.position-2*2480/c.width);doc=await project();assert.ok(Math.abs(doc.nodes[0].x+doc.nodes[0].w/2-vertical.position)<.01);pass('centro do objeto encaixa na guia arrastada da régua');
 await page.getByRole('button',{name:'Ocultar linhas',exact:true}).click();c=await canvas.boundingBox();await dragObject(vertical.position-4*2480/c.width);doc=await project();assert.ok(Math.abs(doc.nodes[0].x+doc.nodes[0].w/2-vertical.position)>2);assert.equal(await page.locator('.cr-manual-guide').count(),0);assert.equal(doc.guides.length,2);pass('ocultar guias desativa sua atração sem apagar as coordenadas');
 await page.getByRole('button',{name:'Mostrar linhas',exact:true}).click();await page.getByRole('button',{name:'Destravar todas',exact:true}).click();
 await page.getByRole('combobox',{name:'Guia selecionada',exact:true}).selectOption(vertical.id);
 const input=page.getByRole('spinbutton',{name:'Posição da guia',exact:true});await input.fill('100');await input.press('Tab');doc=await project();assert.ok(Math.abs(doc.guides.find(g=>g.id===vertical.id).position-100*300/25.4)<.02);pass('posição da linha pode ser informada numericamente em milímetros');
 await page.getByRole('button',{name:'Fechar configurações das guias',exact:true}).click();
 // Moving a guide at another zoom uses the current canvas rectangle.
 await page.getByRole('button',{name:'Aumentar zoom',exact:true}).click();c=await canvas.boundingBox();v=await line('x').boundingBox();
 await page.mouse.move(v.x+v.width/2,c.y+c.height*.1);await page.mouse.down();await page.mouse.move(c.x+c.width*.35,c.y+c.height*.1,{steps:8});await page.mouse.up();
 doc=await project();assert.ok(Math.abs(doc.guides.find(g=>g.axis==='x').position-2480*.35)<.1);pass('arraste continua preciso após alterar o zoom');
 c=await canvas.boundingBox();v=await line('x').boundingBox();await page.mouse.move(v.x+v.width/2,c.y+c.height*.1);await page.mouse.down();await page.mouse.move(c.x-35,c.y+c.height*.1,{steps:6});await page.mouse.up();assert.equal((await project()).guides.length,1);pass('soltar a linha fora da arte remove a guia');
 await page.keyboard.press('Control+z');assert.equal((await project()).guides.length,2);pass('remover guia por arraste também pode ser desfeito');
 // Escape cancels a pending drag, retaining the previous project.
 c=await canvas.boundingBox();const r=await page.getByRole('button',{name:'Puxar guia horizontal da régua superior',exact:true}).boundingBox();await page.mouse.move(r.x+r.width*.25,r.y+12);await page.mouse.down();await page.mouse.move(c.x+c.width*.25,c.y+c.height*.2);await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await project()).guides.length,2);pass('Esc cancela a nova guia sem alterar a composição');
 const exported=async()=>{await page.getByRole('button',{name:'Exportar',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar composição',exact:true}).click();const download=await pending;return fs.readFile(await download.path());};
 const withGuides=await exported();await page.getByRole('button',{name:/^Guias livres/}).click();await page.getByRole('button',{name:'Ocultar linhas',exact:true}).click();await page.getByRole('button',{name:'Fechar configurações das guias',exact:true}).click();const withoutGuides=await exported();assert.equal(createHash('sha256').update(withGuides).digest('hex'),createHash('sha256').update(withoutGuides).digest('hex'));pass('guias não aparecem na exportação: PNG idêntico com linhas ligadas ou desligadas');
 doc=await project();await page.getByRole('button',{name:'Nova aba',exact:true}).click();assert.equal((await project()).guides?.length||0,0);await page.getByRole('tab',{name:/Arte 1/}).click();assert.equal((await project()).guides.length,2);pass('guias são independentes entre as duas abas de arte');
 page.on('dialog',dialog=>dialog.accept());await page.locator('input[type=file][accept=".cgdesign,application/json"]').setInputFiles({name:'guias.cgdesign',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'cgdesign',version:1,document:doc}))});await page.getByRole('tab',{name:/Arte 1.*1 camadas/}).waitFor();assert.deepEqual((await project()).guides,doc.guides);pass('salvar e reabrir o .cgdesign mantém guias e coordenadas');
 await page.getByRole('button',{name:/^Guias livres/}).click();await page.getByRole('button',{name:'Mostrar linhas',exact:true}).click();await page.getByRole('button',{name:'Fechar configurações das guias',exact:true}).click();
 // Restore the fit, then select the object to expose the new contextual toolbar.
 await page.getByRole('button',{name:'Ajustar zoom à tela',exact:true}).click();c=await canvas.boundingBox();const n=doc.nodes[0];await page.mouse.click(c.x+(n.x+n.w/2)*c.width/doc.width,c.y+(n.y+n.h*.3)*c.height/doc.height);await page.getByRole('toolbar',{name:'Ações rápidas do elemento selecionado'}).waitFor();
 await page.getByRole('button',{name:'Centralizar objeto na horizontal',exact:true}).click();assert.equal((await project()).nodes[0].x,(doc.width-n.w)/2);pass('barra contextual torna o alinhamento acessível junto à arte');
 if(await page.getByRole('button',{name:'Fechar',exact:true}).count())await page.getByRole('button',{name:'Fechar',exact:true}).first().click();
 await page.screenshot({path:path.join(harness.output,'ruler-guides-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),z=document.querySelector('.cr-canvas-zone').getBoundingClientRect();return c.top>=z.top+20&&c.bottom<=z.bottom-10;});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(harness.output,'ruler-guides-mobile.png'),fullPage:true});pass('novos controles mantêm a página móvel sem transbordamento horizontal');
 assert.deepEqual(errors,[]);pass('nenhum erro JavaScript durante o fluxo de guias');console.log(`Artifacts: ${harness.output}`);
}finally{await browser.close();await harness.close();}
