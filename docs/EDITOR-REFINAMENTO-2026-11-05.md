# Refinamento incremental do Studio Click — 05/11/2026

## Resultado

- Desagrupar SVG: separação por nível em camadas independentes, grupos internos preservados, histórico, cores, degradês, rotação e espelhamento. Sem extração semântica de personagens fundidos ou raster.
- 44 materiais dos RARs: 39 SVGs editáveis e 5 WebPs. A prancha geométrica gerou 12 objetos separados. Duplicatas foram descartadas; personagens prontos continuam inteiros.
- Ícones: aba e catálogo genérico desativados por `ENABLE_ICONS_TAB=false` em `src/lib/creative/editor-flags.ts`; 1.651 arquivos SVG locais e entradas do mapa retirados. SVGs já salvos nas camadas permanecem embutidos. Nenhum dos 19 ornamentos laranja originais foi removido.
- Objetos: 19 → 38, mantendo paleta e linguagem das categorias existentes. Os objetos brancos eram itens do banco genérico, não objetos originais; IDs retirados estão em `EDITOR-ICONES-REMOVIDOS-2026-11-05.csv`.
- Elementos: 48 formas no total (46 entradas novas além de retângulo/elipse), agrupadas em Básicas, Estrelas e destaques, Setas e linhas, Balões e faixas e Decorativas. Preenchimento, gradiente, contorno, transparência, rotação e proporção usam as propriedades persistidas da camada. Raio para retângulos; pontas/lados para estrelas e polígonos.
- Bézier: mantém o formato antigo e acrescenta caminhos de até 128 pontos, alças, pontos suaves/de canto, abrir/fechar, preenchimento, espessura 0,5–100 px, cap, join, tracejado e espaçamento. Clique cria âncoras, arraste cria alças, Enter confirma e Esc cancela.
- Efeitos: 31 presets adicionais, com miniaturas reais geradas sob demanda pelo mesmo renderizador da arte, intensidade, cor e remoção não destrutiva. Sombras, glow, contornos, metálicos, relevo, extrusão, reflexo e tratamentos de imagem usam o mesmo renderizador no canvas e na exportação. Intermediários limitados em documentos alternativos muito grandes.
- Fontes: amostra com texto selecionado na própria família, busca, categorias, favoritas, recentes, fonte atual, virtualização e carregamento por visibilidade. Hover/foco é temporário; clique confirma e integra o histórico.
- Fundos: os 5.235 padrões/degradês ficam na aba Fundos, junto com as bases anteriores e importação. A Biblioteca oferece um atalho. Busca e filtros por tema/estilo e paleta são mantidos.
- Canvas: painéis laterais recolhíveis, estado local persistido, zoom ajustado pelo ResizeObserver e espaços reduzidos. Interface com fontes 400/500/600, ícones finos, rótulos em uma linha e avisos de sucesso em faixa fora da arte por aproximadamente 4 s. Erros continuam visíveis para leitura.
- Exportação: PNG com 300 DPI no formato padrão e PDF novo com tamanho físico da estampa e imagem a 300 DPI na escala 100%; exportação usa a mesma composição da prévia. Escalas de 50%/200% alteram a resolução, preservando o tamanho físico do PDF.

## Limitações explícitas

1. `ARQUIVOS JUNTOS.rar` excede 32 MiB e não pôde ser transferido. Continua pendente de reenvio em partes menores. `novosss.rar` e `outros.rar`, incluindo os ZIPs internos, foram processados.
2. Os cinco materiais rasterizados não ganham anatomia vetorial. Um deles tinha mais de 5.000 partes/2,5 MB; os outros continham imagens embutidas.
3. Desagrupar não tenta adivinhar semanticamente personagens; separa a estrutura existente, até 200 objetos por operação e 1.000 camadas no documento. Transparência global, máscaras do editor, recortes e efeitos incompatíveis precisam ser removidos antes; a sombra global é removida com aviso e pode ser desfeita.
4. Desfoque do fundo atua na camada de fundo selecionada, preservando as outras camadas. Não segmenta automaticamente uma pessoa dentro da mesma foto. Vidro, metálicos, relevo e reflexo são tratamentos gráficos estilizados; contorno tracejado de imagens é uma aproximação por máscara, não um traçado vetorial reconstituído.
5. Categorias tipográficas de fontes importadas sem metadados de estilo são inferidas pelo nome; nenhuma fonte foi excluída. Direitos de uso das fontes particulares continuam sob responsabilidade de quem as forneceu.
6. Lint dos arquivos do editor sem erros/avisos. Lint global sem erros; permanecem cinco avisos anteriores sobre navegação em `src/components/site/home.tsx`, fora do editor.

## Como reativar os ícones

Mude `ENABLE_ICONS_TAB` para `true`, recompile e publique. O banco legado é importado sob demanda e usa as origens versionadas quando os assets locais não existem. Para empacotar novamente os SVGs locais, execute o script de empacotamento do catálogo. A lógica de Uploads e Importar SVG editável permanece sempre disponível.

## Verificações

