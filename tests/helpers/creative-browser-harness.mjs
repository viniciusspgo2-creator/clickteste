import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import {createRequire} from 'node:module';
const root=process.cwd(),require=createRequire(path.join(root,'package.json'));
export const toolRequire=process.env.STUDIO_TEST_TOOLS?createRequire(path.join(process.env.STUDIO_TEST_TOOLS,'package.json')):require;
const {build}=toolRequire('esbuild');

export async function startCreativeHarness(){
const output=process.env.STUDIO_TEST_OUTPUT||await fs.mkdtemp(path.join(os.tmpdir(),'creative-precision-'));
await fs.mkdir(output,{recursive:true});
await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {CreativeEditor} from './src/components/creative/creative-editor';import * as svg from './src/lib/creative/editable-svg';import {ungroupSvg} from './src/lib/creative/svg-ungroup';import {readLocalAsset} from './src/lib/creative/user-uploads';import {drawDesign,exportDesign} from './src/lib/creative/design';import {vectorShapes} from './src/lib/creative/vector-shapes';import {effectPresets} from './src/lib/creative/layer-effects';import {stockObjects} from './src/lib/creative/stock-objects';import {validateProjectDocument} from './src/lib/creative/validate-project';window.svgTest={...svg,ungroupSvg,readLocalAsset,drawDesign,exportDesign,vectorShapes,effectPresets,stockObjects,validateProjectDocument};createRoot(document.getElementById('root')).render(<CreativeEditor/>);`,resolveDir:root,loader:'tsx'},
 external:['/cg-editor/*'],bundle:true,platform:'browser',format:'esm',outfile:path.join(output,'bundle.js'),tsconfig:path.join(root,'tsconfig.json'),
 define:{'process.env.NODE_ENV':'"development"'},logLevel:'warning',
 plugins:[{name:'test-link',setup(builder){builder.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test-link'}));builder.onLoad({filter:/.*/,namespace:'test-link'},()=>({contents:"import React from 'react';export default function Link({href,...props}){return React.createElement('a',{...props,href});}",resolveDir:root}));}}]});
const postcss=require('postcss'),tailwind=require('@tailwindcss/postcss');
const from=path.join(root,'src/app/globals.css');
const css=await postcss([tailwind({base:root})]).process(await fs.readFile(from,'utf8'),{from});
await fs.writeFile(path.join(output,'global.css'),css.css);
await fs.writeFile(path.join(output,'index.html'),'<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>');
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,items:[],total:0}));return;}
  const base=/^\/(creative-library|cg-editor|mockup|fonts)\//.test(url.pathname)?path.join(root,'public'):output;
  const file=path.resolve(base,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  const data=await fs.readFile(file);
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));

return {output,url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
