# NEXT-STEPS — Pendências do Studio Click Mockup 2D (por severidade)

Data: 2026-11-11
Branch: feat/studio-click-mockup-2d
Commit: f05c329da03767536590975b5f8a3452e612d331

## Bloqueador imediato (esta rodada)

1. **Push da branch + Draft PR** — o commit f05c329 está pronto localmente,
   mas o push precisa de uma deploy key com escrita no GitHub (a chave que
   a VPS tem hoje só serve para o deploy, não para enviar). Uma browser task
   está adicionando a chave. Depois: push da branch, abrir o Draft PR
   (base main, título "feat: Studio Click Mockup 2D — integração da coleção
   (revisão, sem deploy)"), verificar o GitHub Actions e corrigir bloqueios.
   **Nenhum merge, nenhum deploy.**

## Alta (próxima fase — catálogo e calibração)

2. **Integrar os 94 templates** — copiar para `public/studio-mockup-2d/scenes/`
   (corrigir "TEMPALTE_80" e "template_74"), calibrar a área de cada cena
   (detecção automática + revisão manual) e registrar em `catalog.ts`.
   É o trabalho mais longo. Não afirmar que estão prontos antes de calibrar.
3. **Calibrador visual admin (Fase 3)** — área protegida para cadastrar
   cenários sem editar código: arrastar contorno, máscaras, grade de teste,
   salvar rascunho/publicar. Ver CALIBRATION-GUIDE.md.
4. **Upgrade da detecção automática** — OpenCV.js + jscanify (lazy), para
   melhorar a precisão nas 94 cenas. Ver REFERENCIAS-PESQUISA.md.

## Média (qualidade e exportação)

5. **Exportação JPEG** — hoje só PNG.
6. **Prévia do Blob de exportação** — mostrar a prévia do arquivo final
   antes do download (hoje o download é direto).
7. **Grade de calibração embutida** — arte de grade (linhas, números,
   círculo, texto) para validar a geometria de cada cena.
8. **Galeria de templates** — busca, filtros por formato/categoria/nº de
   canecas, miniaturas, paginação (hoje só as 2 cenas gamer, sem busca).
9. **Testes E2E (Playwright)** — abrir catálogo, enviar arte, trocar
   preset, ajustar, exportar e validar o PNG; teste de viewport mobile.

## Baixa (polimento)

10. **Desfazer/refazer** no editor (histórico limitado).
11. **Persistência de calibração em banco** (hoje o catálogo é um array em
    `catalog.ts`; a persistência vem com o calibrador admin).
12. **API admin do módulo** (cadastrar/publicar/arquivar template) — com
    o calibrador.
13. **Teste automatizado de transparência PNG** e de correspondência
    geométrica preview vs export.

## Decisões que dependem do usuário (não reabrir proativamente)

- Revisar o Draft PR quando abrir (o usuário revisa; nada de merge sem
  autorização explícita).
- Confirmar se a VPS antiga suspensa deve ser cancelada antes de 03/12/2026
  (cobrança de €7,50 pode se repetir) — item já entregue, sem resposta.
- A meta de ~80 templates é escopo, não promessa: os 94 arquivos baixados
  cobrem a quantidade, mas a calibração de cada um é o trabalho real.

## O que NÃO fazer

- Não fazer push na main, merge, force-push, rebase destrutivo, release ou deploy.
- Não executar deploy.sh, pm2 reload/restart, migrate deploy ou db push em produção.
- Não reativar o módulo legado mockup-cenarios.
- Não promover a rota para menu público/home.
- Não afirmar 80/94 templates prontos, build verde ou PR aberto sem evidência.
