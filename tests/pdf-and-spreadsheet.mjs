import fs from "node:fs";
import Module, { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  ts = require("typescript");
Module._extensions[".ts"] = (mod, file) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
const { parseCsv, toCsv } = require("../src/lib/spreadsheet.ts");
const { applyPdfEdits } = require("../src/lib/pdf-edits.ts");
const { PDFDocument, StandardFonts, degrees } = require("pdf-lib");
test("CSV handles BOM, semicolons, embedded newlines, empty cells and escaped quotes", () => {
  assert.deepEqual(
    parseCsv(
      '\uFEFFNome;Observação;Preço\r\nMaria;"linha 1\nlinha 2; com ""aspas""";35\r\nPedro;;42',
    ),
    [
      ["Nome", "Observação", "Preço"],
      ["Maria", 'linha 1\nlinha 2; com "aspas"', "35"],
      ["Pedro", "", "42"],
    ],
  );
  assert.deepEqual(parseCsv('A,B\n"1,2",3\n'), [
    ["A", "B"],
    ["1,2", "3"],
  ]);
  assert.throws(() => parseCsv('a,b\n"sem fechamento'), /aspas/);
});
test("CSV exports formula-like values as text and preserves cell boundaries", () => {
  const out = toCsv([["=CMD()", "normal;texto", '"citado"', "-2"]]);
  assert.deepEqual(parseCsv(out), [
    ["'=CMD()", "normal;texto", '"citado"', "'-2"],
  ]);
});
test("PDF edits preserve page size and rotation, support Latin text, and fill native form fields", async () => {
  const pdf = await PDFDocument.create(),
    p = pdf.addPage([420, 594]);
  p.setRotation(degrees(90));
  p.drawText("Original", { x: 30, y: 500, size: 16 });
  const field = pdf.getForm().createTextField("cliente");
  field.addToPage(p, { x: 30, y: 300, width: 180, height: 20 });
  const check = pdf.getForm().createCheckBox("confirmado");
  check.addToPage(p, { x: 30, y: 270, width: 15, height: 15 });
  const source = await pdf.save();
  const edit = {
    id: "test",
    page: 0,
    text: "Orçamento: ação",
    x: 30,
    y: 500,
    size: 16,
    width: 100,
    height: 18,
    angle: 0,
    font: StandardFonts.HelveticaBold,
    color: "#112233",
    background: "#ffffff",
    cover: true,
  };
  const result = await PDFDocument.load(
    await applyPdfEdits(source, [edit], { cliente: "Maria", confirmado: true }),
  );
  assert.deepEqual(result.getPage(0).getSize(), { width: 420, height: 594 });
  assert.equal(result.getPage(0).getRotation().angle, 90);
  assert.equal(result.getForm().getTextField("cliente").getText(), "Maria");
  assert.equal(result.getForm().getCheckBox("confirmado").isChecked(), true);
  await assert.rejects(
    applyPdfEdits(source, [{ ...edit, text: "😀" }]),
    /caracteres/,
  );
  await assert.rejects(applyPdfEdits(source, [{ ...edit, page: 9 }]), /Página/);
  await assert.rejects(
    applyPdfEdits(source, [{ ...edit, size: NaN }]),
    /tamanho/,
  );
});
