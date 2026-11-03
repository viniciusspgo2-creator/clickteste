/** RFC-style quoted CSV; supports Brazilian semicolon-delimited files. */
export function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const line = text.split(/\r?\n/, 1)[0] || "";
  const delimiter =
    (line.match(/;/g)?.length || 0) > (line.match(/,/g)?.length || 0)
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && (!cell || quoted)) {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else cell += char;
    if (rows.length > 50000 || row.length > 250)
      throw new Error(
        "CSV muito extenso: use até 50 mil linhas e 250 colunas.",
      );
  }
  if (quoted) throw new Error("CSV inválido: campo com aspas não foi fechado.");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
export function toCsv(rows: string[][]): string {
  // Prevent spreadsheet formula injection when exported data is reopened.
  return rows
    .map((row) =>
      row
        .map((value) => {
          const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
          return '"' + safe.replaceAll('"', '""') + '"';
        })
        .join(";"),
    )
    .join("\r\n");
}
