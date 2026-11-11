# AUDITORIA INICIAL — Studio Click Mockup 2D (Wrap V2 → Next.js)

Data: 2026-11-11
Repositório: viniciusspgo2-creator/clickteste
Branch de trabalho: feat/studio-click-mockup-2d (existe; no último exame, idêntica à main)
Branch de produção: main — INTOCÁVEL (sem push, sem merge, sem deploy)

## 1. Resumo executivo

A coleção Next.js preparada na sessão Work (ChatGPT) **NÃO está acessível neste ambiente**.
O próprio ChatGPT confirmou que não conseguiu acessar a coleção naquele ambiente
(mensagem do usuário em 11/11/2026 ~14:32). Portanto, **não há arquivos finais do
Work para transferir**. O que existe aqui, de concreto, é:

| Material | Onde está | Estado |
|---|---|---|
| Studio_Click_Mockup_2D_Wrap_V2.html (motor de projeção) | ~/workspace/user/files/ (enviado pelo usuário) | PRESENTE, 2,4 MB, íntegro |
| Templates WebP (cenas das canecas) | file.kiwi/cd56f846 (2 ZIPs: 117 MB + 151 MB) | LINK ACESSÍVEL; download em andamento via navegador (curl direto retornou 403) |
| Snapshot do projeto Next.js (clickteste-audit) | ~/workspace/clickteste-audit/ | PRESENTE — é o módulo LEGADO mockup-cenarios, não o novo Studio 2D |
| Coleção Next.js preparada no Work | — | AUSENTE (não está neste ambiente; aguardando o usuário enviar o ZIP) |

**Consequência:** não é possível "só transferir e abrir o PR" sem os arquivos do Work.
Os dois caminhos são: (A) o usuário envia o ZIP da coleção do Work → integro na
branch e abro o Draft PR; (B) se o ZIP não for recuperável, construo a implementação
a partir do Wrap V2 + templates (port do motor para TypeScript + catálogo), com
aprovação do usuário antes de mexer no repo.

## 2. Wrap V2 — o que foi confirmado no arquivo

Arquivo: Studio_Click_Mockup_2D_Wrap_V2.html — 2.503.376 bytes, 638 linhas,
título "Studio Click · Mockup 2D — Wrap preciso". Totalmente autocontido
(nenhum script externo).

Funções do motor presentes (todas as citadas no handoff):
- `cacheArtPixels`, `computeMaps`, `drawWarped`, `render`, `renderPreview`
- Geometria: `bodyPath`, `mugLeft`, `mugRight`, `mugT`, `mugX`, `topY`, `botY`

Templates embutidos (2 cenas gamer funcionais):
- `gamer-2-canecas` (Template 01)
- `gamer-par-alcas-opostas` (Template 02)

Imagens embutidas (data URLs): 4 imagens (~24 KB, ~158 KB, ~1,1 MB, ~1,19 MB)
— as 2 bases de cena + arte de demonstração/miniaturas.

Parâmetros padrão confirmados: zoom=100, offX=0, offY=0, opacity=100,
light=50, shade=75, sat=100, splitPoint=50.

## 3. Snapshot legado (clickteste-audit) — o que já existe no projeto

O snapshot é o módulo ANTIGO `mockup-cenarios`, conceitualmente relacionado mas
NÃO equivalente ao novo Wrap V2. Não reativar em produção inadvertidamente
(decisão de produto registrada no handoff).

Arquivos relevantes do legado:
- `src/lib/mockup-scenes/`: catalog.ts, render.ts, server.ts, types.ts, validation.ts
- `src/app/mockup-cenarios/`: page.tsx, editor/page.tsx, layout.tsx
- `src/app/api/mockup-scenes/`: catalog/route.ts, images/[id]/route.ts
- `src/app/api/admin/mockup-scenes/`: route.ts, [id]/route.ts
- `docs/mockup-cenarios/`: LEIA-ME.md, SCHEMA_ADICIONAL.sql, VALIDACAO.md
- `public/studio-templates/`: cenario-001..007 (.webp + preview) — 7+ cenários existentes
- `public/mockup-scenes/`: models/, previews/, thumbs/, showcase.jpg

Versões no package.json do snapshot: Next.js ^16.1.1, React ^19.0.0,
Prisma ^6.11.1, TypeScript ^5 — compatíveis com o handoff.

Workflow presente no snapshot: `.github/workflows/verify-clickgruda.yml`
(o workflow de deploy `deploy-clickteste.yml` será confirmado no clone do repo).

## 4. Repositório GitHub — estado (CONFIRMADO via VPS em 11/11/2026 ~14:35)

