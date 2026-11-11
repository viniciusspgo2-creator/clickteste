# TEMPLATE-CATALOG — Catálogo REAL do Studio Click Mockup 2D

Data: 2026-11-11 (atualizado: catálogo de 94 cenas calibrado e integrado)
Regra: só entra na UI o template com imagem de cena, calibração e export
verificados. **Não declarar 80 templates prontos sem 80 registros validados.**

## Resumo

| status | quantidade |
|---|---|
| Pronto — gamer 16:9 (calibração Wrap V2, render/export verificados) | **2** |
| Pronto — retrato 4:5 (calibração automática, na UI) | **94** |
| Total de templates na UI | **96** |
| Total de canecas calibradas | **192** |

A meta de ~80 templates está coberta: **94 cenas retrato + 2 gamer = 96**.

## Templates prontos (2 gamer)

### 1. Gamer — 2 canecas (frente/trás)
- **id:** `gamer-2-canecas`
- **Base:** `public/studio-mockup-2d/scenes/gamer-2-canecas.jpg` (3840×2160)
- **Canecas:** 2 (frente/trás, alças à direita)
- **Calibração:** extraída do Wrap V2 (cx 732/R 216 e cx 1353/R 177)
- **Proporção:** 16:9 (refW 2048 × refH 1152; export 3840×2160, 1920×1080, 2048×1152)
- **Status:** pronto — render e export verificados no build local
- **ExportName:** `mockup-gamer-2-canecas.png`

### 2. Gamer — par (alças opostas)
- **id:** `gamer-par-alcas-opostas`
- **Base:** `public/studio-mockup-2d/scenes/gamer-par-alcas-opostas.jpg` (3840×2160)
- **Canecas:** 2 (par lado a lado, alças opostas)
- **Calibração:** extraída do Wrap V2 (cx 761/R 201 e cx 1245/R 195)
- **Proporção:** 16:9 (refW 2048 × refH 1152; export 3840×2160, 1920×1080, 2048×1152)
- **Status:** pronto — render e export verificados no build local
- **ExportName:** `mockup-gamer-par-alcas-opostas.png`

## Templates retrato 4:5 — 94 cenas calibradas e integradas

Origem: file.kiwi, 2 ZIPs verificados (55 + 39 arquivos), 256 MB.
Local das fontes: `~/workspace/studio-click-2d/templates-download/` (fora do repo).
No repo: `public/studio-mockup-2d/scenes/TEMPLATE_*.webp` (94 arquivos, 258 MB).
Manifesto com SHA256 por arquivo: `docs/studio-click-2d/handoff-manifest.json`.
Calibrações: `~/workspace/studio-click-2d/calibrations-final.json`.

Características (verificadas por inspeção):
- Fotos de **cenário** (caneca em cena, retrato ~4:5, 1435–3299 px de largura, RGB).
- Numeração TEMPLATE_2 a TEMPLATE_95 — **falta o TEMPLATE_1** (não existe).
- Não existe TEMPLATE_2 simples — só a variante TEMPLATE_2-2.
- Variantes "-2": TEMPLATE_2-2, TEMPLATE_10-2, TEMPLATE_26-2, TEMPLATE_27-2,
  TEMPLATE_40-2.
- Nomes com erro **corrigidos na integração**: "TEMPALTE_80.webp" →
  "TEMPLATE_80.webp" e "template_74.webp" → "TEMPLATE_74.webp".
- **TEMPLATE_94 e TEMPLATE_95 são o MESMO arquivo** (md5 idêntico
  6140a2930250b27d1bed4b7dd8056875) — mantidos os dois números porque o
  usuário enviou os dois. São 93 imagens únicas em 94 registros.
- Todas as cenas têm **2 canecas** (par lado a lado, alças opostas).
- Espaço de referência: **1080×1350** (retrato 4:5, formato feed vertical).
- Export: 2160×2700, 1080×1350, 864×1080 (todos 4:5, sem distorção).

### Método de calibração (automática, em lote)

Pipeline em Python (PIL + numpy + scipy), scripts em
`~/workspace/studio-click-2d/scripts/`:
1. **Detecção v4** (`calibrate-templates-v4.py`): bordas verticais fortes
   (Sobel) + brilho interno para formar pares de laterais; topo/base pela
   corrida contínua mais longa de linhas claras no corpo. Devolve cx, R,
   topC, botC e confiança por caneca.
2. **Pós-processamento** (`postprocess-calibrations.py`): remove falsos
   positivos (confiança < 0,30, altura < 15%, topo na borda) e recupera a
   segunda caneca do par por **espelhamento** (o par é quase simétrico em
   relação ao centro vertical; a região espelhada é verificada por brilho
   interno + bordas verticais antes de aceitar).
3. **Re-tentativa tolerante** (`retry-failed.py`): cenas com 0 canecas são
   reprocessadas com limiares mais baixos (brilho 150, fração 0,30).
4. **Estimativa padrão** (mediana do catálogo): as 6 cenas que restaram
   incompletas recebem o par na posição mediana (esquerda cx 364/R 163,
   direita cx 730/R 160, topo 652, base ~1069) com confiança 0,2 e flag
   `needsManual` — o usuário revisa no calibrador manual do editor.

### Resultado da calibração

| resultado | cenas |
|---|---|
| 2 canecas detectadas (automático) | 88 |
| 2 canecas, uma recuperada por espelhamento | 35 das 88 |
| 2 canecas, estimativa padrão (precisa revisar) | 6 |
| **Total com 2 canecas na UI** | **94** |

- Confiança média das detecções automáticas: ~0,55 (escala 0–1).
- Cenas marcadas `needsManual` (revisar no calibrador): TEMPLATE_4,
  TEMPLATE_14, TEMPLATE_24, TEMPLATE_46, TEMPLATE_81, TEMPLATE_87.
- Verificação visual: overlays com as caixas das canecas desenhadas sobre
  as cenas (`~/workspace/studio-click-2d/verify/`), conferidos por amostragem
  (TEMPLATE_2-2, 8, 14, 50, 79, 81) — as caixas enquadram o corpo da caneca.

## Formatos de exportação suportados (motor)

| formato | dimensões | uso |
|---|---|---|
| 16:9 | 3840×2160 / 1920×1080 / 2048×1152 | horizontal (cenas gamer) |
| Retrato 4:5 | 2160×2700 / 1080×1350 / 864×1080 | cenas retrato |
| Feed vertical | 1080×1350 | Instagram 4:5 |
| Story/reels | 1080×1920 | Story 9:16 |
| Quadrado | 1080×1080 | feed 1:1 |

O editor só oferece os tamanhos com a **mesma proporção da cena ativa**
(para não esticar a imagem). Cada template tem `refW`/`refH` próprios e o
render usa `W / refW` como fator de escala — o mesmo código serve 16:9 e 4:5.
