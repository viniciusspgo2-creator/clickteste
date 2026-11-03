"use client";

import { useState } from "react";
import { Check, Focus, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useMockupStore, type ArtState } from "../state/store";
import { getArtImage } from "../lib/art-registry";
import { computeDpi } from "../lib/art-canvas";
import { CIRC_CM, MODEL_METRICS, resolvePrintArea } from "../lib/config";
import { suggestArtLayout, suggestArtTone } from "../lib/art-analysis";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";

const PROFILES = {
  empty: { label: "Imagem transparente", hint: "Não encontramos conteúdo visível. Experimente outro arquivo." },
  light: { label: "Tons claros e delicados", hint: "Preserve os tons pastel. Ajuste o reflexo do esmalte sem aumentar a exposição da arte." },
  dark: { label: "Arte de tons escuros", hint: "O brilho da cerâmica é separado da estampa. Um pequeno ajuste de luminosidade pode revelar detalhes nas sombras." },
  colorful: { label: "Cores intensas", hint: "Sua arte já tem cor suficiente. Mantenha a saturação original para evitar perder detalhes." },
  balanced: { label: "Tons equilibrados", hint: "Mantenha as cores originais ou experimente o ajuste tonal suave, sempre reversível." },
};

/** Measurements are recommendations; uploaded art is never edited in place. */
export function ArtAssistant({ active, art, locked = false, onNotice }: {
  active: string;
  art: ArtState;
  locked?: boolean;
  onNotice?: (message: string) => void;
}) {
  const model = useMockupStore(s => active === "hero" ? s.mug.model : s.companions.find(c => c.id === active)?.model ?? s.mug.model);
  const [restore, setRestore] = useState<{ id: string; patch: Partial<ArtState> } | null>(null);
  const entry = getArtImage(art.imageId);
  if (!entry) return null;
  const analysis = entry.analysis;
  const profile = analysis ? PROFILES[analysis.profile] : null;
  const dpi = computeDpi(art, undefined, model);
  const area = resolvePrintArea(art);
  const metrics = MODEL_METRICS[model] ?? MODEL_METRICS.classic;
  const ratio = (area.arcCm * metrics.circumference / CIRC_CM) / (area.heightCm * metrics.height / 9.5);
  const layout = suggestArtLayout(entry.width, entry.height, ratio, analysis);
  const neutral = Object.entries(NEUTRAL_ADJUSTMENTS).every(([key, value]) => art[key as keyof typeof NEUTRAL_ADJUSTMENTS] === value);
  function apply(patch: Partial<ArtState>, message: string) {
    const before = Object.fromEntries(Object.keys(patch).map(key => [key, art[key as keyof ArtState]]));
    setRestore({ id: `${active}:${art.imageId}`, patch: before });
    useMockupStore.getState().setCompare(false);
    useMockupStore.getState().patchObjectArt(active, patch);
    onNotice?.(message);
  }
  return <section className="cg-art-assistant" aria-label="Assistente de arte">
    <div className="cg-art-assistant-heading"><Sparkles aria-hidden="true" /><div><strong>Assistente de arte</strong><span>Análise local · você decide o ajuste</span></div></div>
    <div className="cg-art-assistant-metrics">
      <span><strong>{entry.naturalWidth.toLocaleString("pt-BR")} × {entry.naturalHeight.toLocaleString("pt-BR")}</strong> pixels do original</span>
      <span><strong>{entry.vector ? "SVG vetorial" : dpi ? `${Math.round(dpi)} DPI` : "—"}</strong>{entry.vector ? " rasterizado na saída" : " na área atual"}</span>
    </div>
    <p className="cg-art-assistant-preserved"><ShieldCheck aria-hidden="true" />{entry.originalBlob ? "Arquivo original preservado ao salvar o projeto." : "Arte de exemplo gerada no navegador."}</p>
    {profile && <div className="cg-art-assistant-profile"><strong>{profile.label}</strong><p>{profile.hint}</p></div>}
    {!entry.vector && dpi !== null && dpi < 150 && <p className="cg-art-assistant-warning" role="status">Poucos pixels para este tamanho de impressão. Reduza a arte ou use um arquivo maior; filtros não recuperam detalhes ausentes.</p>}
    <p className="cg-art-assistant-fit">{layout.fit === "contain" ? "Encaixe sugerido: arte inteira, sem distorcer ou cortar." : "Encaixe sugerido: preenchimento panorâmico, com possível corte nas bordas."}</p>
    <div className="cg-art-assistant-actions">
      <button type="button" disabled={locked || analysis?.empty} onClick={() => apply(layout, "Enquadramento sugerido aplicado. Use Ctrl+Z para desfazer.")}><Focus aria-hidden="true" />Aplicar enquadramento</button>
      {analysis && <button type="button" disabled={locked || analysis.empty} onClick={() => apply(suggestArtTone(analysis), "Ajuste tonal suave aplicado. O arquivo original continua intacto.")}><Sparkles aria-hidden="true" />Ajuste tonal suave</button>}
      <button type="button" disabled={locked || neutral} onClick={() => apply(NEUTRAL_ADJUSTMENTS, "Cores originais restauradas.")}><Check aria-hidden="true" />Cores originais</button>
      {restore?.id === `${active}:${art.imageId}` && <button type="button" disabled={locked} onClick={() => {
        useMockupStore.getState().setCompare(false);
        useMockupStore.getState().patchObjectArt(active, restore.patch);
        setRestore(null);
        onNotice?.("Última sugestão desfeita.");
      }}><RotateCcw aria-hidden="true" />Desfazer sugestão</button>}
    </div>
    <small>Encaixe e cor são independentes. Para brilho e verniz, use Acabamento da caneca.</small>
  </section>;
}
