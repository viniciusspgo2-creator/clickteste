'use client';

import type { ExtraToolId, ToolId } from '@/lib/tools-store';
import {
  JurosCompostosTool, DescontoTool, SalarioLiquidoTool, RescisaoTool, MaquininhaTool, EnergiaTool, CotacaoTool, ValorHoraTool, PrecificacaoTool,
} from './finance';
import { SorteadorTool, RegraTresTool, ImcTmbTool, BhaskaraTool, TempoDownloadTool, CepTool, BarcodeTool, Base64Tool } from './utilities';
import { ContadorTool, LoremTool, NarradorTool, DuplicadasTool, SlugTool, UtmTool } from './text';
import { PaletaTool, MixerCoresTool, BoxShadowTool, AvatarTool, AspectRatioTool } from './design';
import { SenhasTool, HashTool, CpfCnpjTool, JsonTool, DadosFalsosTool, CidrTool } from './dev';
import { PomodoroTool, CronometroTool, TempoRenderTool, VramTool, Unidades3dTool } from './productivity';
import { ExpandedTool, EspelhadorTool, ChecklistPedidoTool } from './expanded';

import {
  TrendingUp, Percent, Wallet, FileSpreadsheet, CreditCard, Zap, DollarSign, Clock, Calculator,
  Dices, Divide, HeartPulse, Radical, Wifi, MapPin, Barcode, FileJson2,
  Type, FileText, Volume2, ListX, Link2, ChartLine, Coffee,
  Palette, Droplets, Square, UserCircle, Ratio,
  KeyRound, Hash, IdCard, Braces, Users, Network,
  Timer, AlarmClock, Box, MemoryStick, Ruler,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ExtraCategory =
  | 'financas' | 'utilitarios' | 'texto' | 'marketing'
  | 'design' | 'seguranca' | 'dev' | 'produtividade' | '3d' | 'sublimacao';

export const CATEGORY_META: { id: ExtraCategory; label: string; icon: LucideIcon; cor: string }[] = [
  { id: 'financas', label: 'Finanças', icon: DollarSign, cor: '#e8703a' },
  { id: 'utilitarios', label: 'Utilitários', icon: Wifi, cor: '#25d366' },
  { id: 'texto', label: 'Texto', icon: Type, cor: '#f2b56b' },
  { id: 'marketing', label: 'Marketing', icon: ChartLine, cor: '#e8703a' },
  { id: 'design', label: 'Design', icon: Palette, cor: '#ffab7e' },
  { id: 'seguranca', label: 'Segurança', icon: KeyRound, cor: '#25d366' },
  { id: 'dev', label: 'Dev', icon: Braces, cor: '#f2b56b' },
  { id: 'produtividade', label: 'Produtividade', icon: Timer, cor: '#e8703a' },
  { id: '3d', label: '3D', icon: Box, cor: '#ffab7e' },
  { id: 'sublimacao', label: 'Sublimação', icon: Ruler, cor: '#a98bfa' },
];

export interface ExtraToolDef {
  id: ExtraToolId;
  category: ExtraCategory;
  title: string;
  desc: string;
  icon: LucideIcon;
  Component: React.ComponentType;
}

export const EXTRA_TOOLS: ExtraToolDef[] = [
  // ===== FINANÇAS =====
  { id: 'juros-compostos', category: 'financas', title: 'Juros Compostos', desc: 'Simule investimentos com aportes mensais e veja o gráfico da evolução', icon: TrendingUp, Component: JurosCompostosTool },
  { id: 'desconto', category: 'financas', title: 'Calculadora de Desconto', desc: 'Preço final, economia e alerta de promoções enganosas', icon: Percent, Component: DescontoTool },
  { id: 'salario-liquido', category: 'financas', title: 'Salário Líquido CLT', desc: 'INSS + IRRF (tabelas 2025), dependentes e outros descontos', icon: Wallet, Component: SalarioLiquidoTool },
  { id: 'rescisao', category: 'financas', title: 'Rescisão Trabalhista', desc: 'Saldo, férias, 13º, aviso prévio e multa do FGTS estimados', icon: FileSpreadsheet, Component: RescisaoTool },
  { id: 'maquininha', category: 'financas', title: 'Taxas de Maquininha', desc: 'Valor líquido e quanto cobrar embutindo a taxa da máquina', icon: CreditCard, Component: MaquininhaTool },
  { id: 'energia', category: 'financas', title: 'Consumo de Energia', desc: 'Custo mensal e anual de qualquer aparelho da casa', icon: Zap, Component: EnergiaTool },
  { id: 'cotacao', category: 'financas', title: 'Cotação ao Vivo', desc: 'Dólar, Euro e Bitcoin para Real com cotação atualizada', icon: DollarSign, Component: CotacaoTool },
  { id: 'valor-hora', category: 'financas', title: 'Valor-Hora Freelancer', desc: 'Quanto cobrar por hora considerando custos e impostos', icon: Clock, Component: ValorHoraTool },
  { id: 'precificacao', category: 'financas', title: 'Precificador de Produtos e Serviços', desc: 'Calcule custo unitário, taxas e preço de venda com a margem desejada', icon: Calculator, Component: PrecificacaoTool },

  // ===== UTILITÁRIOS =====
  { id: 'sorteador', category: 'utilitarios', title: 'Sorteador', desc: 'Números aleatórios ou sorteio justo de nomes com animação', icon: Dices, Component: SorteadorTool },
  { id: 'regra-de-3', category: 'utilitarios', title: 'Regra de 3', desc: 'Encontre o 4º valor de qualquer proporção instantaneamente', icon: Divide, Component: RegraTresTool },
  { id: 'imc-tmb', category: 'utilitarios', title: 'IMC + TMB', desc: 'Índice de massa corporal e calorias diárias para manter ou emagrecer', icon: HeartPulse, Component: ImcTmbTool },
  { id: 'bhaskara', category: 'utilitarios', title: 'Equação do 2º Grau', desc: 'Delta, x₁ e x₂ com fórmula de Bhaskara passo a passo', icon: Radical, Component: BhaskaraTool },
  { id: 'tempo-download', category: 'utilitarios', title: 'Tempo de Download', desc: 'Quanto tempo real leva para baixar um arquivo pela sua internet', icon: Wifi, Component: TempoDownloadTool },
  { id: 'cep', category: 'utilitarios', title: 'Consultor de CEP', desc: 'Endereço completo, cidade, UF e DDD pelo ViaCEP', icon: MapPin, Component: CepTool },
  { id: 'barcode', category: 'utilitarios', title: 'Código de Barras', desc: 'CODE128, EAN-13, EAN-8, UPC e ITF-14 em PNG de alta resolução', icon: Barcode, Component: BarcodeTool },
  { id: 'base64', category: 'utilitarios', title: 'Conversor Base64', desc: 'Texto ↔ Base64 e Imagem ↔ Base64 com prévia e cópia rápida', icon: FileJson2, Component: Base64Tool },

  // ===== TEXTO =====
  { id: 'contador', category: 'texto', title: 'Contador de Palavras', desc: 'Caracteres, palavras, frases e tempo de leitura ao vivo', icon: Type, Component: ContadorTool },
  { id: 'lorem', category: 'texto', title: 'Lorem Ipsum', desc: 'Texto fictício em parágrafos, frases ou palavras para protótipos', icon: FileText, Component: LoremTool },
  { id: 'narrador', category: 'texto', title: 'Narrador Digital', desc: 'Ouça qualquer texto com vozes neurais do seu próprio navegador', icon: Volume2, Component: NarradorTool },
  { id: 'remover-duplicadas', category: 'texto', title: 'Remover Duplicadas', desc: 'Limpe listas gigantes removendo linhas repetidas', icon: ListX, Component: DuplicadasTool },
  { id: 'slug', category: 'texto', title: 'Gerador de Slug', desc: 'URLs limpas e otimizadas para SEO a partir de qualquer título', icon: Link2, Component: SlugTool },

  // ===== MARKETING =====
  { id: 'utm', category: 'marketing', title: 'Construtor UTM', desc: 'Links rastreáveis para Google Analytics, Meta Ads e campanhas', icon: ChartLine, Component: UtmTool },

  // ===== DESIGN =====
  { id: 'paleta', category: 'design', title: 'Paleta de Cores de Imagem', desc: 'Extraia as cores dominantes de qualquer foto com um clique', icon: Palette, Component: PaletaTool },
  { id: 'mixer-cores', category: 'design', title: 'Mixer de Cores', desc: 'Misture de 2 a 6 cores e descubra HEX, RGB e contraste', icon: Droplets, Component: MixerCoresTool },
  { id: 'box-shadow', category: 'design', title: 'Box Shadow CSS', desc: 'Sombras profissionais com preview ao vivo e código pronto', icon: Square, Component: BoxShadowTool },
  { id: 'avatar', category: 'design', title: 'Gerador de Avatares', desc: 'Avatares geométricos únicos e determinísticos por nome', icon: UserCircle, Component: AvatarTool },
  { id: 'aspect-ratio', category: 'design', title: 'Aspect Ratio', desc: 'Redimensione imagens e vídeos mantendo a proporção perfeita', icon: Ratio, Component: AspectRatioTool },

  // ===== SEGURANÇA =====
  { id: 'senhas', category: 'seguranca', title: 'Gerador de Senhas', desc: 'Senhas com crypto API, medidor de força e tempo de quebra', icon: KeyRound, Component: SenhasTool },
  { id: 'hash', category: 'seguranca', title: 'Gerador de Hash', desc: 'MD5, SHA-1, SHA-256, SHA-384 e SHA-512 no navegador', icon: Hash, Component: HashTool },

  // ===== DEV =====
  { id: 'cpf-cnpj', category: 'dev', title: 'Gerador de CPF/CNPJ', desc: 'Números válidos para testar validações e cadastros de sistemas', icon: IdCard, Component: CpfCnpjTool },
  { id: 'json', category: 'dev', title: 'Formatador JSON', desc: 'Valide, embeleze ou minifique JSON com estatísticas', icon: Braces, Component: JsonTool },
  { id: 'dados-falsos', category: 'dev', title: 'Dados Falsos BR', desc: 'Perfis brasileiros completos para popular bancos e testes', icon: Users, Component: DadosFalsosTool },
  { id: 'cidr', category: 'dev', title: 'IP / CIDR Calculator', desc: 'Máscara, faixa de hosts, broadcast e classe de qualquer IPv4', icon: Network, Component: CidrTool },

  // ===== PRODUTIVIDADE =====
  { id: 'pomodoro', category: 'produtividade', title: 'Timer Pomodoro', desc: 'Foco com ciclos animados, confete e contador de pomodoros', icon: Timer, Component: PomodoroTool },
  { id: 'cronometro', category: 'produtividade', title: 'Cronômetro', desc: 'Centésimos de precisão com registro de voltas', icon: AlarmClock, Component: CronometroTool },

  // ===== 3D =====
  { id: 'tempo-render', category: '3d', title: 'Tempo de Render', desc: 'Prazo e custo de renderização por frames e máquinas', icon: Box, Component: TempoRenderTool },
  { id: 'vram', category: '3d', title: 'VRAM de Texturas', desc: 'Consumo de memória de vídeo das suas texturas em segundos', icon: MemoryStick, Component: VramTool },
  { id: 'unidades-3d', category: '3d', title: 'Conversor de Unidades 3D', desc: 'Blender, ZBrush, UE5, Unity e CAD para o mundo real', icon: Ruler, Component: Unidades3dTool },

  // ===== NEGÓCIOS & PRODUÇÃO — novos utilitários =====
  { id: 'comissao-vendas', category: 'financas', title: 'Calculadora de Comissão', desc: 'Comissão por venda e total do período', icon: DollarSign, Component: ExpandedTool },
  { id: 'ponto-equilibrio', category: 'financas', title: 'Ponto de Equilíbrio', desc: 'Quantas vendas pagam seus custos fixos', icon: Calculator, Component: ExpandedTool },
  { id: 'parcelamento', category: 'financas', title: 'Simulador de Parcelamento', desc: 'Parcela, total pago e juros estimados', icon: CreditCard, Component: ExpandedTool },
  { id: 'margem-lucro', category: 'financas', title: 'Margem & Markup', desc: 'Entenda seu lucro e a margem sobre o preço', icon: TrendingUp, Component: ExpandedTool },
  { id: 'meta-vendas', category: 'financas', title: 'Meta de Vendas', desc: 'Vendas e contatos necessários para sua meta', icon: TrendingUp, Component: ExpandedTool },
  { id: 'preco-original', category: 'financas', title: 'Preço antes do Desconto', desc: 'Recalcule preço original e economia da oferta', icon: Percent, Component: ExpandedTool },

  { id: 'dpi-impressao', category: 'sublimacao', title: 'DPI de Impressão', desc: 'Confira a resolução efetiva no tamanho final', icon: Ruler, Component: ExpandedTool },
  { id: 'conversor-medidas-impressao', category: 'sublimacao', title: 'Medidas para Impressão', desc: 'Converta centímetros, milímetros e polegadas', icon: Ruler, Component: ExpandedTool },
  { id: 'sangria-impressao', category: 'sublimacao', title: 'Calculadora de Sangria', desc: 'Prepare sangria e margem segura da arte', icon: FileSpreadsheet, Component: ExpandedTool },
  { id: 'aproveitamento-folha', category: 'sublimacao', title: 'Aproveitamento de Folha', desc: 'Estime quantas peças cabem por folha', icon: Box, Component: ExpandedTool },
  { id: 'custo-sublimacao', category: 'sublimacao', title: 'Custo por Impressão', desc: 'Some tinta, papel, energia e outros insumos', icon: Calculator, Component: ExpandedTool },
  { id: 'tempo-prensa', category: 'sublimacao', title: 'Planejador de Prensa', desc: 'Preveja tempo de produção por lote', icon: Clock, Component: ExpandedTool },
  { id: 'gabarito-caneca', category: 'sublimacao', title: 'Gabarito de Caneca', desc: 'Área segura e resolução sugerida da estampa', icon: Coffee, Component: ExpandedTool },
  { id: 'espelhador-sublimacao', category: 'sublimacao', title: 'Espelhar Arte para Sublimação', desc: 'Inverta e baixe sua arte para impressão', icon: Ratio, Component: EspelhadorTool },

  { id: 'conversor-cores', category: 'design', title: 'Conversor de Cores', desc: 'Converta cores HEX, RGB e HSL', icon: Palette, Component: ExpandedTool },
  { id: 'contraste-cores', category: 'design', title: 'Verificador de Contraste', desc: 'Avalie legibilidade de pares de cores (WCAG)', icon: Palette, Component: ExpandedTool },
  { id: 'gradiente-css', category: 'design', title: 'Gerador de Gradiente CSS', desc: 'Crie gradientes e copie o código CSS', icon: Droplets, Component: ExpandedTool },
  { id: 'tamanhos-redes', category: 'design', title: 'Tamanhos para Redes', desc: 'Dimensões rápidas para posts, stories e capas', icon: Ratio, Component: ExpandedTool },

  { id: 'resposta-whatsapp', category: 'marketing', title: 'Respostas para WhatsApp', desc: 'Mensagens prontas para etapas do atendimento', icon: Volume2, Component: ExpandedTool },
  { id: 'descricao-produto', category: 'marketing', title: 'Descrição de Produto', desc: 'Estruture textos claros para catálogo e loja', icon: FileText, Component: ExpandedTool },
  { id: 'bio-instagram', category: 'marketing', title: 'Bio para Instagram', desc: 'Monte uma bio objetiva com chamada para ação', icon: UserCircle, Component: ExpandedTool },
  { id: 'gerador-hashtags', category: 'marketing', title: 'Ideias de Hashtags', desc: 'Gere tags organizadas a partir de palavras-chave', icon: Hash, Component: ExpandedTool },
  { id: 'copy-promocao', category: 'marketing', title: 'Texto de Promoção', desc: 'Monte uma chamada com oferta, prazo e CTA', icon: Percent, Component: ExpandedTool },
  { id: 'mensagem-pos-venda', category: 'marketing', title: 'Mensagem de Pós-venda', desc: 'Agradeça e peça feedback após a entrega', icon: FileText, Component: ExpandedTool },

  { id: 'maiusculas-minusculas', category: 'texto', title: 'Conversor de Maiúsculas', desc: 'Altere caixa e formato de títulos rapidamente', icon: Type, Component: ExpandedTool },
  { id: 'limpar-texto', category: 'texto', title: 'Limpar Espaços e Quebras', desc: 'Normalize espaços e remova linhas vazias', icon: FileText, Component: ExpandedTool },
  { id: 'localizar-substituir', category: 'texto', title: 'Localizar e Substituir', desc: 'Troque termos em textos de forma rápida', icon: FileText, Component: ExpandedTool },
  { id: 'inverter-texto', category: 'texto', title: 'Inverter Texto', desc: 'Inverta caracteres, palavras ou linhas', icon: Type, Component: ExpandedTool },
  { id: 'html-para-texto', category: 'texto', title: 'HTML para Texto', desc: 'Extraia o conteúdo textual de trechos HTML', icon: FileText, Component: ExpandedTool },

  { id: 'json-csv', category: 'dev', title: 'Conversor JSON para CSV', desc: 'Exporte dados de objetos JSON como CSV', icon: Braces, Component: ExpandedTool },
  { id: 'gerador-uuid', category: 'dev', title: 'Gerador de UUID', desc: 'Crie identificadores aleatórios no navegador', icon: Hash, Component: ExpandedTool },
  { id: 'decodificador-jwt', category: 'dev', title: 'Decodificador JWT', desc: 'Inspecione o payload localmente, sem validar assinatura', icon: Braces, Component: ExpandedTool },

  { id: 'prazo-util', category: 'produtividade', title: 'Calculadora de Dias Úteis', desc: 'Estime prazos comerciais sem contar fins de semana', icon: Clock, Component: ExpandedTool },
  { id: 'checklist-pedido', category: 'produtividade', title: 'Checklist de Pedido', desc: 'Acompanhe etapas de produção e acabamento', icon: FileSpreadsheet, Component: ChecklistPedidoTool },
  { id: 'calculadora-idade', category: 'utilitarios', title: 'Calculadora de Idade', desc: 'Calcule idade em anos, meses e dias', icon: Clock, Component: ExpandedTool },
];

export function getExtraTool(id: ExtraToolId | null): ExtraToolDef | undefined {
  return EXTRA_TOOLS.find((t) => t.id === id);
}

export type { ToolId };
