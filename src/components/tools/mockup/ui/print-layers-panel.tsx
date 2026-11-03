"use client";
import { useState } from "react";
import { Layers } from "lucide-react";
import { useMockupStore } from "../state/store";
import { loadArtFile } from "../lib/art-registry";
import { Section, SliderRow, ToggleRow } from "./controls";
export function PrintLayersPanel() {
  const st = useMockupStore(),
    id = st.selectedIds[0] ?? "hero";
  const art =
    id === "hero"
      ? st.art
      : (st.companions.find((c) => c.id === id)?.art ?? st.art);
  const [message, setMessage] = useState("");
  const patch = (p: Partial<typeof art>) => st.patchObjectArt(id, p);
  async function upload(file: File, key: "decalImageId" | "baseImageId") {
    try {
      const e = await loadArtFile(file);
      patch({ [key]: e.id });
      setMessage("Imagem aplicada à peça selecionada.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Imagem inválida.");
    }
  }
  return (
    <Section title="Camadas de impressão" icon={Layers}>
      <p className="cg-hint">
        Use um PNG transparente para acrescentar um logo ou detalhe sobre a
        estampa. A impressão inferior aparece ao virar a caneca.
      </p>
      <label className="cg-file-label">
        Adicionar detalhe sobre a arte
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, "decalImageId");
            e.target.value = "";
          }}
        />
      </label>
      {art.decalImageId && (
        <>
          <SliderRow
            label="Tamanho do detalhe"
            value={art.decalScale ?? 0.25}
            min={0.05}
            max={1}
            step={0.01}
            onChange={(decalScale) => patch({ decalScale })}
          />
          <SliderRow
            label="Detalhe · horizontal"
            value={art.decalX ?? 0}
            min={-1}
            max={1}
            step={0.01}
            onChange={(decalX) => patch({ decalX })}
          />
          <SliderRow
            label="Detalhe · vertical"
            value={art.decalY ?? 0}
            min={-1}
            max={1}
            step={0.01}
            onChange={(decalY) => patch({ decalY })}
          />
          <SliderRow
            label="Rotação do detalhe"
            value={art.decalRotation ?? 0}
            min={-180}
            max={180}
            onChange={(decalRotation) => patch({ decalRotation })}
          />
          <SliderRow
            label="Opacidade do detalhe"
            value={art.decalOpacity ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(decalOpacity) => patch({ decalOpacity })}
          />
          <button
            className="cg-secondary"
            onClick={() => patch({ decalImageId: null })}
          >
            Remover detalhe
          </button>
        </>
      )}
      <ToggleRow
        label="Acabamento metalizado da arte"
        checked={art.metallic ?? false}
        onChange={(metallic) => patch({ metallic })}
      />
      <p className="cg-hint" role="status">
        {message ||
          "O metalizado usa a transparência das imagens para delimitar o acabamento."}
      </p>
    </Section>
  );
}
