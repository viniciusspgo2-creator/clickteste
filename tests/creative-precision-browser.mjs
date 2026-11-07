/** Real 2D editor, isolated from Next hosting/auth/database.
 * STUDIO_TEST_TOOLS=/path/to/tools node tests/creative-precision-browser.mjs
 * Tools: esbuild, playwright; Chromium: STUDIO_TEST_CHROMIUM or /usr/bin/chromium.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const {toolRequire,startCreativeHarness}=await import('./helpers/creative-browser-harness.mjs');
const {chromium}=toolRequire('playwright');
const harness=await startCreativeHarness();
const {output}=harness;
const browser=await chromium.launch({executablePath:process.env.STUDIO_TEST_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];let checks=0;
const pass=message=>{checks++;console.log(`PASS ${checks}: ${message}`);};
try{
 const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'reduce',acceptDownloads:true});
 await context.route('**/*',route=>/^https?:\/\/127\.0\.0\.1:/.test(route.request().url())?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000);
 await page.goto(harness.url);
 await page.getByRole('button',{name:'Elementos',exact:true}).click();
 await page.getByRole('button',{name:'Retângulo',exact:true}).click();
 const x=page.getByRole('spinbutton',{name:'Posição X',exact:true}),y=page.getByRole('spinbutton',{name:'Posição Y',exact:true});
 const startX=Number(await x.inputValue()),startY=Number(await y.inputValue());
 const canvas=page.locator('canvas').first();
 await canvas.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Shift+ArrowDown');await page.keyboard.press('Alt+ArrowLeft');
 await page.waitForFunction(v=>Number(document.querySelector('[aria-label="Posição X"]').value)===v,startX+.9);
 assert.equal(Number(await x.inputValue()),startX+.9);assert.equal(Number(await y.inputValue()),startY+10);pass('setas movem 1 px, Shift 10 px e Alt 0,1 px');
 await x.focus();await page.keyboard.press('ArrowUp');await x.press('Tab');
 assert.equal(Number(await x.inputValue()),startX+1);pass('setas dentro de campos numéricos editam o campo e não deslocam a seleção');
 await canvas.focus();const beforeRepeat=Number(await x.inputValue());
 await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowRight');await page.keyboard.up('ArrowRight');
 assert.equal(Number(await x.inputValue()),beforeRepeat+3);
 await page.keyboard.press('Control+z');
 // Undo deselects by design; verify through the actual portable project exporter.
 const project=async()=>{
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Projeto',exact:true}).click();await page.getByTitle('Criar backup portátil com os arquivos do projeto',{exact:true}).click({timeout:5000});
  const download=await pending;return JSON.parse(await fs.readFile(await download.path(),'utf8')).document;
 };
 assert.equal((await project()).nodes[0].x,beforeRepeat);pass('uma tecla mantida vira uma única etapa de desfazer');
 await page.keyboard.press('Control+Shift+z');assert.equal((await project()).nodes[0].x,beforeRepeat+3);pass('refazer recupera toda a sequência de movimento');
 // Select through the canvas, retaining real hit testing and focus behavior.
 let bounds=await canvas.boundingBox(),document=await project();
 const select=async node=>{bounds=await canvas.boundingBox();await page.mouse.click(bounds.x+(node.x+node.w/2)*bounds.width/document.width,bounds.y+(node.y+node.h/2)*bounds.height/document.height);};
 await select(document.nodes[0]);await page.getByRole('button',{name:'Centralizar horizontalmente',exact:true}).click();
 assert.equal(Number(await x.inputValue()),(2480-document.nodes[0].w)/2);pass('alinhamento central usa a largura real do documento');
 const aligned=(await project()).nodes[0];bounds=await canvas.boundingBox();
 const sx=bounds.x+(aligned.x+aligned.w/2)*bounds.width/2480,sy=bounds.y+(aligned.y+aligned.h/2)*bounds.height/1122;
 await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx+4,sy,{steps:3});
 assert.equal(await page.locator('.cr-snap-x').count(),1);await page.mouse.up();
 assert.equal((await project()).nodes[0].x,aligned.x);assert.equal(await page.locator('.cr-snap-x').count(),0);pass('arraste encaixa no centro e remove a linha auxiliar ao soltar');
 await page.getByRole('button',{name:'Travar ou destravar elemento',exact:true}).click();
 const locked=await project();await canvas.focus();await page.keyboard.press('ArrowRight');assert.equal((await project()).nodes[0].x,locked.nodes[0].x);pass('camadas bloqueadas não se movem pelo teclado');
 await page.getByRole('button',{name:'Travar ou destravar elemento',exact:true}).click();
 const exported=async()=>{
  await page.getByRole('button',{name:'Exportar',exact:true}).click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar composição',exact:true}).click();
  const download=await pending;return fs.readFile(await download.path());
 };
 const withRulers=await exported();await page.getByRole('button',{name:'Visualização e guias',exact:true}).click();await page.getByRole('button',{name:'Mostrar réguas',exact:true}).click();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Visualização e guias',exact:true}).click();await page.getByRole('button',{name:'Mostrar centros das faces da caneca',exact:true}).click();await page.keyboard.press('Escape');const withoutRulers=await exported();
 assert.equal(createHash('sha256').update(withRulers).digest('hex'),createHash('sha256').update(withoutRulers).digest('hex'));pass('réguas e guias não alteram o PNG exportado');
 await page.locator('.cr-rail').getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.getByRole('textbox',{name:'Pesquisar itens da biblioteca',exact:true}).fill('kawaii');
 await page.getByTitle('Adicionar Café kawaii',{exact:true}).click();
 let composition=await project();assert.equal(composition.nodes.length,2);assert.ok(composition.nodes[1].src.startsWith('data:image/svg+xml'));pass('ilustração kawaii local é inserida sem serviço externo');
 await page.getByLabel('Tipo de conteúdo',{exact:true}).selectOption('Elementos');
 await page.getByRole('textbox',{name:'Pesquisar itens da biblioteca',exact:true}).fill('coração');
 await page.locator('.cr-curated-add').first().click();composition=await project();assert.equal(composition.nodes.length,3);assert.ok(composition.nodes[2].w>=200&&composition.nodes[2].h>=200);pass('busca em português insere vetor Tabler local com todos os CDNs bloqueados');
 assert.ok(await page.locator('.cr-curated-card').count()<60);pass('biblioteca mantém apenas os cards visíveis no DOM');
 await canvas.focus();await page.keyboard.press('Control+c');await page.getByRole('button',{name:'Nova aba',exact:true}).click();await page.keyboard.press('Control+v');
 const pasted=await project();assert.equal(pasted.nodes.length,1);assert.notEqual(pasted.nodes[0].id,composition.nodes[2].id);
 await page.getByRole('tab',{name:/Arte 1/}).click();assert.equal((await project()).nodes.length,3);pass('copiar e colar entre abas preserva documentos independentes');
 await page.getByTitle('Atalhos e dicas de edição',{exact:true}).click();await page.getByRole('dialog',{name:'Atalhos do editor'}).waitFor();
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Fechar atalhos');await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog',{name:'Atalhos do editor'}).count(),0);pass('painel de atalhos mantém foco e fecha com Esc');

 if(await page.getByRole('button',{name:'Fechar',exact:true}).count())await page.getByRole('button',{name:'Fechar',exact:true}).first().click();
 await page.screenshot({path:path.join(output,'editor-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'editor-mobile.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);pass('layout móvel preservado sem transbordamento horizontal');
 assert.deepEqual(errors,[]);pass('nenhum erro JavaScript no navegador');
 console.log(`Artifacts: ${output}`);
}finally{await browser.close();await harness.close();}
