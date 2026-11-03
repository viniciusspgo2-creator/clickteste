# Click & Gruda V3.7 — evolução de módulos avançados

## Natureza da entrega
Código-fonte **FULL** da cópia de testes, com melhorias integradas sobre a V3.6. **Não é release homologada.** Nenhum arquivo de produção original foi modificado e nenhum deploy foi realizado por esta entrega.

## Mudanças implementadas

### 1. Realismo 3D
- Preservação dos controles de sombra projetada, sombras de contato, HDRI, softboxes, materiais existentes e presets do Studio.
- Ajuste conservador de `shadow-bias` e `shadow-normalBias` na luz-chave para reduzir a separação artificial entre a caneca e a sombra/artefatos de profundidade. **Requer validação visual nos navegadores e posições reais.**
- Esta mudança **não** equivale a path tracing/ray tracing, estudo fotogramétrico da caneca ou reconstrução geométrica milimétrica da alça.

### 2. Assistente de IA e ações
- Endpoint `/api/creative-assistant` preservado (somente texto da pergunta, módulo e idioma enviados ao provedor; sem arquivos do cliente).
- Propostas de ações agora são validadas por módulo; um comando do Studio não pode ser executado a partir do Editor e vice-versa. O cliente exige confirmação explícita antes de abrir recursos.
- Verificação de origem de chamadas, limite inicial de tamanho da requisição e rate limit já existente.
- Conteúdo do guia local atualizado para PDF/PSD/MP4 atuais.
- IA externa depende de `OPENAI_API_KEY` válida configurada **somente** no ambiente de testes Vercel. O fluxo real com um provedor e cotas compartilhadas ainda exige homologação. Não acrescente chaves ao repositório.

### 3. PDF/PSD local
- PDF: permite selecionar a página a importar em documentos com múltiplas páginas. Trechos de texto detectáveis tornam-se objetos independentes sobre fundo rasterizado. A limpeza de texto original só é tentada em regiões com fundo visualmente uniforme, reduzindo danos a fotografias.
- PSD: importação de camadas raster RGB/8 bits com compressão raw, RLE, ZIP e ZIP com predição; preserva posição/opacidade e cores. Teste real do navegador para ZIP/predição aprovado.
- Limites: vetores PDF, arquivos escaneados, fontes não incorporadas, objetos inteligentes, estilos/grupos Photoshop, PSB, CMYK e 16-bit não são convertidos em objetos totalmente editáveis. Não prometer compatibilidade total com qualquer PDF/PSD.

### 4. Templates inteligentes
- O arquivo `.cgtemplate` mantém metadados locais de encaixe mesmo quando a caneca é importada **depois** do cenário.
- Reencaixe proporcional (sem achatar caneca), alinhamento central na área e limpeza da máscara anterior quando novo template não contém máscara.
- Recoloração e máscara da mesma imagem funcionam simultaneamente.
- Validação de limites do pacote e das imagens extraídas.
- Ainda não inclui detecção automática de mãos/corpos, estimativa fotográfica de profundidade ou perspectiva física automática.

### 5. MP4 e linha do tempo
- Prévia com linha do tempo e posição em segundos, controles para reproduzir/pausar, marcar posições e aplicar entradas: aparecer, deslizar esquerda/direita, zoom e giro.
- Pontos de movimento ficam armazenados no documento `.cgdesign`. Interpolação suave de posição, escala, rotação e transparência.
- Exportador H.264/WebCodecs agora usa grupos de camadas estáticas renderizadas uma vez, atualizando apenas camadas animadas; preserva ordem de sobreposição e possui cancelamento.
- Restrições mantidas: até **20 segundos**, **720p**, **24 fps**, **sem áudio**, dependente do suporte do navegador/codec e do CORS do vídeo administrativo. Não edita o conteúdo interno dos frames do MP4 nem oferece timeline de áudio.

## Validação feita nesta sessão

- **15/15** testes de estrutura/regressão V3.6+V3.7 passaram.
- `tests/v35-editor-and-fonts.mjs` passou (sintaxe, fontes, tipografia, histórico, alça).
- `scripts/verify-v34.mjs` passou (ordem de camadas, espelho e transferência de sombra).
- Chromium isolado: PSD comprimido com ZIP/predição, alfas, animações por Canvas, máscaras com recoloração e encaixe da caneca passaram (`python tests/v37-browser.py`).
- Verificação do Studio que exige `node_modules` não foi executada: este ambiente não conseguiu instalar dependências do npm (`EAI_AGAIN` / registro inacessível).
- **Não foi possível executar `npm ci`, `npx tsc --noEmit` nem `npm run build` do Next.js, nem a exportação MP4 end-to-end.** O Chromium de testes não disponibilizou WebCodecs em contexto seguro; a navegação para HTTPS/local foi bloqueada pelo ambiente.
- O teste de API usou uma resposta simulada de IA, sem chamada ou cobrança real.

## Checklist obrigatório na clickteste (antes de considerar concluído)

1. Confirme que o projeto Vercel e `DATABASE_URL` apontam exclusivamente para o banco de testes. Nenhuma migração Prisma nova é necessária nesta versão.
2. Execute `npm ci --no-audit --no-fund`, `npx prisma generate`, `npx tsc --noEmit` e `npm run build`. Corrija qualquer erro de tipagem antes de publicação.
3. Verifique no Editor: PDF simples de 2+ páginas, PSD RGB/8 ZIP/RLE/raw, `.cgtemplate` com e sem caneca importada, máscara e coloração juntas, exportação PNG, undo/redo, reset.
4. Em Chrome/Edge HTTPS, suba vídeo MP4 curto, aplique animações a texto e mockup, pré-visualize, exporte, reproduza o arquivo em outro player, teste cancelamento e duração.
5. No Studio 3D, rode a caneca 360º, deitada/inclinada, compare sombras em fundo branco/escuro e verifique serrilhados e pontos brancos a diferentes distâncias. Compare a alça com a fotografia física real.
6. Configure chave de IA apenas no projeto de testes, pergunte por cada módulo, teste confirmação/cancelamento, tentativas de ações indevidas e custos. Sem chave, valide o guia local.
7. Valide iOS/Android e desktop, permissões administrativas, desempenho com projetos grandes, erros de console e CORS do R2.

## Comandos de regressão após instalar as dependências

```bash
node --test tests/v36-feature-checks.mjs tests/v37-feature-checks.mjs
node tests/v35-editor-and-fonts.mjs
node scripts/verify-v34.mjs
node scripts/verify-studio-before-deploy.mjs
npm run build
```

Testes Chromium isolados usam Python com Playwright instalado e `/usr/bin/chromium` (ajuste o executável em outros sistemas): `python tests/v37-browser.py`.

## Arquivos alterados
Veja `docs/V3_7_ARQUIVOS_ALTERADOS.txt`. Não houve mudanças no Prisma schema ou nos scripts de deploy.
