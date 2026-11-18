"use client";
import { useState } from "react";
import { Check, Frame, SlidersHorizontal } from "lucide-react";
import { useMockupStore } from "../state/store";
import { EXPORT_RATIOS } from "../lib/config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const RATIO_NAMES: Record<string, string> = {
  sq: "Feed quadrado",
  portrait: "Retrato",
  story: "Story / Reels",
  wide: "Paisagem",
  pinterest: "Pinterest",
  "4k": "Ultra HD 4K",
  catalog: "Catálogo",
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectLabel(w: number, h: number): string {
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

/** Seletor de tamanho da saída: botões com o formato e as dimensões,
 * em vez do dropdown minúsculo. Trocar o tamanho reenquadra a caneca
 * e o quadro do cenário juntos (o store dispara o fit). */
export function OutputFormatControl() {
  const st = useMockupStore();
  const es = st.exportSettings;
  const [open, setOpen] = useState(false);
  const ratio = EXPORT_RATIOS.find((r) => r.id === es.ratioId);
  const isCustom = !ratio;
  const w = isCustom ? es.customW : ratio!.w;
  const h = isCustom ? es.customH : ratio!.h;
  const label = isCustom
    ? `Personalizado · ${w}×${h}`
    : `${aspectLabel(w, h)} · ${w}×${h}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Tamanho da saída"
          title="Tamanho da saída — muda o tamanho do arquivo final e o quadro do cenário acompanha"
          className="flex items-center gap-1.5 rounded border bg-background px-2 py-1 text-xs text-foreground hover:border-primary/60"
        >
          <Frame className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-medium">Tamanho da saída</span>
          <span className="text-neutral-400">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[340px] max-w-[calc(100vw-2rem)]"
      >
        <p className="text-sm font-semibold">Tamanho da saída</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          Muda o tamanho do arquivo final — o quadro do cenário e a caneca
          se ajustam juntos.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {EXPORT_RATIOS.map((r) => {
            const active = !isCustom && es.ratioId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  st.setExport({ ratioId: r.id, scale: 1 });
                  setOpen(false);
                }}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors hover:border-primary/60",
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary/60"
                    : "border-white/10",
                )}
              >
                <span className="flex h-10 w-12 shrink-0 items-center justify-center">
                  <span
                    style={{ aspectRatio: `${r.w} / ${r.h}`, height: 40 }}
                    className="rounded-sm border-2 border-primary/70 bg-primary/20"
                  />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-xs font-semibold">
                    {RATIO_NAMES[r.id] ?? r.id}
                    {active && <Check className="h-3 w-3 text-primary" />}
                  </span>
                  <span className="block text-[11px] text-neutral-400">
                    {aspectLabel(r.w, r.h)} · {r.w}×{r.h}
                  </span>
                </span>
              </button>
            );
          })}
          {isCustom && (
            <button
              type="button"
              onClick={() => {
                st.setExportOpen(true);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-lg border border-primary bg-primary/10 p-2 text-left ring-1 ring-primary/60 transition-colors hover:border-primary/60"
            >
              <span className="flex h-10 w-12 shrink-0 items-center justify-center">
                <span
                  style={{ aspectRatio: `${w} / ${h}`, height: 40 }}
                  className="rounded-sm border-2 border-primary/70 bg-primary/20"
                />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-xs font-semibold">
                  Personalizado
                  <Check className="h-3 w-3 text-primary" />
                </span>
                <span className="block text-[11px] text-neutral-400">
                  {aspectLabel(w, h)} · {w}×{h}
                </span>
              </span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            st.setExportOpen(true);
            setOpen(false);
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-xs font-medium hover:border-primary/60"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Personalizado… (outro tamanho)
        </button>
        <p className="mt-2 text-[11px] leading-snug text-neutral-500">
          Escolher um cenário ajusta a saída para o tamanho da imagem dele.
        </p>
      </PopoverContent>
    </Popover>
  );
}
