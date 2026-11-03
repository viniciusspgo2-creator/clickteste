"use client";
import { useState } from "react";
import catalog from "../lib/premium-backgrounds.json";
import { useMockupStore } from "../state/store";
import { loadBgBlob } from "../lib/background-registry";
import { exportImage, downloadBlob } from "../exporters/image-exporter";
import { zipSync } from "fflate";
import { SliderRow } from "./controls";
const waitPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
export async function applyPremiumBackground(src: string, label: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error("Não foi possível carregar o cenário.");
  const entry = await loadBgBlob(await response.blob(), label);
  const st = useMockupStore.getState();
  st.patch("bg", {
    type: "image",
    imageId: entry.id,
    floor: "continuo",
    imageFit: "cover",
    imageZoom: 1,
    imageX: 0,
    imageY: 0,
    imageRot: 0,
    imageBlur: 0,
    imageBright: 1,
    imageContrast: 0,
    imageVignette: 0,
    matchLight: false,
  });
  await waitPaint();
}
export function PremiumBackgrounds({
  notify,
}: {
  notify: (text: string) => void;
}) {
  const st = useMockupStore();
  const [category, setCategory] = useState("Todos");
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const list =
    category === "Todos"
      ? catalog
      : catalog.filter((x) => x.category === category);
  async function batch() {
    const original = { ...st.bg };
    setBusy(true);
    setProgress(0);
    try {
      const files: Record<string, Uint8Array> = {};
      const targets = catalog.filter((x) => chosen.includes(x.id));
      for (let i = 0; i < targets.length; i++) {
        const b = targets[i];
        await applyPremiumBackground(b.src, b.label);
        const res = await exportImage({
          width: 1080,
          height: 1080,
          format: "png",
          quality: 1,
          transparent: false,
        });
        files[`${b.id}.png`] = new Uint8Array(await res.blob.arrayBuffer());
        setProgress((i + 1) / targets.length);
      }
      downloadBlob(
        new Blob([zipSync(files, { level: 0 }) as BlobPart], {
          type: "application/zip",
        }),
        "clickgruda-fundos.zip",
      );
      notify(`${targets.length} mockups exportados.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Falha no lote.");
    } finally {
      useMockupStore.getState().patch("bg", original);
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="cg-hint">
        30 cenários originais. Clique para aplicar; marque vários para baixar um
        lote com a mesma composição.
      </p>
      <select
        className="cg-background-filter"
        aria-label="Categoria de fundos"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {["Todos", ...new Set(catalog.map((x) => x.category))].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <div className="cg-background-grid">
        {list.map((b) => (
          <div key={b.id}>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await applyPremiumBackground(b.src, b.label);
                } catch (e) {
                  notify(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <img loading="lazy" src={b.src} alt={`Cenário ${b.label}`} />
              <strong>{b.label}</strong>
            </button>
            <label className="cg-batch-row">
              <input
                type="checkbox"
                aria-label={`Incluir ${b.label} no lote`}
                checked={chosen.includes(b.id)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked
                      ? [...chosen, b.id]
                      : chosen.filter((x) => x !== b.id),
                  )
                }
              />
              Incluir no lote
            </label>
          </div>
        ))}
      </div>
      <button
        className="cg-secondary"
        disabled={!chosen.length || busy}
        onClick={batch}
      >
        {busy
          ? `Preparando ${Math.round(progress * 100)}%`
          : `Exportar ${chosen.length} fundos em ZIP`}
      </button>
      <SliderRow
        label="Contraste do fundo"
        value={st.bg.imageContrast ?? 0}
        min={-0.8}
        max={1}
        step={0.01}
        onChange={(imageContrast) => st.patch("bg", { imageContrast })}
      />
      <SliderRow
        label="Vinheta do fundo"
        value={st.bg.imageVignette ?? 0}
        min={0}
        max={1}
        step={0.01}
        onChange={(imageVignette) => st.patch("bg", { imageVignette })}
      />
    </div>
  );
}
