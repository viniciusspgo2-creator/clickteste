import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {startCreativeHarness,toolRequire} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright');
test('Real curved mug retains its opaque pixels and gets a thin exterior contact shadow',async()=>{
 const source=await sharp('public/mockup-scenes/models/three-quarter-base.png').resize(600).png().toBuffer();
 const harness=await startCreativeHarness(),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});await page.goto(harness.url);await page.waitForSelector('canvas');
  const result=await page.evaluate(async src=>{
   const node={id:'real-mug',kind:'image',role:'mockup',src,x:100,y:50,w:600,h:600,angle:0,opacity:1,shadow:0};
   const doc={width:800,height:750,background:'#ffffff',nodes:[node]},plain=document.createElement('canvas'),shadow=document.createElement('canvas'),mask=document.createElement('canvas');
   await window.svgTest.drawDesign(plain,doc);await window.svgTest.drawDesign(mask,{...doc,background:'transparent'});
   node.grounding={strength:1,softness:.35,direction:.45,length:.22,offset:0};await window.svgTest.drawDesign(shadow,doc);
   const p=plain.getContext('2d').getImageData(0,0,800,750).data,s=shadow.getContext('2d').getImageData(0,0,800,750).data,m=mask.getContext('2d').getImageData(0,0,800,750).data;
   let changedOpaque=0,exterior=0;
   for(let i=0;i<m.length;i+=4){if(m[i+3]===255&&(p[i]!==s[i]||p[i+1]!==s[i+1]||p[i+2]!==s[i+2]))changedOpaque++;if(m[i+3]===0&&s[i]<240)exterior++;}
   // Review an actual curved mug over a supplied DBZ scene, with identical geometry.
   const review=document.createElement('div');review.style.cssText='position:fixed;inset:0;z-index:9999;background:#15171b;display:flex;align-items:center;justify-content:center;gap:20px;color:white';
   for(const enabled of [false,true]){
    const scene={id:'scene',kind:'image',role:'background',src:'/studio-templates/cenario-016.webp',x:0,y:0,w:928,h:1152,angle:0,opacity:1};
    const canvas=document.createElement('canvas');await window.svgTest.drawDesign(canvas,{width:928,height:1152,background:'#fff',nodes:[scene,{...node,x:190,y:460,w:600,h:600,grounding:enabled?node.grounding:undefined}]});
    const figure=document.createElement('figure'),label=document.createElement('figcaption');label.textContent=enabled?'Sombra do contorno real · intensidade 100%':'Sem integração';canvas.style.cssText='width:450px;height:auto';figure.append(label,canvas);review.append(figure);
   }
   document.body.append(review);return {changedOpaque,exterior};
  },'data:image/png;base64,'+source.toString('base64'));
  assert.equal(result.changedOpaque,0,'Grounding must never reshape or darken opaque mug pixels');assert.ok(result.exterior>100,'Contact shadow should exist outside the source silhouette');
  await page.screenshot({path:'/tmp/contact-real-mug-comparison.png'});
 }finally{await browser.close();await harness.close();}
});
