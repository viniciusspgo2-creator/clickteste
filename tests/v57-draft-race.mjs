import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url),ts=require('typescript');
function loadQueue(){
 const file=resolve(root,'src/lib/creative/draft-write-queue.ts');
 const transpiled=ts.transpileModule(readFileSync(file,'utf8'),{
  fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true},
 });
 assert.deepEqual(transpiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)||[],[]);
 const mod={exports:{}};
 new Function('module','exports',transpiled.outputText)(mod,mod.exports);
 return mod.exports.DraftWriteQueue;
}
const DraftWriteQueue=loadQueue();
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test('V5.7: a queued stale draft is skipped after reset, not written afterwards',async()=>{
 const queue=new DraftWriteQueue(),gate=deferred(),events=[];
 const first=queue.save(()=>true,async()=>{events.push('first started');await gate.promise;events.push('first finished');});
 await Promise.resolve();await Promise.resolve();
 const stale=queue.save(()=>true,async()=>{events.push('stale write');});
 const reset=queue.reset(async()=>{events.push('draft deleted');});
 gate.resolve();
 assert.equal(await first,false);
 assert.equal(await stale,false);
 await reset;
 assert.deepEqual(events,['first started','first finished','draft deleted']);
});
test('V5.7: old in-flight write finishes before deletion and new writes follow deletion',async()=>{
 const queue=new DraftWriteQueue(),gate=deferred(),events=[];
 const old=queue.save(()=>true,async()=>{events.push('old start');await gate.promise;events.push('old end');});
 await Promise.resolve();await Promise.resolve();
 const reset=queue.reset(async()=>{events.push('delete');});
 const fresh=queue.save(()=>true,async()=>{events.push('new saved');});
 gate.resolve();
 assert.equal(await old,false);
 await reset;
 assert.equal(await fresh,true);
 assert.deepEqual(events,['old start','old end','delete','new saved']);
});
test('V5.7: an edit invalidates a scheduled snapshot before writing',async()=>{
 const queue=new DraftWriteQueue();let current=true,writes=0;
 const gate=deferred(),first=queue.save(()=>true,()=>gate.promise);
 const stale=queue.save(()=>current,async()=>{writes++;});
 current=false;gate.resolve();await first;
 assert.equal(await stale,false);assert.equal(writes,0);
});
test('V5.7: failing IndexedDB save does not block subsequent reset',async()=>{
 const queue=new DraftWriteQueue(),events=[];
 await assert.rejects(queue.save(()=>true,async()=>{throw Error('quota');}),/quota/);
 await queue.reset(async()=>{events.push('deleted');});
 assert.equal(await queue.save(()=>true,async()=>{events.push('saved');}),true);
 assert.deepEqual(events,['deleted','saved']);
});
test('V5.7: startup draft restoration checks media and current edits before replacing document',()=>{
 const src=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 const start=src.indexOf(' // Handoff: dados binários');
 const end=src.indexOf(' // Rascunho local temporário');
 assert.ok(start>0&&end>start);
 const init=src.slice(start,end);
 assert.match(init,/const captured=stateRef\.current\.history\[stateRef\.current\.step\],request=projectLoadRef\.current/);
 assert.match(init,/validateProjectDocument\(saved\.document\)/);
 assert.match(init,/hasTemporaryMedia\(saved\.document\)/);
 assert.match(init,/inspectProjectMedia\(saved\.document\)/);
 assert.match(init,/canApplyLoadedProject\(request,projectLoadRef\.current,captured,/);
 const restore=init.slice(init.indexOf('if(!handoff&&!preset&&!params.has(\'asset\')'),init.indexOf('if(handoff&&mounted)'));
 assert.ok(restore.indexOf('inspectProjectMedia(saved.document)')<restore.indexOf('stateRef.current={history:[d]'));
});
test('V5.7: reset and project imports serialize draft deletion instead of deleting concurrently',()=>{
 const src=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(src,/autoDraftQueueRef=useRef<DraftWriteQueue>\(new DraftWriteQueue\(\)\)/);
 assert.match(src,/autoDraftQueueRef\.current\.save\(/);
 assert.match(src,/void autoDraftQueueRef\.current\.reset\(deleteAutomaticDraft\)/);
 const reset=src.slice(src.indexOf(' const resetDocument='),src.indexOf(' const refreshLocalProjects='));
 assert.match(reset,/autoDraftQueueRef\.current\.reset\(deleteAutomaticDraft\)/);
 assert.equal((src.match(/autoDraftQueueRef\.current\.reset\(deleteAutomaticDraft\)/g)||[]).length,3);
});
