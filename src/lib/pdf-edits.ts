import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
export type PdfTextEdit = {
  id: string;
  page: number;
  text: string;
  x: number;
  y: number;
  size: number;
  width: number;
  height: number;
  angle: number;
  font: StandardFonts;
  color: string;
  background: string;
  cover: boolean;
  original?: string;
  originX?: number;
  originY?: number;
  originAngle?: number;
};
export const PDF_FONTS = [
  StandardFonts.Helvetica,
  StandardFonts.HelveticaBold,
  StandardFonts.HelveticaOblique,
  StandardFonts.HelveticaBoldOblique,
  StandardFonts.TimesRoman,
  StandardFonts.TimesRomanBold,
  StandardFonts.TimesRomanItalic,
  StandardFonts.TimesRomanBoldItalic,
  StandardFonts.Courier,
  StandardFonts.CourierBold,
  StandardFonts.CourierOblique,
  StandardFonts.CourierBoldOblique,
];
function color(hex: string) {
  if (!/^#[a-f0-9]{6}$/i.test(hex)) throw new Error("Cor inválida.");
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
}
/** Visual replacement only. White covers are not secure redaction. */
export async function applyPdfEdits(
  bytes: Uint8Array,
  edits: PdfTextEdit[],
  fields: Record<string, string | boolean> = {},
) {
  const doc = await PDFDocument.load(bytes.slice());
  const fonts = new Map<
    StandardFonts,
    Awaited<ReturnType<typeof doc.embedFont>>
  >();
  for (const edit of edits) {
    if (
      !Number.isFinite(edit.page) ||
      edit.page < 0 ||
      edit.page >= doc.getPageCount()
    )
      throw new Error("Página inválida.");
    if (
      ![edit.x, edit.y, edit.size, edit.width, edit.height, edit.angle].every(
        Number.isFinite,
      ) ||
      edit.size < 4 ||
      edit.size > 200 ||
      !PDF_FONTS.includes(edit.font)
    )
      throw new Error("Confira posição, tamanho e fonte do texto.");
    const page = doc.getPage(edit.page);
    let font = fonts.get(edit.font);
    if (!font) {
      font = await doc.embedFont(edit.font);
      fonts.set(edit.font, font);
    }
    try {
      font.encodeText(edit.text);
    } catch {
      throw new Error(
        "Este texto contém caracteres não suportados pela fonte PDF. Use caracteres latinos ou remova emojis.",
      );
    }
    if (edit.cover) {
      const angle = edit.originAngle ?? edit.angle;
      const radians = (angle * Math.PI) / 180;
      page.drawRectangle({
        x: (edit.originX ?? edit.x) + Math.sin(radians) * edit.height * 0.25,
        y: (edit.originY ?? edit.y) - Math.cos(radians) * edit.height * 0.25,
        width: edit.width + 1,
        height: edit.height * 1.25,
        color: color(edit.background),
        rotate: degrees(angle),
      });
    }
    if (edit.text)
      page.drawText(edit.text, {
        x: edit.x,
        y: edit.y,
        size: edit.size,
        font,
        color: color(edit.color),
        rotate: degrees(edit.angle),
        lineHeight: edit.size * 1.2,
      });
  }
  const form = doc.getForm();
  for (const [key, value] of Object.entries(fields)) {
    const field = form.getField(key);
    if (field.isReadOnly()) continue;
    if (typeof value === "boolean" && "check" in field && "uncheck" in field) {
      if (value) (field as import("pdf-lib").PDFCheckBox).check();
      else (field as import("pdf-lib").PDFCheckBox).uncheck();
    } else if ("setText" in field)
      (field as import("pdf-lib").PDFTextField).setText(String(value));
    else if ("select" in field && value)
      (field as import("pdf-lib").PDFDropdown).select(String(value));
  }
  return doc.save();
}
