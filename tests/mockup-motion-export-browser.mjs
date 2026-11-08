import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {startStudioHarness,toolRequire} from './helpers/mockup-browser-harness.mjs';
const h=await startStudioHarness();
const b=await toolRequire('playwright').chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{
 const p=await b.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});p.setDefaultTimeout(120000);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(h.url);await p.waitForFunction(()=>window.studioTest?.refs.gl&&window.studioTest?.refs.camera);
 await p.evaluate(()=>{const t=window.studioTest,s=t.store.getState(),a=t.art.makeSampleArt();s.setArtImage({imageId:a.id,name:a.name,width:a.width,height:a.height});
  // Test-only small resolution exercises the real UI → renderer → encoder path
  // without spending CI time rendering 72 Full HD frames in software.
  t.video.VIDEO_RESOLUTIONS.qa_small={w:320,h:320,label:'QA 320'};s.patch('video',{res:'qa_small',duration:3,fps:24,quality:'fast',anim:'giro'});s.setExportOpen(true);});
 const dialog=p.getByRole('dialog',{name:'Exportar criação',exact:true});await dialog.getByRole('tab',{name:/^Vídeo/}).click();
 await p.waitForFunction(()=>document.querySelector('canvas[aria-label="Prévia animada do vídeo"]')?.style.opacity==='1');
 await dialog.getByRole('switch',{name:'ALFA — fundo transparente',exact:true}).click();await p.waitForTimeout(400);
 await p.waitForFunction(()=>{const c=document.querySelector('canvas[aria-label="Prévia animada do vídeo"]');return c?.style.opacity==='1'&&c.getContext('2d').getImageData(0,0,1,1).data[3]===0;});
 await dialog.getByRole('button',{name:'Pausar prévia',exact:true}).click();await p.waitForFunction(()=>!window.studioTest.refs.exporting);
 await dialog.getByRole('switch',{name:'ALFA — fundo transparente',exact:true}).click();
 await dialog.getByRole('button',{name:'Reproduzir prévia',exact:true}).click();await p.waitForFunction(()=>window.studioTest.refs.exporting);
 const download=p.waitForEvent('download',{timeout:180000});await dialog.getByRole('button',{name:'Gerar vídeo',exact:true}).click();
 const file=await download,videoPath=path.join(h.output,file.suggestedFilename());await file.saveAs(videoPath);
 await p.waitForFunction(()=>!window.studioTest.refs.exporting&&!window.studioTest.store.getState().exportOpen);
 const {stdout}=await promisify(execFile)('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames,duration','-show_entries','format=duration','-of','json',videoPath]);
 const metadata=JSON.parse(stdout),stream=metadata.streams.find(s=>s.width);
 assert.equal(stream.width,320);assert.equal(stream.height,320);
 assert.ok(Number(metadata.format.duration)>=2.85&&Number(metadata.format.duration)<=3.2);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(h.output,'encoded-video-results.json'),JSON.stringify({metadata,errors,file:file.suggestedFilename(),previewTransparency:true,previewStoppedBeforeEncoder:true},null,2));
 console.log(JSON.stringify({passed:true,codec:stream.codec_name,width:stream.width,height:stream.height,duration:metadata.format.duration,output:h.output}));
}finally{await b.close();await h.close();}
