# ENGINE-MIGRATION — Wrap V2 (HTML) → TypeScript (Next.js)

Data: 2026-11-11
Origem: Studio_Click_Mockup_2D_Wrap_V2.html (2,5 MB, 1 bloco <script> de 498 linhas)
Destino: src/lib/studio-mockup-2d/* (TypeScript, App Router, rota isolada)
Branch: feat/studio-click-mockup-2d

## 1. O que foi portado (fiel ao original)

O motor foi portado função por função, sem mudar a matemática. O HTML original
continua como referência em ~/workspace/user/files/Studio_Click_Mockup_2D_Wrap_V2.html.

### Espaço de referência
- REF_W = 2048, REF_H = 1152. As cenas 4K (3840×2160) são 1,875× esse espaço.
- Toda calibração de caneca é em coordenadas desse espaço. A escala de render
  é s = W / REF_W, e a geometria é idêntica em preview e exportação.

### Geometria da caneca (geometry.ts)
- MugCalibration: id, nome, cor (cor da máscara), cx, R, topC, topRy, botC,
  botRy, xLeft, xRight, lip (6), foot (1.5).
- mugLeft/mugRight: usam xLeft/xRight (ou cx±R como fallback).
- mugT(m, x): x → t em [-1, 1]. mugX(m, t): t → x.
- topY(m, t) = topC + topRy·√(1−t²) + lip — borda superior elíptica, alguns px
  ABAIXO da borda de porcelana (nunca dentro da boca).
- botY(m, t) = botC + botRy·√(1−t²) − foot — borda inferior elíptica.
- bodyPath(ctx, m, s): contorno fechado com 96 segmentos (topo esq→dir,
  base dir→esq). xLeft/xRight medidos por template impedem faixas brancas
  de uma máscara curta.

### Amostragem da arte (warp.ts)
- cacheArtPixels: reduz a arte para no máx. 4096×2048 (smoothing high) e guarda
  o ImageData (data, w, h).
- drawWarped: projeção cilíndrica contínua, por pixel — SEM as 180 faixas que
  geravam linhas. Para cada pixel de destino: tx = mugT, theta = asin(tx),
  u = uCenter + theta·visFrac/π. Amostragem bilinear nos dois eixos, wrap
  horizontal sem costura, alfa preservado. Suporte a split (splitStart/splitEnd
  limitam a composição à metade correta, sem misturar a metade oposta nas
  bordas). Antialias de borda (edgeAA = 1,2 px reais) nas laterais, topo e base.
  Saturação aplicada via ctx.filter ao desenhar a camada.

### Mapas derivados da foto (maps.ts)
- computeMaps (1× por template, a partir da foto original da caneca branca):
  - lumMap: luminosidade normalizada (ref = percentil 95) → sombreamento
    natural sem escurecer a arte. Blur 0,5.
  - specMap: reflexos especulares (smoothstep p80→p99 × 0,85) → brilho
    vitrificado sem faixas artificiais. Blur 0,25.
  - edgeColors: cor RGB real das bordas de cada caneca (só o matiz,
    normalizado para lum 128) → reflexo ambiente discreto.
  - grainPattern: grão sutil da porcelana (canvas 128×128 de ruído, repeat).
- smoothstep, blurCanvas (downscale + upscale).

### Render (render.ts)
- render(ctx, W, H): s = W/REF_W. Desenha a base. Para cada caneca ativa
  (com arte e sem compare):
  - visFrac = min(1, 0,613 · (100/zoom)). uCenter = 0,5 + offX/100
    (ou ajustado no split: cada caneca fica na sua porção, visFrac limitado
    a segmentSpan·0,97).
  - Clip em bodyPath. Camadas, nesta ordem:
    1. drawWarped — tinta, source-over, opacidade.
    2. lumMap — multiply, alpha shade/100.
    3. specMap — screen, alpha light/100 (só se light > 0).
    4. gradiente de edgeColors — soft-light, alpha light·0,25.
    5. grainPattern — overlay, alpha 0,05.
  - showMasks: contorno da caneca na cor dela + nome.
- renderPreview: throttle por requestAnimationFrame.

### Estado (types.ts)
- RenderState: zoom 60–200 (100), offX −50..50 (0), offY −15..15 (0),
  opacity 40–100 (100), light 0–100 (50), shade 0–100 (75), sat 70–140 (100),
  split (false), splitPoint 30–70 (50), use [true,true], showMasks (false),
  compare (false).
- Exportação: canvas W×(W·9/16). Tamanhos: 3840×2160 (Ultra HD),
  1920×1080 (Full HD), 2048×1152 (Alta qualidade). O mesmo render da prévia,
  sem diferença de geometria.

## 2. Cenas (catalog.ts)

Extraídas do HTML (data URLs → arquivos, sem recriar a cena):
- public/studio-mockup-2d/scenes/gamer-2-canecas.jpg (3840×2160, 804 KB)
  — Template 01, 2 canecas. Mug1: cx 732, R 216, topC 430, topRy 30,
  botC 940, botRy 35, xLeft 516, xRight 952. Mug2: cx 1353, R 177,
  topC 373, topRy 22, botC 792, botRy 31, xLeft 1177, xRight 1537.
- public/studio-mockup-2d/scenes/gamer-par-alcas-opostas.jpg (3840×2160, 869 KB)
  — Template 02, 2 canecas. Mug1: cx 761, R 201, topC 409, topRy 21,
  botC 892, botRy 33, xLeft 560, xRight 970. Mug2: cx 1245, R 195,
  topC 402, topRy 20, botC 882, botRy 31, xLeft 1049, xRight 1448.
- public/studio-mockup-2d/demo-art-21x9-5cm.png (2100×950, 116 KB)
  — arte de demonstração 21×9,5 cm.

## 3. O que é NOVO (não existia no Wrap V2)

- Detecção automática de área (detect.ts): encontra a caneca na foto da cena
  por análise de bordas/contraste e sugere a calibração (cx, R, topC, botC,
  xLeft, xRight). O usuário confirma ou ajusta.
- Ajuste manual de área (calibrador): arrastar os cantos/pontos da área na
  prévia, com guias; salva a calibração por template.
- Ajuste automático da arte (autofit): centraliza e ajusta o zoom para a arte
  cobrir a área de impressão, respeitando 21×9,5 cm.
- Catálogo com os 94 templates WebP (TEMPLATE_2 a TEMPLATE_95, em
  ~/workspace/studio-click-2d/templates-download/), cada um com sua calibração.
- Exportação nos formatos sociais (1080×1350, 1080×1920, 1920×1080, 1080×1080)
  além dos 16:9 do Wrap V2.
- Rota isolada /studio-mockup-2d (não reativa o módulo legado mockup-cenarios
  e não toca em Studio 3D, Editor 2D, checkout, auth ou biblioteca).

## 4. O que NÃO foi portado / decisões

- O HTML NÃO foi colado em iframe nem dangerouslySetInnerHTML. É port real.
- O módulo legado src/lib/mockup-scenes (mockup-cenarios) NÃO foi reutilizado
  nem reativado — o novo motor vive em src/lib/studio-mockup-2d/, separado.
- A logo embutida (studio-logo.webp, 500×167) não foi copiada para o repo —
  o projeto já tem identidade própria; se precisar, usar o logo existente.
- Nenhum segredo, .env, token ou credencial foi copiado para o código.
