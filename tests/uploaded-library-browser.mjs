import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {toolRequire,startCreativeHarness} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright'),harness=await startCreativeHarness();
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),requests=[],errors=[];
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 page.on('request',r=>{if(r.url().includes('/uploads/'))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(harness.url);await page.locator('canvas').first().waitFor();
 await page.locator('.cr-rail').getByRole('button',{name:'Biblioteca',exact:true}).click();
 const search=page.getByRole('textbox',{name:'Pesquisar itens da biblioteca'});await search.fill('Gato preto');
 const first=page.getByTitle('Adicionar Gato preto 01',{exact:true});await first.waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('img')].some(i=>i.src.includes('enviado-gatos-pretos-01-thumb.webp')&&i.complete&&i.naturalWidth>0));
 assert.ok(requests.length>0&&requests.every(url=>url.endsWith('-thumb.webp')),'browsing only downloads small previews');
 await first.click();await page.waitForFunction(()=>document.querySelector('.cr-layer-row')||document.querySelector('canvas'));
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Projeto',exact:true}).click();await page.getByTitle('Criar backup portátil com os arquivos do projeto',{exact:true}).click();
 const download=await pending,project=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 assert.equal(project.document.nodes.length,1);assert.ok(requests.some(url=>url.endsWith('enviado-gatos-pretos-01.webp')));
 assert.match(project.document.nodes[0].src,/^data:image\/webp;base64,/);
 await page.screenshot({path:`${harness.output}/uploaded-library.png`,fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: miniaturas leves, imagem WebP sob demanda, inserção e backup portátil sem erros.');
}finally{await browser.close();await harness.close();}