- Build de produção com Webpack e TypeScript sem erros. O build Turbopack local ficou preso no sandbox; na Vercel o comando original `npm run build` foi preservado.
- Suíte criativa completa; validação de projetos antigos e novos, limites de mídia, fontes, máscaras, exportação e histórico.
- Navegador: 48 formas, 38 objetos, 31 efeitos; equivalência de pixels entre prévia e PNG; chunk pHYs de 300 DPI; PDF com tamanho físico; criação/edição de pontos; filtros de fundos; persistência dos painéis; ausência de requisições de ícones; layout móvel.
- Navegador: fonte local carregada, amostra personalizada, hover/cancelamento, confirmação, favorita, recentes e salvamento.
- Navegador: desagrupamento, recomposição visual, grupos/degradês, desfazer/refazer, backup, 44 materiais decodificados e 39 SVGs sanitizados e editáveis.

## Arquivos principais

- `creative-editor.tsx`: integração, ferramentas e painéis; mantém rotas e fluxo existentes.
- `shape-library.tsx`, `vector-shapes.ts`, `vector-path.ts`, `curve-handles.tsx`: catálogo, geometria e edição de caminhos.
- `effect-preview.tsx`: miniaturas reais de efeitos, geradas por visibilidade e armazenadas em cache.
- `layer-effects.ts`, `design.ts`: presets e renderização/exportação compartilhada.
- `font-library.tsx`: seletor virtualizado e experiência de escolha de fontes.
- `stock-library.tsx`, `stock-objects.ts`, `legacy-icon-library.tsx`, `editor-flags.ts`: separação dos objetos laranja e banco legado opcional.
- `curated-library.tsx`, `library-manifest.ts`, `library-load.ts`: fundos na aba correta e acervo local carregado sob demanda.
- `svg-ungroup.ts`, `uploaded-library.json`, `bundled-library.json`: desagrupamento e novos materiais dos RARs.
- `validate-project.ts`: validação de novos campos opcionais, preservando documentos antigos.
- `creative.css`: ajustes incrementais de tipografia, espaço, avisos, painéis e responsividade.
- Testes de navegador e testes isolados: dependências de dados atualizadas, fixtures CommonJS renomeadas para satisfazer lint, sem enfraquecer verificações de segurança.

## Lista de arquivos de código/testes/documentação alterados

- `A	docs/rar-svg-ungroup-2026-11-05.md`
- `D	public/creative-library/tabler-catalog.json`
- `M	scripts/bundle-creative-library.mjs`
- `M	src/components/creative/creative-editor.tsx`
- `M	src/components/creative/creative.css`
- `M	src/components/creative/curated-library.tsx`
- `M	src/components/creative/font-library.tsx`
- `A	src/components/creative/legacy-icon-library.tsx`
- `A	src/components/creative/shape-library.tsx`
- `M	src/components/creative/stock-library.tsx`
- `M	src/lib/creative/bundled-library.json`
- `M	src/lib/creative/design.ts`
- `A	src/lib/creative/editor-flags.ts`
- `A	src/lib/creative/layer-effects.ts`
- `M	src/lib/creative/library-load.ts`
- `M	src/lib/creative/library-manifest.ts`
- `M	src/lib/creative/project-media-check.ts`
- `M	src/lib/creative/stock-objects.ts`
- `A	src/lib/creative/svg-ungroup.ts`
- `M	src/lib/creative/typefaces.ts`
- `M	src/lib/creative/uploaded-library.json`
- `M	src/lib/creative/validate-project.ts`
- `A	src/lib/creative/vector-path.ts`
- `A	src/lib/creative/vector-shapes.ts`
- `A	tests/archive-assets-browser.mjs`
- `M	tests/bocao-ux-standalone.mjs`
- `M	tests/creative-precision.mjs`
- `M	tests/helpers/creative-browser-harness.mjs`
- `M	tests/ruler-guides.mjs`
- `A	tests/svg-ungroup-browser.mjs`
- `M	tests/uploaded-library.mjs`
- `M	tests/v38-stability.mjs`
- `M	tests/v39-layers.mjs`
- `M	tests/v42-export-integrity.mjs`
- `M	tests/v44-mask-composition.mjs`
- `M	tests/v45-video-template-preflight.mjs`
- `M	tests/v47-assistant-video-reliability.mjs`
- `M	tests/v48-sublimation-psd-pdf.mjs`
- `M	tests/v49-video-fullhd.mjs`
- `M	tests/v50-video-preflight.mjs`
- `M	tests/v51-mp4-integrity.mjs`
- `M	tests/v510-bounded-image-load.mjs`
- `M	tests/v511-font-video-safety.mjs`
- `M	tests/v512-assistant-end-to-end.mjs`
- `M	tests/v513-assistant-request-timeouts.mjs`
- `M	tests/v514-image-export-dpi.mjs`
- `M	tests/v515-export-boundaries-progress.mjs`
- `M	tests/v516-blob-arraybuffer-types.mjs`
- `M	tests/v517-handle-c-installed-fonts.mjs`
- `M	tests/v53-transparent-handoff.mjs`
- `M	tests/v54-template-safety.mjs`
- `M	tests/v55-portable-project.mjs`
- `M	tests/v60-editor-canvas-tabs-tools.mjs`
- `M	tests/v61-curated-library.mjs`
- `src/components/creative/curve-handles.tsx`
- `tests/editor-refinements-browser.mjs`
- `tests/font-preview-browser.mjs`
