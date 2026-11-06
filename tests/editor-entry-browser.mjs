import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {toolRequire} from './helpers/creative-browser-harness.mjs';
const {chromium}=toolRequire('playwright'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const base=process.env.STUDIO_ENTRY_URL||'http://127.0.0.1:3014',output=process.env.STUDIO_TEST_OUTPUT||'/tmp/editor-entry';await fs.mkdir(output,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.addInitScript(()=>localStorage.setItem('cg-v34-ui-language','pt'));
 await page.route('**/api/access/session',r=>r.fulfill({json:{ok:true,plan:'Premium',clientName:'Teste'}}));
 await page.route('**/api/admin/**',r=>r.fulfill({json:{ok:true,items:[]}}));
 const query='preset=floral&from=mockup&asset=teste%20com%20espa%C3%A7os';await page.goto(base+'/editor-artes?'+query);await page.getByRole('heading',{name:'Comece por aqui',exact:true}).waitFor();
 const enter=page.getByRole('link',{name:'Entrar no editor',exact:true});assert.equal(await enter.getAttribute('href'),'/editor-artes/editor?'+new URLSearchParams(query).toString());assert.equal(await page.locator('canvas').count(),0);assert.equal(await page.locator('.ew-card').count(),3);
 const b=await enter.boundingBox();assert.ok(b.height>=68&&b.y+b.height<=900);await page.screenshot({path:output+'/welcome-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await enter.isVisible());const mobile=await enter.boundingBox();assert.ok(mobile.y+mobile.height<844);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:output+'/welcome-mobile.png',fullPage:true});
 await page.setViewportSize({width:1920,height:900});await enter.click();await page.waitForURL('**/editor-artes/editor?*');await page.locator('.cr-stage').waitFor();assert.equal(new URL(page.url()).searchParams.get('asset'),'teste com espaços');assert.equal(new URL(page.url()).searchParams.get('from'),'mockup');
 const bounds=await page.locator('.cg-creative').boundingBox();assert.ok(bounds.y+bounds.height<=900.5,'Account bar and editor fit the viewport');
 assert.deepEqual(errors,[]);console.log('PASS: entry page before canvas, empty cards, prominent responsive CTA and query handoff to gated editor');
}finally{await browser.close();}
