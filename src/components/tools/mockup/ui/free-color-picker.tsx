"use client";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HSV,
} from "../lib/ceramic-colors";

export function FreeColorPicker({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const id = useId(),
    hex = normalizeHexColor(value) ?? "#ffffff";
  const [selection, setSelection] = useState(() => ({
    hex,
    hsv: hexToHsv(hex),
  }));
  const [draft, setDraft] = useState(() => ({ source: hex, text: hex }));
  const pointer = useRef<number | null>(null);
  // Remember hue/saturation while selecting white or black, whose RGB loses them.
  const hsv =
    selection.hex === hex ? selection.hsv : hexToHsv(hex, selection.hsv.h);
  const text = draft.source === hex ? draft.text : hex;
  function emit(next: HSV) {
    if (disabled) return;
    const color = hsvToHex(next);
    setSelection({ hex: color, hsv: next });
    setDraft({ source: color, text: color });
    onChange(color);
  }
  function pick(e: PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    emit({
      ...hsv,
      s: Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)),
      ),
      v:
        1 -
        Math.max(
          0,
          Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)),
        ),
    });
  }
  function key(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.1 : 0.01;
    const changes: Record<string, HSV> = {
      ArrowLeft: { ...hsv, s: Math.max(0, hsv.s - step) },
      ArrowRight: { ...hsv, s: Math.min(1, hsv.s + step) },
      ArrowUp: { ...hsv, v: Math.min(1, hsv.v + step) },
      ArrowDown: { ...hsv, v: Math.max(0, hsv.v - step) },
      Home: { ...hsv, s: 0, v: 1 },
      End: { ...hsv, v: 0 },
    };
    if (changes[e.key]) {
      e.preventDefault();
      emit(changes[e.key]);
    }
  }
  return (
    <fieldset className="cg-free-color" disabled={disabled}>
      <legend>{label} · personalizada</legend>
      <div
        className="cg-free-color-plane"
        role="group"
        aria-label={`Escolher ${label.toLowerCase()} arrastando`}
        aria-describedby={`${id}-help`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        onPointerDown={(e) => {
          if (disabled || pointer.current !== null) return;
          e.preventDefault();
          pointer.current = e.pointerId;
          e.currentTarget.focus();
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (pointer.current === e.pointerId) pick(e);
        }}
        onPointerUp={(e) => {
          if (pointer.current === e.pointerId) pointer.current = null;
        }}
        onPointerCancel={(e) => {
          if (pointer.current === e.pointerId) pointer.current = null;
        }}
        onLostPointerCapture={(e) => {
          if (pointer.current === e.pointerId) pointer.current = null;
        }}
        onKeyDown={key}
      >
        <span
          className="cg-free-color-thumb"
          aria-hidden="true"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: hex,
          }}
        />
      </div>
      <span id={`${id}-help`} className="sr-only">
        Arraste para ajustar a saturação e o brilho. No teclado, use esquerda e
        direita para saturação, cima e baixo para brilho. Shift faz ajustes
        maiores.
      </span>
      <label className="cg-free-color-hue" htmlFor={`${id}-hue`}>
        <span>
          Tonalidade<output>{Math.round(hsv.h)}°</output>
        </span>
        <input
          id={`${id}-hue`}
          aria-label={`Tonalidade — ${label.toLowerCase()}`}
          type="range"
          min="0"
          max="360"
          step="1"
          value={hsv.h}
          onChange={(e) => emit({ ...hsv, h: Number(e.target.value) })}
        />
      </label>
      <div className="cg-free-color-value">
        <span
          className="cg-free-color-preview"
          style={{ background: hex }}
          aria-hidden="true"
        />
        <label htmlFor={`${id}-hex`}>HEX</label>
        <input
          id={`${id}-hex`}
          aria-label={`Código HEX — ${label.toLowerCase()}`}
          type="text"
          value={text}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          onChange={(e) => {
            const next = e.target.value;
            setDraft({ source: hex, text: next });
            const valid = normalizeHexColor(next);
            if (valid) emit(hexToHsv(valid, hsv.h));
          }}
          onBlur={() => setDraft({ source: hex, text: hex })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <p className="cg-free-color-tip">
        Arraste na área acima e ajuste a tonalidade para encontrar qualquer cor.
      </p>
    </fieldset>
  );
}
