from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1200,'height':800})
    page.set_content('<!DOCTYPE html><html><body></body></html>')
    page.add_script_tag(content=(root/'fixtures/v37-browser-runtime.js').read_text())
    result=page.evaluate('''async()=>{
      const {drawDesign}=window.cgBrowserV37;
      const red={id:'red',kind:'rect',role:'background',x:0,y:0,w:100,h:100,angle:0,opacity:1,fill:'#ff0000',locked:true};
      const blue={id:'blue',kind:'rect',role:'content',x:0,y:0,w:100,h:100,angle:0,opacity:1,fill:'#0000ff',visible:false};
      const green={id:'green',kind:'rect',role:'foreground',x:40,y:40,w:20,h:20,angle:0,opacity:1,fill:'#00ff00'};
      const doc={width:100,height:100,background:'transparent',nodes:[red,blue,green]};
      const canvas=document.createElement('canvas');await drawDesign(canvas,doc);let ctx=canvas.getContext('2d');
      const at=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
      const hidden=at(10,10),foreground=at(50,50);
      blue.visible=true;await drawDesign(canvas,doc);const revealed=at(10,10);
      green.visible=false;await drawDesign(canvas,doc);const behindForeground=at(50,50);
      return {hidden,foreground,revealed,behindForeground};
    }''')
    print('Pixel test: hidden, foreground, revealed and no foreground:',result)
    assert result['hidden']==[255,0,0,255],result
    assert result['foreground']==[0,255,0,255],result
    assert result['revealed']==[0,0,255,255],result
    assert result['behindForeground']==[0,0,255,255],result
    browser.close()
