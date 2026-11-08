"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Coffee, Download, ImagePlus, Keyboard, Layers, Lightbulb, Move, ShieldCheck, X, Images, Camera, Play, Printer, Save, Search } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { STUDIO_GUIDE_STEPS, type StudioGuideAction } from "@/lib/creative/studio-help";
export type GuideAction = StudioGuideAction;
const icons = { import:ImagePlus, fit:Coffee, material:Coffee, position:Move, scenarios:Images, "close-up":Camera, lighting:Lightbulb, compose:Layers, video:Play, export:Download, print:Printer, save:Save };
const STEPS = STUDIO_GUIDE_STEPS.map((step,index)=>({...step,icon:icons[step.id as keyof typeof icons]??BookOpen,eyebrow:`${String(index+1).padStart(2,"0")} / GUIA PRÁTICO`}));
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export function StudioGuide({ open, onOpenChange, onAction, onShortcuts }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: GuideAction) => void;
  onShortcuts: () => void;
}) {
  const [step, setStep] = useState(0);
  const [query,setQuery]=useState("");
  const filtered=STEPS.map((item,index)=>({item,index})).filter(({item})=>normalize(`${item.title} ${item.description} ${item.tips.join(" ")}`).includes(normalize(query)));
  const current = STEPS[step];
  const Icon = current.icon;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="cg-guide-dialog" showCloseButton={false}>
      <DialogHeader className="cg-guide-heading">
        <span className="cg-guide-kicker"><BookOpen /> GUIA DO STUDIO</span>
        <DialogTitle>Da sua arte a uma apresentação de estúdio.</DialogTitle>
        <DialogDescription>12 tópicos práticos, da importação à impressão. Busque sua dúvida ou escolha uma etapa.</DialogDescription>
      </DialogHeader>
      <label className="cg-guide-search"><Search size={16}/><input aria-label="Buscar no guia do Studio" placeholder="Procure: aproximação, vídeo, salvar, DPI…" value={query} onChange={event=>{setQuery(event.target.value);const match=STEPS.findIndex(item=>normalize(`${item.title} ${item.description} ${item.tips.join(" ")}`).includes(normalize(event.target.value)));if(match>=0)setStep(match);}}/></label>
      <DialogClose className="cg-guide-close" aria-label="Fechar guia"><X /></DialogClose>
      <div className="cg-guide-layout">
        <nav className="cg-guide-nav" aria-label="Etapas do guia">
          {filtered.map(({item,index}) => <button key={item.short} type="button" aria-current={step === index ? "step" : undefined}
            onClick={() => setStep(index)}><span>{String(index + 1).padStart(2, "0")}</span><item.icon /><strong>{item.short}</strong><ArrowRight /></button>)}
          {filtered.length===0&&<p className="cg-hint">Nenhum tópico encontrado. Tente outra palavra.</p>}
        </nav>
        <section className="cg-guide-lesson" aria-live="polite" aria-atomic="true">
          <div className="cg-guide-lesson-icon"><Icon /></div>
          <span className="cg-guide-eyebrow">{current.eyebrow}</span>
          <h3>{current.title}</h3>
          <p>{current.description}</p>
          <ul>{current.tips.map(tip => <li key={tip}><Check /><span>{tip}</span></li>)}</ul>
          <p className="cg-guide-check"><ShieldCheck size={16}/><span><strong>Confira antes de seguir</strong>{current.check}</span></p>
          <button className="cg-guide-action" type="button" onClick={() => { onOpenChange(false); onAction(current.action); }}>
            {current.cta}<ArrowRight />
          </button>
        </section>
      </div>
      <div className="cg-guide-footer">
        <span><ShieldCheck /> Imagens processadas no navegador. Salve uma cópia dos seus projetos.</span>
        <div><button type="button" onClick={() => { onOpenChange(false); onShortcuts(); }}><Keyboard /> Atalhos</button>
          <button type="button" aria-label="Etapa anterior" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft /></button>
          <span>{step + 1} / {STEPS.length}</span>
          <button type="button" aria-label="Próxima etapa" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}><ArrowRight /></button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
