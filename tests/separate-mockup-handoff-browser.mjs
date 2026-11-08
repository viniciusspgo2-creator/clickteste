import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {startStudioHarness,toolRequire} from './helpers/mockup-browser-harness.mjs';
const h=await startStudioHarness({withEditor:true});
const browser=await toolRequire('playwright').chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const checks=[],errors=[];
async function waitForAsync(read,predicate){const deadline=Date.now()+30000;while(Date.now()<deadline){const value=await read();if(predicate(value))return value;await new Promise(resolve=>setTimeout(resolve,250));}throw new Error('O estado esperado não foi salvo a tempo.');}const pass=t=>{checks.push(t);console.log('PASS',checks.length,t)};
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});p.setDefaultTimeout(90000);p.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER_ERROR',e.message)});
 await p.goto(h.url);console.log('STEP mounted');await p.waitForFunction(()=>window.studioTest?.refs.gl&&window.studioTest?.refs.camera);
 await p.evaluate(()=>{const s=window.studioTest.store.getState();s.compose('pair');const next=window.studioTest.store.getState();next.patchObject('hero',{name:'Frente da caneca',posX:0,posZ:0,rotationY:-40});next.patchObject(next.companions[0].id,{name:'Verso da caneca',posX:0,posZ:2,rotationY:140});next.setExport({framing:'current'});next.setZoom(190);});
 await p.waitForTimeout(1800);
 const snapshot=()=>p.evaluate(()=>{const s=window.studioTest.store.getState();return {mug:s.mug,art:s.art,companions:s.companions,zoom:s.zoom,exportSettings:s.exportSettings,layerOrder:s.layerOrder};});
 const before=await snapshot();
 const isolation=await p.evaluate(async()=>{
  const t=window.studioTest,scene=t.refs.scene,objects=[];scene.traverse(o=>{if(o.name==='mug-float')objects.push(o)});
  const companion=t.store.getState().companions[0].id;
  const session=t.frames.beginFrames(400,400,{transparent:true,hideGroundShadow:true,objectId:'hero',ssCap:1});
  let during;
  try{const camera=t.frames.fitCamera(session);during={visible:objects.filter(o=>o.visible).map(o=>o.userData.objectId),zoom:camera.zoom,directionDelta:camera.quaternion.angleTo(t.refs.camera.quaternion),centerX:t.frames.sceneCenter(scene).x};}
  finally{t.frames.endFrames(session)}
  const restored=objects.every(o=>o.visible)&&!t.refs.exporting;
  const opts={width:600,height:600,format:'png',quality:1,transparent:true,hideGroundShadow:true,objectId:'hero',supersample:1};
  const first=await t.images.exportImage(opts);
  // Same target renders identically whether the overlapping companion is visible or hidden.
  const other=objects.find(o=>o.userData.objectId===companion);other.visible=false;
  const second=await t.images.exportImage(opts);other.visible=true;
  const hash=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',');
  let rejected=false;try{await t.images.exportImage({...opts,objectId:'missing'});}catch{rejected=true;}
  const original=HTMLCanvasElement.prototype.toBlob;
  let failed=false;
  HTMLCanvasElement.prototype.toBlob=function(cb){cb(null)};
  try{await t.images.exportImage(opts);}catch{failed=true;}finally{HTMLCanvasElement.prototype.toBlob=original;}
  return {during,restored,identical:await hash(first.blob)===await hash(second.blob),rejected,failed,afterFailure:objects.every(o=>o.visible)&&!t.refs.exporting};
 });
 assert.deepEqual(isolation.during.visible,['hero']);assert.equal(isolation.during.zoom,1);assert.ok(isolation.during.directionDelta<1e-7);assert.ok(isolation.identical&&isolation.restored&&isolation.rejected&&isolation.failed&&isolation.afterFailure);assert.deepEqual(await snapshot(),before);
 pass('Caneca sobreposta sai inteira e isolada; câmera preserva o ângulo e a cena é restaurada também após falha.');
 console.log('STEP open export');await p.getByRole('button',{name:'Exportar criação',exact:true}).click();console.log('STEP export clicked');const dialog=p.getByRole('dialog',{name:'Exportar criação',exact:true});console.log('STEP open editor section');await dialog.locator('summary').filter({hasText:'Continuar a criação'}).click();console.log('STEP editor section open');
 await p.screenshot({path:path.join(h.output,'separate-choice-desktop.png')});
 await dialog.getByRole('button',{name:'Enviar canecas separadas · 2',exact:true}).click();
 await p.waitForFunction(()=>window.__studioNavigation==='/editor-artes?from=mockup');
 const payload=await p.evaluate(async()=>{const t=window.studioTest,h=await t.handoff.readEditorHandoff();window.transferred=h;return {mode:h.mode,names:h.items.map(i=>i.name),types:h.items.map(i=>i.blob.type),sizes:h.items.map(i=>i.blob.size)};});
 assert.equal(payload.mode,'separate');assert.deepEqual(payload.names,['Frente da caneca','Verso da caneca']);assert.deepEqual(payload.types,['image/png','image/png']);assert.ok(payload.sizes.every(n=>n>1000));assert.deepEqual(await snapshot(),before);
 pass('Botão real transfere dois PNGs independentes e identificados pelo IndexedDB, sem alterar o projeto 3D.');
 const atomic=await p.evaluate(async()=>{const t=window.studioTest;let rejected=false;try{await t.handoff.writeLayeredHandoff([{blob:new Blob(['bad'],{type:'image/jpeg'}),name:'Inválida'}])}catch{rejected=true}return {rejected,names:(await t.handoff.readEditorHandoff()).items.map(i=>i.name)};});assert.ok(atomic.rejected);assert.deepEqual(atomic.names,payload.names);
 pass('Transferência inválida não substitui a última transferência válida.');
 await p.goto(h.url+'/editor-artes?from=mockup');await p.locator('.cr-stage').waitFor();await p.getByText('2 canecas em camadas independentes.',{exact:false}).waitFor();
 const draft=()=>p.evaluate(async()=>{const t=window.studioTest;return (await t.creativeProjects.readCreativeProject(t.creativeProjects.LOCAL_DRAFT_ID))?.document;});
 const initial=await waitForAsync(draft,d=>d?.nodes.length===2);assert.equal(initial.width,1080);assert.equal(initial.height,1350);assert.equal(initial.nodes.length,2);assert.deepEqual(initial.nodes.map(n=>n.layerName),payload.names);assert.notEqual(initial.nodes[0].src,initial.nodes[1].src);assert.ok(initial.nodes.every(n=>n.role==='mockup'&&n.aspectLock));
 // Move only the initially selected front layer with a real keyboard action.
 await p.locator('.cr-stage canvas').focus();await p.keyboard.press('ArrowRight');
 const moved=await waitForAsync(draft,d=>d?.nodes[0].x!==undefined&&d.nodes[0].x!==initial.nodes[0].x);assert.notEqual(moved.nodes[0].x,initial.nodes[0].x);assert.deepEqual(moved.nodes[1],initial.nodes[1]);
 await p.screenshot({path:path.join(h.output,'editor-independent-layers.png')});
 pass('Editor abre duas camadas reais; mover a frente preserva a posição, tamanho e imagem do verso.');
 await p.reload();await p.locator('.cr-stage').waitFor();await p.getByText('Rascunho deste navegador restaurado.',{exact:false}).waitFor();assert.deepEqual(await draft(),moved);
 pass('Recarregar restaura as camadas e o posicionamento sem repetir a transferência.');
 const compatibility=await p.evaluate(async()=>{const t=window.studioTest,h=await t.handoff.readEditorHandoff();await t.handoff.writeHandoff(h.items[0].blob);const single=await t.handoff.readEditorHandoff();const legacy=await t.handoff.readHandoff();return {mode:single.mode,count:single.items.length,legacyBlob:legacy instanceof Blob,size:legacy.size};});
 assert.equal(compatibility.mode,'composition');assert.equal(compatibility.count,1);assert.ok(compatibility.legacyBlob);assert.ok(compatibility.size>1000);
 await p.goto(h.url+'/editor-artes?from=mockup');await p.getByText('Composição recebida do Studio.',{exact:false}).waitFor();
 await waitForAsync(draft,d=>d?.nodes.length===1);
 pass('PNG único anterior continua abrindo como composição completa.');
 await p.locator('input[accept*=".cgtemplate"]').setInputFiles('public/templates/template-inteligente-demonstracao.cgtemplate');
 const template=await waitForAsync(draft,d=>!!d?.smartTemplate&&d.nodes.some(n=>n.role==='foreground'));
 assert.equal(template.nodes.filter(n=>n.role==='mockup').length,1);
 assert.ok(template.nodes.find(n=>n.role==='mockup').maskSrc?.startsWith('data:image/'));
 await p.screenshot({path:path.join(h.output,'secure-template-import.png')});
 pass('Template inteligente existente abre pela interface real, mantendo a caneca e aplicando a máscara após a extração segura.');

 await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(h.output,'editor-mobile.png')});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);pass('Editor cabe no celular e não apresentou erros de JavaScript durante o fluxo.');
 await fs.writeFile(path.join(h.output,'results.json'),JSON.stringify({passed:true,checks,errors,payload},null,2));console.log(JSON.stringify({passed:true,checks:checks.length,output:h.output}));
}catch(error){const page=browser.contexts()[0]?.pages()[0];if(page){await page.screenshot({path:path.join(h.output,'failure.png')}).catch(()=>{});console.log('FAILED_BODY',(await page.locator('body').innerText()).slice(0,1400));}console.log('ERRORS',errors);throw error;}finally{await browser.close();await h.close();}
