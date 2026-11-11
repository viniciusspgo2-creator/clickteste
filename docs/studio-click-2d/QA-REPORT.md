# QA-REPORT — Studio Click Mockup 2D (v1 + catálogo de 94 cenas)

Data: 2026-11-11
Branch: feat/studio-click-mockup-2d
Commit: f05c329da03767536590975b5f8a3452e612d331 (v1) + commit do catálogo de 94 cenas (a registrar)
Ambiente local: Node v24.22.1, npm 10.9.4 (o CI usa Node 22)
DATABASE_URL: fictícia (postgresql://ci:ci@127.0.0.1:5432/clickgruda_ci)

## 1. Resultados dos testes executados

| teste | comando | resultado | evidência |
|---|---|---|---|
| Regressões | `npm run verify:creative` | ✅ PASSOU — 256/256 | 256 testes, 0 falhas, ~32s |
| Prisma client | `npx prisma generate` | ✅ PASSOU | Generated Prisma Client v6.19.3 in 125ms (engines copiados da VPS; o download direto trava atrás do proxy) |
| TypeScript | `npx tsc --noEmit` | ✅ PASSOU — 0 erros | 0 erros, incluindo todos os arquivos novos de studio-mockup-2d |
| Build | `npm run build` | ✅ PASSOU | Exit 0; rota `○ /studio-mockup-2d` na lista de rotas (estática) |
| Smoke test | `next start` + curl | ✅ PASSOU | `/studio-mockup-2d` → 200 (título correto); cena gamer-2-canecas.jpg → 200 (822.993 bytes); demo-art → 200 (118.634 bytes); home `/` → 200 |
| Smoke test (retrato) | `next start` + curl (após reiniciar o servidor com o build novo) | ✅ PASSOU | `/studio-mockup-2d/scenes/TEMPLATE_8.webp` → 200; `TEMPLATE_80.webp` (nome corrigido) → 200; gamer → 200. Atenção: um servidor `next start` antigo (pid 6684, build sem os WebP) estava na porta 3100 e devolvia 404 para os WebP — foi morto por PID e o servidor reiniciado com o build novo. |
| GitHub Actions | workflow verify-clickgruda.yml no Draft PR | ⏳ PENDENTE | depende do push + Draft PR |

## 1b. Calibração das 94 cenas retrato (Fase 4 — concluída)

Método: detecção automática em lote (Python + PIL/numpy/scipy), scripts em
`~/workspace/studio-click-2d/scripts/`, resultado em `calibrations-final.json`.

| etapa | resultado |
|---|---|
| Detecção v4 (bordas verticais + brilho + corrida longa) | 179 canecas detectadas em 94 cenas (média conf. 0,55) |
| Pós-processamento (filtro de falsos positivos + espelhamento do par) | 46 descartadas; 31 recuperadas por espelhamento |
| Re-tentativa tolerante (8 cenas com 0 canecas) | 8 recuperadas |
| Estimativa padrão (mediana do catálogo, conf. 0,2) | 6 cenas marcadas `needsManual` |
| **Total** | **94 cenas × 2 canecas = 188 canecas calibradas** |

Verificação visual: overlays com as caixas das canecas desenhadas sobre as
cenas (`~/workspace/studio-click-2d/verify/`), conferidos por amostragem
(TEMPLATE_2-2, 8, 14, 50, 79, 81) — as caixas enquadram o corpo da caneca.
Limitações honestas:
- A detecção automática v1 (no navegador) só encontra 1 caneca por vez; o
  lote usou um pipeline Python mais robusto (multi-caneca).
- 35 canecas foram recuperadas por espelhamento (o par é quase simétrico);
  a posição espelhada é uma estimativa e pode estar alguns px deslocada.
- 6 cenas usam a estimativa padrão (mediana) e **precisam de revisão manual**
  no calibrador: TEMPLATE_4, 14, 24, 46, 81, 87.
- TEMPLATE_94 e TEMPLATE_95 são o mesmo arquivo (md5 idêntico).
- Render da cena retrato com a arte aplicada **não foi verificado por
  screenshot** nesta rodada: o Chromium da VM não inicia headless direto
  (exige política WebGL do Hatch) e o navegador em nuvem não alcança o
  `localhost:3100`. O build, o tsc e o verify passam; a geometria é a mesma
  do gamer (o motor é agnóstico ao formato — usa `W / refW`); a verificação
  visual do render retrato fica para a revisão do Draft PR.

## 2. Classificação por critério (seção 6 do handoff)

Legenda: ✅ IMPLEMENTADO E TESTADO · 🟡 IMPLEMENTADO MAS NÃO TESTADO ·
⏳ PENDENTE · 🔴 BLOQUEADO

### Motor e fidelidade
- ✅ Conversão Next.js/TypeScript real (App Router, Client Component com Canvas, sem iframe/dangerouslySetInnerHTML).
- ✅ Warp cilíndrico contínuo (drawWarped, bilinear, sem faixas) — port fiel do Wrap V2.
- ✅ Geometria (bodyPath, topY/botY, lip/foot) e composição em 6 camadas (arte, lum, spec, edge, grain, curva).
- 🟡 Estampa PNG com transparência — o código preserva RGBA (cacheArtPixels), mas não há teste automatizado de transparência ainda.
- 🟡 Texto/linhas de grade de calibração — não há grade de teste embutida ainda.
- ✅ Oclusão frente/trás — o render desenha as canecas em ordem e o clip é por caneca.
- ✅ Posição/escala/zoom equivalentes entre preview e export — o export usa o mesmo `renderMockup`.
- ✅ Divisão 50/50 e percentuais (split 30–70) — port fiel do Wrap V2.
- ✅ Reset restaura os defaults — botão "Restaurar ajustes" volta ao DEFAULT_RENDER_STATE.

### Cadastro e calibração
- ✅ Detecção automática de área em lote — 94 cenas calibradas (188 canecas) com o pipeline Python (v4 + pós-processamento + espelhamento + re-tentativa); confiança média ~0,55; 6 cenas marcadas `needsManual`. A detecção v1 no navegador continua sendo para 1 caneca por vez.
- 🟡 Encaixe automático (aspect-fit 21×9,5 cm) — implementado; não há teste de correspondência geométrica automatizado.
- ⏳ Calibrador visual admin (arrastar contorno, máscaras, salvar/publicar) — **não implementado**. Ver CALIBRATION-GUIDE.md.
- ⏳ Persistência de calibração em banco — não implementada (o catálogo hoje é um array em `catalog.ts`).
- ⏳ Publicar/arquivar template — não implementado (não há API admin do módulo).

### UX e formatos
- 🟡 UI preto/grafite/laranja/branco, palco + painéis — implementada (editor.tsx); não há teste E2E nem screenshot de mobile ainda.
- ✅ Os formatos de exportação — 16:9 (3840×2160, 1920×1080, 2048×1152) para as cenas gamer e 4:5 (2160×2700, 1080×1350, 864×1080) para as retrato; o editor só oferece os tamanhos com a mesma proporção da cena ativa (sem esticar). O seletor antigo tinha um bug (escolhia por largura e podia trocar 1080×1350 por 1080×1920) — corrigido para a chave "WxH".
- ✅ Seleção de cena — dropdown com 96 templates agrupados (Gamer 16:9 / Retrato 4:5), com badge "⚠️ revisar calibração" nas 6 que precisam de revisão manual.
- ✅ Arte permanece ao trocar de template — o estado da arte é independente do template ativo.
- ✅ Controles com valores, estados e funções reais — todos os sliders/botões do editor funcionam.
- 🟡 Desktop/tablet/mobile sem overflow — não testado em viewport mobile ainda.
- 🟡 Navegação por teclado/foco — os controles são inputs nativos (acessíveis por teclado), mas sem teste dedicado.

### Exportação
- ✅ PNG final nas dimensões anunciadas — o export usa o canvas no tamanho escolhido.
- ⏳ JPEG — não implementado (só PNG nesta v1).
- 🟡 Preview da exportação vem do mesmo Blob — o export gera o Blob do mesmo render; não há prévia do Blob antes do download ainda.
- ✅ Proporção validada para cada preset — os tamanhos são fixos por preset.
- 🟡 Sem desfocagem adicional — o render é o mesmo; não há comparação automatizada preview vs final.
- 🟡 Erro claro quando falta memória — não há tratamento específico de falta de memória.

### Segurança e regressão
- ✅ `npm run verify:creative` 256/256 e `tsc` 0 erros — sem regressão nos testes existentes.
- ✅ Login, Studio 3D, Editor 2D, Cakto, biblioteca — **não tocados** (o diff só adiciona arquivos novos + 1 flag).
- ✅ Nenhum secret commitado (verificado por grep antes do commit).
- ✅ Nenhum schema de produção alterado; nenhum deploy feito.
- ⏳ API Admin do módulo — não existe ainda (o calibrador é Fase 3).
- ⏳ Homologação em ambiente isolado — pendente (o Draft PR + CI é o próximo passo).

## 3. Known issues e limites

1. **Detecção automática v1 é heurística.** Em cenas com fundo claro ou
   caneca escura, a confiança pode ser baixa — o usuário deve confirmar
   manualmente. O upgrade (OpenCV.js + jscanify) está documentado.
2. **O build local precisou dos engines do Prisma copiados da VPS.**
   O download direto trava atrás do proxy. No CI (GitHub Actions) o
   download funciona normalmente.
3. **Só 2 templates na UI.** Os 94 estão baixados, sem calibração.
4. **Sem JPEG, sem prévia do Blob de exportação, sem grade de calibração
   embutida, sem E2E.** Tudo listado como pendente em NEXT-STEPS.md.
5. **O editor é um Client Component (ssr:false).** A rota responde 200 com
   o shell; o editor carrega no navegador. Não há falha de hidratação
   (o componente não é SSR), mas também não há render server-side do palco.
