import test from 'node:test';
import assert from 'node:assert/strict';
import {startCreativeHarness,toolRequire} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright');
test('One-click support, visible controls, pinning and exported contact shadow work in a browser',async()=>{
 const harness=await startCreativeHarness();
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(harness.url+'/studio-templates');await page.waitForSelector('.cr-gallery-card');
  await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=200;c.height=260;
   const ctx=c.getContext('2d');ctx.fillStyle='#dd8844';ctx.fillRect(30,20,120,210);
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
   await window.svgTest.writeLayeredHandoff([{blob,name:'Caneca frente'},{blob,name:'Caneca verso'}]);
  });
  await page.locator('.cr-gallery-thumbnail').first().click();
  await page.getByText('Cenário e mockup prontos.',{exact:false}).waitFor();
  await page.locator('.cr-layer-select').filter({hasText:'Caneca frente'}).click();
  const original=await page.locator('.cr-selection').evaluate(el=>({x:el.style.left,y:el.style.top,w:el.style.width,h:el.style.height}));
  await page.locator('.cr-layer-select').filter({hasText:'Cenários cinematográficos'}).click();
  await page.getByRole('button',{name:'Integrar à mesa (2 canecas)',exact:true}).click();
  await page.getByText('Sombra aplicada sem mover', {exact:false}).waitFor();
  const unchanged=await page.locator('.cr-selection').evaluate(el=>({x:el.style.left,y:el.style.top,w:el.style.width,h:el.style.height}));
  assert.deepEqual(unchanged,original);
  await page.getByRole('button',{name:'Prender nesta posição',exact:true}).click();
  await page.getByText('Apoio preso na posição atual.',{exact:false}).waitFor();
  assert.deepEqual(await page.locator('.cr-selection').evaluate(el=>({x:el.style.left,y:el.style.top,w:el.style.width,h:el.style.height})),original);
  await page.getByText('Presa à mesa · move para os lados',{exact:true}).waitFor();
  assert.ok(await page.getByRole('slider',{name:'Intensidade da sombra',exact:true}).isVisible());
  const selection=()=>page.locator('.cr-selection').evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top),w:parseFloat(el.style.width),h:parseFloat(el.style.height)}));
  const before=await selection();
  await page.locator('canvas[tabindex]').focus();await page.keyboard.press('ArrowDown');
  assert.equal((await selection()).y,before.y);
  await page.keyboard.press('ArrowRight');assert.ok((await selection()).x>before.x);
  // Resize while pinned: the foot remains at the table, rather than lifting with the top edge.
  const handle=page.getByRole('button',{name:'Redimensionar se com proporção preservada'}),box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+20,box.y+box.height/2+30,{steps:5});await page.mouse.up();
  const after=await selection();assert.ok(after.h>before.h);assert.ok(after.y<before.y);
  await page.getByRole('button',{name:'← Esquerda',exact:true}).click();
  await page.getByRole('button',{name:'Natural',exact:true}).click();
  await page.screenshot({path:'/tmp/clickteste-grounding-desktop.png'});
  await page.getByRole('button',{name:'Soltar da mesa',exact:true}).click();
  const released=await selection();await page.locator('canvas[tabindex]').focus();await page.keyboard.press('ArrowDown');assert.ok((await selection()).y>released.y);
  // Pixel evidence uses the real renderer and PNG exporter, with transparent PNG margins.
  const pixels=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=200;c.height=260;
   const ctx=c.getContext('2d');ctx.fillStyle='#ff7700';ctx.fillRect(30,20,120,210);
   const node={id:'mug',kind:'image',role:'mockup',src:c.toDataURL(),x:160,y:80,w:200,h:260,angle:0,opacity:1,shadow:0};
   const doc={width:500,height:400,background:'#ffffff',nodes:[node]},output=document.createElement('canvas');
   await window.svgTest.drawDesign(output,doc);
   const sample=(x,y)=>Array.from(output.getContext('2d').getImageData(x,y,1,1).data);
   const off=sample(250,311);
   node.grounding={strength:.8,softness:.55,direction:.45,length:.22,offset:0};
   window.svgTest.validateProjectDocument(doc);
   for(const bad of [{...node.grounding,strength:NaN},{...node.grounding,pin:{surface:3,contactX:.5,contactY:.9}}]){
    let rejected=false;try{window.svgTest.validateProjectDocument({...doc,nodes:[{...node,grounding:bad}]});}catch{rejected=true;}if(!rejected)throw Error('Unsafe grounding accepted');
   }
   await window.svgTest.drawDesign(output,doc);const on=sample(250,311);
   const blob=await window.svgTest.exportDesign(doc,'png',1),image=await createImageBitmap(blob);
   output.getContext('2d').clearRect(0,0,500,400);output.getContext('2d').drawImage(image,0,0);
   const exported=sample(250,311);image.close();
   node.x+=80;await window.svgTest.drawDesign(output,doc);
   return {off,on,exported,moved:sample(330,311),old:sample(250,311),type:blob.type};
  });
  assert.equal(pixels.off[0],255);assert.ok(pixels.on[0]<245);assert.deepEqual(pixels.exported,pixels.on);assert.ok(pixels.moved[0]<245);assert.ok(pixels.old[0]>pixels.on[0]);assert.equal(pixels.type,'image/png');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.getByRole('button',{name:'Integrar à mesa',exact:true}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await harness.close();}
});
