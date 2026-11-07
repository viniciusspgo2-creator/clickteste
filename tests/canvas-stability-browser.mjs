import assert from 'node:assert/strict';
import {toolRequire,startCreativeHarness} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright'),h=await startCreativeHarness(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(h.url)?r.continue():r.abort());await page.goto(h.url);await page.waitForFunction(()=>window.svgTest);
 const measure=()=>page.evaluate(()=>{const s=document.querySelector('.cr-stage'),z=document.querySelector('.cr-canvas-zone'),r=s.getBoundingClientRect(),b=z.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y,zone:{w:b.width,h:b.height,clientW:z.clientWidth,clientH:z.clientHeight,scrollW:z.scrollWidth,scrollH:z.scrollHeight},padding:getComputedStyle(z).padding};});
 await page.waitForTimeout(600);const before=await measure();console.log('initial',before);
 await page.getByRole('button',{name:'Elementos',exact:true}).click();await page.getByTitle('Estrela 8 pontas',{exact:true}).click();await page.waitForTimeout(300);const selected=await measure();console.log('selected',selected);
 await page.getByRole('button',{name:'Projeto',exact:true}).click();await page.getByRole('menuitem',{name:/Salvar no navegador/}).click();await page.locator('.cr-notice').waitFor();
 const history=await page.evaluate(async()=>{const values=[];for(let i=0;i<80;i++){const r=document.querySelector('.cr-stage').getBoundingClientRect();values.push([r.width,r.height,r.x,r.y]);await new Promise(r=>setTimeout(r,65));}return values;});
 console.log('distinct positions',new Set(history.map(JSON.stringify)).size);
 assert.ok(Math.abs(selected.x-before.x)<1&&Math.abs(selected.y-before.y)<1,'Selection must not move the artboard');
 assert.ok(selected.zone.scrollW<=selected.zone.clientW+1&&selected.zone.scrollH<=selected.zone.clientH+1,'Fit must avoid scrollbars');
 assert.ok(Math.abs(selected.width-before.width)<2,'Selection must not resize the artboard');assert.equal(new Set(history.map(JSON.stringify)).size,1,'Artboard must stay stationary while notices appear/disappear');
 const b=await page.locator('.cr-stage').boundingBox();await page.mouse.click(b.x+b.width*.95,b.y+b.height*.95);await page.waitForTimeout(200);assert.ok(Math.abs((await measure()).width-selected.width)<2);
 await page.getByRole('button',{name:'Aumentar zoom',exact:true}).click();const manual=await measure();await page.getByRole('button',{name:'Recolher ou expandir propriedades',exact:true}).click();await page.waitForTimeout(300);assert.ok(Math.abs((await measure()).width-manual.width)<2,'Manual zoom must survive panel changes');
 await page.getByRole('button',{name:'Ajustar zoom à tela',exact:true}).click();await page.waitForTimeout(200);console.log('fit',await measure());
 for(const size of [{width:1920,height:900},{width:1440,height:700}]){
  await page.setViewportSize(size);await page.getByRole('button',{name:'Ajustar zoom à tela',exact:true}).click();await page.waitForTimeout(200);
  const initial=await measure(),canvas=await page.locator('canvas').first().boundingBox();await page.mouse.click(canvas.x+canvas.width/2,canvas.y+canvas.height/2);await page.waitForTimeout(150);const after=await measure();
  assert.ok(Math.abs(initial.width-after.width)<1&&Math.abs(initial.y-after.y)<1,JSON.stringify(size));assert.ok(after.zone.scrollW<=after.zone.clientW+1&&after.zone.scrollH<=after.zone.clientH+1);
 }
 await page.screenshot({path:h.output+'/stable-canvas.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS canvas stability, selection, notices, manual zoom and fit');
}finally{await browser.close();await h.close();}
