# Painel Admin & Acesso PREMIUM — Click & Gruda Tools

## Acesso

- **Painel**: `/admin` (link discreto no rodapé). Sem indexação no Google (`robots.txt` bloqueia).
- **Senha inicial**: definida em `.env` → `ADMIN_PASSWORD` (padrão local: `gruda2026`). **Troque dentro do painel** (aba *SEO & Config → Senha do painel*), onde ela é salva com hash scrypt no banco.

## O que o painel faz

| Aba | Função |
|---|---|
| **Códigos** | Gera códigos de acesso PREMIUM (prefixo, quantidade, ativações por código, validade em dias, observação). Lista com busca, filtro por status (ativo/esgotado/expirado/revogado), copiar, revogar/reativar e excluir. |
| **Visitas** | Contador de visitas: hoje, 7/30 dias, sessões únicas, total, gráfico de 30 dias e páginas mais visitadas. |
| **SEO & Config** | Nome do site, URL canônica, título padrão, template de título, descrição, palavras-chave, imagem OG, Twitter @ e Google Analytics — tudo aplicado em tempo real ao site, sitemap.xml e robots.txt. Troca de senha e logout. |

## Como o acesso PREMIUM funciona

1. O cliente assina a **Biblioteca de Artes** → você gera um código (ex.: `CG-7K2M-9QPX`) no painel e envia a ele.
2. No site, ao abrir o **Mockup 3D**, aparece a janela de código. Ao validar:
   - o código é vinculado ao dispositivo dele (`deviceId` no localStorage);
   - cada ativação consome 1 vaga do limite configurado;
   - o mesmo dispositivo revalida sem consumir nova vaga;
   - revogado/expirado/limite estourado → acesso negado com mensagem clara.
3. Validação sempre passa pelo servidor (`POST /api/access/validate`) — o armazenamento local só guarda o código para conveniência.

## Variáveis de ambiente (`.env`)

```
DATABASE_URL=file:/home/z/my-project/db/custom.db   # SQLite (Prisma)
ADMIN_PASSWORD=...        # senha inicial do painel
ADMIN_SECRET=...          # segredo HMAC das sessões (12h de validade)
```

## Segurança embutida

- Sessão HMAC-SHA256 em cookie `httpOnly` (12h).
- Senha comparada com `timingSafeEqual`; novo hash scrypt ao trocar.
- Rate limit: 8 logins/10min por IP; 30 validações/10min por dispositivo.
- Guarda em todas as rotas `/api/admin/*`; `/admin` e `/api` fora do sitemap.

## Notas de implantação

- Banco SQLite em `db/custom.db` — faça backup dele junto com o código.
- Em deploy serverless (Vercel), o SQLite precisa de disco persistente; recomenda-se manter em VPS/Node ou trocar `DATABASE_URL` por um Postgres (schema Prisma é compatível).
- As visitas têm pruning automático de registros >120 dias.
