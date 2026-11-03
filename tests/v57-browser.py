"""Opcional: regressão de ordenação da fila de rascunhos em Chromium isolado."""
import asyncio, subprocess
from pathlib import Path
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1]
compiled=subprocess.check_output(['node','-e',r"""const fs=require('fs');const ts=require('typescript');const src=fs.readFileSync('src/lib/creative/draft-write-queue.ts','utf8');process.stdout.write(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);"""],cwd=root,text=True)
script="var module={exports:{}};var exports=module.exports;\n"+compiled+"\nwindow.DraftWriteQueue=module.exports.DraftWriteQueue;"
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page()
  await page.set_content('<html><body>Click & Gruda V5.7 draft queue</body></html>')
  await page.add_script_tag(content=script)
  result=await page.evaluate(r"""async()=>{
   const store=new Map();
   function transaction(op,value){return new Promise(resolve=>setTimeout(()=>{if(op==='put')store.set('auto-draft',value);else store.delete('auto-draft');resolve();},2));}
   function read(){return Promise.resolve(store.get('auto-draft'));}
   let unlock;const gate=new Promise(r=>unlock=r);const queue=new DraftWriteQueue();
   const old=queue.save(()=>true,async()=>{await gate;await transaction('put','obsolete');});
   await Promise.resolve();await Promise.resolve();
   const stale=queue.save(()=>true,async()=>{await transaction('put','wrong');});
   const reset=queue.reset(()=>transaction('delete'));
   const latest=queue.save(()=>true,()=>transaction('put','new project'));
   unlock();const oldResult=await old,staleResult=await stale;await reset;const latestResult=await latest;const stored=await read();
   return {stored,oldResult,staleResult,latestResult,isolatedBrowser:true};
  }""")
  print(result)
  assert result['stored']=='new project'
  assert result['oldResult'] is False
  assert result['staleResult'] is False
  assert result['latestResult'] is True
  await browser.close()
asyncio.run(run())
