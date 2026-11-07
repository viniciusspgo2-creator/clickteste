# Validação da etapa 1 — 7 de novembro de 2026

Base: b4f4b88561cecf6f10400919dbe1ac369ea7227a, repositório CLICKTESTE.

## Resultados

- **79 verificações de integração passaram** usando PostgreSQL privado iniciado pelos testes em diretório temporário e interface 127.0.0.1. Nenhuma conexão com banco de produção foi usada.
- Schema anterior + flags desligadas: sessão legada, login mestre, monitoramento desativado e API indisponível funcionam antes de existir qualquer tabela nova.
- O SQL aditivo preserva integralmente códigos, usos e configurações fictícias previamente inseridas. A senha administrativa de teste e a validação HMAC continuam intactas.
- Credencial lembrada em cookie HttpOnly, com validade limitada pela licença; ausência de token no sessionStorage; concorrência de abas não rotaciona a credencial compartilhada; renovação de membro não reinicia o teste nem altera o vínculo.
- Trial cadastrado há dois dias continua com o Studio ativo: já passaram as 24h da Biblioteca, mas restam cinco dias do bônus. Revogação sem motivo ou com motivo LIBRARY_TRIAL_EXPIRED é rejeitada.
- Upgrade para MEMBER mantém código, navegador e token, retira a data final de teste e permite renovação normal da sessão de membro além do prazo antigo do trial.
- Logout, vencimento, bloqueio de navegador, proteção contra nova ativação, código universal com só um navegador bloqueado, revogação global e preservação de bloqueio administrativo durante atualização automática passaram.
- HMAC inválido/antigo, reutilização da credencial administrativa como chave da integração, campos de privilégio inesperados, mudança da data original, conflito/repetição de evento, oito entregas simultâneas e eventos fora de ordem foram exercitados.
- **Chromium com tela de acesso e admin reais:** reabertura com cookies e sem sessionStorage, abas simultâneas, falha de conexão com estado de trabalho preservado, monitoramento, bloqueio pelo admin e recusa de reativação passaram.
- **38 verificações existentes do editor passaram.**
- **TypeScript, ESLint dos arquivos alterados e build Next/webpack passaram.**

As rotas e a implementação de senha/login do Admin Master não foram alteradas. Não houve alteração de código no repositório da Biblioteca, aplicação de SQL em produção, alteração de ambiente da Vercel ou rotação de credenciais.

## Limites da evidência

O PostgreSQL e as contas exercitados são fictícios e locais. Isto comprova a execução dos módulos e as transações nessas condições, não a saúde dos cadastros reais. A base fictícia preservada não é um backup da produção. A restauração de um backup real, a aplicação controlada do SQL no banco correto e a validação dos dois sistemas juntos continuam sendo condições para ativar os recursos em produção.

A API do Studio está implementada, mas seu emissor na Biblioteca será a próxima etapa. Portanto, a entrega automática do código no cadastro real e a integração com pagamentos reais ainda não são fluxos disponíveis.

A presença informa contato/atividade da aplicação e não comprova que uma pessoa está ao teclado. Os dados de uma aba anterior à atualização começam a ser coletados quando essa aba abrir a nova versão. A janela de presença e os limites da lista estão informados no painel.
