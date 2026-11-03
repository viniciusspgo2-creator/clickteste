'use client';

import { create } from 'zustand';
import { trackPage } from '@/lib/track';

export type ToolId =
  | 'inicio'
  | 'qr'
  | 'whatsapp'
  | 'orcamento'
  | 'contrato'
  | 'pdf'
  | 'imagens'
  | 'mockup'
  | 'extras';

export type ExtraToolId =
  | 'juros-compostos' | 'desconto' | 'salario-liquido' | 'rescisao' | 'precificacao'
  | 'maquininha' | 'energia' | 'cotacao' | 'valor-hora'
  | 'sorteador' | 'regra-de-3' | 'imc-tmb' | 'bhaskara' | 'tempo-download' | 'cep' | 'barcode' | 'base64'
  | 'contador' | 'lorem' | 'narrador' | 'remover-duplicadas' | 'slug' | 'utm'
  | 'paleta' | 'mixer-cores' | 'box-shadow' | 'avatar' | 'aspect-ratio'
  | 'senhas' | 'hash' | 'cpf-cnpj' | 'json' | 'dados-falsos' | 'cidr'
  | 'pomodoro' | 'cronometro'
  | 'tempo-render' | 'vram' | 'unidades-3d'
  | 'comissao-vendas' | 'ponto-equilibrio' | 'parcelamento' | 'margem-lucro' | 'meta-vendas' | 'preco-original'
  | 'dpi-impressao' | 'conversor-medidas-impressao' | 'sangria-impressao' | 'aproveitamento-folha' | 'custo-sublimacao' | 'tempo-prensa' | 'gabarito-caneca' | 'espelhador-sublimacao'
  | 'conversor-cores' | 'contraste-cores' | 'gradiente-css' | 'tamanhos-redes'
  | 'resposta-whatsapp' | 'descricao-produto' | 'bio-instagram' | 'gerador-hashtags' | 'copy-promocao' | 'mensagem-pos-venda'
  | 'maiusculas-minusculas' | 'limpar-texto' | 'localizar-substituir' | 'inverter-texto' | 'html-para-texto'
  | 'json-csv' | 'gerador-uuid' | 'decodificador-jwt'
  | 'prazo-util' | 'checklist-pedido' | 'calculadora-idade';

interface ToolsState {
  activeTool: ToolId;
  activeExtra: ExtraToolId | null;
  extrasCategory: string | null;
  extrasQuery: string;
  qrSeed: string; // texto/URL para pré-preencher o gerador de QR
  setActiveTool: (t: ToolId, qrSeed?: string, opts?: { silent?: boolean }) => void;
  openExtra: (id: ExtraToolId) => void;
  setExtrasCategory: (category: string | null) => void;
  setExtrasQuery: (query: string) => void;
}

/** grava a troca de ferramenta no histórico do navegador (botão voltar funciona) */
function pushHistory(tool: ToolId, extra?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (tool === 'inicio') url.searchParams.delete('tool');
    else url.searchParams.set('tool', tool);
    if (extra) url.searchParams.set('extra', extra);
    else url.searchParams.delete('extra');
    const state = extra ? { tool, extra } : { tool };
    window.history.pushState(state, '', url.toString());
  } catch {
    /* histórico indisponível — segue sem */
  }
}

export const useToolsStore = create<ToolsState>((set) => ({
  activeTool: 'inicio',
  activeExtra: null,
  extrasCategory: null,
  extrasQuery: '',
  qrSeed: '',
  setActiveTool: (t, qrSeed, opts) => {
    if (t !== 'inicio') trackPage(`/ferramenta/${t}`);
    set({
      activeTool: t,
      qrSeed: qrSeed ?? '',
      activeExtra: null,
    });
    // silent = vindo do popstate (o histórico já andou — não empurra de novo)
    if (!opts?.silent) pushHistory(t);
  },
  openExtra: (id) => {
    trackPage(`/ferramentas-mais/${id}`);
    set({ activeTool: 'extras', activeExtra: id });
    pushHistory('extras', id);
  },
  setExtrasCategory: (category) => set({ extrasCategory: category }),
  setExtrasQuery: (query) => set({ extrasQuery: query }),
}));
