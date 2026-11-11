# CALIBRATION-GUIDE — Cadastrar e ajustar um cenário (Studio Click Mockup 2D)

Data: 2026-11-11
Status: **calibrador visual completo PENDENTE** (Fase 3). Este guia documenta
o método disponível hoje (detecção automática + ajuste manual por
parâmetros) e o que falta para o calibrador visual.

## 1. O que é a calibração

Cada cena (foto com caneca) precisa de uma calibração — os números que dizem
ao motor onde está o corpo da caneca e como a arte se projeta nele.
Sem calibração, a arte não encaixa: ela flutua, corta ou distorce.

A calibração é um `MugCalibration` (ver `src/lib/studio-mockup-2d/types.ts`),
em coordenadas do espaço de referência **2048 × 1152** (a cena 4K é 1,875×
esse espaço):

| campo | o que é |
|---|---|
| `cx` | centro horizontal da caneca (px) |
| `R` | metade da largura do corpo (px) |
| `topC` | centro vertical da borda superior (elipse do topo) |
| `topRy` | raio vertical da elipse do topo |
| `botC` | centro vertical da borda inferior (elipse da base) |
| `botRy` | raio vertical da elipse da base |
| `xLeft` / `xRight` | limites laterais do corpo (fallback: cx ± R) |
| `lip` | quanto a borda de porcelana fica acima do topo da arte (px) |
| `foot` | quanto a base fica abaixo da base da arte (px) |
| `cor` | cor do contorno da máscara (debug) |
| `id` / `nome` | identificação da caneca no template |

Regras de ouro:
- A arte **nunca** cobre o lábio superior, a alça nem a base — essas áreas
  ficam fora da superfície imprimível.
- A calibração é por **foto**: nunca reutilizar a geometria de uma cena em
  outra foto por conveniência.
- Coordenadas normalizadas [0..1] são o alvo final (o calibrador visual
  vai gravar assim); hoje o catálogo usa px de referência 2048×1152.

## 2. Método disponível hoje (v1)

### Passo 1 — Detectar a área automaticamente
1. Abra a rota `/studio-mockup-2d`.
2. Selecione a cena.
3. Clique em **"Detectar área automaticamente"**.
4. O motor (v1, sem WASM — bordas verticais + mancha clara) sugere uma
   calibração e mostra a **confiança** (0–100%).
5. Se a confiança for alta (≥ 70%), clique em **"Aplicar área"**.

### Passo 2 — Conferir e ajustar manualmente
- Ative **"Mostrar máscaras (calibração)"** para ver o contorno da caneca
  sobre a foto.
- Compare o contorno com o corpo real da caneca: o topo da máscara deve
  ficar **abaixo** da borda de porcelana (o `lip` cobre isso) e a base deve
  ficar **acima** do pé da caneca (o `foot` cobre isso).
- Se o contorno estiver deslocado, ajuste os números da calibração em
  `src/lib/studio-mockup-2d/catalog.ts` (edite o `mugs` do template):
  aumente/diminua `cx`, `R`, `topC`, `botC`, `xLeft`, `xRight` até o
  contorno acompanhar o corpo.

### Passo 3 — Testar com a grade de calibração
- Envie uma arte de grade (linhas verticais/horizontais, números nas
  bordas, círculo e texto) e confira: linhas retas não podem ficar
  achatadas, o círculo não pode virar oval e o texto não pode espelhar.
- Ajuste `zoom` (60–200) e `offX`/`offY` até a grade ficar correta.

### Passo 4 — Registrar no catálogo
- Adicione o template em `src/lib/studio-mockup-2d/catalog.ts` com:
  `id`, `nome`, `base` (caminho em `public/studio-mockup-2d/scenes/`),
  `exportName`, `mugs` (calibrações) e `ratio`.
- Atualize `docs/studio-click-2d/TEMPLATE-CATALOG.md` com o status real.

## 3. O que o calibrador visual vai trazer (PENDENTE — Fase 3)

- Área protegida (admin) para cadastrar cenários sem editar código.
- Marcar o contorno do corpo diretamente sobre a imagem, com zoom/pan,
  guias, grade e alças de controle (arrastar os 4 cantos + topo/base).
- Máscara de impressão e máscara de oclusão separadas (pincel/borracha,
  polígono, desfazer/refazer).
- Grade de teste embutida e estampa padrão colorida.
- Salvar como rascunho, reabrir, duplicar, versionar e publicar com
  validação server-side.
- Coordenadas normalizadas [0..1] persistidas (banco), não px de referência.

**Não prometer que o calibrador visual está pronto — ele não está.**
O método desta seção (detecção + ajuste por parâmetros) é o que existe hoje.

## 4. Upgrade previsto da detecção

A detecção v1 (bordas verticais + mancha clara) é um ponto de partida.
O upgrade previsto (ver `REFERENCIAS-PESQUISA.md`) é **OpenCV.js + jscanify**
(Canny → contornos → approxPolyDP → quadrilátero), carregado sob demanda
(lazy), com a mesma interface — trocar a implementação não muda quem chama.
