# TEMPLATE-CATALOG — Catálogo REAL do Studio Click Mockup 2D

Data: 2026-11-11
Regra: só entra na UI o template com imagem de cena, calibração e export
verificados. **Não declarar 80 templates prontos sem 80 registros validados.**

## Resumo

| status | quantidade |
|---|---|
| Pronto (calibração validada, export verificado) | **2** |
| Baixado, pendente de calibração/integração | **94** |
| Total de arquivos de cena em mãos | 96 |

A meta de ~80 templates é escopo a ser implantado (Fase 4), não entrega
concluída. Os 94 arquivos baixados cobrem essa meta em quantidade, mas
**nenhum deles tem calibração validada ainda**.

## Templates prontos (2)

### 1. Gamer — 2 canecas (frente/trás)
- **id:** `gamer-2-canecas`
- **Base:** `public/studio-mockup-2d/scenes/gamer-2-canecas.jpg` (3840×2160)
- **Canecas:** 2 (frente/trás, alças à direita)
- **Calibração:** extraída do Wrap V2 (cx 732/R 216 e cx 1353/R 177)
- **Proporção:** 16:9 (export 3840×2160, 1920×1080, 2048×1152)
- **Status:** pronto — render e export verificados no build local
- **ExportName:** `mockup-gamer-2-canecas.png`

### 2. Gamer — par (alças opostas)
- **id:** `gamer-par-alcas-opostas`
- **Base:** `public/studio-mockup-2d/scenes/gamer-par-alcas-opostas.jpg` (3840×2160)
- **Canecas:** 2 (par lado a lado, alças opostas)
- **Calibração:** extraída do Wrap V2 (cx 761/R 201 e cx 1245/R 195)
- **Proporção:** 16:9 (export 3840×2160, 1920×1080, 2048×1152)
- **Status:** pronto — render e export verificados no build local
- **ExportName:** `mockup-gamer-par-alcas-opostas.png`

## Templates pendentes (94) — baixados, sem calibração

Origem: file.kiwi, 2 ZIPs verificados (55 + 39 arquivos), 256 MB.
Local: `~/workspace/studio-click-2d/templates-download/` (fora do repo).
Manifesto com SHA256 por arquivo: `docs/studio-click-2d/handoff-manifest.json`.

Características (verificadas por inspeção):
- Fotos de **cenário** (caneca em cena, retrato ~4:5, 1600–2500 px de largura, RGB).
- Numeração TEMPLATE_2 a TEMPLATE_95 — **falta o TEMPLATE_1**.
- Variantes "-2": TEMPLATE_2-2, TEMPLATE_10-2, TEMPLATE_26-2, TEMPLATE_27-2,
  TEMPLATE_40-2.
- Nomes com erro a corrigir na integração: "TEMPALTE_80.webp" e
  "template_74.webp".

Para cada um dos 94, falta (antes de entrar na UI):
1. Copiar para `public/studio-mockup-2d/scenes/` (com nome corrigido).
2. Calibrar a área da caneca (detecção automática + revisão manual).
3. Registrar em `catalog.ts` com `id`, `nome`, `ratio`, `mugs` e `exportName`.
4. Testar render + export no formato nativo do template.
5. Atualizar esta tabela com o status real.

**Nenhum dos 94 está na UI hoje.** O catálogo da UI tem apenas os 2 gamer.

## Formatos de exportação suportados (motor)

| formato | dimensões | uso |
|---|---|---|
| 16:9 | 3840×2160 / 1920×1080 / 2048×1152 | horizontal |
| Feed vertical | 1080×1350 | Instagram 4:5 |
| Story/reels | 1080×1920 | Story 9:16 |
| Quadrado | 1080×1080 | feed 1:1 |

O motor exporta nesses 4 formatos. Cada template tem uma proporção nativa;
trocar de formato por "versões irmãs" só quando existirem — sem alongar
uma imagem 4:5 para 16:9.
