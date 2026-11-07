import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const git=promisify(execFile);
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const items=JSON.parse(await fs.readFile('src/lib/creative/uploaded-library.json','utf8'));
const audit=JSON.parse(await fs.readFile('docs/creative-library/print-audit.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const full=p=>'public/creative-library/'+p;

test('Both rejected batches are gone; all 288 original assets are unchanged',async()=>{
 assert.equal(audit.removed.length,361);assert.equal(audit.preserved.length,288);
 const ids=new Set(items.map(x=>x.id));for(const id of audit.removed)assert.ok(!ids.has(id),id);
 for(const folder of ['rar-2026','nov-2026'])await assert.rejects(fs.access('public/creative-library/uploads/'+folder));
 for(const original of audit.preserved){const item=items.find(x=>x.id===original.id);assert.equal(item.arquivo,original.arquivo);
  for(const [p,hash] of [[original.arquivo,original.sha256],[original.miniatura,original.thumbnailSha256]]){
   const b=await fs.readFile(full(p));assert.equal(sha(b),hash,p);
   // Verify preservation against the pre-replacement Git revision, not just this audit.
   assert.equal(sha((await git('git',['show','ef01b6ae3ac8fb75154c4dced60095dc6e00f261:'+full(p)],{maxBuffer:8*1024*1024,encoding:'buffer'})).stdout),hash,p);
  }
 }
});
test('Approved full-resolution assets have verifiable sources and lightweight previews',async()=>{
 assert.equal(audit.approved.length,914);assert.equal(items.length,1202);const ids=new Set(),approved=new Map(audit.approved.map(x=>[x.id,x]));
 for(const item of items){assert.ok(!ids.has(item.id),item.id);ids.add(item.id);assert.ok(item.colecao);assert.equal(item.licenca,'Enviado pelo usuário');
  const thumb=await sharp(full(item.miniatura)).metadata();assert.ok(thumb.width<=192&&thumb.height<=192);assert.ok((await fs.stat(full(item.miniatura))).size<50_000);
  const record=approved.get(item.id);if(!record)continue;
  assert.ok(!/Preview|princess|harry|dragon.ball/i.test(item.origem));assert.equal(sha(await fs.readFile(full(item.arquivo))),record.sha256);
  const m=await sharp(full(item.arquivo)).metadata();assert.equal(m.width,item.impressao.largura);assert.equal(m.height,item.impressao.altura);assert.equal(item.impressao.semPerdas,true);
  if(item.formato==='SVG'){const s=await fs.readFile(full(item.arquivo),'utf8');assert.ok(!/<(?:image|script|foreignObject|use)\b/i.test(s));assert.ok(!/(?:href|onload)=/i.test(s));assert.equal(item.impressao.vetorial,true);if(record.qa?.meanError!==undefined){assert.ok(record.qa.unmatchedInteriorPixels<=3);assert.ok(record.qa.meanError<=.35);assert.ok(Math.abs(record.qa.alphaCoverageDelta)<=.002);}}
  else{assert.equal(m.format,'png');assert.ok(m.hasAlpha);assert.equal(record.lossless,true);assert.equal(record.pixelsHash,record.outputPixelsHash);assert.equal(sha(await sharp(full(item.arquivo)).ensureAlpha().raw().toBuffer()),record.outputPixelsHash);assert.ok(record.bytes<=24*1024*1024);}
 }
 assert.equal(audit.approved.filter(x=>x.format==='SVG').length,844);assert.equal(audit.approved.filter(x=>x.format==='PNG').length,70);
 assert.equal(audit.blocked.length,13);assert.ok(audit.approved.some(x=>x.bytes>8*1024*1024),'Exercise original PNGs larger than the former limit');
});
