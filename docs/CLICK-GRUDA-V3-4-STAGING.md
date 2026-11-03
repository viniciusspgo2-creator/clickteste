# Click & Gruda V3.4 — pacote STAGING (02–03/11/2026)

> **Não homologado para produção.** Atualização incremental sobre a V3.3. O projeto original da Click & Gruda não foi alterado. Este pacote NÃO representa a conclusão de todos os recursos do briefing da plataforma.

## Recursos implementados nesta rodada

### Editor de Artes para Sublimação

- **Resetar projeto** com confirmação e aviso sobre descarte do documento/undo atual. Não remove arquivos exportados nem projetos salvos manualmente.
- **Histórico local**: rascunho automático e salvamento manual em IndexedDB, lista/restauração/exclusão, aviso de que o navegador pode eliminar os dados. Backup `.cgdesign` disponível. O conteúdo do usuário não é enviado para a API de criação.
- **Rotação** por alça circular sobre o objeto e por controle numérico.
- **Profundidade/camadas**: trazer à frente, subir uma camada, descer uma camada e enviar para trás; disponíveis para qualquer tipo de nó e registrados no undo/redo.
- **Espelhar horizontal/vertical**: imagens, textos, formas e objetos vetoriais rasterizados, também na exportação. O bitmap original é preservado.
- **Conta-gotas**: coleta pelo navegador quando a API está disponível, com modo alternativo de captura no Canvas. O tint de imagens monocromáticas é aplicado como silhueta, não como edição de caminhos vetoriais individuais.
- **Transferência Studio → Editor**: PNG com transparência sem sombra projetada no chão/contato; reflexos e sombreado dos materiais da cerâmica são preservados. O usuário pode configurar sombra novamente no Editor.

### Studio Mockup 3D

- Rodapé com atalhos para *Mover caneca*, *Mover cenário*, *Luz/sombra* e *Resetar*.
- Reset abre o diálogo já existente, sem apagar a arte inadvertidamente.
- No caminho específico de enviar ao Editor, remove grupos de sombra de piso/contato; exportações comuns de imagem e vídeo mantêm sua configuração anterior.

### Idiomas

- Modal de escolha no primeiro acesso, com 🇧🇷 PT, 🇺🇸 EN, 🇪🇸 ES; preferência local e troca posterior.
- Traduções estruturadas de controles mais usados e novas ações. **A tradução de toda a interface, painéis administrativos, documentação e conteúdo dinâmico ainda está INCOMPLETA**. Muitos textos continuam em PT-BR. Não apresentar como internacionalização 100% concluída.

### Admin: comunicados

- Reutiliza o cadastro existente para avisos, ofertas e recados.
- Nova rota `GET /api/public-announcements`: retorna SOMENTE comunicados `active`, públicos (`audience: all`), dentro da janela de publicação e limitados a 10 registros.
- Exibição discreta nas áreas gerais e no Editor de Artes, com frequência por navegador. O Studio 3D mantém sua implementação premium original, evitando aviso duplicado. Comunicados administrativos não aparecem para usuários comuns.
- A rota pública não oferece escrita e não expõe comunicados rascunho ou restritos.

### Guia interativo

- Novos tópicos documentados: camadas, espelhamento, reset e privacidade local.
- As ações contextuais disponíveis exigem confirmação. **Este guia é baseado em regras locais; NÃO é uma IA generativa com acesso completo às configurações ou ações arbitrárias.**

## Preservações de segurança e privacidade

- Uploads dos clientes permanecem no navegador; assets publicados pelo Admin são armazenados separadamente no backend/R2.
- Nenhum segredo ou arquivo `.env` está embutido no pacote. **Não reutilizar o banco de produção**; usar credenciais e storage da V3 de testes.
- Nenhuma migração Prisma nova foi adicionada nesta rodada, portanto `npx prisma db push` não é necessário para estas funcionalidades.
- PDFs têm renderização da primeira página (não reconstroem camadas); PSD ainda não é editável. Arquivos de fontes sem comprovação de licença de redistribuição NÃO foram instalados automaticamente.

## Itens de escopo maior ainda NÃO CONCLUÍDOS

- Alça/modelo 3D geometricamente idênticos à caneca Live Sub, que exigem medidas e referências de múltiplos ângulos, mais calibração e testes com a geometria existente.
- Remodelagem completa de iluminação/renderização, pós-processamento premium e todos os presets avançados do Studio.
- Tradução completa de 100% da interface para EN/ES, incluindo Admin e conteúdos personalizados.
- Importação de PDF/PSD preservando textos e camadas nativas em todos os arquivos.
- Agente com IA generativa e execução abrangente de funções com permissões por usuário.
- Template inteligente com máscaras automáticas de mãos/pessoas e edição de MP4 no Editor.
- Publicação automática das fontes enviadas pelo dono sem licença de redistribuição verificada.

## Verificações executadas

`node scripts/verify-v34.mjs`

- Verificação de sintaxe TypeScript/TSX em 14 arquivos alterados.
- Testes de unidade puros das quatro movimentações de profundidade (sem mutar o array original).
- Testes de espelhamento horizontal/vertical e preservação do original.
- Verificação estrutural da aplicação de espelhamento na renderização/exportação e do modo sem sombra no handoff.

**Não executado:** `npm ci`, `npm run build`/Next.js, TypeScript typecheck com dependências, Playwright/browser mobile/desktop, teste visual da alça e sombra na GPU. Este ambiente não possui `node_modules` e o pacote é entregue para validação em staging. Build com status Ready não garante funcionamento das rotas e interações.

## Deploy seguro

1. Repositório e conta Vercel isolados da produção original; banco Neon e bucket R2 separados.
2. Extraia o ZIP. Faça commit somente do conteúdo de `clicktools-main/` (a raiz real do Next.js).
3. Deixe `vercel.json` com `buildCommand: npm run build`. Não sincronize/migre banco automaticamente em cada deploy.
4. Configure as mesmas variáveis do projeto de testes que já funciona. Não cole segredos em chats/logs.
5. Faça deploy de teste e confirme: build, `/`, `/editor-artes`, `/studio-templates`, `/mockup-caneca-3d/studio`, `/admin`.
6. Teste com duas imagens sobrepostas: envie para trás, espelhe em X/Y, desfaça, exporte e compare pixels. Teste reset com confirmação, restauração local, mudança de idioma e aviso público do Admin.
7. Teste o envio do mockup ao Editor com fundo claro e com fundo escuro, conferindo sombra e acabamento. Se o resultado for inferior à V3.3, faça rollback do projeto de testes.
