# Click & Gruda V5.12 — Resiliência do assistente inteligente (staging)

**Base:** V5.11. **Destino permitido para testes:** projeto separado `clickteste` na Vercel. Não houve publicação, alterações de banco de dados, migração Prisma ou mudança de credenciais nesta rodada.

## Correções reais

1. **Limite do servidor abrangendo a resposta inteira:** a contagem de 15 s do endpoint `/api/creative-assistant` não é mais encerrada após os cabeçalhos HTTP do provedor. Continua até o corpo terminar de ser lido e o JSON ser interpretado. Respostas fragmentadas que param no meio são interrompidas em vez de manter a função pendente.
2. **Proteção do tamanho recebido:** a resposta do provedor possui limite de 16 KiB, verificado tanto por `Content-Length` como pelos bytes reais de respostas chunked. Erros de UTF-8 e JSON retornam fallback seguro (`unavailable`, HTTP 503), sem expor a chave.
3. **Timeout no cliente:** perguntas enviadas à IA terminam em até 20 s. Quando não há resposta, o guia local assume e o indicador de carregamento é liberado. Respostas antigas continuam impedidas de sobrescrever a pergunta atual.
4. **Verificação inicial:** a consulta GET de disponibilidade da IA tem limite de 6 s, com limpeza da chamada ao desmontar o painel.
5. **Privacidade e confirmação:** o endpoint recebe apenas pergunta, área, idioma e últimas perguntas (não imagens/PSD/projetos). A sugestão de ação continua limitada ao módulo ativo e exige confirmação do usuário.

## Arquivos relevantes

- `src/lib/creative/provider-response.ts` — leitor de resposta de IA com limites de tempo/bytes.
- `src/app/api/creative-assistant/route.ts` — usa o leitor antes de encerrar o timeout de 15 s.
- `src/components/creative/studio-concierge.tsx` — timeout cliente POST 20 s e consulta GET 6 s.
- `tests/v512-assistant-end-to-end.mjs` — testes novos de resposta fragmentada, limite, cancelamento, UTF-8, proteção de ações e envio de somente texto.
- `tests/v37-feature-checks.mjs` e `tests/v47-assistant-video-reliability.mjs` — atualização das simulações para o contrato da API novo, preservando as expectativas de segurança.
- `package.json` — `verify:creative` executa a bateria nova.

## Validação executada

- **176/176 testes automatizados passaram** (`npm run verify:creative`).
- **675 imports internos resolvidos, nenhum ausente** (`node scripts/verify-source.mjs`).
- **TypeScript isolado do novo leitor passou** (`tsc --strict --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM src/lib/creative/provider-response.ts`).
- **Análise de sintaxe TS/TSX** dos 3 arquivos principais passou.
- **Build Next.js integral não executado:** `npm run build` parou em `sh: prisma: not found` devido às dependências ausentes deste ambiente. O build deverá ser executado pela GitHub Actions/Vercel com `npm ci`, gerando Prisma e compilando TypeScript.

## Checklist para a clickteste

1. Publicar apenas no projeto `clickteste` — nunca copiar para a produção sem homologação.
2. Confirmar que `npm ci`, `prisma generate`, `tsc --noEmit` e `next build` passam no CI (o projeto já inclui o workflow de verificação).
3. Com `OPENAI_API_KEY` válido configurado **diretamente na Vercel**, pedir orientação na aba Editor e confirmar resposta/ações adequadas. Não compartilhar a chave nem colocá-la no ZIP.
4. Com a chave ausente, verificar se o guia local responde. Desabilitar acesso ao provedor temporariamente para verificar o fallback após o prazo, sem spinner eterno.
5. Testar perguntas rápidas em sequência, fechamento do painel durante uma chamada e controle de confirmação das ações.
6. Continuar homologação separada do MP4 H.264 exportado/reproduzido, Studio 3D realista, PDFs/PSDs complexos, idiomas e mobile; estes itens **não foram homologados pela V5.12**.

## Limites conhecidos

- O rate limit da API é por instância de servidor, não compartilhado entre instâncias. Para alto volume público será necessário um rate limit centralizado (Redis/KV ou similar).
- A V5.12 testa comportamento do endpoint com provedor simulado; **não** confirma resposta da API real, cobrança, compatibilidade com o modelo escolhido nem disponibilidade da rede.
- O limite de 16 KiB é adequado às respostas curtas de até 500 tokens; se futuramente for ampliado o `max_tokens`, deve-se reavaliar esse limite.
- Não foram alteradas geometria, sombreamento, PDF/PSD ou código de exportação MP4 nesta rodada.
