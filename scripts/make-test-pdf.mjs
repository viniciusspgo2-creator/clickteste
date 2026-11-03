import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= 5; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Pagina ${i} - Teste Click & Gruda Tools`, {
      x: 60, y: 760, size: 22, font, color: rgb(0.91, 0.44, 0.23),
    });
    page.drawText(`Documento de teste para o editor de PDF.`, {
      x: 60, y: 720, size: 12, font,
    });
  }
  doc.setTitle('Teste Click Gruda');
  doc.setAuthor('Click & Gruda');
  const bytes = await doc.save();
  fs.writeFileSync('/tmp/teste.pdf', bytes);
  console.log('PDF criado:', bytes.length, 'bytes');
}
main();
