/** Studio Mockup regression gate. Does NOT write to the database or deploy. */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const programs = process.platform === 'win32' ? { npm: 'npm.cmd' } : { npm: 'npm' };
const node = process.execPath;
const cases = [
  'tests/bocao-ux-standalone.mjs',
  'tests/studio-interaction-rendering.mjs',
  'tests/art-quality.mjs',
  'tests/handle-regressions.mjs',
  'tests/mockup-movement.mjs',
  'tests/mockup-multi-scene.mjs',
  'tests/ceramic-colors.mjs',
  'docs/mockup-studio/regressions.mjs',
  'tests/final-preview-view.mjs',
  'tests/base-art.mjs',
  'tests/announcements.mjs',
];
let errors = 0;
function run(label, bin, args) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(bin, args, { cwd: root, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
  if (res.status !== 0) {
    console.error(`✘ ${label}: ${res.error?.message ?? `código ${res.status ?? 'desconhecido'}`}`);
    errors++;
  } else {
    console.log(`✓ ${label}`);
  }
}
if (!existsSync(join(root, 'node_modules', 'next', 'package.json'))) {
  console.error('Dependências incompletas. Instale com npm ci (usando package-lock.json) antes de executar esta verificação.');
  process.exit(1);
}
for (const item of cases) run(item, node, [item]);
// prisma generate creates a local client but does NOT connect to PostgreSQL or push schema.
run('Gerar cliente Prisma local (sem db push)', programs.npm, ['exec', '--no', '--', 'prisma', 'generate']);
run('TypeScript completo', programs.npm, ['exec', '--no', '--', 'tsc', '--noEmit']);
run('Lint', programs.npm, ['exec', '--no', '--', 'eslint', 'src/components/tools/mockup', 'tests/bocao-ux-standalone.mjs', 'tests/studio-interaction-rendering.mjs']);
// Calling next directly deliberately avoids package.json's existing prisma db push in 'build'.
run('Next build sem db push', programs.npm, ['exec', '--no', '--', 'next', 'build']);
if (process.env.STUDIO_TEST_TOOLS) {
  for (const item of ['tests/final-preview-browser.mjs','tests/announcements-browser.mjs']) run(item, node, [item]);
} else {
  console.log('\nℹ️ Testes Playwright opcionais não executados: defina STUDIO_TEST_TOOLS para habilitá-los.');
}
console.log(`\n${errors ? `FALHOU: ${errors} etapa(s). NÃO PROMOVA PARA PRODUÇÃO.` : 'PASSOU: verificação local. Ainda é necessária aceitação visual no navegador e validação de sessão/banco.'}`);
process.exitCode = errors ? 1 : 0;
