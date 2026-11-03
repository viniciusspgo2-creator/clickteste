"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import type { MugState } from "../state/store";
import { CERAMIC_FINISHES, ceramicFinishValues, type CeramicFinish } from "../lib/ceramic-finishes";
import { SliderRow } from "./controls";

export function CeramicFinishControls({ mug, onChange, onApplyAll, disabled }: {
  mug: Partial<MugState>;
  onChange: (values: CeramicFinish | Partial<CeramicFinish>) => void;
  onApplyAll?: (values: CeramicFinish) => void;
  disabled?: boolean;
}) {
  const values = ceramicFinishValues(mug);
  const defaults = ceramicFinishValues({});
  const currentFinish = CERAMIC_FINISHES.find(finish => Object.entries(finish.values).every(([key, value]) => Math.abs(values[key as keyof CeramicFinish]! - value) < 0.001));
  const percent = (v: number) => `${Math.round(v * 100)}%`;
  return <fieldset disabled={disabled} className="cg-finish-controls">
    <legend><Sparkles /> Verniz de estúdio</legend>
    <p className="cg-finish-intro">O acabamento muda os reflexos sobre a cerâmica e a estampa. Escolha um perfil e refine a luz na cena.</p>
    <div className="cg-finish-presets">
      {CERAMIC_FINISHES.map(finish => <button key={finish.id} type="button" title={finish.description}
        aria-pressed={Object.entries(finish.values).every(([key, value]) => Math.abs(values[key as keyof CeramicFinish]! - value) < 0.001)}
        onClick={() => onChange(finish.values)}>{finish.label}</button>)}
    </div>
    <div className="cg-finish-profile"><span>{currentFinish?.label ?? "Personalizado"}</span><p>{currentFinish?.description ?? "Seu ajuste de brilho e polimento."}</p></div>
    <SliderRow label="Intensidade do verniz" min={0} max={3} step={0.05}
      value={values.glazeStrength!} onChange={glazeStrength => onChange({ glazeStrength })} defaultValue={defaults.glazeStrength!} format={percent} />
    <SliderRow label="Nitidez do verniz" min={0} max={1} step={0.01}
      value={1 - values.clearcoatRoughness!} onChange={v => onChange({ clearcoatRoughness: 1 - v })} defaultValue={1 - defaults.clearcoatRoughness!} format={percent} hint="Mais nítido: faixas de luz definidas. Menos: brilho difuso." />
    <SliderRow label="Camada de verniz" min={0} max={1} step={0.01}
      value={values.clearcoat} onChange={clearcoat => onChange({ clearcoat })} defaultValue={defaults.clearcoat} format={percent} />
    <SliderRow label="Polimento da cerâmica" min={0} max={0.99} step={0.01}
      value={1 - values.roughness} onChange={v => onChange({ roughness: 1 - v })} defaultValue={1 - defaults.roughness} format={percent} />
    <SliderRow label="Intensidade dos reflexos" min={0} max={3} step={0.05}
      value={values.reflection} onChange={reflection => onChange({ reflection })} defaultValue={defaults.reflection} format={percent} />
    <SliderRow label="Reflexo da cerâmica" min={0} max={1} step={0.01}
      value={values.specularIntensity!} onChange={specularIntensity => onChange({ specularIntensity })} defaultValue={defaults.specularIntensity!} format={percent} />
    <button className="cg-apply-finish" type="button" onClick={() => onChange(defaults)}><RotateCcw /> Restaurar acabamento de estúdio</button>
    <p>Gire a caneca para conferir os reflexos. Ajustes de cor da arte ficam em um painel separado.</p>
    {onApplyAll && <button className="cg-apply-finish" type="button" onClick={() => onApplyAll(values)}>Aplicar acabamento a todas</button>}
  </fieldset>;
}
