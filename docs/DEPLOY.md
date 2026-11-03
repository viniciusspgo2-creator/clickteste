# Deploy — Click & Gruda Tools (Vercel + Neon)

## O que você precisa
- O código no GitHub (já está)
- Uma conta na Vercel (já tem)
- Um banco no Neon (neon.tech, plano grátis)

## Passo 1 — Criar o banco (só uma vez)
1. No neon.tech, crie um projeto.
2. Copie a "Connection string". Ela começa com `postgresql://`.
3. Use um banco só para este site. Não reaproveite o de outro projeto.

## Passo 2 — Colocar as 3 variáveis na Vercel
Vercel → seu projeto → Settings → Environment Variables.
Marque Production e Preview.

| Nome | O que colocar |
|---|---|
| DATABASE_URL | A string do Neon |
| ADMIN_PASSWORD | Uma senha forte para entrar no /admin |
| ADMIN_SECRET | Um texto aleatório com 32 letras ou mais |

Sem ADMIN_PASSWORD e ADMIN_SECRET o /admin fica bloqueado. É de propósito, por segurança.

## Passo 3 — Fazer o deploy
Cada mudança salva na branch `main` do GitHub faz a Vercel publicar sozinha.
O próprio build cria as tabelas no banco. Você não precisa rodar nada.

Acompanhe em Vercel → Deployments. Quando ficar "Ready", clique em Visit.

## Passo 4 — Conferir se deu certo
1. Abra `/api/admin/login`. Deve aparecer `"configured":true`.
2. Abra `/admin` e entre com a sua senha.
3. No painel, vá em "SEO & Config" e coloque o endereço real do seu site.
4. Abra `/sitemap.xml` e `/robots.txt` para ver se carregam.

## Se der problema
| O que aconteceu | O que fazer |
|---|---|
| Página 404 da Vercel | Settings → Build and Development Settings → Framework Preset = Next.js. Depois faça Redeploy. |
| Build falhou com erro de conexão ou tempo esgotado | Na DATABASE_URL use a string direta do Neon (host sem `-pooler`). |
| Build falhou com aviso de perda de dados | O banco é de outro projeto. Crie um banco novo só para este site. |
| /admin diz que está bloqueado | Falta ADMIN_PASSWORD ou ADMIN_SECRET. Cadastre e faça Redeploy. |
