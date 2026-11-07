# Contrato da API da Biblioteca → Studio

`POST /api/integrations/library/entitlements` — não é uma API do navegador, de cadastro administrativo ou de pagamentos. Serve apenas para sincronizar o bônus que a Biblioteca autorizou.

## Requisição

Corpo JSON UTF-8, até 8 KiB. Campos extras são rejeitados.

```json
{
  "eventId": "03f928b0-7444-4620-93c4-de34c0823723",
  "version": 1,
  "libraryUserId": "identificador_imutavel_na_biblioteca",
  "name": "Nome do cliente",
  "entitlement": "TRIAL",
  "registeredAt": "2026-11-07T10:00:00.000Z",
  "trialEndsAt": "2026-11-14T10:00:00.000Z"
}
```

- `eventId`: UUID criado uma vez para aquela mudança. Reutilizar o mesmo ID/corpo nas retentativas.
- `version`: inteiro positivo, crescente por cliente; persistir junto à mudança na Biblioteca. Repetir uma versão com outro conteúdo/ID resulta em conflito.
- `libraryUserId`: ID do registro existente na Biblioteca, até 100 caracteres `[a-zA-Z0-9_-]`. Não usar nome ou e-mail como chave de vínculo.
- `name`: 1–120 caracteres.
- `registeredAt`: data original da criação da conta, obtida pelo servidor da Biblioteca, em ISO-8601. É imutável após o primeiro vínculo.
- `trialEndsAt`: obrigatório em TRIAL; exatamente registeredAt + 7 × 24 horas. Em MEMBER/REVOKED é opcional e, se informado, deve manter essa igualdade. As 24h de downloads pertencem apenas à Biblioteca e não são este campo.
- `entitlement`: TRIAL, MEMBER ou REVOKED.
- `revocationReason`: obrigatório somente em REVOKED, com ADMIN_REVOKED, ACCOUNT_BLOCKED, REFUND ou CHARGEBACK. Não aceita LIBRARY_TRIAL_EXPIRED, DOWNLOAD_QUOTA ou término do teste grátis. TRIAL expira pelo relógio do próprio Studio; não precisa desse comando.

**TRIAL** cria/atualiza o teste independente de 7 dias. Se o evento chegar depois dos 7 dias, mantém o prazo antigo e devolve active=false, sem estender o acesso.

**MEMBER** converte o mesmo código para acesso sem data final de teste. Preserva navegador e sessão existentes; a renovação da sessão lembrada segue sua política normal. Vale também se a compra ocorrer depois do teste. Um bloqueio administrativo continua tendo prioridade.

**REVOKED** encerra o acesso e sua sessão, com motivo administrativo/financeiro explícito. Não representa o fim das 24h ou dos 20 downloads na Biblioteca.

## Assinatura

Cabeçalhos:

```text
Content-Type: application/json
X-Library-Timestamp: segundos Unix atuais
X-Library-Signature: v1=<HMAC-SHA256 em hexadecimal minúsculo>
```

A chave é STUDIO_LIBRARY_WEBHOOK_SECRET, exclusiva dos servidores. O texto assinado é:

```js
const signed = `POST\n/api/integrations/library/entitlements\n${timestamp}\n${rawBody}`;
const signature = 'v1=' + createHmac('sha256', secret).update(signed).digest('hex');
```

Usar o corpo efetivamente enviado, sem reserializar após assinar. A janela aceita cinco minutos de diferença entre o relógio do servidor e o cabeçalho. Reassinar com timestamp atual a cada tentativa; manter o eventId e o conteúdo do evento. Não acrescentar query string. Cookie ou token de Admin Master não autoriza essa API.

## Resposta 200

```json
{
  "ok": true,
  "code": "CG-ABCDEF0123456789ABCDEF01",
  "libraryUserId": "identificador_imutavel_na_biblioteca",
  "version": 1,
  "entitlement": "TRIAL",
  "registeredAt": "2026-11-07T10:00:00.000Z",
  "trialEndsAt": "2026-11-14T10:00:00.000Z",
  "expiresAt": "2026-11-14T10:00:00.000Z",
  "active": true,
  "adminBlocked": false,
  "duplicate": false
}
```

Retentativa já recebida pode retornar `duplicate=true`. Evento antigo ainda não recebido pode retornar `stale=true`, com o estado atual. São confirmações de entrega; não reiniciar versão/código nem mostrar o estado antigo ao cliente. Em MEMBER, expiresAt=null significa código definitivo; uma sessão de navegador continua tendo validade própria. `adminBlocked=true` exige análise do administrador, não um novo código automático.

A Biblioteca deve guardar o código no registro vinculado e apresentá-lo somente ao próprio cliente autenticado. Não enviar segredo, código ou senha em parâmetros de URL nem em logs. `active=false` não significa falha de entrega: pode ser teste encerrado ou bloqueio respeitado.

## Erros

| HTTP | Tratamento |
|---|---|
| 400 | Corrigir contrato/datas/motivo; não reenviar indefinidamente |
| 401 | Corrigir assinatura/chave/horário; nunca usar login mestre como substituto |
| 404 | Integração desativada; conservar fila e conta, aguardar ativação |
| 409 | Evento, versão ou data original conflitante; reconciliar, não criar outro cliente |
| 413 | Reduzir corpo; não enviar projeto, imagem ou cadastro completo |
| 503 | Configuração/banco temporariamente indisponível; manter a fila e tentar novamente com o mesmo evento |

Quando o Studio estiver fora do ar, a conta da Biblioteca continua criada. Mostrar código pendente e retomar o mesmo evento mais tarde. O prazo continua contado da data original, sem reinício.
