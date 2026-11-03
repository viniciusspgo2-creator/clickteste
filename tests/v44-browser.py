"""Chromium real-pixel test for luminance/alpha/inverted masks.
Run from project root: python tests/v44-browser.py
Requires Node.js, TypeScript, playwright Python, and Chromium available locally.
"""
import asyncio
import shutil
import subprocess
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
COMPILE = r"""
const fs=require('fs');const ts=require('typescript');const root=process.cwd()+'/src/lib/creative';
const transpile=name=>ts.transpileModule(fs.readFileSync(`${root}/${name}`,'utf8'),{fileName:name,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const js=`const __cache={exports:{}};new Function('module','exports',${JSON.stringify(transpile('effect-cache.ts'))})(__cache,__cache.exports);
const __design={exports:{}};new Function('module','exports','require',${JSON.stringify(transpile('design.ts'))})(__design,__design.exports,key=>{if(key==='./effect-cache')return __cache.exports;if(key==='./typefaces')return {ensureDesignFonts:async()=>{}};if(key==='./animation')return {animateDesignNode:n=>n};throw Error('Unexpected '+key)});window.__maskDraw=__design.exports.drawDesign;`;
process.stdout.write(js);
"""

async def main():
    bundle = subprocess.check_output(['node', '-e', COMPILE], cwd=ROOT, text=True)
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox'])
        page = await browser.new_page()
        await page.goto('about:blank')
        await page.add_script_tag(content=bundle)
        pixels = await page.evaluate('''async ()=>{
          const source=document.createElement('canvas');source.width=100;source.height=40;
          const sr=source.getContext('2d');sr.fillStyle='#ff0000';sr.fillRect(0,0,100,40);
          const mask=document.createElement('canvas');mask.width=100;mask.height=40;
          const mc=mask.getContext('2d');mc.fillStyle='#000000';mc.fillRect(0,0,50,40);
          const src=source.toDataURL(),msk=mask.toDataURL();
          const target=document.createElement('canvas'),pixels=[];
          for(const [mode,invert] of [['luminance',false],['alpha',false],['alpha',true]]){
            await window.__maskDraw(target,{width:100,height:40,background:'transparent',nodes:[{
              id:'m',kind:'image',src,maskSrc:msk,maskMode:mode,maskInvert:invert,
              x:0,y:0,w:100,h:40,angle:0,opacity:1}]},undefined,{strict:true});
            const ctx=target.getContext('2d');pixels.push([ctx.getImageData(25,20,1,1).data[3],ctx.getImageData(75,20,1,1).data[3]]);
          }
          return pixels;
        }''')
        await browser.close()
    assert pixels[0][0] < 4 and pixels[0][1] < 4, pixels
    assert pixels[1][0] > 250 and pixels[1][1] < 4, pixels
    assert pixels[2][0] < 4 and pixels[2][1] > 250, pixels
    print('Chromium V4.4 OK:', pixels)

if __name__ == '__main__':
    asyncio.run(main())
