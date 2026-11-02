"use client";

import { Coffee } from "lucide-react";
import { useMockupStore } from "../state/store";
import { Section } from "./controls";
import { HANDLE_STYLES } from "../lib/handle-styles";

export function HandleControls({ active }: { active: string }) {
  const st = useMockupStore();
  const piece = active === "hero" ? st.mug : st.companions.find(c => c.id === active);
  if (!piece) return null;
  const style = piece.handleStyle ?? st.mug.handleStyle;
  return <Section title="Modelo da alça" icon={Coffee} defaultOpen>
    <div className="cg-handle-choices" role="group" aria-label="Escolher modelo de alça">
      {HANDLE_STYLES.map(({ id, label, description, path, color }) => <button type="button" key={id}
        disabled={!!piece.locked} aria-pressed={style === id}
        onClick={() => {
          st.patchObject(active, { handleStyle: id, ...(id !== 'classic' && id !== 'rounded' ? { handleColor: color } : {}) });
          if (style !== id) st.frameAll();
        }}>
        <svg viewBox="0 0 80 72" aria-hidden="true" fill="none">
          <path d="M21 8v56" stroke="currentColor" strokeWidth="3" opacity=".25" />
          <path d={path}
            stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          {id === 'spoon' && <><path d="M28 12v53" stroke="currentColor" strokeWidth="4"/><ellipse cx="28" cy="8" rx="6" ry="9" fill="currentColor"/></>}
        </svg>
        <strong>{label}</strong>
        <small>{description}</small>
      </button>)}
    </div>
    <p className="cg-hint">Alça em 3D com acabamento de cerâmica. A escolha vale somente para esta caneca.</p>
  </Section>;
}
