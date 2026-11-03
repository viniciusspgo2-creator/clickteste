# Click & Gruda V4.0 — rodada de acabamento e pré-impressão

**Status:** STAGING. Esta rodada parte da V3.9 corrigida. **Não altere a produção original.**

## O que mudou

1. **Sombra da caneca sensível à pose:** `src/components/tools/mockup/lib/shadow-pose.ts` calcula a projeção 2D da orientação 3D (`Euler XYZ`) e transforma apenas a sombra difusa no chão; canecas eretas continuam com sombra compacta. Aplicado no `FloatShadows` de `scene/studio.tsx` para principal e acompanhantes.
2. **Reencaixe em template inteligente:** `fitMockupIntoSlot` mantém proporção, conteúdo e máscara; botão **Reencaixar caneca** aparece no inspetor quando uma caneca e um slot de template estão selecionados.
3. **Pré-impressão raster:** `image-quality.ts` calcula DPI **efetivo** a partir da imagem de origem, recorte aplicado, escala no documento e largura física de 21 cm. Alerta para valores abaixo de 140 DPI e recomenda conferir artes entre 140 e 220 DPI. SVG não é avaliado como raster. A verificação é local, ao abrir a exportação.
4. **Texto rotacionado:** `rotatedBounds` é usado na verificação da área visível de 19 × 8,5 cm. Continua sendo uma estimativa, especialmente para fontes curvadas.
5. **Tradução dos novos controles** em PT/EN/ES e 5 testes de regressão.

## Arquivos alterados

- `src/components/tools/mockup/scene/studio.tsx`
- `src/components/tools/mockup/lib/shadow-pose.ts` (novo)
- `src/lib/creative/print-check.ts`
- `src/lib/creative/image-quality.ts` (novo)
- `src/lib/creative/smart-templates.ts`
- `src/components/creative/creative-editor.tsx`
- `src/components/platform/language-provider.tsx`
- `tests/v40-realism-print-template.mjs` (novo)
- `tests/v37-feature-checks.mjs` (expectativa atualizada após refatoração de encaixe)
- `package.json` (script verify:creative)
- `CHANGELOG.md`, este relatório

## Testes executados neste ambiente

```bash
node scripts/verify-source.mjs
node --test tests/v36-feature-checks.mjs tests/v37-feature-checks.mjs tests/v38-stability.mjs tests/v39-layers.mjs tests/v40-realism-print-template.mjs
```

**Resultado:** 32/32 testes automatizados, 653 imports internos resolvidos, 0 erros sintáticos nos módulos TS/TSX de implementação. Não foi possível concluir `npm ci` e, portanto, nem `npm run build`/`tsc --noEmit` com todas as dependências; testes visuais reais do Studio 3D e a compilação Next.js são **pendências de homologação**.

## Checklist para `clickteste`

- Confirmar que `npm run build` conclui sem erros TypeScript.
- Testar caneca vertical, inclinada a 45° e deitada a 90°, com fundo claro/escuro; observar orientação e suavidade da sombra no chão. Repetir com duas canecas.
- Gerar caneca no Studio, enviar ao Editor, selecionar template inteligente e deslocar a caneca. Clicar **Reencaixar caneca** e confirmar proporção e máscara. Testar Ctrl+Z.
- Em documento 21 × 9,5 cm, aumentar uma imagem pequena, abrir Exportar e conferir aviso de resolução baixa. Testar imagem alta resolução e SVG, sem falso aviso.
- Girar texto próximo à área segura e conferir aviso de extrapolação. Confirmar que guias não aparecem no PNG exportado.
- Confirmar idioma PT/EN/ES nos novos controles; testar no desktop e mobile.

## Limites explícitos

- **Sombra baseada em pose não é ray tracing nem substitui calibragem fotográfica da alça/material.** A sombra de contato já existente permanece separada.
- **DPI é estimado com base em pixels e tamanho final, não garante qualidade física da sublimação.** O navegador redimensiona/rasteriza conteúdos durante a composição.
- Templates inteligentes continuam dependendo de máscaras e área de encaixe preparadas previamente; não reconhecem pessoas e mãos automaticamente.
- Não foi executado novo deploy nem houve migração do Neon. O acervo e os arquivos pessoais não foram enviados a servidores nesta rodada.
