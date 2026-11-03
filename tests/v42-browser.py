"""Standalone Chromium regression for transparent mask, recolor cache and export preflight."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1100,'height':780})
    page.set_content('<!doctype html><html><body></body></html>')
    page.add_script_tag(content=(root/'fixtures/v37-browser-runtime.js').read_text())
    result=page.evaluate('''async()=>{
      const api=window.cgBrowserV37;
      const make=(left,right)=>{const canvas=document.createElement('canvas');canvas.width=8;canvas.height=4;
       const ctx=canvas.getContext('2d');ctx.fillStyle=left;ctx.fillRect(0,0,4,4);ctx.fillStyle=right;ctx.fillRect(4,0,4,4);
       return canvas.toDataURL('image/png');};
      const image=make('#ffffff','#ffffff'),mask=make('#ffffff','#000000');
      const node={id:'m',kind:'image',src:image,maskSrc:mask,tint:'#ff0000',x:0,y:0,w:8,h:4,angle:0,opacity:1};
      const doc={width:8,height:4,background:'transparent',nodes:[node]};
      const original=document.createElement.bind(document);let allocations=0;
      document.createElement=function(name,...args){if(name==='canvas')allocations++;return original(name,...args)};
      const canvas=original('canvas');await api.drawDesign(canvas,doc);const afterFirst=allocations;
      const sample=(x,y)=>Array.from(canvas.getContext('2d').getImageData(x,y,1,1).data);
      const shown=sample(2,2),hidden=sample(6,2);
      await api.drawDesign(canvas,doc);const afterSecond=allocations;
      node.tint='#0000ff';await api.drawDesign(canvas,doc);const afterTint=allocations;
      const changed=sample(2,2);
      document.createElement=original;
      const bad={...doc,nodes:[{...node,src:'data:image/png;base64,NOTVALID',maskSrc:undefined}]};
      let error='';try{await api.exportDesign(bad,'png',1)}catch(e){error=e.message}
      const blob=await api.exportDesign(doc,'png',1);
      const bitmap=await createImageBitmap(blob);
      const exported=original('canvas');exported.width=8;exported.height=4;
      exported.getContext('2d').drawImage(bitmap,0,0);
      const outputPixel=[...exported.getContext('2d').getImageData(2,2,1,1).data];
      return {shown,hidden,changed,afterFirst,afterSecond,afterTint,error,blobBytes:blob.size,outputPixel};
    }''')
    print('V4.2 Chromium:',result)
    assert result['shown']==[255,0,0,255],result
    assert result['hidden'][3]==0,result
    assert result['changed']==[0,0,255,255],result
    assert result['afterFirst']==result['afterSecond'],result
    assert result['afterTint']==result['afterSecond']+1,result
    assert 'não pôde ser carregada' in result['error'],result
    assert result['outputPixel']==[0,0,255,255] and result['blobBytes']>60,result
    browser.close()
