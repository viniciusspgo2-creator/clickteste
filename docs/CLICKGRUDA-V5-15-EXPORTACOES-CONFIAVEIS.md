# Click & Gruda V5.15 — Exportações completas e progresso real

**Base:** V5.14. **Destino:** apenas projeto de testes `clickteste`. **Produção / Neon / R2 / credenciais:** não alterados.

## Diagnóstico

Na V5.14, o Editor passou a confirmar que os bytes exportados correspondiam ao formato pedido (PNG, JPEG ou WebP). Porém, um arquivo *truncado* que ainda preservasse a assinatura inicial poderia passar no teste de formato. No MP4, a barra de progresso podia indicar **100% antes** da finalização e inspeção do contêiner, especialmente em vídeos curtos (1 ou 9 quadros).

## Alterações realizadas

1. `src/lib/creative/image-export-integrity.ts`: `assertExportBlobFormat` verifica também o início `IHDR` e a terminação `IEND` do PNG, o marcador final EOI (`FF D9`) do JPEG, e o tamanho RIFF mais o primeiro chunk VP8/VP8L/VP8X do WebP. A inspeção usa fatias pequenas de `Blob` (`slice`), sem decodificar a imagem inteira, recompactar o arquivo ou enviar dados para servidores.
2. `src/lib/creative/video-templates.ts`: função `safeVideoProgress` reserva 100% para o momento **depois** de `muxer.finalize()`, `inspectRenderedMp4` e conferência dos quadros. Atualizações intermediárias ficam no máximo em 99%. Não altera o codec, taxas, resoluções, geometria, transparência ou duração.
3. `tests/v515-export-boundaries-progress.mjs`: 11 testes novos de finais de arquivo, tamanhos incompatíveis, regressão de formato e controle do progresso. `package.json` atualizado para executar a nova suíte no check de CI.

## Verificações executadas nesta revisão

- `NODE_PATH=$(npm root -g) npm run verify:creative`: **204/204 testes aprovados** (193 anteriores + 11 novos).
- `node scripts/verify-source.mjs`: **273 arquivos de código, 676 imports relativos, zero problemas**.
- TypeScript estrito isolado para o módulo de imagens: **aprovado**.
- **Chromium real**: geração via `canvas.toBlob` de PNG, JPEG e WebP de uma arte de teste; formatos completos aceitos, formatos truncados rejeitados. Não é teste end-to-end do Editor Next.js.
- ZIP completo com pasta raiz `clicktools-main/`: conteúdo e CRC verificados na entrega.

## Limitações / próximos passos

- **Build completo não executado**: neste ambiente não existem as dependências locais do projeto e o registro npm está inacessível (`EAI_AGAIN`). `npm ci`, `prisma generate`, `tsc --noEmit` integrado e `next build` devem ser executados na CI ou na Vercel **da `clickteste`**.
- Verificação estrutural de cabeçalho/final de imagem não substitui decodificação nem controle colorimétrico/ICC da impressão.
- O MP4 completo ainda precisa ser **gerado e reproduzido** em Chrome/Edge no ambiente publicado, com arquivo real, WebCodecs e H.264; este ambiente Chromium não expôs `VideoEncoder` fora de origem segura. O teste da barra de progresso foi automatizado isoladamente.
- Assistente de IA com chave verdadeira, fidelidade visual da caneca 3D, PSD/PDF complexos e mobile continuam pendentes de homologação real.

## Roteiro de homologação sem afetar produção

1. Instalar este ZIP **somente** no repositório da `clickteste`, extraindo o conteúdo de `clicktools-main/`. Não rodar migrações nem apontar a aplicação para o banco de produção.
2. Conferir a CI: `npm ci`, `npm run verify:creative`, `npx prisma generate`, `npx tsc --noEmit` e `npm run build`.
3. Exportar PNG/JPEG/WebP de 1 arte simples e de 1 arte com imagem, texto e máscara. Abrir arquivos em visualizador externo.
4. Exportar MP4 curto (menos de 1 segundo) e MP4 de 20 segundos, em 720p/24fps e, se suportado, 1080p/30fps. Conferir a barra (máximo 99% antes da validação), reproduzir os dois vídeos completos, testar cancelamento e dispositivo sem WebCodecs.
5. Conferir Studio Mockup, projetos salvos e mobile. Promover para produção somente após passar a homologação.
