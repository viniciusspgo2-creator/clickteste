import asyncio,os
from pathlib import Path
import subprocess
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1100,'height':800})
  await page.set_content('<!doctype html><title>Testes V3.6</title>')
  await page.add_script_tag(content=subprocess.run(['node','tests/helpers/v36-browser-runtime.mjs'],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
  await page.evaluate("Object.defineProperty(crypto, 'randomUUID', {value:()=> 'fixture-'+Math.random().toString(36).slice(2), configurable:true});")
  psd=(ROOT/'tests/fixtures/sample-2-layers.psd').read_bytes()
  import base64
  result=await page.evaluate('''async (payload)=>{const raw=Uint8Array.from(atob(payload), c=>c.charCodeAt(0));
   const f=new File([raw],'sample.psd',{type:'image/vnd.adobe.photoshop'});
   const parsed=await window.cgBrowserTest.importPsdLayers(f);
   const canv=document.createElement('canvas');await window.cgBrowserTest.drawDesign(canv,parsed.document);
   const pixels=canv.getContext('2d').getImageData(0,0,32,16).data;
   const color=(x,y)=>Array.from(pixels.slice((y*32+x)*4,(y*32+x)*4+4));
   return {layers:parsed.count,names:parsed.document.nodes.map(n=>n.layerName),red:color(4,4),blue:color(24,12),transparent:color(24,4)};
  }''',base64.b64encode(psd).decode())
  print('Browser PSD import:',result)
  assert result['layers']==2 and result['red'][:3]==[255,0,0] and result['blue'][:3]==[0,0,255], result
  mask=await page.evaluate('''async()=>{
   const mask=document.createElement('canvas');mask.width=4;mask.height=4;const mc=mask.getContext('2d');
   mc.fillStyle='#fff';mc.fillRect(0,0,2,4);mc.fillStyle='#000';mc.fillRect(2,0,2,4);
   const red=document.createElement('canvas');red.width=4;red.height=4;const rc=red.getContext('2d');rc.fillStyle='#f00';rc.fillRect(0,0,4,4);
   const doc={width:4,height:4,background:'transparent',nodes:[{id:'a',kind:'image',src:red.toDataURL(),maskSrc:mask.toDataURL(),x:0,y:0,w:4,h:4,angle:0,opacity:1}]};
   const target=document.createElement('canvas');await window.cgBrowserTest.drawDesign(target,doc);const d=target.getContext('2d').getImageData(0,0,4,4).data;
   return {shown:[...d.slice(0,4)],hidden:[...d.slice(12,16)]};
  }''')
  print('Browser mask:',mask)
  assert mask['shown'][3]==255 and mask['hidden'][3]==0,mask
  await browser.close()
asyncio.run(main())
