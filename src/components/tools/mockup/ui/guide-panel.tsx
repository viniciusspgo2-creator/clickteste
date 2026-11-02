"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Coffee, Download, ImagePlus, Keyboard, Layers, Lightbulb, Move, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type GuideAction = "upload" | "art" | "finish" | "light" | "move" | "compose" | "export";
const STEPS = [
  { title: "Comece pela sua arte", short: "Importar", icon: ImagePlus, eyebrow: "01 / DO ARQUIVO À CANECA", action: "upload", cta: "Adicionar minha arte",
    description: "Adicione uma imagem, cole com Ctrl+V ou solte o arquivo na área do Studio. Use PNG com transparência quando quiser manter a cor da caneca ao redor da estampa.",
    tips: ["Um arquivo maior oferece mais detalhe; ampliar uma imagem pequena não cria informação nova.", "O ajuste de cor é feito na composição. Seu arquivo de origem não é sobrescrito.", "Confira o tamanho em pixels e a resolução indicada no assistente da arte antes de exportar."],
  },
  { title: "Encaixe sem adivinhar", short: "Ajustar", icon: Coffee, eyebrow: "02 / COMPOSIÇÃO DA ESTAMPA", action: "art", cta: "Abrir ajustes da arte",
    description: "Use Frente, Costas ou 360° completo para posicionar a estampa. O assistente analisa a imagem no seu dispositivo e sugere um encaixe que você pode aplicar e refinar.",
    tips: ["Centrar arte reposiciona a estampa sem alterar o arquivo original.", "A ferramenta A move a arte sobre a superfície; não movimenta a caneca.", "Compare antes/depois dos filtros e use Desfazer quando quiser voltar. Ajustar para cobrir pode cortar bordas; confira a prévia."],
  },
  { title: "Luz que valoriza o verniz", short: "Iluminar", icon: Lightbulb, eyebrow: "03 / ACABAMENTO E ILUMINAÇÃO", action: "finish", cta: "Ajustar verniz da caneca",
    description: "O verniz controla o brilho da superfície. A luz cria os reflexos que revelam esse acabamento. São ajustes diferentes: brilho da arte clareia os pixels, não adiciona verniz.",
    tips: ["Escolha um perfil de acabamento e gire a peça para avaliar o reflexo sobre a estampa e a alça.", "Nitidez do verniz define se a faixa de luz aparece concentrada ou mais difusa.", "Em Luz e sombra, gire o estúdio e ajuste os reflexos. Evite intensidade excessiva que apague detalhes de artes claras."],
  },
  { title: "Cada caneca no seu lugar", short: "Compor", icon: Move, eyebrow: "04 / MOVIMENTO MANUAL", action: "move", cta: "Ativar ferramenta Mover",
    description: "Selecione uma caneca, ative Mover (G) e arraste o próprio corpo da peça para aproximar ou afastar no chão. Use as alças do gizmo para ajustes por eixo.",
    tips: ["Shift + clique seleciona mais de uma caneca. Arrastar uma peça do grupo move a seleção.", "Segure Alt durante o arrasto para suspender o encaixe magnético. Escape cancela o movimento.", "As setas movem com precisão; Shift usa um passo maior. Peças travadas não se movem. Centralizar (F) reenquadra a cena."],
  },
  { title: "Uma ideia, várias perspectivas", short: "Cena", icon: Layers, eyebrow: "05 / CÂMERA E COMPOSIÇÃO", action: "compose", cta: "Abrir composições",
    description: "Comece com uma composição pronta, como Par ou Trio, e depois personalize a posição de cada peça. Frente, Costas e Perspectiva são atalhos de câmera, sem alterar sua arte.",
    tips: ["Girar 360° anima a caneca; Mover cenário (H) ajusta o enquadramento da câmera.", "Duplique uma peça com Ctrl+D e selecione a nova caneca para editar seus detalhes.", "Salve seu projeto no dispositivo. Exporte o projeto portátil se quiser transferi-lo ou manter outra cópia."],
  },
  { title: "Exporte com intenção", short: "Exportar", icon: Download, eyebrow: "06 / SUA APRESENTAÇÃO FINAL", action: "export", cta: "Abrir exportação",
    description: "Escolha as dimensões de saída de acordo com o destino. PNG preserva transparência quando habilitada; JPG é útil quando o fundo já faz parte da composição.",
    tips: ["Mais pixels na exportação não recuperam detalhes que não existem no arquivo enviado.", "Faça uma prévia e confira os textos pequenos, as bordas, a estampa e o enquadramento antes de enviar ao cliente.", "Os recursos do navegador e da GPU limitam a dimensão disponível. Exportações grandes podem levar mais tempo."],
  },
] as const;

export function StudioGuide({ open, onOpenChange, onAction, onShortcuts }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: GuideAction) => void;
  onShortcuts: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="cg-guide-dialog" showCloseButton={false}>
      <DialogHeader className="cg-guide-heading">
        <span className="cg-guide-kicker"><BookOpen /> GUIA DO STUDIO</span>
        <DialogTitle>Da sua arte a uma apresentação de estúdio.</DialogTitle>
        <DialogDescription>Seis passos rápidos. Você escolhe por onde começar.</DialogDescription>
      </DialogHeader>
      <DialogClose className="cg-guide-close" aria-label="Fechar guia"><X /></DialogClose>
      <div className="cg-guide-layout">
        <nav className="cg-guide-nav" aria-label="Etapas do guia">
          {STEPS.map((item, index) => <button key={item.short} type="button" aria-current={step === index ? "step" : undefined}
            onClick={() => setStep(index)}><span>{String(index + 1).padStart(2, "0")}</span><item.icon /><strong>{item.short}</strong><ArrowRight /></button>)}
        </nav>
        <section className="cg-guide-lesson" aria-live="polite" aria-atomic="true">
          <div className="cg-guide-lesson-icon"><Icon /></div>
          <span className="cg-guide-eyebrow">{current.eyebrow}</span>
          <h3>{current.title}</h3>
          <p>{current.description}</p>
          <ul>{current.tips.map(tip => <li key={tip}><Check /><span>{tip}</span></li>)}</ul>
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
