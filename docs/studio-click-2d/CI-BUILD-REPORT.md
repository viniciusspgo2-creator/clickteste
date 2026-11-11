# CI-BUILD-REPORT — Studio Click Mockup 2D (build v1: motor portado + rota)

Data: 2026-11-11
Repositório: viniciusspgo2-creator/clickteste
Branch: feat/studio-click-mockup-2d
Commit base: fc02dfa (main)
Ambiente local: Node v24.22.1, npm 10.9.4 (o CI usa Node 22)
DATABASE_URL: fictícia (postgresql://ci:ci@127.0.0.1:5432/clickgruda_ci)

> Resultado oficial é o GitHub Actions (verify-clickgruda.yml) no Draft PR.
> Este documento registra o pré-check local da v1.

## Resultado por etapa (v1)

| Etapa | Comando | Resultado | Evidência |
|---|---|---|---|
| 1. npm ci | `npm ci --no-audit --no-fund` | ⚠️ Travou no postinstall do Prisma (download dos binários parado atrás de proxy). Contornado com `npm install --ignore-scripts --no-save` (178 pacotes, 34s). Depois, os binários do Prisma foram copiados da VPS (`~/.cache/prisma`, 53 MB) e o `prisma generate` passou. Não é erro do repo. | Log npm + cache |
| 2. verify:creative | `npm run verify:creative` | ✅ PASSOU — 256/256 | 256 testes, 0 falhas, ~32s. |
| 3. prisma generate | `DATABASE_URL=fictícia npx prisma generate` | ✅ PASSOU | "Generated Prisma Client (v6.19.3) in 125ms" (após copiar os engines da VPS). |
| 4. tsc --noEmit | `npx tsc --noEmit` | ✅ PASSOU — 0 erros | Antes do `prisma generate` havia 3 erros de tipos do Prisma (client não gerado). Depois, 0 erros — incluindo todos os arquivos novos de studio-mockup-2d. |
| 5. build | `DATABASE_URL=fictícia npm run build` | ✅ PASSOU | Exit 0. Rota `○ /studio-mockup-2d` presente na lista de rotas (estática). |
| 6. smoke test | `next start` + curl | ✅ PASSOU | `/studio-mockup-2d` → 200, título correto. Cena `gamer-2-canecas.jpg` → 200 (822.993 bytes). Demo art → 200 (118.634 bytes). Home `/` → 200 (nada quebrado). |

## Arquivos da v1 (todos na branch feat/studio-click-mockup-2d)

- `src/lib/features.ts` (modificado): flag `STUDIO_MOCKUP_2D_ENABLED = true`
  (acesso por URL direta, sem promoção no menu/home).
- `src/lib/studio-mockup-2d/types.ts` — tipos, REF 2048×1152, estado, export sizes.
- `src/lib/studio-mockup-2d/geometry.ts` — mugLeft/Right/T/X, topY, botY, bodyPath.
- `src/lib/studio-mockup-2d/warp.ts` — cacheArtPixels, drawWarped (warp cilíndrico).
- `src/lib/studio-mockup-2d/maps.ts` — computeMaps (lum/spec/edge/grain), smoothstep, blur.
- `src/lib/studio-mockup-2d/render.ts` — renderMockup (6 camadas), exportMockupBlob.
- `src/lib/studio-mockup-2d/catalog.ts` — 2 cenas gamer + arte de demonstração.
- `src/lib/studio-mockup-2d/detect.ts` — detecção automática de área (v1, sem WASM).
- `src/lib/studio-mockup-2d/autofit.ts` — ajuste automático (aspect-fit 21×9,5 cm).
- `src/app/studio-mockup-2d/layout.tsx` + `page.tsx` — rota isolada (dynamic ssr:false).
- `src/components/studio-mockup-2d/editor.tsx` — editor (canvas, controles, detecção, encaixe, export).
- `public/studio-mockup-2d/scenes/gamer-2-canecas.jpg` (3840×2160) e
  `gamer-par-alcas-opostas.jpg` (3840×2160), `demo-art-21x9-5cm.png` (2100×950).

## Recursos novos da v1 (além do Wrap V2)

- Sliders Realismo (0–100) e Curva (0–100) — ideia do stallkit (MIT).
- Detecção automática de área (bordas verticais + mancha clara, com confiança).
- Encaixe automático da arte (aspect-fit, 21×9,5 cm).
- Exportação 16:9 (3840/1920/2048) + social (1080×1350, 1080×1920, 1920×1080, 1080×1080).
- Nada do módulo legado mockup-cenarios foi tocado; Studio 3D, Editor 2D,
  checkout, auth e biblioteca intactos.

## A reexecutar após a integração (CI)

- `npm ci`, `npm run verify:creative`, `npx prisma generate`, `npx tsc --noEmit`,
  `npm run build` — todos no GitHub Actions do Draft PR.
