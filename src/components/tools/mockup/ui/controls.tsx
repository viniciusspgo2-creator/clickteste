/* ============================================================
   Widgets de painel — sliders com valor digitável + reset por
   duplo clique, cores, segmentados, toggles, seções acordeão.
   ============================================================ */

"use client";

import { useId, useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Seção acordeão ---------------- */

export function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div className="cg-control-section overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
        aria-expanded={open}
        aria-controls={contentId}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="flex-1 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-300">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-neutral-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div id={contentId} className="space-y-3.5 px-3 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ---------------- Slider com valor + reset ---------------- */

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  defaultValue,
  disabled,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  defaultValue?: number;
  disabled?: boolean;
  hint?: string;
}) {
  const id = useId();
  const safeValue = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  const changed = defaultValue !== undefined && Math.abs(safeValue - defaultValue) > step / 2;
  const setValue = (v: number) => {
    if (!disabled && Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
  };
  return (
    <fieldset className="cg-slider-control" disabled={disabled} aria-describedby={hint ? `${id}-hint` : undefined}>
      <div className="cg-slider-heading">
        <label htmlFor={id}>{label}</label>
        {defaultValue !== undefined && <button type="button" className="cg-control-reset"
          aria-label={`Restaurar ${label.toLowerCase()}`} title={`Restaurar: ${format ? format(defaultValue) : defaultValue}`}
          disabled={disabled || !changed} onClick={() => setValue(defaultValue)}><RotateCcw /></button>}
        <input
          aria-label={`${label}: valor numérico`}
          type="number"
          value={Math.round(safeValue * 1000) / 1000}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setValue(v);
          }}
          disabled={disabled}
          className="cg-control-value"
        />
      </div>
      <input
        id={id}
        type="range"
        value={safeValue}
        min={min}
        max={max}
        step={step}
        onChange={e => setValue(e.target.valueAsNumber)}
        aria-valuetext={format ? format(safeValue) : undefined}
        disabled={disabled}
        className="cg-control-range"
        style={{ "--cg-range-progress": `${max === min ? 0 : (safeValue - min) / (max - min) * 100}%` } as React.CSSProperties}
      />
      {(format || hint) && <div className="cg-slider-caption">{hint && <p id={`${id}-hint`}>{hint}</p>}{format && <output htmlFor={id}>{format(safeValue)}</output>}</div>}
    </fieldset>
  );
}

/* ---------------- Cor ---------------- */

export function ColorRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-neutral-400">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className="w-20 rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[13px] uppercase text-neutral-200 outline-none focus:border-primary/60"
        />
        <label
          className="relative h-7 w-9 cursor-pointer overflow-hidden rounded-md border border-white/15"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            disabled={disabled}
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
      </div>
    </div>
  );
}

/* ---------------- Segmentado ---------------- */

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      {label && (
        <p className="mb-1.5 text-[13px] font-medium text-neutral-400">
          {label}
        </p>
      )}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[13px] font-semibold transition-all",
              value === o.value
                ? "bg-primary text-[#1d130d] shadow-sm"
                : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Toggle ---------------- */

export function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-2 py-0.5"
    >
      <span className="text-[13px] font-medium text-neutral-400">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

/* ---------------- Botões de ação ---------------- */

export function MiniButton({
  children,
  onClick,
  active,
  className,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      title={title}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition-all active:scale-95",
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] shadow-[0_8px_24px_-8px_rgba(232,112,58,0.7)] transition-transform hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
