import test from 'node:test';
import assert from 'node:assert/strict';
import {startCreativeHarness,toolRequire} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright');

test('Studio Templates: choose supplied scene, retain Studio mug, add text/logo and render',async()=>{
 const harness=await startCreativeHarness();
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(harness.url+'/studio-templates');
  await page.waitForSelector('.cr-gallery-card');
  assert.equal(await page.locator('.cr-gallery-card').count(),24);
  assert.equal(await page.getByText('LAYOUTS EDITÁVEIS DA PLATAFORMA').count(),0);
  assert.ok(await page.locator('.cr-gallery-filter').innerText().then(s=>s.includes('112')));
  await page.getByRole('button',{name:'Aniversário',exact:true}).click();
  assert.equal(await page.locator('.cr-gallery-card').count(),11);
  await page.getByRole('button',{name:'Todos',exact:true}).click();
  await page.getByRole('button',{name:'Próxima',exact:true}).click();
  assert.ok((await page.locator('.cr-gallery-pagination').innerText()).includes('2 / 5'));
  await page.getByRole('textbox',{name:'Buscar cenários'}).fill('neon');
  assert.equal(await page.locator('.cr-gallery-card').count(),18);
  await page.getByRole('textbox',{name:'Buscar cenários'}).fill('sem-resultado');
  await page.getByText('Nenhum cenário encontrado.').waitFor();
  await page.getByRole('button',{name:'Ver todos os cenários'}).click();
  assert.ok(await page.locator('.cr-gallery-thumbnail img').first().evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=200;canvas.height=260;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#ee6600';ctx.fillRect(30,20,120,210);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   await window.svgTest.writeLayeredHandoff([{blob,name:'Mockup de teste'}]);
  });
  await page.locator('.cr-gallery-thumbnail').first().click();
  await page.getByText('Cenário e mockup prontos.',{exact:false}).waitFor({timeout:30000});
  assert.equal(new URL(page.url()).search,'');
  assert.ok((await page.locator('.cr-layer-select').allTextContents()).some(s=>s.includes('Mockup de teste')));
  assert.ok((await page.locator('.cr-layer-select').allTextContents()).some(s=>s.includes('Cenários cinematográficos 01')));
  // Exercise the real text and upload tools on top of the supplied background.
  await page.getByRole('button',{name:'Textos',exact:true}).click();
  await page.getByRole('button',{name:'+ Título',exact:true}).click();
  await page.locator('input[type="file"][multiple][accept*="image/png"]').setInputFiles({name:'logo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="blue"/></svg>')});
  await page.getByRole('button',{name:'Camadas',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.cr-layer-select').length===4);
  assert.equal(await page.locator('.cr-layer-select').count(),4);
  const png=await page.locator('canvas').first().evaluate(canvas=>canvas.toDataURL('image/png'));
  assert.ok(png.startsWith('data:image/png;base64,'));assert.ok(png.length>10000);
  await page.screenshot({path:'/tmp/clickteste-studio-scenes-editor.png'});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await harness.close();}
});
