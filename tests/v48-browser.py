"""Isolated real Chromium pixel regression for mirror export and hidden PSD layers."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, subprocess
root=Path(__file__).resolve().parent.parent
js=subprocess.check_output(['node','-e',r'''const fs=require('fs'),ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
for(const [name,file] of [['mirror','src/lib/creative/export-transform.ts'],['psd','src/lib/creative/psd-import.ts']]){
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 console.log(`{let module={exports:{}},exports=module.exports;const require=(key)=>key==='./design'?{uid:()=> 'v48-'+Math.random()}:{};${code}\nwindow.v48_${name}=module.exports;}`);
}'''],cwd=root,text=True)
fixture=bytearray((root/'tests/fixtures/sample-zip-prediction.psd').read_bytes())
# Second RGB layer is hidden according to PSD layer flags (bit 1).
starts=[];offset=0
while True:
 off=fixture.find(b'8BIMnorm',offset)
 if off<0:break
 starts.append(off);offset=off+1
assert len(starts)==2,starts
fixture[starts[1]+10]|=2
b64=base64.b64encode(fixture).decode()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':800,'height':600})
 page.set_content('<!doctype html><html><body></body></html>')
 page.add_script_tag(content=js)
 result=page.evaluate('''async (content)=>{
   const from=document.createElement('canvas');from.width=2;from.height=1;
   const fc=from.getContext('2d');fc.fillStyle='#ff0000';fc.fillRect(0,0,1,1);fc.fillStyle='#0000ff';fc.fillRect(1,0,1,1);
   const dst=document.createElement('canvas');dst.width=2;dst.height=1;
   window.v48_mirror.drawOutputWithMirror(dst.getContext('2d'),from,2,1,true);
   const pix=dst.getContext('2d').getImageData(0,0,2,1).data;
   const c=Uint8Array.from(atob(content),x=>x.charCodeAt(0));
   const file=new File([c],'2-layers.psd');
   const psd=await window.v48_psd.importPsdLayers(file);
   const hidden=psd.document.nodes.find(n=>n.visible===false);
   let sample=null;
   if(hidden){const image=new Image();image.src=hidden.src;await image.decode();const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;cv.getContext('2d').drawImage(image,0,0);sample=Array.from(cv.getContext('2d').getImageData(0,0,1,1).data)}
   return {mirrorLeft:Array.from(pix.slice(0,4)),mirrorRight:Array.from(pix.slice(4,8)),layers:psd.count,hidden:psd.document.nodes.filter(n=>n.visible===false).length,hiddenSample:sample,warning:psd.warning};
 }''',b64)
 print('V4.8 Chromium:',result)
 assert result['mirrorLeft']==[0,0,255,255] and result['mirrorRight']==[255,0,0,255],result
 assert result['layers']==2 and result['hidden']==1 and result['hiddenSample'],result
 assert 'oculta' in result['warning'],result
 browser.close()
