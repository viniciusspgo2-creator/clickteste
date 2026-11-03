# Click & Gruda V5.5 — Backup portátil e proteção contra perda de arquivos

**Status:** staging; não homologado para produção; nenhuma alteração de banco ou deploy realizada.

## Falha corrigida

O Editor anteriormente serializava todo o documento como JSON `.cgdesign` sem materializar referências `blob:`. Tais URLs expiram com a sessão e tornam mídias impossíveis de recuperar após fechar a aba ou mudar de dispositivo. A nova função `createPortableProjectBlob` cria um snapshot com dados de imagens, máscaras, referências do template e vídeo incorporados ao JSON, preservando o documento original. URLs HTTPS referenciadas na composição também são incorporadas quando o navegador permite lê-las.

- Nova biblioteca `src/lib/creative/portable-project.ts` com cópias sem mutação, referências repetidas deduplicadas e limites de recursos/arquivo.
- O botão `.cgdesign` do Editor usa a exportação portátil e informa erros de mídia em vez de gerar backups incompletos.
- O salvamento manual no histórico do navegador incorpora referências temporárias antes de gravá-las no IndexedDB, até o limite de 28 MB desse histórico.
- O salvamento automático é suspenso enquanto houver `blob:` temporário, para não criar um rascunho aparentemente recuperável contendo URLs vencidas. A interface avisa para criar um backup `.cgdesign`.
- Ao importar `.cgdesign` antigo com referências `blob:`, o Editor avisa que a mídia precisa ser reenviada em vez de abrir uma composição quebrada sem explicação.
- A validação de SVG embutido em projetos também examina o XML quando está codificado em base64, para não aceitar scripts e referências externas disfarçadas.

## Testes realizados

- `npm run verify:creative`: **116/116 testes passaram** (110 anteriores e 6 novos).
- `node scripts/verify-source.mjs`: **267 arquivos de código, 668 imports locais, 0 problemas**.
- Chromium isolado: arquivo `.cgdesign` JSON contendo imagem PNG e vídeo local, ambos inicialmente com URLs `blob:`, foi produzido com os dados incorporados e sem alterar os objetos originais.
- `npm ci --offline` interrompeu em `ENOTCACHED` (pacote `zwitch` ausente do cache).
- `npm run build` interrompeu em `prisma: not found` devido à ausência de dependências npm. **Next.js e TypeScript integrados não foram homologados localmente.**

## Limitações importantes

1. Arquivos acima dos limites seguros são recusados com uma mensagem clara: 24 MB por mídia, 43 MB para backup JSON e 28 MB para histórico IndexedDB. Os limites evitam bloquear navegadores de máquinas com pouca memória.
2. O navegador deve permitir ler os arquivos externos, inclusive regras CORS. Mídias externas inacessíveis impedem gerar backup completo; o Editor não salva um `.cgdesign` quebrado silenciosamente.
3. Vídeos ainda podem ser grandes. A cópia `.cgdesign` não substitui guardar seus arquivos originais. O backup automático é suspenso quando há URLs temporárias; o usuário deve baixar `.cgdesign` ou salvar manualmente.
4. Nenhum recurso é enviado ao servidor durante a produção do backup. Dados já enviados explicitamente ao Assistente de IA seguem as regras daquele recurso, não deste backup.
5. O Studio 3D, MP4/WebCodecs com vídeos reais em ambiente publicado, integração da IA, compatibilidade total PSD/PDF e a tradução integral continuam exigindo homologação específica.

## Instalação e testes na `clickteste`

1. Atualizar apenas o repositório de testes, incluindo `src/lib/creative/portable-project.ts` e `tests/v55-portable-project.mjs`.
2. Verificar o GitHub Actions e o build Vercel.
3. No Editor, importar um PNG e um MP4 locais, salvar `.cgdesign`, fechar a aba e reabrir o projeto: os arquivos devem continuar disponíveis.
4. Tentar salvar um vídeo muito grande: o Editor deve avisar do limite sem baixar um backup inconsistente.
5. Conferir o histórico manual e o aviso de mídia temporária; exportações comuns PNG e MP4 devem continuar funcionando.

**Banco:** schema Prisma, migrations e variáveis de ambiente não mudaram. Não executar `prisma db push` por esta atualização.
