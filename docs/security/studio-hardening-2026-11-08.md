# Segurança do Studio — 08/11/2026

Escopo: CLICKTESTE/Studio, Editor e APIs do mesmo projeto. A Biblioteca é outra aplicação e não foi alterada. A integração assinada existente foi testada por regressão, sem mudar o contrato.

## Correções

- Catálogo, arquivos R2, imagens de cenários e IA exigem sessão validada no servidor. O Master mantém seu caminho independente. Material inativo e acesso revogado continuam sem autorização. As respostas privadas não são compartilhadas por cache.
- O guard administrativo valida origem em mutações. Login/logout também verificam origem. Cookies com nomes falsos ou codificação inválida, assinaturas com componentes extras e expirações inválidas falham sem lançar erros públicos. Cookies administrativos são Secure em produção, além de HttpOnly e SameSite.
- O formato de tokens, a assinatura atual e os códigos existentes foram mantidos. O modo antigo ainda retorna e rotaciona bearer; um cookie HttpOnly somente de sessão permite carregar imagens/fontes que não enviam Authorization. A opção de lembrar o navegador continua separada.
- Login, ativação e IA têm contadores atômicos entre instâncias na tabela de chave/valor existente, em namespace reservado. Não há nova tabela ou migração. A limpeza limita o lote e revalida o prazo na exclusão. Ela não modifica SEO, senhas, usuários ou códigos. Há também limites locais com memória limitada e buckets independentes por finalidade.
- Se o banco falhar, o login não reativa uma senha antiga do ambiente. Sessões Master já assinadas continuam verificáveis. A verificação de scrypt no login é assíncrona e aceita os salts legados; senhas novas usam o mesmo formato e passam a exigir 12 caracteres. Nenhuma senha ou chave real foi trocada.
- JSON e multipart têm limites sobre os bytes efetivamente recebidos, cancelamento e prazo de leitura. Content-Length falso não contorna a proteção. Webhook mantém a assinatura dos mesmos bytes e o limite de 8 KB.
- Templates ZIP validam diretório, caminhos, quantidade, tamanhos declarados, tamanho efetivamente descompactado e CRC. Saída é processada em blocos, sem descompactar tudo antecipadamente. ZIP64, criptografia, entradas duplicadas, caminhos externos e estouro de orçamento são recusados. O template de demonstração existente passou pela extração e pelo Editor.
- Inflação de tabelas WOFF tem limite de saída. Exceções do banco/SDK não retornam detalhes nos erros de upload.
- HSTS, restrições de base/object/frame/form, ausência de X-Powered-By e mapas de fonte de navegador desabilitados complementam os headers anteriores. Não foi aplicada uma CSP que bloqueie scripts inline, workers, WebAssembly ou os ambientes externos usados pelo Studio.
- Scripts JSON-LD escapam `<` e o identificador de Analytics é limitado ao formato GA4 antes de compor JavaScript.
- Módulos de sessão, banco, assinatura e contadores são marcados server-only. Gitignore protege também bundles de chaves, exports de banco e credenciais locais.

## Dependências

Auditoria de produção antes: 11 alertas (5 altos, 6 moderados). Conjunto corrigido: zero alertas conhecidos na consulta ao registro npm em 08/11/2026.

Foram removidos dois pacotes sem referências no código (`@mdxeditor/editor` e `react-syntax-highlighter`). `sharp` foi atualizado para 0.35.5. Overrides corrigem `deepmerge-ts` e o UUID usado pelo ExcelJS. Houve validação nativa de alfa/redimensionamento, abertura/salvamento XLSX e composição; o CLI Prisma validou o schema com a dependência corrigida, sem conectar a banco. O deploy usa `npm ci` e `package-lock.json`, como antes.

A busca por padrões de chaves privadas e tokens no código versionado não identificou credenciais reais. Arquivos `.env` de produção não foram obtidos ou exibidos. Não houve rotação de credenciais ou invalidação em massa de sessões.

## Verificação

- `npm run verify:creative`: inclui regressões existentes e `security-boundaries.mjs`.
- TypeScript e ESLint.
- `tests/studio-security.mjs`: Postgres temporário, cookies/CSRF, concorrência de contadores, indisponibilidade do banco, autorização de arquivos/IA, compatibilidade bearer e ZIPs maliciosos.
- `tests/studio-access-stage1.mjs`: 79 verificações da integração, contas legadas, Master, persistência, revogações e concorrência.
- `tests/studio-access-browser.mjs`: login, duas abas, reinício do navegador, indisponibilidade temporária e bloqueio do dispositivo preservando o trabalho.
- `tests/separate-mockup-handoff-browser.mjs`: exportação, duas camadas, recuperação, modo anterior e importação real do template existente no Editor.

Os testes de banco usaram exclusivamente PostgreSQL local e temporário. Nenhum schema ou registro de usuário foi modificado no banco de produção pela validação.

## Limites e operação

Segurança exige acompanhamento; auditoria sem avisos não é prova de ausência de falhas. DDoS volumétrico também depende das proteções da hospedagem. A Vercel fornece mitigação automática de DDoS; a consulta à configuração WAF customizada retornou `Config not found`, e nenhuma regra ampla de bloqueio/Challenge foi ativada nesta entrega. Não foi habilitado Attack Mode nem comprado um novo serviço.

Os contadores de tentativas usam o banco já existente: uma indisponibilidade nele impede novos logins/ativações e a IA retorna indisponibilidade, sem abrir acesso indevido. A sessão Master já emitida continua independente dessa consulta. Recursos locais do Editor/Studio não são enviados ao servidor por esta mudança.

Assets estáticos e o JavaScript necessário à renderização no navegador continuam sendo entregues ao cliente. As correções não prometem impedir screenshots ou recuperar segredo que já tenha sido compartilhado fora do projeto.

Rollback: reverter o commit de aplicação e publicar novamente. Não há migração a desfazer, segredo novo obrigatório ou modificação de contas a reverter. Contadores internos remanescentes são dados auxiliares, separados dos registros de acesso.
