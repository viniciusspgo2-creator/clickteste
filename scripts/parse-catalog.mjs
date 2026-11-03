import fs from 'fs';

const CATS = ['financas', 'utilitarios', 'marketing', 'texto', 'produtividade', 'design', 'seguranca', 'desenvolvedor', '3d'];
const SKIP = /categorias|index|sobre|sugerir|contato|termos|politicas|cookies|assets|#|^\.\/$|salvos/;

const catalog = {};

for (const cat of CATS) {
  const html = fs.readFileSync(`/tmp/ft-${cat}.html`, 'utf8');
  const found = [];
  const seen = new Set();

  // cada link de ferramenta: href="...html" com texto
  const re = /<a[^>]+href="((?:\.\.\/|\/)?[\w\d/-]+\.html)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const path = m[1].replace(/^\.\.\//, '');
    if (SKIP.test(path)) continue;
    if (path.startsWith('categorias/')) continue;
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || seen.has(path)) continue;
    seen.add(path);
    found.push({ path, text });
  }
  catalog[cat] = found;
  console.log(`\n=== ${cat} (${found.length}) ===`);
  found.forEach((f) => console.log(`  ${f.path}  →  ${f.text.slice(0, 90)}`));
}

const total = Object.values(catalog).reduce((a, b) => a + b.length, 0);
console.log(`\nTOTAL: ${total}`);
fs.writeFileSync('/tmp/ft-catalog.json', JSON.stringify(catalog, null, 2));
