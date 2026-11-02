import assert from 'node:assert/strict';
import {startStudioHarness,toolRequire} from './helpers/mockup-browser-harness.mjs';
const harness=await startStudioHarness({noticesOnly:true});const {chromium}=toolRequire('playwright');
const browser=await chromium.launch({executablePath:process.env.STUDIO_TEST_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const notice={id:'test-notice',revision:'v1',title:'Aviso de teste',message:'Conteúdo sintético, sem HTML.',type:'info',imageUrl:'',buttonText:'',buttonUrl:'',startsAt:'',endsAt:'',audience:'all',priority:5,repeat:'once',status:'active'};
 let saved=null;
 await page.route('**/api/announcements',r=>r.fulfill({json:{ok:true,items:[notice]}}));
 await page.route('**/api/admin/announcements',async r=>{if(r.request().method()==='POST')saved=r.request().postDataJSON();await r.fulfill({json:r.request().method()==='POST'?{ok:true,id:'fixture'}:{ok:true,items:[]}});});
 await page.goto(harness.url);await page.evaluate(()=>window.studioTest.store.getState().setExportOpen(true));
 await page.waitForTimeout(4500);
 assert.equal(await page.getByRole('complementary',{name:'Comunicado do Studio'}).count(),0);
 await page.evaluate(()=>window.studioTest.store.getState().setExportOpen(false));
 const banner=page.getByRole('complementary',{name:'Comunicado do Studio'});await banner.waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'BODY');
 await page.getByRole('button',{name:'Fechar comunicado',exact:true}).click();await banner.waitFor({state:'hidden'});
 await page.reload();await page.waitForTimeout(4500);assert.equal(await banner.count(),0);
 await page.getByRole('textbox',{name:'Título',exact:true}).fill('Comunicado criado no teste');
 await page.getByRole('textbox',{name:'Mensagem (texto simples)',exact:true}).fill('Mensagem para conferência.');
 await page.getByRole('button',{name:'Pré-visualizar',exact:true}).click();
 await page.getByRole('button',{name:'Salvar comunicado',exact:true}).click();
 await page.waitForFunction(()=>document.body.textContent.includes('Comunicado salvo.'));
 assert.equal(saved.title,'Comunicado criado no teste');assert.equal(saved.status,'draft');
 console.log('PASS: comunicado adiado durante exportação, sem roubar foco, fechamento persistente e formulário/prévia do admin. API de armazenamento simulada; banco real não exercitado.');
}finally{await browser.close();await harness.close();}
