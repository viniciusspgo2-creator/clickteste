import sharp from 'sharp';
import fs from 'fs';

const SRC = '/home/z/my-project/upload/click e gurda.png';
const OUT_PREVIEW = '/tmp/crop-preview.png';

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log('Logo dims:', meta.width, 'x', meta.height);

  const W = meta.width, H = meta.height;

  // Crop the "&" area: roughly centered around 46% width, top 80% height (above tagline)
  const left = Math.round(W * 0.395);
  const top = Math.round(H * 0.04);
  const cropW = Math.round(W * 0.102); // narrow band containing only the &
  const cropH = Math.round(H * 0.68); // exclude tagline bottom

  const buf = await sharp(SRC)
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();

  // Trim transparent/empty edges
  const trimmed = await sharp(buf).trim({ threshold: 30 }).png().toBuffer();
  const tMeta = await sharp(trimmed).metadata();
  console.log('Trimmed & dims:', tMeta.width, 'x', tMeta.height);

  await sharp(trimmed).toFile(OUT_PREVIEW);

  // Build 512x512 icon: rounded black square + & centered
  const pad = 512 * 0.16;
  const inner = 512 - pad * 2;
  const scale = Math.min(inner / tMeta.width, inner / tMeta.height);
  const fw = Math.round(tMeta.width * scale);
  const fh = Math.round(tMeta.height * scale);

  const resizedAmp = await sharp(trimmed).resize(fw, fh).png().toBuffer();

  const bgSvg = Buffer.from(`
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141414"/>
          <stop offset="100%" stop-color="#050505"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#g)"/>
      <rect x="14" y="14" width="484" height="484" rx="100" fill="none" stroke="#E8703A" stroke-opacity="0.35" stroke-width="10"/>
    </svg>`);

  const icon512 = await sharp(bgSvg)
    .composite([{ input: resizedAmp, gravity: 'center' }])
    .png()
    .toBuffer();

  // Outputs
  fs.mkdirSync('/home/z/my-project/public/icons', { recursive: true });
  await sharp(icon512).resize(512, 512).toFile('/home/z/my-project/public/icons/icon-512.png');
  await sharp(icon512).resize(192, 192).toFile('/home/z/my-project/public/icons/icon-192.png');
  await sharp(icon512).resize(256, 256).toFile('/home/z/my-project/src/app/icon.png');
  await sharp(icon512).resize(180, 180).toFile('/home/z/my-project/src/app/apple-icon.png');

  // Copy logo for header usage (trim transparent padding)
  const logoTrim = await sharp(SRC).trim({ threshold: 10 }).png().toBuffer();
  const lm = await sharp(logoTrim).metadata();
  console.log('Logo trimmed:', lm.width, 'x', lm.height);
  await sharp(logoTrim).toFile('/home/z/my-project/public/logo.png');

  console.log('✔ Icons generated');
}

main().catch(e => { console.error(e); process.exit(1); });
