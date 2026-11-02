# Studio Mockup 3D — foco e acesso

## Rotas e oferta

- `/`: apresentação do Studio com prévia 3D interativa e entrada premium.
- `/mockup-caneca-3d/studio`: editor premium, R$ 34,90/ano para avulsos; incluso para assinantes da Biblioteca Click Gruda. Pagamento e entrega de código são manuais pelo WhatsApp.
- `/bonus`: somente QR Code, WhatsApp, orçamento, PDF e Excel. Cada bônus tem sua própria rota `/bonus/<id>`, sem autenticação. Os componentes antigos permanecem no histórico/código, mas não são carregados na home nem exibidos no catálogo.
- `/admin`: Admin Master com acesso FULL ao Studio pela própria sessão, cadastro do nome/tipo do cliente, edição de validade e observações, revogação, reativação, exclusão e troca de navegador.
- URLs antigas `/?tool=qr`, `whatsapp`, `orcamento`, `pdf` continuam encaminhadas ao bônus correspondente. As demais ferramentas antigas encaminham ao catálogo de bônus.

Links da Biblioteca e suporte estão centralizados em `src/lib/studio-links.ts`. O número do suporte existente foi normalizado com o DDI brasileiro 55.

## Acesso por navegador e sessão

O primeiro login vincula o código ao hash de um segredo aleatório em cookie HttpOnly, SameSite=Strict. O limite é sempre um navegador. Não se usa um `deviceId` fornecido pelo cliente como prova de identidade.

O token de sessão é aleatório, fica em sessionStorage e tem somente o hash armazenado no banco. Todo login substitui a sessão anterior. Ao carregar a página, o token é rotacionado por uma operação condicional para impedir que a duplicação de uma aba compartilhe a mesma sessão. A interface verifica a sessão a cada 15 segundos e ao voltar à janela; revogação, exclusão, expiração ou substituição bloqueiam o editor. As sessões duram 12 horas. Não há modo offline com acesso liberado.

O vínculo inicial usa atualização condicional atômica no PostgreSQL: duas primeiras ativações concorrentes não conseguem ocupar o mesmo código. Trocar de navegador exige reset pelo administrador; o reset encerra a sessão atual. A validade anual começa na geração (365 dias), com ajuste manual pelo administrador. Biblioteca permite prazo em branco e revogação manual quando a assinatura termina; não há integração automática com cobrança ou status da Biblioteca.

Limites: como qualquer aplicação que renderiza no cliente, isso controla o fluxo normal de acesso e não é DRM para JavaScript baixado. Cookies copiados ou extensões comprometidas não podem ser distinguidos de forma absoluta. A limitação de tentativas é em memória por processo; instalações com múltiplas instâncias devem usar um armazenamento de rate limit compartilhado.

## Banco e aplicação

Novos campos aditivos em `AccessCode`: `clientName`, `clientType`, `browserHash`, `sessionHash`, `sessionExpiresAt`. O build já executa `prisma generate` e `prisma db push --skip-generate`; não foi executado contra produção. Antes de implantar, faça backup do banco e confira a mudança de schema. Códigos antigos recebem tipo Biblioteca e nome vazio; complete os nomes pelo painel. Eles serão vinculados ao primeiro navegador que fizer login após a atualização. Os registros legados de uso são preservados, salvo troca de navegador explícita.

O ambiente local usa somente `clicktools_dev` no PostgreSQL local, com `.env.local` ignorado. Nunca copie credenciais para este documento ou para o Git. Nenhuma publicação foi feita nesta tarefa.

## Cerâmica e exportação

O shader de fidelidade agora aplica o verniz acima da tinta, sem limitar o reflexo pela luminosidade da estampa. Estampas escuras recebem reflexos de softbox. Uma faixa vertical de luz no ambiente evidencia o acabamento, que continua obedecendo aos controles de polimento e verniz. O mapeamento UV inclui a metade externa da borda até o ponto mais alto (100% da altura). A metade interna e a cavidade permanecem limpas, com costura UV separada e normais suaves.

Imagens continuam com o número exato de pixels escolhido. O render interno usa até 4× por eixo, ou até 2× com pós-processamento, limitado pela memória/GPU; a interface informa o fator real no resultado. PNG é sem perdas; qualidade de JPG/WebP afeta compressão, enquanto DPI é metadado para impressão. Texturas das canecas adicionais passam a usar a mesma resolução de captura da principal. A renderização contínua é suspensa nos diálogos para reduzir trabalho gráfico desnecessário.

Atalhos: `?` abre ajuda, `Ctrl S` salva o projeto local, `Ctrl Shift E` abre exportação. Permanecem desfazer/refazer, duplicar, colar arte, mover por setas, enquadrar, giro e ferramentas. No Mac, use Command. Projetos continuam locais; o encerramento do editor solicita autosave.

## PDF e Excel

O PDF identifica texto selecionável por página, permite substituição visual e adição de texto, 12 fontes latinas padrão, tamanho, posição, cor, fundo, desfazer/refazer, zoom, leitura de múltiplas páginas e preenchimento de formulários nativos. Aplicar incorpora as alterações ao documento; exportar salva a cópia. Organização, rotação, seleção, remoção, mesclagem, marca d'água, numeração e metadados existentes continuam disponíveis.

A substituição cobre visualmente o trecho antigo e escreve texto novo; não é redação segura de informações confidenciais nem edição com refluxo de parágrafos. Fontes originais não são preservadas automaticamente. Páginas sem texto selecionável são sinalizadas, sem fingir OCR; anotações continuam possíveis. Emojis não suportados são rejeitados com mensagem. O arquivo é processado no dispositivo.

Excel lê XLSX e CSV localmente, com abas, busca, paginação, número de linha/coluna e exportação CSV do resultado. Fórmulas mostram o resultado já salvo no Excel; macros não executam. Arquivos XLS antigos precisam ser salvos em XLSX. Limites: 15 MB, 50 mil linhas e 250 colunas por aba, até 500 mil células XLSX. A saída CSV protege células que poderiam virar fórmulas ao serem reabertas.

## Verificações

- `npm run build` (carregar `.env.local` antes para o banco local).
- `npx tsc --noEmit` e `npm run lint`.
- `node docs/mockup-studio/regressions.mjs` (25 testes do motor 3D).
- `node tests/pdf-and-spreadsheet.mjs` (CSV e PDF com formulários/rotação/acentos).
- `node --env-file=.env.local tests/studio-access.mjs` com o servidor local ativo: só aceita o banco isolado e limpa seus próprios códigos ao final.
- Chromium/Playwright: home desktop e celular, cinco bônus, leitura/busca em XLSX, detecção de texto PDF e de página sem texto, substituição visual, exportação PDF e bloqueio do Studio sem sessão. Evidências e fixtures locais em `/workspace/clicktools-qa`.

### Evidências finais

O build de produção e os tipos passaram. Lint sem erros (5 avisos preexistentes no componente antigo de home, fora da navegação atual). Passaram 25 regressões 3D, 15 verificações integradas de acesso e 3 verificações de PDF/CSV. No Chromium, foram inspecionados arquivos reais: PNG 3000×3000 com 300 DPI, PNG 512×512 com alfa transparente e opção máxima 4× produzindo 4320×4320. Não houve erros de JavaScript nos testes de navegação nem nos de exportação. Os limites de memória podem reduzir a suavização interna, mas não o tamanho final solicitado.

As edições de texto em PDF permanecem ao alternar abas. A exportação principal inclui o rascunho atual mesmo antes de Aplicar ao documento; esse botão também permite incorporar a edição à prévia e às miniaturas antes de outras operações.
