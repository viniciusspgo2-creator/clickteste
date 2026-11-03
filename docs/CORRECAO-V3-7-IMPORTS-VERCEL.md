# Correção V3.7 — build Vercel: Module not found

## Causa reproduzida

O projeto continha uma regra `.gitignore` chamada `local-*` que ignorava qualquer arquivo iniciado por `local-`, inclusive os módulos TypeScript de produção `src/lib/creative/local-projects.ts` e `src/lib/creative/local-fonts.ts`. Esses arquivos existiam no ZIP entregue, mas podiam deixar de ser enviados ao repositório por ferramentas que respeitam `.gitignore`.

## Alterações aplicadas

- Renomeados os módulos para `src/lib/creative/browser-projects.ts` e `src/lib/creative/browser-fonts.ts`.
- Atualizadas as importações em `src/components/creative/creative-editor.tsx` e `src/components/creative/font-library.tsx`.
- Regra `.gitignore` alterada de `local-*` para `/local-*`, restrita a arquivos temporários na raiz do repositório.
- Referências dos testes locais atualizadas para os novos nomes.

## Verificações no pacote corrigido

- Varredura do grafo de dependências em 252 arquivos JS/TS/JSX/TSX, conferindo 644 imports internos: zero caminhos ausentes.
- `git check-ignore` nos arquivos dentro de `src`: nenhum arquivo ignorado.
- `node scripts/verify-v34.mjs` passou.
- `node tests/v35-editor-and-fonts.mjs` passou.
- `node tests/v36-feature-checks.mjs` passou (7 testes).
- `node tests/v37-feature-checks.mjs` passou (8 testes).

## Deploy

Substitua os arquivos do repositório GitHub da V3.7 pelo conteúdo deste ZIP completo e confira no commit os arquivos `src/lib/creative/browser-projects.ts` e `src/lib/creative/browser-fonts.ts`. O build da Vercel deverá deixar de apresentar o `module-not-found` de `local-projects`.

Nenhuma migração no Neon ou mudança de Environment Variables é necessária para esta correção.

**Limitação de homologação:** sem dependências npm instaladas neste ambiente, não foi possível executar um `npm run build` real. O deploy final deve ser validado na Vercel. Esta correção resolve a causa demonstrada do erro de importação, mas não garante ausência de erros futuros de build ou runtime.
