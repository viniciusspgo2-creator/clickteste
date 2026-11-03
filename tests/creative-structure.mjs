/** QA estática que pode rodar sem baixar dependências. Validação de build exige npm ci + npm run build:staging. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Módulos independentes mantêm Studio original',()=>{
 for(const p of ['src/app/mockup-caneca-3d/studio/page.tsx','src/app/editor-artes/page.tsx','src/app/studio-templates/page.tsx','src/components/tools/mockup/mockup-studio.tsx'])assert.ok(exists(p),p);
});
test('Editor não faz POST para servidor com arquivos do cliente',()=>{
 const s=read('src/components/creative/creative-editor.tsx')+read('src/lib/creative/handoff.ts');
 assert.ok(!/method\s*:\s*['"]POST['"]/.test(s));
 assert.match(s,/readHandoff/);assert.match(s,/exportDesign/);
});
test('Novos endpoints administrativos usam guarda de autenticação',()=>{
 for(const p of ['src/app/api/admin/creative-assets/route.ts','src/app/api/admin/creative-assets/[id]/route.ts'])assert.match(read(p),/requireAdmin\(req\)/);
});
test('Metadata só de assets ADMIN, não de uploads de cliente',()=>{
 assert.match(read('prisma/schema.prisma'),/model CreativeAsset/);
 assert.match(read('src/app/api/admin/creative-assets/route.ts'),/r2Request\('PUT'/);
 assert.match(read('src/components/tools/mockup/ui/panels.tsx'),/writeHandoff\(res.blob\)/);
});
test('Novo build não sincroniza Neon automaticamente',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.ok(!pkg.scripts.build.includes('db push'));
 assert.ok(pkg.scripts['build:staging'].includes('tsc --noEmit'));
});
