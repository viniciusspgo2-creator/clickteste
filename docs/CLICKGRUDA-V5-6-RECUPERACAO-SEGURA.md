# Click & Gruda V5.6 — Recuperação de projetos sem perda de trabalho

**Ambiente-alvo:** `clickteste` (staging). Esta versão não foi publicada nem homologada para produção.

## Problema encontrado

Até a V5.5, o arquivo `.cgdesign` passava por validação estrutural, mas a interface substituía imediatamente o projeto aberto sem confirmar que as imagens e máscaras podiam ser decodificadas. Um projeto com uma mídia corrompida podia ocultar a arte anterior e falhar apenas na exportação. Havia ainda risco de um carregamento assíncrono sobrepor alterações feitas durante a importação.

## Mudanças

- `src/lib/creative/project-media-check.ts` (novo): inspeção de imagens, máscaras e vídeo realizada **no navegador**, com até três decodificações simultâneas, reaproveitamento de resultados de URLs repetidas e mensagens por camada. Falhas de imagens/máscaras impedem a substituição; falhas de prévia de vídeo são avisos de compatibilidade (a composição pode continuar editável).
- `src/components/creative/creative-editor.tsx`: importação de `.cgdesign` e recuperação do histórico local só substituem o documento após a inspeção e após verificar que o usuário não modificou a arte durante a leitura. Se houver erro, a composição atual permanece aberta.
- Abrir um `.cgdesign` sobre uma composição com conteúdo passa a exigir confirmação explícita.
- Sair da página ou navegar ao início enquanto houver **alterações ainda não salvas** mostra uma confirmação do navegador. A referência de salvamento só avança após um salvamento local, backup ou rascunho automático concluído.
- Resetar a arte cancela carregamentos pendentes de projeto, evitando que um resultado antigo reapareça depois do reset.
- `tests/v56-project-recovery.mjs` (novo): regressões para deduplicação, imagem inválida, vídeo não suportado, máscara de template, limite de concorrência, proteção contra importações obsoletas e saída sem salvar.
- `package.json`: adicionada a suíte V5.6 a `npm run verify:creative`, executada também pelo workflow de CI existente no GitHub.

## Testes

- `npm run verify:creative` — **124/124** testes aprovados (116 prévios + 8 novos).
- `node scripts/verify-source.mjs` — **268 arquivos de código, 670 imports internos, zero caminhos ausentes**.
- Chromium isolado: PNG válido carregou normalmente, PNG inválido foi detectado como erro de imagem, máscara inválida detectada separadamente.
- `npm run build` — verificação de imports concluída; interrompido em `prisma: not found`, pois as dependências não estão instaladas integralmente neste ambiente. **Não é um build Next.js homologado**.

## Checklist manual para a clickteste

1. Fazer deploy do repositório de testes e aguardar o check GitHub/Vercel.
2. Salvar uma arte com PNG em `.cgdesign`, reabrir e confirmar que a arte foi recuperada.
3. Tentar abrir um `.cgdesign` com imagem inválida e confirmar que a arte atual permanece aberta; deve aparecer o nome da camada afetada.
4. Alterar a arte enquanto um projeto grande carrega: a importação antiga deve ser descartada em vez de sobrescrever a edição nova.
5. Abrir um projeto que contenha vídeo não decodificável: a arte permanece editável e o vídeo é sinalizado.
6. Navegar para a página inicial com alterações não salvas; confirmar que o navegador pede confirmação. Repetir após salvar no navegador ou baixar `.cgdesign`.
7. Testar reset, importação, histórico local, PNG/WebP e MP4 em desktop e celular.

## Limitações e privacidade

- A inspeção verifica se cada arquivo pode ser carregado; **não** garante fidelidade de cores, fontes instaladas, desempenho ou reprodução MP4 em todo navegador.
- A prévia de vídeo pode falhar em um navegador sem que o projeto inteiro esteja corrompido; neste caso a falha é apenas aviso.
- O código não faz upload de mídias do cliente para o servidor. Imagens referenciadas em URLs HTTPS existentes continuam sendo solicitadas diretamente do navegador, conforme CORS e disponibilidade da origem.
- A janela de confirmação ao sair depende do comportamento do próprio navegador; nem sempre é exibida em navegação móvel, fechamento forçado ou perda de energia. O `.cgdesign` continua sendo a forma recomendada de backup.
- A tradução integral PT/EN/ES, a calibração final da alça, o fluxo MP4/WebCodecs publicado e a IA com API real continuam precisando de homologação. Nenhuma migração Prisma ou mudança de variável de ambiente foi realizada.