- `main`: fc02dfa531b4df2ebbfe1731e7b8267a49fab95e
- `feat/studio-click-mockup-2d`: fc02dfa531b4df2ebbfe1731e7b8267a49fab95e
- **Idênticas.** A branch de feature é exatamente a main; nada foi transferido ainda.
- Último commit: `fc02dfa fix: aceitar origem pública atrás do proxy reverso (login admin)`.
- Workflows presentes em main: `deploy-clickteste.yml` (deploy na VPS em push na
  main — NÃO disparar) e `verify-clickgruda.yml` (CI de verificação).
- PRs abertos: a confirmar via API do GitHub (o handoff registra nenhum no
  momento da consulta).

## 5. Templates do file.kiwi (BAIXADOS E VERIFICADOS em 11/11/2026 ~14:41)

Link: https://file.kiwi/cd56f846#nlOxx9xMYYGlogYWexdxTg
Local: ~/workspace/studio-click-2d/templates-download/ (94 arquivos, 256 MB extraídos)

- templates-webp-parte-1-de-2.zip — 116.500.586 bytes, SHA256
  9a82cac5d28adbb5ebe30a387b6b5a9311d3387bf36c5b3dbf5f6f0a3a668b0b,
  testzip OK, 55 arquivos (TEMPLATE_2-2 a TEMPLATE_56)
- templates-webp-parte-2-de-2.zip — 151.497.024 bytes, SHA256
  42c6100e930a54855696fa313f323632dd01541acd2ccb1e0fc5714eb3d30b3b,
  testzip OK, 39 arquivos (TEMPLATE_57 a TEMPLATE_95)

Verificação: todos os 94 são WebP de verdade (magic RIFF/WEBP), nenhum
inválido. São fotos de CENÁRIO (caneca em cena, retrato ~4:5, 1600–2500 px
de largura), não as artes — a arte 21×9,5 cm é projetada sobre elas.

Numeração observada (TEMPLATE_2 a TEMPLATE_95):
- FALTANDO: TEMPLATE_1.webp (não existe em nenhum dos ZIPs).
- Variantes "-2": TEMPLATE_2-2, TEMPLATE_10-2, TEMPLATE_26-2, TEMPLATE_27-2,
  TEMPLATE_40-2.
- Nomes com erro: "TEMPALTE_80.webp" (troca de letras) e "template_74.webp"
  (minúsculas) — corrigir na integração.
- Total: 94 arquivos. A meta de ~80 templates do handoff é de templates
  VERIFICADOS (cena + máscara/calibração + export); estas são cenas brutas,
  ainda sem máscara nem calibração registrada.

## 6. Riscos e decisões registradas

- NÃO fazer push na main, merge, force-push, rebase destrutivo, release ou deploy.
  O workflow deploy-clickteste.yml dispara em push na main e afeta o site real.
- NÃO executar deploy.sh, pm2 reload/restart, migrations em banco real, db push
  com DATABASE_URL de produção, nem alterar DNS/SSL.
- NUNCA versionar .env, tokens, chaves SSH, credenciais, segredos ou dumps reais.
- NÃO sobrescrever implementações mais recentes do repo usando o ZIP antigo
  como substituição integral.
- NÃO promover rota nova para o menu público/home. Acesso de desenvolvimento
  isolado, sem liberar a produção.
- NÃO afirmar 80 templates, build verde ou PR aberto sem evidência (manifesto,
  log, URL real).
- O módulo legado mockup-cenarios NÃO será reativado; o novo Studio 2D vive em
  rota própria e isolada.

## 7. Pré-check baseline do repo atual (executado 11/11/2026 ~14:47)

Detalhe em CI-BUILD-REPORT.md. Resumo:
- `npm run verify:creative`: ✅ PASSOU — 256/256 testes, 0 falhas.
- `npx tsc --noEmit`: ⚠️ 3 erros, todos de tipos do Prisma ausentes porque o
  client não foi gerado localmente (o download dos binários do Prisma trava
  atrás do proxy desta VM). Não são erros de código da aplicação. O CI gera
  o client antes do tsc.
- `npm ci` completo e `npm run build`: ⏸️ não executados localmente pelo mesmo
  motivo (binários do Prisma). A verificação oficial será o GitHub Actions
  no Draft PR.

## 8. Próximos passos (em ordem)

1. Aguardar o usuário enviar o ZIP da coleção do Work (ou confirmar o caminho B).
2. Concluir o download dos templates do file.kiwi e inventariá-los.
3. Concluir o clone do repo e comparar snapshot × repo atual × branch de feature.
4. Se o ZIP do Work chegar: inventariar (HANDOFF-INVENTORY.md), integrar só os
   arquivos auditados na feat/studio-click-mockup-2d, pré-check local, commit +
   push da branch, Draft PR, verificar CI.
5. Se o ZIP não chegar: apresentar ao usuário o plano de port do Wrap V2 +
   templates e só implementar após aprovação.
