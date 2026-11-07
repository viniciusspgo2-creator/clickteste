# Etapa 1 — acesso persistente, monitoramento e integração com a Biblioteca

**Implementação do CLICKTESTE. Os novos recursos começam desativados.** Não há alteração de cadastro, pagamento, limite de downloads ou conta administrativa da Biblioteca neste repositório. Não são executados `db push`, reset, seed, migração automática de produção, importação de usuários ou troca de senhas/segredos.

## Regra de negócio confirmada

A Biblioteca é o produto mestre. Studio Mockup e Editor são bônus, sem venda avulsa do Studio.

| Acesso | Regra |
|---|---|
| Biblioteca gratuita | Até 20 artes em até 24 horas contadas do cadastro; termina ao atingir qualquer um dos limites |
| Studio/Editor gratuitos | Código emitido no cadastro, válido até cadastro + 7 dias |
| Biblioteca encerrada após 24h ou 20 downloads | Não revoga o teste de 7 dias do Studio |
| Compra/ativação confirmada do pacote | O mesmo código vira MEMBER, sem prazo de teste; o vínculo de navegador e a sessão são preservados |
| Contas e códigos anteriores | Continuam com seu comportamento e dados anteriores; não são convertidos em teste |

As 24 horas e os 20 downloads serão implementados no repositório da Biblioteca. O contrato desta etapa impede tratar o encerramento dessa oferta como motivo de revogação do Studio. O código do Studio expira pelo próprio prazo de 7 dias, sem precisar de evento de expiração enviado pela Biblioteca.

## Sessão no navegador

Com `STUDIO_PERSISTENT_SESSIONS=1`, o usuário pode marcar **Lembrar neste navegador**. A credencial fica em um cookie HttpOnly, SameSite Strict e Secure em HTTPS. O código não é guardado em localStorage. A sessão lembrada dura até 30 dias e é renovada durante uso autenticado quando restam menos de 15 dias. Nunca ultrapassa a validade vigente da licença.

Desmarcar a opção cria cookie de sessão com prazo de servidor de 12 horas. Sessões antigas válidas podem transitar do bearer da aba para o cookie sem recriar contas, trocar o código ou renovar em massa seus prazos. Um token antigo em outra aba não substitui o cookie válido compartilhado. Navegador anônimo ou cookies apagados exigem nova ativação.

O acesso continua conferido no servidor a cada 15 segundos. Em falha de conexão a interface pausa as ações, preservando os componentes e o trabalho aberto. Bloqueio/expiração também mantêm o trabalho montado atrás da tela de acesso. O admin continua usando sua autenticação original; suas rotas de login/senha e o segredo administrativo não foram modificados.

## Monitoramento

Com `STUDIO_MONITORING_ENABLED=1`, a aba **Monitoramento** recebe confirmações autenticadas de abas visíveis a cada 30 segundos. Mostra:

- nome associado ao código, referência mascarada, plano e navegador simplificado;
- Studio, Editor, Cenários ou Templates;
- online com contato nos últimos 90 segundos, sessão válida sem contato recente, offline, expirado ou bloqueado;
- atividade recente informada pelo cliente, distinguida de simples sessão aberta;
- validade e horários apresentados em America/Sao_Paulo;
- bloquear/desbloquear um navegador, encerrar uma sessão ou revogar o código inteiro.

Não coleta IP, conteúdo das artes, senhas ou tokens em presença/auditoria. O servidor confere a licença antes de registrar presença. A lista mostra os 500 contatos mais recentes e avisa quando alcança esse limite; os contadores e a busca são relativos a essa lista. Abas antigas sem a nova versão só aparecem após uma nova visita/atualização normal.

Bloquear navegador cria um registro persistente; apagar um uso não contorna o bloqueio. Em código universal, o bloqueio individual deixa os outros navegadores funcionando. **Revogar o código** encerra todos os navegadores e pede confirmação explícita do alcance. Desbloquear um navegador não restaura um token revogado: é necessária nova ativação válida. Ações administrativas são auditadas sem expor os códigos ou as credenciais.

O monitoramento é operacional. Uma confirmação de presença não prova identidade humana nem contratação externa; a licença e a Biblioteca continuam sendo as autoridades apropriadas.

## Banco e implantação

O schema só acrescenta três tabelas: `StudioPresence`, `StudioLibraryLink` e `StudioIntegrationEvent`. As relações reversas de Prisma não adicionam colunas em `AccessCode`. Não existe nova tabela de usuário/admin nem alteração da senha mestre. Códigos integrados não podem ser excluídos, para não perder o vínculo e reabrir testes; devem ser revogados. Plano e validade de códigos integrados são gerenciados pela Biblioteca, e não pelo formulário de edição local.

O SQL revisado está em [studio-access-additive.sql](../../prisma/reviewed/studio-access-additive.sql), com transação, espera de lock limitada a 3 segundos e execução limitada a 30 segundos. Cria somente as tabelas/índices novos e as referências a `AccessCode`. **Não o execute na Biblioteca.** Falha exige ROLLBACK; não habilitar flags após falha ou aplicação parcial. Reexecutar o script sobre uma estrutura já instalada não é necessário e falha sem apagar dados.

