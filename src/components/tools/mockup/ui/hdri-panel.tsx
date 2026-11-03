"use client";
import { useState } from "react";
import { Sun } from "lucide-react";
import { Section, SliderRow } from "./controls";
import { useMockupStore } from "../state/store";
import {
  getEnvironment,
  registerEnvironment,
} from "../lib/environment-registry";
export function HDRIPanel() {
  const light = useMockupStore((s) => s.light);
  const patch = useMockupStore((s) => s.patch);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Section title="Ambiente HDRI" icon={Sun}>
      {(
        [
          "keyStrength",
          "fillStrength",
          "rimStrength",
          "ambientStrength",
        ] as const
      ).map((key, i) => (
        <SliderRow
          key={key}
          label={
            [
              "Luz principal",
              "Preenchimento",
              "Recorte traseiro",
              "Luz ambiente",
            ][i]
          }
          min={0}
          max={3}
          step={0.05}
          value={light[key] ?? 1}
          onChange={(v) => patch("light", { [key]: v })}
        />
      ))}
      <p className="cg-hint">
        O estúdio usa softboxes HDR procedurais. Você também pode carregar um
        panorama Radiance do seu dispositivo.
      </p>
      <label className="cg-file-label">
        {busy ? "Carregando ambiente…" : "Carregar .hdr"}
        <input
          type="file"
          disabled={busy}
          accept=".hdr"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              const id = await registerEnvironment(f, f.name);
              patch("light", { hdriId: id });
              setMessage(f.name);
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Não foi possível carregar.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <p className="cg-hint" role="status">
        {message ||
          getEnvironment(light.hdriId)?.name ||
          "Ambiente de estúdio ativo"}
      </p>
      <button
        className="cg-secondary"
        onClick={() => {
          patch("light", { hdriId: null });
          setMessage("Estúdio restaurado.");
        }}
      >
        Usar softboxes do estúdio
      </button>
    </Section>
  );
}
