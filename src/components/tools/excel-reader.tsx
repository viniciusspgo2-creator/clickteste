"use client";
import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  Search,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { downloadBlob } from "@/lib/helpers";
type Sheet = { name: string; rows: string[][] };
const PAGE_SIZE = 100;
export function ExcelReader() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheet, setSheet] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = async (file: File) => {
    setError("");
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError(
        "Abra uma planilha .xlsx ou .csv. Para arquivos .xls antigos, salve uma cópia em .xlsx no Excel.",
      );
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Use uma planilha de até 15 MB.");
      return;
    }
    setBusy(true);
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        const { parseCsv } = await import("@/lib/spreadsheet");
        const rows = parseCsv(text);
        setSheets([{ name: "Planilha CSV", rows }]);
      } else {
        await workbook.xlsx.load(await file.arrayBuffer());
        const result: Sheet[] = [];
        let cells = 0;
        workbook.eachSheet((ws) => {
          if (ws.rowCount > 50000 || ws.columnCount > 250)
            throw new Error(
              "Planilha muito extensa: limite de 50 mil linhas e 250 colunas por aba.",
            );
          const rows: string[][] = [];
          ws.eachRow({ includeEmpty: true }, (row) => {
            cells += ws.columnCount;
            if (cells > 500000)
              throw new Error(
                "Este arquivo ultrapassa o limite de 500 mil células. Divida-o em arquivos menores.",
              );
            const values: string[] = [];
            for (let col = 1; col <= ws.columnCount; col++)
              values.push(row.getCell(col).text);
            rows.push(values);
          });
          result.push({ name: ws.name, rows });
        });
        setSheets(result);
      }
      setName(file.name);
      setSheet(0);
      setQuery("");
      setPage(0);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível abrir a planilha. Confira se ela está protegida ou corrompida.",
      );
    } finally {
      setBusy(false);
    }
  };
  const current = sheets[sheet];
  const rows = useMemo(
    () =>
      (current?.rows ?? [])
        .map((cells, index) => ({ cells, index }))
        .filter(
          (row) =>
            !query ||
            row.cells.some((v) =>
              v
                .toLocaleLowerCase("pt-BR")
                .includes(query.toLocaleLowerCase("pt-BR")),
            ),
        ),
    [current, query],
  );
  const columns = current?.rows.reduce((n, r) => Math.max(n, r.length), 0) || 0;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const exportCsv = async () => {
    const { toCsv } = await import("@/lib/spreadsheet");
    downloadBlob(
      new Blob(["\uFEFF" + toCsv(rows.map((r) => r.cells))], {
        type: "text/csv;charset=utf-8",
      }),
      `${current?.name || "planilha"}-filtrada.csv`,
    );
  };
  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy && e.dataTransfer.files[0])
            void load(e.dataTransfer.files[0]);
        }}
        className="rounded-2xl border border-dashed border-border p-8 text-center"
      >
        <FileSpreadsheet className="mx-auto mb-4 text-orange-400" size={30} />
        <h2 className="font-semibold">Sua planilha, sem instalar nada</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Arraste um Excel (.xlsx) ou CSV de até 15 MB. O arquivo é lido neste
          navegador e não é enviado ao servidor.
        </p>
        <input
          aria-label="Abrir planilha Excel ou CSV"
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) void load(e.target.files[0]);
            e.target.value = "";
          }}
        />
        <button
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Upload size={16} />
          )}
          {busy ? "Lendo planilha…" : "Abrir planilha"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </p>
      )}
      {current && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <strong className="mr-auto text-sm">{name}</strong>
            <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <Search size={15} />
              <input
                className="w-44 bg-transparent text-sm outline-none"
                aria-label="Buscar na planilha"
                placeholder="Buscar em todas as células"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs"
            >
              <Download size={15} />
              Exportar resultado em CSV
            </button>
          </div>
          <div
            role="tablist"
            aria-label="Abas da planilha"
            className="flex gap-2 overflow-x-auto"
          >
            {sheets.map((s, i) => (
              <button
                key={s.name}
                role="tab"
                aria-selected={sheet === i}
                onClick={() => {
                  setSheet(i);
                  setPage(0);
                }}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm ${sheet === i ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-border"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {rows.length} linhas · {columns} colunas · Fórmulas usam o resultado
            salvo no Excel; nenhuma macro ou fórmula é executada.
          </p>
          <div className="max-h-[600px] overflow-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-secondary">
                <tr>
                  <th className="p-3">Linha</th>
                  {Array.from({ length: columns }, (_, i) => (
                    <th key={i} className="min-w-32 border-l border-border p-3">
                      {columnName(i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                  .map((r) => (
                    <tr
                      key={r.index}
                      className="border-t border-border hover:bg-secondary/30"
                    >
                      <th className="bg-secondary/50 p-3 font-normal text-muted-foreground">
                        {r.index + 1}
                      </th>
                      {Array.from({ length: columns }, (_, i) => (
                        <td
                          key={i}
                          title={r.cells[i] || ""}
                          className="max-w-80 truncate border-l border-border p-3"
                        >
                          {r.cells[i]}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="p-8 text-sm text-muted-foreground">
                Nenhum resultado.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-4 py-2 disabled:opacity-30"
            >
              Anterior
            </button>
            <span>
              Página {page + 1} de {pages}
            </span>
            <button
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-4 py-2 disabled:opacity-30"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function columnName(index: number): string {
  let result = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  return result;
}
