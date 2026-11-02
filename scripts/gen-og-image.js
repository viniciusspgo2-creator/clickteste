/* Gera o OG image 1200×630 do Click & Gruda (identidade: preto + laranja #e8703a) */
const sharp = require('sharp');
const path = require('path');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e8703a" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#e8703a" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f08048"/>
      <stop offset="0.5" stop-color="#e8703a"/>
      <stop offset="1" stop-color="#f0a048"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0908"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="1050" cy="120" r="260" fill="#e8703a" opacity="0.08"/>
  <circle cx="90" cy="560" r="200" fill="#e8703a" opacity="0.07"/>
  <g transform="translate(80,96)">
    <rect width="64" height="64" rx="16" fill="#e8703a"/>
    <text x="32" y="45" font-family="DejaVu Sans, sans-serif" font-size="38" font-weight="bold" fill="#0a0908" text-anchor="middle">&amp;</text>
  </g>
  <text x="164" y="142" font-family="DejaVu Sans, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">Click &amp; Gruda <tspan fill="#e8703a">Tools</tspan></text>
  <text x="80" y="300" font-family="DejaVu Sans, sans-serif" font-size="64" font-weight="bold" fill="#ffffff">Ferramentas online grátis</text>
  <text x="80" y="382" font-family="DejaVu Sans, sans-serif" font-size="64" font-weight="bold" fill="url(#accent)">para canecas personalizadas</text>
  <text x="80" y="462" font-family="DejaVu Sans, sans-serif" font-size="28" fill="#b8aca0">QR Code · WhatsApp · Orçamentos · Contratos · PDF · Imagens</text>
  <text x="80" y="510" font-family="DejaVu Sans, sans-serif" font-size="28" font-weight="bold" fill="#f0a048">Mockup 3D fotorrealista + caneca mágica (PREMIUM)</text>
  <rect x="80" y="560" width="1040" height="2" fill="#e8703a" opacity="0.35"/>
  <text x="80" y="600" font-family="DejaVu Sans, sans-serif" font-size="24" fill="#8d8177">clickgruda.vercel.app · 100% no navegador · sem cadastro</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(path.join('/home/z/my-project/public/og', 'og-default.png'))
  .then((info) => console.log('OG gerado:', info.width + 'x' + info.height, Math.round(info.size / 1024) + 'KB'))
  .catch((e) => { console.error(e); process.exit(1); });
