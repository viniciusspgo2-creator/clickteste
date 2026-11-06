import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const items=JSON.parse(await fs.readFile('src/lib/creative/uploaded-library.json','utf8'));
test('Uploaded elements have valid formats, preserved legacy transparency and bounded thumbnails',async()=>{
 assert.equal(items.length,649);const ids=new Set();
 for(const item of items){
  assert.ok(item.colecao,`${item.id} needs a collection`);assert.ok(!ids.has(item.id));ids.add(item.id);
  assert.ok(/\.(zip|rar|svg)( |$)/.test(item.origem));assert.equal(item.licenca,'Enviado pelo usuário');
  assert.match(item.arquivo,/^uploads\/[a-z0-9-]+\/[a-z0-9-]+\.(webp|svg)$/);
  for(const [file,limit] of [[item.arquivo,2048],[item.miniatura,192]]){
   const path=`public/creative-library/${file}`,m=await sharp(path).metadata();
   assert.equal(m.format,file.endsWith('.svg')?'svg':'webp');if(file.endsWith('.webp')&&item.id.startsWith('enviado-'))assert.ok(m.hasAlpha,`${file} must preserve transparency`);
   if(!file.endsWith('.svg'))assert.ok(m.width<=limit&&m.height<=limit,file);
   if(limit===192)assert.ok((await fs.stat(path)).size<50_000,`${file} thumbnail too large`);
  }
 }
});
