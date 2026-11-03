# Click & Gruda V5.0 — Diagnóstico pré-exportação de MP4 e robustez do assistente

## Base e escopo
Base: V4.9 com correções TS2304/TS18048. Alterações focadas em verificar compatibilidade antes de iniciar um MP4 custoso e em informar corretamente o estado do assistente quando a IA estiver inacessível. Não foram alterados geometria 3D, banco Neon, endpoints de upload nem esquema Prisma.

## Alterações

- `src/lib/creative/video-templates.ts`: novo `probeVideoExport()` que valida WebCodecs, consulta a configuração H.264 realmente disponível para resolução e FPS selecionados, lê metadados e um quadro do vídeo e identifica casos de canvas bloqueado por CORS. A verificação não produz um MP4 nem transfere o vídeo para um servidor.
- `src/lib/creative/video-templates.ts`: nova função `resolveVideoInterval()` compartilhada pela verificação e pela exportação, evitando discrepância no cálculo de início, fim e limite de 20 segundos.
- `src/components/creative/creative-editor.tsx`: botão **Testar compatibilidade do MP4** no diálogo de exportação; mensagem com codec, dimensões, resolução original e quadros estimados. Cancelamento da verificação quando o vídeo ou intervalo muda e quando a tela é desmontada. Resultado anterior é descartado ao trocar a qualidade/FPS.
- `src/components/platform/language-provider.tsx`: traduções PT/EN/ES dos novos comandos e avisos de compatibilidade.
- `src/components/creative/studio-concierge.tsx`: aviso explícito quando o provedor de IA falha; mantém o guia local ativo, sem apresentar a resposta como vinda da IA. Ajuda geral de fallback respeita a escolha de idioma nos idiomas não portugueses.
- `src/components/creative/creative.css`: estilo discreto para os detalhes do diagnóstico.
- `tests/v50-video-preflight.mjs`: testes de duração, resolução, codec, leitura do primeiro quadro, falha CORS, integração do botão e fallback da IA.
- `package.json`: registra os testes V5.0 no comando `npm run verify:creative`.

## Verificações executadas

- `NODE_PATH=$(npm root -g) npm run verify:creative`: **86/86 testes aprovados** (inclui regressões V3.6–V4.9 e cinco casos V5.0).
- `node scripts/verify-source.mjs`: **261 arquivos de código, 659 imports internos resolvidos, zero problemas**.
- Teste de TypeScript isolado da V4.9 aprovado; essa verificação **não substitui** `next build`.
- Instalação completa offline indisponível: `npm ci --offline` interrompido por ausência de pacote no cache npm (`ENOTCACHED`). Logo, não foi possível homologar o Next.js localmente.
- Chromium local não expôs WebCodecs em origem permitida no ambiente de testes. Portanto não se validou o fluxo real completo de codificação H.264.

## Testar na clickteste

1. Faça deploy apenas no projeto de testes usando a pasta `clicktools-main`. Não execute `prisma db push`; esta rodada não altera schema.
2. Abra o Editor de Artes, importe um MP4 **local**, entre em Exportar e selecione 720p/24 fps.
3. Clique em **Testar compatibilidade do MP4**. Confirme codec H.264, origem, duração e quadros. Troque para 1080p/30fps e repita.
4. Exporte um MP4 curto, abra o arquivo num player (não basta o download aparecer), confira 720p/1080p conforme a composição e confirme que a animação não perde quadros visíveis.
5. Com um MP4 remoto sem permissões CORS, o teste deve indicar que não é possível ler o vídeo, antes de tentar exportar.
6. Para o assistente, teste sem OPENAI_API_KEY (guia local), com API configurada (resposta real), e com provedor temporariamente indisponível (exibe guia local com status verdadeiro). Nunca cole chaves no chat nem no código.
7. Faça testes também em celular. Alguns navegadores, especialmente em dispositivos mais modestos, podem não oferecer codificação H.264 via WebCodecs.

## Limites importantes

O botão verifica **compatibilidade inicial**, não garante a renderização completa de arquivos grandes; codificação ainda depende de memória, processamento, codec e disponibilidade do navegador. MP4 continua **sem áudio** e com máximo de 20 segundos. PDF/PSD avançados e geometria fiel da alça não foram alterados nesta rodada. A instalação de dependências, a compilação Next.js e a homologação visual no site publicado permanecem pendentes. 
