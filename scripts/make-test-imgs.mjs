import sharp from 'sharp';

async function main() {
  // 3 imagens de teste em formatos diferentes
  const base = sharp({
    create: { width: 400, height: 300, channels: 4, background: { r: 232, g: 112, b: 58, alpha: 1 } },
  });
  await base.clone().png().toFile('/tmp/teste1.png');
  await sharp({
    create: { width: 320, height: 320, channels: 3, background: { r: 37, g: 211, b: 102 } },
  }).jpeg({ quality: 90 }).toFile('/tmp/teste2.jpg');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#0a0908"/><circle cx="150" cy="150" r="100" fill="#e8703a"/></svg>');
  await sharp(svg).png().toFile('/tmp/teste3.png');
  console.log('Imagens de teste criadas');
}
main();