Sequência de ativação:

1. Verificar backup consistente e restauração do banco de produção em um destino separado. Comparar códigos, vínculos e configurações antes/depois. Os testes locais desta entrega não são backup de produção.
2. Conferir a versão publicada e aplicar o SQL revisado apenas no banco do Studio. Validar que as tabelas antigas e as credenciais continuam intactas.
3. Ativar a sessão persistente e depois o monitoramento com uma conta fictícia de homologação. Validar a entrada administrativa e códigos legados. A persistência sozinha não depende das tabelas novas, desde que as outras flags estejam desativadas.
4. Manter a integração desativada até a etapa da Biblioteca estar implementada e os dois lados testados com a mesma chave exclusiva da integração.
5. Somente então ativar a integração gradualmente para novos cadastros. Não associar códigos antigos automaticamente por nome/e-mail.

| Variável, somente no servidor | Padrão |
|---|---|
| `STUDIO_PERSISTENT_SESSIONS` | desativada; `1` ativa |
| `STUDIO_MONITORING_ENABLED` | desativada; `1` ativa após o SQL |
| `STUDIO_LIBRARY_INTEGRATION_ENABLED` | desativada; `1` ativa após o SQL e a etapa da Biblioteca |
| `STUDIO_LIBRARY_WEBHOOK_SECRET` | ausente; chave aleatória exclusiva com pelo menos 32 caracteres |

Não reutilizar `ADMIN_SECRET`, `ADMIN_PASSWORD` ou a senha dos clientes. Não colocar a chave em variável NEXT_PUBLIC_, mensagens de chat, código cliente, logs ou URL. Configurar separadamente cada ambiente; usar chaves diferentes em homologação e produção. A chave é compartilhada somente entre Biblioteca e Studio do mesmo ambiente. Não apontar homologação para o banco de produção.

Em reversão, interromper primeiro o envio de eventos na Biblioteca e a recepção na integração. Não apagar as tabelas, os registros, o histórico ou os vínculos. Antes de voltar a uma versão sem bloqueio individual, revogar os códigos que precisarem permanecer bloqueados, pois uma versão antiga não conhece esse bloqueio novo. Revogação do código inteiro continua respeitada pela versão anterior.

## API preparada

Consulte o [contrato](library-api.md). A API é de servidor para servidor, com HMAC sobre corpo/método/caminho/timestamp, janela de 5 minutos, limite de 8 KiB, validação estrita, ID imutável por evento e versão crescente por cliente. A criação e os recibos ficam na mesma transação, protegidos por locks PostgreSQL entre instâncias.

Reenvio não duplica código nem reinicia teste. Evento antigo não rebaixa um membro. Cadastro original não pode ser alterado. Atualização automática não retira um bloqueio manual. Reembolso/bloqueio têm comandos explícitos; a expiração das 24 horas da Biblioteca não é um deles.

## Validação desta entrega

- Testes de integração sobem um PostgreSQL privado em diretório temporário e porta de loopback. O cliente Prisma recebe essa URL explicitamente; não utiliza DATABASE_URL externa.
- O teste começa com o schema anterior e flags desativadas; verifica admin, sessão legada e integração indisponível antes de instalar a extensão.
- Compara registros antigos/configurações antes e depois do SQL; exercita cookies lembrados, concorrência de abas, validade, logout, presença, bloqueios individual/universal, HMAC, duplicidade simultânea, upgrade com mesmo código, evento atrasado e bloqueio manual.
- Chromium usa a tela real de acesso e o admin real com credenciais fictícias; testa nova aba, contexto de navegador reaberto sem sessionStorage, falha de conexão, trabalho preservado e bloqueio que impede nova ativação.
- Testes existentes do editor, TypeScript, ESLint e build também devem passar.

Ferramentas de teste em pasta separada via STUDIO_TEST_TOOLS: Playwright/Chromium, esbuild e embedded-postgres 18.4.0-beta.17. A dependência de PostgreSQL não foi adicionada ao aplicativo de produção.

```sh
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/studio-access-stage1.mjs
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/studio-access-browser.mjs
npm run verify:creative
npx --no-install tsc --noEmit
```

## Próxima etapa: repositório da Biblioteca

Implementar cadastro grátis com cota de 20 e validade de 24h somente para novos participantes; preservar todos os membros, histórico e contas administrativas. Guardar cadastro + 7 dias como validade independente do bônus. Persistir uma fila junto à operação do cadastro/pagamento para entregar eventos com retentativas, sem perder a conta quando o Studio estiver indisponível. Exibir código e estado de sincronização na área do usuário.

Compra confirmada envia MEMBER para o mesmo `libraryUserId`, remove apenas as restrições do teste daquele cliente e preserva contas/histórico. Esgotar 20 downloads ou 24h não envia REVOKED ao Studio. Implementar lançamento real de recebimento manual para clientes existentes, separando cortesia de pagamento, com data, valor, meio, responsável e prevenção de duplicidade. Não inventar evento Cakto para uma entrada manual nem duplicar a receita já registrada.
