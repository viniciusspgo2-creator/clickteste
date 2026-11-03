"""Chromium pixel test: full-canvas smart-template masks must not stretch to mug dimensions."""
import asyncio, shutil, subprocess
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
COMPILE=r'''
const fs=require('fs'),ts=require('typescript');const root=process.cwd()+'/src/lib/creative';
const tr=file=>ts.transpileModule(fs.readFileSync(`${root}/${file}`,'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const compiled=['effect-cache.ts','design.ts'].map(tr);
process.stdout.write(`const cache={exports:{}};new Function('module','exports',${JSON.stringify(compiled[0])})(cache,cache.exports);`+
`const design={exports:{}};new Function('module','exports','require',${JSON.stringify(compiled[1])})(design,design.exports,k=>{if(k==='./effect-cache')return cache.exports;if(k==='./typefaces')return {ensureDesignFonts:async()=>{}};if(k==='./animation')return {animateDesignNode:n=>n};throw Error(k)});window.__draw=design.exports.drawDesign;`)
'''
async def main():
 bundle=subprocess.check_output(['node','-e',COMPILE],cwd=ROOT,text=True)
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  page=await browser.new_page()
  await page.goto('about:blank')
  await page.add_script_tag(content=bundle)
  result=await page.evaluate('''async()=>{
   const image=document.createElement('canvas');image.width=100;image.height=40;
   image.getContext('2d').fillStyle='#f00';image.getContext('2d').fillRect(0,0,100,40);
   const mask=document.createElement('canvas');mask.width=100;mask.height=40;
   const mc=mask.getContext('2d');mc.fillStyle='#fff';mc.fillRect(0,0,50,40);mc.fillStyle='#000';mc.fillRect(50,0,50,40);
   const base={id:'mug',kind:'image',src:image.toDataURL(),maskSrc:mask.toDataURL(),maskMode:'luminance',x:50,y:0,w:50,h:40,angle:0,opacity:1};
   const out=document.createElement('canvas');const results=[];
   for(const props of [{maskSpace:'element'},{maskSpace:'canvas'},{maskSpace:'canvas',x:0}]){
    await window.__draw(out,{width:100,height:40,background:'transparent',nodes:[{...base,...props}]},undefined,{strict:true});
    const ctx=out.getContext('2d');results.push([ctx.getImageData(12,20,1,1).data[3],ctx.getImageData(62,20,1,1).data[3],ctx.getImageData(88,20,1,1).data[3]]);
   }
   return results;
  }''')
  await browser.close()
 print('V4.5 Chromium mask alignment:',result)
 # Element-local mask spreads white half across mug's left half.
 assert result[0][1]>250 and result[0][2]<5,result
 # Canvas-anchored mask recognizes the mug is entirely in the black half.
 assert result[1][1]<5 and result[1][2]<5,result
 # Moving the mug to the left samples the white half without reusing the old cache.
 assert result[2][0]>250 and result[2][1]<5,result
if __name__=='__main__':asyncio.run(main())
