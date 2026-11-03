from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json
root=Path(__file__).resolve().parent
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1100,'height':800})
 page.set_content('<!DOCTYPE html><html><body></body></html>')
 page.add_script_tag(content=(root/'fixtures/v37-browser-runtime.js').read_text())
 page.evaluate("Object.defineProperty(crypto, 'randomUUID', {value:()=> 'test-'+Math.random().toString(36).slice(2), configurable:true});")
 psd=base64.b64encode((root/'fixtures/sample-zip-prediction.psd').read_bytes()).decode()
 result=page.evaluate('''async b=>{
   const buf=Uint8Array.from(atob(b),v=>v.charCodeAt(0));const file=new File([buf],'test.psd');
   const psd=await window.cgBrowserV37.importPsdLayers(file);
   const canvas=document.createElement('canvas');await window.cgBrowserV37.drawDesign(canvas,psd.document);
   const c=canvas.getContext('2d');return {count:psd.count,names:psd.document.nodes.map(x=>x.layerName),blue:Array.from(c.getImageData(4,4,1,1).data),green:Array.from(c.getImageData(20,12,1,1).data),transparent:Array.from(c.getImageData(21,4,1,1).data)};
 }''',psd)
 print('PSD ZIP/RLE/Prediction:',result)
 assert result['count']==2,result
 assert result['blue']==[0,0,255,255],result
 assert result['green']==[0,255,0,255],result
 assert result['transparent'][3]==0,result
 motion=page.evaluate('''async()=>{
   const m=window.cgBrowserV37;let n={id:'1',kind:'rect',x:70,y:10,w:50,h:40,angle:0,opacity:1,fill:'#fa842c'};
   n.keyframes=m.motionPreset(n,'slide-left',3);
   let first=m.animateDesignNode(n,0),middle=m.animateDesignNode(n,1.5),last=m.animateDesignNode(n,3);
   let c=document.createElement('canvas');await m.drawDesign(c,{width:130,height:60,background:'transparent',nodes:[n]},0);
   let a=c.getContext('2d').getImageData(10,30,1,1).data[3];
   await m.drawDesign(c,{width:130,height:60,background:'transparent',nodes:[n]},3);
   let b=c.getContext('2d').getImageData(90,30,1,1).data[3];
   return {first:first.x,middle:middle.x,last:last.x,firstAlpha:a,lastAlpha:b};
 }''')
 print('Keyframe animation with Canvas:',motion)
 assert motion['first']<motion['middle']<motion['last'] and motion['last']==70,motion
 assert motion['firstAlpha']==255 and motion['lastAlpha']==255,motion
 smart=page.evaluate('''async()=>{
  const canv=document.createElement('canvas');canv.width=16;canv.height=16;const ctx=canv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,16,16);
  const bytes=Uint8Array.from(atob(canv.toDataURL().split(',')[1]),v=>v.charCodeAt(0));
  const manifest={format:'clickgruda-smart-template',version:1,name:'Teste',width:200,height:100,background:'back.png',mask:'mask.png',slot:{x:.1,y:.15,w:.4,h:.65}};
  window.cgFixtureArchive=Promise.resolve({files:{'manifest.json':{},'back.png':{},'mask.png':{}},file(path){return {'async':async(type)=>path==='manifest.json'?JSON.stringify(manifest):bytes}}});
  const file=new File(['fixture'],'template.cgtemplate');
  const empty={width:200,height:100,background:'#fff',nodes:[]};
  const noMug=await window.cgBrowserV37.importSmartTemplate(file,empty);
  const mug={id:'m',kind:'image',role:'mockup',x:20,y:10,w:80,h:90,angle:0,opacity:1,src:canv.toDataURL()};
  const withMug=await window.cgBrowserV37.importSmartTemplate(file,{...empty,nodes:[mug]});
  const fitted=withMug.document.nodes.find(x=>x.id==='m');
  return {savedSlot:!!noMug.document.smartTemplate,mask:!!noMug.document.smartTemplate?.maskSrc,fit:{w:fitted.w,h:fitted.h,ratio:fitted.w/fitted.h},maskedMug:!!fitted.maskSrc};
 }''')
 print('Smart templates after/before mug:',smart)
 assert smart['savedSlot'] and smart['mask'] and smart['maskedMug'],smart
 assert abs(smart['fit']['ratio']-(80/90))<.001,smart
 combine=page.evaluate('''async()=>{
   const m=window.cgBrowserV37;
   const art=document.createElement('canvas');art.width=8;art.height=4;const ac=art.getContext('2d');ac.fillStyle='#ff0000';ac.fillRect(0,0,8,4);
   const mask=document.createElement('canvas');mask.width=8;mask.height=4;const mc=mask.getContext('2d');mc.fillStyle='#fff';mc.fillRect(0,0,4,4);mc.fillStyle='#000';mc.fillRect(4,0,4,4);
   const node={id:'combo',kind:'image',src:art.toDataURL(),maskSrc:mask.toDataURL(),tint:'#0000ff',x:0,y:0,w:8,h:4,angle:0,opacity:1};
   const output=document.createElement('canvas');await m.drawDesign(output,{width:8,height:4,background:'transparent',nodes:[node]});
   const ctx=output.getContext('2d');return {visible:Array.from(ctx.getImageData(1,1,1,1).data),hidden:Array.from(ctx.getImageData(6,1,1,1).data)};
 }''')
 print('Mask + recoloring:',combine)
 assert combine['visible']==[0,0,255,255] and combine['hidden'][3]==0,combine
 codec=page.evaluate('''async()=>({WebCodecs:typeof VideoEncoder!=='undefined',H264:typeof VideoEncoder==='undefined'?false:(await VideoEncoder.isConfigSupported({codec:'avc1.42001f',width:720,height:480,framerate:24,bitrate:2000000})).supported})''')
 print('Chromium WebCodecs:',codec)
 browser.close()
