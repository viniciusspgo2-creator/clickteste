'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { useToolsStore } from '@/lib/tools-store';
import type { ReactNode } from 'react';

export function BackToExtrasButton() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);
  return (
    <button
      onClick={() => setActiveTool('extras')}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-90"
      aria-label="Voltar às ferramentas"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}

/* Layout padrão das ferramentas extras */
export function ToolShell({
  title, description, children,
}: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="glass-card rounded-2xl p-5 sm:p-7">{children}</div>
    </div>
  );
}

/* Campo padrão */
export function Field({
  label, id, children, hint,
}: { label: string; id: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={`h-11 ${props.className ?? ''}`} />;
}

export function ResultCard({
  label, value, big = false, tone = 'brand',
}: { label: string; value: string; big?: boolean; tone?: 'brand' | 'green' | 'red' | 'neutral' }) {
  const tones = {
    brand: 'border-primary/40 bg-primary/10 text-primary',
    green: 'border-whats/40 bg-whats/10 text-whats',
    red: 'border-destructive/40 bg-destructive/10 text-destructive',
    neutral: 'border-border bg-secondary/50 text-foreground',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className={`font-display font-bold ${big ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>{value}</p>
    </div>
  );
}

export function SectionBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{title}</p>
      {children}
    </div>
  );
}
