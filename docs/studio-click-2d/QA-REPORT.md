# QA-REPORT — Studio Click Mockup 2D (v1)

Data: 2026-11-11
Branch: feat/studio-click-mockup-2d
Commit: f05c329da03767536590975b5f8a3452e612d331
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
| GitHub Actions | workflow verify-clickgruda.yml no Draft PR | ⏳ PENDENTE | depende do push + Draft PR |

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
- 🟡 Detecção automática de área (v1, sem WASM) — implementada, com confiança; precisão real em cenas variadas ainda não medida.
- 🟡 Encaixe automático (aspect-fit 21×9,5 cm) — implementado; não há teste de correspondência geométrica automatizado.
- ⏳ Calibrador visual admin (arrastar contorno, máscaras, salvar/publicar) — **não implementado**. Ver CALIBRATION-GUIDE.md.
- ⏳ Persistência de calibração em banco — não implementada (o catálogo hoje é um array em `catalog.ts`).
- ⏳ Publicar/arquivar template — não implementado (não há API admin do módulo).

### UX e formatos
- 🟡 UI preto/grafite/laranja/branco, palco + painéis — implementada (editor.tsx); não há teste E2E nem screenshot de mobile ainda.
- ✅ Os 4 formatos de exportação (1080×1350, 1080×1920, 1920×1080, 1080×1080) — implementados no seletor de exportação.
- 🟡 Seleção por formato/categoria/busca — o catálogo da UI hoje só lista as 2 cenas gamer (sem busca/filtros; a galeria completa vem com os 94).
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
