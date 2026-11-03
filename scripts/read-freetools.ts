import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const CATS = ['financas', 'utilitarios', 'marketing', 'texto', 'produtividade', 'design', 'seguranca', 'desenvolvedor', '3d'];

async function main() {
  const zai = await ZAI.create();
  const catalog: Record<string, string[]> = {};
  for (const cat of CATS) {
    const url = `https://freetools.com.br/categorias/${cat}.html`;
    try {
      const result = await zai.functions.invoke('page_reader', { url });
      const html = (result as { data?: { html?: string } })?.data?.html ?? '';
      fs.writeFileSync(`/tmp/ft-${cat}.html`, html);
      const links = [...html.matchAll(/href="(?:https:\/\/freetools\.com\.br\/)?((?!categorias|index|sobre|sugerir|contato|termos|politicas|cookies|assets|#)[\w\d/-]+\.html)"/g)].map((m) => m[1]);
      catalog[cat] = [...new Set(links)];
      console.log(`\n=== ${cat} (${catalog[cat].length}) ===`);
      catalog[cat].forEach((l) => console.log(' ', l));
    } catch (e) {
      console.log(`${cat}: ERRO ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  fs.writeFileSync('/tmp/ft-catalog.json', JSON.stringify(catalog, null, 2));
  const total = Object.values(catalog).reduce((a, b) => a + b.length, 0);
  console.log(`\nTOTAL: ${total} ferramentas`);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });

