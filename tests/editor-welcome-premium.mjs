import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const welcome=read('src/components/creative/editor-welcome.tsx');
const landing=read('src/app/editor-artes/page.tsx');
const editor=read('src/app/editor-artes/editor/page.tsx');
const resources=read('src/lib/editor-resources.ts');
const detail=read('src/components/creative/guru-details.tsx');

test('Preserva rota do editor e validação PremiumGate',()=>{
 assert.match(landing,/PremiumGate/);
 assert.match(landing,/editor-artes\/editor/);
 assert.match(editor,/PremiumGate/);
 assert.match(welcome,/href=\{editorHref\}/);
});

test('Links de afiliado exatos e apenas dois períodos',()=>{
 assert.match(resources,/pay\.cakto\.com\.br\/9KnSC7H\?affiliate=SFdcYeVv/);
 assert.match(resources,/pay\.cakto\.com\.br\/32e8spj\?affiliate=SFdcYeVv/);
 assert.match(resources,/R\$ 67,00/);
 assert.match(resources,/R\$ 177,00/);
 assert.match(detail,/rel="sponsored noopener noreferrer"/);
});

test('Drive sem URL não é fingido como recurso habilitado',()=>{
 assert.match(resources,/googleDriveUrl/);
 assert.match(resources,/drive\.google\.com/);
 assert.match(welcome,/entry\.url\s*\?/);
 assert.match(welcome,/Em breve/);
});

test('Todos os links úteis pedidos constam na configuração',()=>{
 for(const domain of ['pixelcut.ai','photoroom.com','remove.bg','picsart.com','pinterest.com','cosmos.so','dribbble.com','behance.net','freepik.com','vecteezy.com','pngtree.com']) assert.ok(resources.includes(domain),domain);
});

test('Ilustrações locais e página interna existem',()=>{
 for(const file of ['hero-studio.webp','guru-mascot.webp','brand-footer.webp','resource-pattern.webp','resource-character.webp','resource-shapes.webp','resource-folder.webp']) assert.ok(existsSync(new URL(`../public/editor-welcome/${file}`,import.meta.url)),file);
 assert.ok(existsSync(new URL('../src/app/editor-artes/ferramentas-guru/page.tsx',import.meta.url)));
 assert.match(welcome,/GuruToolsCarousel/);
});
