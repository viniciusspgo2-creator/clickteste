# Correção do build — 02/11/2026

Erro informado pela Vercel: `TS2345` em `src/components/tools/mockup/ui/base-art-panel.tsx` ao chamar `renderBaseArt` com `MugState | CompanionMug`. A caneca acompanhante não possui todos os campos obrigatórios do estado da caneca principal, embora a renderização da arte da base precise somente das cores.

## Ajustes aplicados

- `src/components/tools/mockup/lib/base-art-canvas.ts`: o contrato de `renderBaseArt` agora exige apenas `baseColor` e `bodyColor` de `MugState`, pois são os únicos campos consultados pela função.
- `src/components/tools/mockup/ui/base-art-panel.tsx`: usa as cores da caneca selecionada e, quando não definidas para uma acompanhante, herda da caneca principal; não passa mais o objeto `CompanionMug` ao renderer.

Nenhuma tela, função do Studio ou esquema de banco foi removido. O ZIP é a versão completa V3 Fase 1 com o reparo acima.

## Validação e implantação

- Parser TypeScript dos arquivos modificados: aprovado.
- Verificações estáticas da assinatura e herança de cores: aprovadas.
- Build do Next.js **não executado aqui**: ambiente sem dependências instaladas e sem acesso ao registro do npm. Fazer o deploy apenas no projeto V3 de testes, sem substituir a produção.
- Na Vercel, use `npm ci && npm run build` (com variáveis de ambiente de **staging**) e examine o resultado integral dos logs. Se surgir outra mensagem de erro, não considerar esta correção uma homologação completa.
