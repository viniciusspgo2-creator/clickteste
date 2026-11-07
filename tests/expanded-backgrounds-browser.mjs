import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {toolRequire,startCreativeHarness} from './helpers/creative-browser-harness.mjs';
const {build}=toolRequire('esbuild'),{chromium}=toolRequire('playwright');
const harness=await startCreativeHarness();
await build({stdin:{contents:`import {expandedBackgroundSvg,backgroundDescriptor} from './src/lib/creative/expanded-backgrounds';import {sanitizeLibrarySvg} from './src/lib/creative/library-load';import catalog from './src/lib/creative/background-catalog.json';window.backgroundTest={expandedBackgroundSvg,backgroundDescriptor,sanitizeLibrarySvg,catalog};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,format:'iife',platform:'browser',outfile:path.join(harness.output,'background-test.js'),tsconfig:path.join(process.cwd(),'tsconfig.json'),logLevel:'warning'});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 await page.goto(harness.url);await page.locator('canvas').first().waitFor();await page.addScriptTag({url:harness.url+'/background-test.js'});
 const result=await page.evaluate(async()=>{
  const t=window.backgroundTest,failures=[],sources=[];
  for(const p of t.catalog){
   try{const src=await t.expandedBackgroundSvg(`pattern:${p.id}:0`,400,200,t.sanitizeLibrarySvg),img=new Image();img.src=src;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=200;canvas.height=100;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,200,100);const rgba=ctx.getImageData(0,0,200,100).data;let changed=0;
    for(let i=0;i<rgba.length;i+=4)if(rgba[i]!==249||rgba[i+1]!==220||rgba[i+2]!==229)changed++;
    if(changed<20)failures.push(p.id+': blank');sources.push({id:p.id,src});
   }catch(e){failures.push(p.id+': '+e.message);}
  }
  let rejected=0;for(const bad of ['pattern:../x:0','pattern:waves-1:-1','pattern:waves-1:99'])try{t.backgroundDescriptor(bad);}catch{rejected++;}
  return {count:sources.length,failures,rejected};
 });
 assert.equal(result.count,342);assert.deepEqual(result.failures,[]);assert.equal(result.rejected,3);console.log('PASS: all 342 designs load and render offline; invalid IDs rejected');
 await page.locator('.cr-rail').getByRole('button',{name:'Fundos',exact:true}).click();
 await page.getByLabel('Estilo do fundo',{exact:true}).selectOption('Florais e botânicos');await page.getByLabel('Paleta de cores',{exact:true}).selectOption('Lavanda');
 const button=page.locator('.cr-curated-add').first();await button.waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.cr-curated-thumb img')].some(i=>i.complete&&i.naturalWidth>0));
 assert.ok(await page.locator('.cr-curated-slot').count()<30,'visible cards remain bounded');
 await button.click();await page.waitForFunction(()=>document.querySelector('.cr-toast')?.textContent?.includes('Fundo')||[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('Fundo')),{timeout:1000}).catch(()=>{});
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Projeto',exact:true}).click();await page.getByTitle('Criar backup portátil com os arquivos do projeto',{exact:true}).click();const download=await pending,project=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 const node=project.document.nodes.find(n=>n.role==='background');assert.ok(node);assert.equal(node.w,2480);assert.equal(node.h,1122);assert.ok(decodeURIComponent(node.src).includes('pattern.monster'));
 await page.screenshot({path:path.join(harness.output,'expanded-backgrounds.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log('PASS: style/palette filters, virtualized browsing, background insertion, portable backup and mobile width');
 // Produce a contact sheet of families and palettes for visual review.
 await page.evaluate(async()=>{const t=window.backgroundTest;document.body.replaceChildren();const grid=document.createElement('div');grid.style='display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px;background:#eee;color:#222';document.body.append(grid);const selected=t.catalog.filter((p,i)=>i<24||p.source==='original');for(let i=0;i<selected.length;i++){const p=selected[i],card=document.createElement('div'),img=new Image();img.style='width:100%;height:120px;object-fit:cover';img.src=await t.expandedBackgroundSvg(`pattern:${p.id}:${i%15}`,400,200,t.sanitizeLibrarySvg);await img.decode();const label=document.createElement('div');label.textContent=p.nome+' · '+p.estilo;card.append(img,label);grid.append(card);}});
 await page.setViewportSize({width:1200,height:1000});await page.screenshot({path:path.join(harness.output,'background-contact-sheet.png'),fullPage:true});
}finally{await browser.close();await harness.close();}
