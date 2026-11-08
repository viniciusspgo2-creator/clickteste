import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {startStudioHarness,toolRequire} from './helpers/mockup-browser-harness.mjs';
const h=await startStudioHarness();
const browser=await toolRequire('playwright').chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const checks=[], errors=[];
try {
  const p=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
  p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(h.url);
  await p.waitForFunction(()=>window.studioTest?.refs.gl&&window.studioTest?.refs.camera);
  await p.getByRole('button',{name:'Projeto',exact:true}).click();
  await p.getByRole('menuitem',{name:'Projetos salvos'}).waitFor();
  await p.keyboard.press('Escape');
  await p.getByRole('button',{name:'Ajuda e recursos',exact:true}).click();
  for(const name of ['Guia do Studio','Assistente de sublimação','Atalhos de teclado','Biblioteca de artes','Bônus gratuitos','Instagram Click&Gruda','Facebook Click&Gruda'])
    assert.equal(await p.getByRole('menuitem',{name,exact:true}).count(),1);
  await p.keyboard.press('Escape');checks.push('Comandos de projeto e recursos continuam acessíveis, sem duplicação no cabeçalho.');
  await p.getByRole('button',{name:'Produto',exact:true}).click();
  const handleGroup=p.getByRole('group',{name:'Escolher modelo de alça'});
  assert.equal(await handleGroup.getByRole('button').count(),6);
  assert.equal(await handleGroup.getByRole('button',{name:/Caneca 325 ml/}).count(),0);
  await handleGroup.getByRole('button',{name:/Coração assimétrico/}).click();
  await p.evaluate(()=>{const s=window.studioTest.store.getState();s.patchObject('hero',{handleColor:'#c90d22',interiorColor:'#c90d22'});});
  await p.getByRole('button',{name:'Lateral / Alça',exact:true}).click();
  await p.waitForTimeout(1200);
  await p.screenshot({path:path.join(h.output,'heart-handle.png')});
  await p.getByRole('button',{name:/Arredondada Formato/}).click();
  await p.screenshot({path:path.join(h.output,'studio.png')});
  checks.push('Seis alças selecionáveis; a alça fina foi retirada sem remover o ID legado.');
  await p.evaluate(async()=>{const t=window.studioTest;const text=await(await fetch('/fixtures/legacy-v1.cgstudio')).text();await t.portable.importPortableProject(new File([text],'legacy.cgstudio'));});
  await p.getByRole('button',{name:'Exportar criação',exact:true}).click();
  const dialog=p.getByRole('dialog',{name:'Exportar criação',exact:true});await dialog.waitFor();
  const tabs=dialog.getByRole('tab');assert.equal(await tabs.count(),5);
  for(const [name,button] of [['Vídeo',/^Gerar (vídeo|WebM com ALFA)$/],['GIF',/^Gerar GIF$/],['Lote de imagens',/^Exportar \d+ imagens em ZIP$/],['Folha de sublimação',/^Baixar folha PNG$/]]){
    await dialog.getByRole('tab',{name:new RegExp('^'+name)}).click();
    // Each existing exporter is mounted, with a real primary action.
    assert.equal(await dialog.getByRole('button',{name:button}).count(),1);
    await dialog.getByRole('tabpanel').waitFor();
  }
  await dialog.getByRole('tab',{name:/^Imagem/}).click();
  const purpose=dialog.getByLabel('Onde você vai usar?');
  await purpose.selectOption('story');
  assert.equal(await p.evaluate(()=>window.studioTest.store.getState().exportSettings.ratioId),'story');
  await purpose.selectOption('social');
  await dialog.getByRole('button',{name:'Pré-visualizar exportação',exact:true}).click();
  await dialog.getByRole('button',{name:'Confirmar e baixar imagem',exact:true}).waitFor({timeout:120000});
  assert.equal(await dialog.getByRole('button',{name:'Pré-visualizar exportação',exact:true}).count(),0);
  await p.screenshot({path:path.join(h.output,'export-desktop.png')});
  checks.push('As cinco saídas continuam disponíveis; Imagem tem uma única ação principal e prévia final.');
  await purpose.selectOption('story');
  await dialog.getByRole('button',{name:'Pré-visualizar exportação',exact:true}).waitFor();
  assert.equal(await dialog.getByRole('button',{name:'Confirmar e baixar imagem',exact:true}).count(),0);
  checks.push('Alterar configurações invalida o arquivo anterior antes de permitir download.');
  await p.setViewportSize({width:390,height:844});
  const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.width<=390&&box.height<=844);
  const action=dialog.getByRole('button',{name:'Pré-visualizar exportação',exact:true});
  await action.scrollIntoViewIfNeeded();const actionBox=await action.boundingBox();
  assert.ok(actionBox.y>=0&&actionBox.y+actionBox.height<=844);
  assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await p.screenshot({path:path.join(h.output,'export-mobile.png')});
  await p.keyboard.press('Escape');
  await p.screenshot({path:path.join(h.output,'studio-mobile.png')});
  for(const trigger of ['Projeto','Ajuda e recursos']){await p.getByRole('button',{name:trigger,exact:true}).click();await p.getByRole('menu').waitFor();await p.keyboard.press('Escape');}
  checks.push('Janela e ação de exportação cabem no celular; menus de projeto e ajuda funcionam.');
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(h.output,'refinement-results.json'),JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({checks,output:h.output}));
} finally {await browser.close();await h.close();}
