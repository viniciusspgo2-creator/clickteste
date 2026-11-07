import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {toolRequire,startCreativeHarness} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright');
const harness=await startCreativeHarness();
const browser=await chromium.launch({executablePath:process.env.STUDIO_TEST_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];let checks=0;
const pass=message=>{checks++;console.log(`PASS ${checks}: ${message}`);};
try{
 const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'reduce',acceptDownloads:true});
 await context.route('**/*',route=>/^https?:\/\/127\.0\.0\.1:/.test(route.request().url())?route.continue():route.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(harness.url);await page.waitForFunction(()=>Boolean(window.svgTest));
 const fixture=await fs.readFile('tests/fixtures/editable-svg/girl.svg','utf8');
 const functional=await page.evaluate(async fixture=>{
  const t=window.svgTest,source=await t.readLocalAsset(new File([fixture],'menina.svg',{type:'image/svg+xml'}));
  const first=t.inspectSvg(source),shirt=first.paints.find(p=>p.label==='Camiseta'),hair=first.paints.find(p=>p.label==='Cabelo');
  if(!shirt||!hair)throw Error('Named SVG parts missing');
  const changed=t.recolorSvg(source,shirt.key,'#27a36c');
  const palette=t.inspectSvg(changed).paints;
  const global=t.inspectSvg(t.recolorSvg(source,shirt.key,'#6644dd','color')).paints;
  const raw=t.svgSource(changed);
  return {source,original:shirt.color,shirt:palette.find(p=>p.key===shirt.key).color,hair:palette.find(p=>p.key===hair.key).color,
   globalShirt:global.find(p=>p.key===shirt.key).color,globalHair:global.find(p=>p.key===hair.key).color,raw};
 },fixture);
 assert.ok(functional.source.startsWith('data:image/svg+xml'));assert.ok(functional.raw.includes('<path'));assert.ok(!functional.raw.includes('<style'));pass('importação mantém paths e converte classes CSS em atributos de apresentação');
 assert.equal(functional.shirt,'#27a36c');assert.equal(functional.hair,functional.original);pass('trocar a camiseta não altera cabelo com a mesma cor original');
 assert.equal(functional.globalHair,'#6644dd');assert.equal(functional.globalShirt,'#6644dd');pass('modo por cor altera todas as partes correspondentes');
 const security=await page.evaluate(()=>{
  const t=window.svgTest;
  const bad=['<script>alert(1)</script>','<foreignObject><div>test</div></foreignObject>','<image href="https://example.com/a.png"/>','<use href="#a"/>','<rect onload="alert(1)"/>','<animate attributeName="fill"/>','<rect fill="url(https://example.com/x)"/>','<style>@import "https://example.com/a.css";</style>','<rect style="fill:url(https://example.com/x)"/>'];
  let rejected=0;for(const body of bad){try{t.sanitizeEditableSvg(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`);}catch{rejected++;}}
  try{t.sanitizeEditableSvg('<!DOCTYPE svg [<!ENTITY x "unsafe">]><svg/>');}catch{rejected++;}
  return {rejected,total:bad.length+1};
 });
 assert.equal(security.rejected,security.total);pass('scripts, eventos, referências externas e XML ativo são rejeitados');
 const advanced=await page.evaluate(()=>{
  const t=window.svgTest,raw='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><defs><linearGradient id="grad"><stop stop-color="red"/><stop offset="1" stop-color="#00f"/></linearGradient><clipPath id="clip"><rect width="50" height="50"/></clipPath></defs><rect id="faixa" width="120" height="30" fill="url(#grad)"/><g fill="rgba(0,255,0,0.5)" transform="translate(10 30)"><rect id="transparente" width="30" height="30" clip-path="url(#clip)"/></g></svg>';
  const src=t.svgDataUrl(t.sanitizeEditableSvg(raw)),before=t.inspectSvg(src);
  const stop=before.paints.find(p=>p.attribute==='stop-color'),green=before.paints.find(p=>p.label==='transparente');
  const after=t.inspectSvg(t.recolorSvg(src,green.key,'#ff8800'));
  const grad=t.svgSource(t.recolorSvg(src,stop.key,'#ffff00'));
  const css=t.inspectSvg(t.svgDataUrl(t.sanitizeEditableSvg('<svg xmlns="http://www.w3.org/2000/svg"><style>.x{fill:red!important} #part{fill:blue}</style><path id="part" class="x" style="fill:green" d="M0 0h10v10Z"/></svg>')));
  return {count:before.paints.length,alpha:after.paints.find(p=>p.key===green.key).alpha,green:after.paints.find(p=>p.key===green.key).color,grad,css:css.paints[0].color};
 });
 assert.equal(advanced.count,3);assert.ok(advanced.grad.includes('#ffff00'));assert.ok(advanced.grad.includes('url(#grad)'));assert.ok(advanced.grad.includes('clip-path'));assert.ok(advanced.alpha>.49&&advanced.alpha<.51);assert.equal(advanced.green,'#ff8800');assert.equal(advanced.css,'#ff0000');pass('gradientes, recortes, transparência, transforms e prioridade CSS são preservados');
 await page.locator('input[type=file][multiple]').setInputFiles({name:'menina.svg',mimeType:'image/svg+xml',buffer:Buffer.from(fixture)});
 const parts=page.getByRole('combobox',{name:'Parte do SVG',exact:true});await parts.waitFor();
 const previewBox=await page.locator('.cr-svg-click-preview').boundingBox(),previewSvg=await page.locator('.cr-svg-click-preview >svg').boundingBox();
 assert.ok(previewSvg.height<=previewBox.height&&previewSvg.width<=previewBox.width);
 const options=await parts.locator('option').allTextContents(),shirtLabel=options.find(s=>s.endsWith('Camiseta'));
 assert.ok(shirtLabel);await page.locator('.cr-svg-click-preview [id$="Camiseta"] path').click();assert.equal(await parts.locator('option:checked').textContent(),shirtLabel);
 await page.getByLabel('Nova cor da parte do SVG',{exact:true}).fill('#27a36c');
 const project=async()=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Projeto',exact:true}).click();await page.getByTitle('Criar backup portátil com os arquivos do projeto',{exact:true}).click();const download=await pending;return JSON.parse(await fs.readFile(await download.path(),'utf8')).document;};
 let doc=await project();assert.equal(doc.nodes.length,1);
 let paint=await page.evaluate(src=>window.svgTest.inspectSvg(src).paints,doc.nodes[0].src);
 assert.equal(paint.find(p=>p.label==='Camiseta').color,'#27a36c');assert.equal(paint.find(p=>p.label==='Cabelo').color,'#e85d75');pass('interface real edita apenas a região escolhida e salva as cores no .cgdesign');
 const canvas=page.locator('canvas').first();await canvas.focus();await page.keyboard.press('Control+z');doc=await project();
 paint=await page.evaluate(src=>window.svgTest.inspectSvg(src).paints,doc.nodes[0].src);assert.equal(paint.find(p=>p.label==='Camiseta').color,'#e85d75');
 await canvas.focus();await page.keyboard.press('Control+Shift+z');doc=await project();paint=await page.evaluate(src=>window.svgTest.inspectSvg(src).paints,doc.nodes[0].src);assert.equal(paint.find(p=>p.label==='Camiseta').color,'#27a36c');pass('desfazer e refazer recuperam as cores vetoriais');
 // Undo/redo deselects; use actual canvas hit testing to select the girl again.
 let rect=await canvas.boundingBox(),n=doc.nodes[0];await page.mouse.click(rect.x+(n.x+n.w/2)*rect.width/doc.width,rect.y+(n.y+n.h/2)*rect.height/doc.height);
 await page.getByRole('combobox',{name:'Unidade das medidas',exact:true}).selectOption('mm');
 await page.getByRole('spinbutton',{name:'Largura',exact:true}).fill('40');await page.getByRole('spinbutton',{name:'Largura',exact:true}).press('Tab');
 doc=await project();assert.ok(Math.abs(doc.nodes[0].w-40*300/25.4)<.001);assert.ok(Math.abs(doc.nodes[0].h/doc.nodes[0].w-1.5)<1e-6);pass('largura em milímetros mantém proporção e escala de impressão a 300 DPI');
 await page.getByRole('button',{name:'Centralizar na face 1',exact:true}).click();await page.getByRole('button',{name:'Duplicar na outra face',exact:true}).click();
 doc=await project();assert.equal(doc.nodes.length,2);assert.ok(Math.abs(doc.nodes[1].x-doc.nodes[0].x-doc.width/2)<.001);assert.equal(doc.nodes[1].src,doc.nodes[0].src);assert.equal(doc.nodes[1].flipX,doc.nodes[0].flipX);pass('cópia na segunda face preserva cores, tamanho e orientação');
 const pixel=await page.evaluate(async doc=>{window.svgTest.validateProjectDocument(doc);const c=document.createElement('canvas');await window.svgTest.drawDesign(c,doc,undefined,{strict:true});const n=doc.nodes[0];return Array.from(c.getContext('2d').getImageData(Math.round(n.x+n.w*.5),Math.round(n.y+n.h*.45),1,1).data);},doc);
 assert.deepEqual(pixel,[39,163,108,255]);pass('renderização final usa a cor da camiseta editada');
 await page.getByRole('button',{name:'Exportar',exact:true}).click();const pngPending=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar composição',exact:true}).click();const png=await pngPending;const pngBytes=await fs.readFile(await png.path());assert.equal(pngBytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');pass('arte com SVG recolorido exporta PNG válido');
 await page.getByRole('button',{name:'Baixar SVG personalizado',exact:true}).scrollIntoViewIfNeeded();const svgPending=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar SVG personalizado',exact:true}).click();const svg=await svgPending;const svgText=await fs.readFile(await svg.path(),'utf8');assert.ok(svgText.includes('#27a36c'));assert.ok(svgText.includes('id="Camiseta"'));assert.ok(!svgText.includes('#ed2693'));pass('download do SVG preserva partes e cores sem o destaque da prévia');
 // Reload the real exported project to exercise the importer, not only JSON serialization.
 page.on('dialog',dialog=>dialog.accept());await page.locator('input[type=file][accept=".cgdesign,application/json"]').setInputFiles({name:'cores.cgdesign',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'cgdesign',version:1,document:doc}))});
 await page.getByRole('tab',{name:/Arte 1.*2 camadas/}).waitFor();const restored=await project();assert.equal(restored.nodes[0].src,doc.nodes[0].src);pass('projeto com SVG editado pode ser reaberto sem perder o vetor');
 if(await page.getByRole('button',{name:'Fechar',exact:true}).count())await page.getByRole('button',{name:'Fechar',exact:true}).first().click();
 rect=await canvas.boundingBox();n=restored.nodes[0];await page.mouse.click(rect.x+(n.x+n.w/2)*rect.width/restored.width,rect.y+(n.y+n.h/2)*rect.height/restored.height);await page.locator('.cr-inspector').evaluate(el=>{el.scrollTop=0;});
 await page.screenshot({path:path.join(harness.output,'svg-editor-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);pass('controles novos cabem no layout móvel');
 assert.deepEqual(errors,[]);pass('nenhum erro JavaScript com importação, recoloração e exportação');
 console.log(`Artifacts: ${harness.output}`);
}finally{await browser.close();await harness.close();}
