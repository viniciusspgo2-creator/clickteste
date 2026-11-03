# Click & Gruda V5.1 — Integridade de MP4 e diagnóstico pré-exportação

**Base:** V5.0. **Destino:** somente `clickteste` (staging). O projeto original/produção não foi alterado.

## Implementação concluída

1. **Inspeção estrutural do MP4 gerado**, em `src/lib/creative/mp4-integrity.ts`. Antes do download, o sistema percorre caixas ISO-BMFF, identifica `ftyp`, `moov`, `mdat`, trilha de vídeo (`vide`), codec `avc1`/`avc3`, dimensões no `stsd` e contagem de quadros no `stsz`. Detecta arquivo vazio/truncado, estrutura inconsistente, codec incorreto, resolução ou quantidade de quadros inesperada. Não envia dados para servidor.
2. **Exportação MP4 protegida**, em `src/lib/creative/video-templates.ts`. Depois da finalização do multiplexador, o buffer é validado antes de criar o arquivo de download. Um arquivo incompleto não é entregue como se tivesse funcionado.
3. **Diagnóstico mais antecipado.** O botão de testar MP4 agora confere também imagens e máscaras visíveis do Editor **antes** de decodificar quadros. Uma camada com arquivo ausente resulta em erro legível antes da exportação demorada.
4. **Testes reprodutíveis**, em `tests/v51-mp4-integrity.mjs` e dois pequenos vídeos de referência gerados para os testes: 320×180/24 fps e 1920×1080/30 fps. Ajustados os mocks de testes antigos para contemplar o novo validador; não houve mudança de comportamento nos módulos anteriores.

## Testes executados

- `NODE_PATH=$(npm root -g) npm run verify:creative`: **92/92 aprovados**, incluindo a regressão das versões anteriores.
- `node scripts/verify-source.mjs`: **262 arquivos de código, 660 imports locais resolvidos, nenhum ausente.**
- `tsc --target ES2022 --module ESNext --lib ES2022,DOM --strict --noEmit --skipLibCheck src/lib/creative/mp4-integrity.ts`: **aprovado**.
- Arquivos de referência criados com FFmpeg e verificados com `ffprobe`. O Chromium conseguiu ler os metadados do vídeo 320×180 por uma URL local de dados.
- O Chromium do ambiente bloqueia navegação a `file://`/`localhost` e não expõe `VideoEncoder` na origem de testes disponível. A exportação WebCodecs completa **não foi homologada** aqui.
- O build real Next.js **não foi executado**: as dependências npm necessárias não estão instaladas neste ambiente.

## Limites e honestidade técnica

Esta inspeção examina **estrutura e tabelas de amostras**. Não decodifica cada quadro nem substitui reprodução real. A confirmação definitiva exige gerar um MP4 no Editor da `clickteste`, reproduzi-lo no navegador e em player externo, observar duração/resolução/efeitos e repetir no celular. O arquivo continua sem áudio, com limite de 20 segundos e dependência de WebCodecs/H.264 suportado pelo navegador.

## Checklist de staging (sem mexer no banco)

1. Atualizar a `clickteste` pelo conteúdo do ZIP (pasta `clicktools-main`).
2. Confirmar `npm run build` na Vercel e revisar falhas de TypeScript caso apareçam.
3. Criar projeto com MP4 local, caneca PNG e máscaras, executar **Testar compatibilidade do MP4**.
4. Exportar 720p/24 fps e 1080p/30 fps, baixar arquivos e reproduzir nos players Chrome/Edge e VLC.
5. Testar um PNG/máscara intencionalmente inválido: a checagem deve interromper antes de iniciar a renderização.
6. Testar cancelar exportação e verificar que não aparece arquivo parcial no navegador.
7. Fazer testes em mobile com vídeo curto e resolução HD; navegadores sem H.264/WebCodecs devem mostrar aviso.

## Pendências priorizadas

1. **Homologação end-to-end:** build e execução real da V5.1 no Next.js, rotas, responsividade e teste no site publicado.
2. **MP4:** reprodução de arquivos exportados por navegadores/hardwares diferentes, otimização de desempenho e tratamento de ausência de WebCodecs; áudio e efeitos de timeline avançados são expansão futura.
3. **IA:** testar com chave de API real na Vercel; avaliar limites, privacidade, respostas em três idiomas e confirmação de ações antes de considerá-la robusta.
4. **Studio 3D:** geometria da alça e realismo da cerâmica exigem fotos frontal/lateral/traseira e medidas da caneca real, mais testes visuais de 360°, mesa e iluminação.
5. **PDF/PSD:** suporte segue parcial: textos PDF reconstruídos por aproximação e PSD RGB/8 bits raster em camadas; formatos e efeitos complexos não têm garantia de fidelidade.
6. **Internacionalização:** auditar integralmente páginas antigas, mensagens e painel administrativo para PT/EN/ES sem traduções faltantes.
7. **Qualidade de produto:** cenários inteligentes reais (mãos e sombras), importação em lote, biblioteca licenciada, testes desktop/mobile de memória e acessibilidade.

**Sem mudanças no Prisma, Neon, buckets, rotas ou secrets.**
