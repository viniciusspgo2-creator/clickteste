# Validação — Mockup de Cenários e alças

Executada em 29/10/2026, com Chromium, Next local e PostgreSQL 16 em um contêiner exclusivo de testes. O banco de produção não foi usado.

## Fluxos confirmados no navegador

- Login premium real → editor estático, sem simular a API de acesso.
- Envio de arte → aplicação no modelo, preservando proporção e curvatura.
- Dupla → seleção por transparência do modelo → arraste de uma peça → desfazer.
- Logotipo opcional → posição/tamanho independentes.
- Cenário próprio → PNG de 3000 × 3000 px → prévia → download. **SHA-256 da prévia igual ao do arquivo baixado.**
- PNG transparente: pixel externo com alfa 0.
- Troca para JPEG e resolução de 2000 px: novo arquivo/prévia e transparência indisponível.
- Retrato 4:5: proporção do palco conferida numericamente no desktop e em viewport de 390 × 844 px, sem transbordamento horizontal.
- Admin → upload de cenário → publicação → busca e seleção no editor.
- Admin → upload de caneca transparente → preparação → grade aplicada → publicação → aplicação de arte no editor do usuário.
- Studio 3D: os quatro novos perfis de alça renderizam, podem ser selecionados e exportados. **Prévia da imagem e download com SHA-256 igual.**
- Nenhum erro de execução do navegador nos fluxos concluídos.

## API e armazenamento

- Escrita administrativa exige autenticação (401 para visitante).
- Upload validado e reencodificado → persistência em PostgreSQL → leitura de imagem.
- Imagens de rascunho não são servidas ao público; o admin pode conferi-las.
- Publicação libera o item no catálogo e a imagem correspondente.
- Publicação de modelo sem superfície válida é rejeitada.
- Miniaturas são consultadas separadamente; listas não retornam os bytes dos arquivos.
- Teste temporário com **1200 itens**: página 50 de 50, **24 itens por resposta**, busca/filtro e contagem corretos. A consulta medida levou 61 ms no ambiente local; não é uma promessa de latência da hospedagem.
- Arquivar um item revoga sua imagem pública, inclusive se o cliente enviar ETag anterior.

## Verificação de código e geometria

- `npm run build`: compilação de produção concluída, incluindo geração do Prisma, sincronização do banco isolado e rotas novas.
- Servidor standalone da compilação: apresentação e assets servidos, sessão admin validada, arte aplicada e prévia de 3000 px preparada no Chromium.
- TypeScript (`tsc --noEmit`): sem erros.
- ESLint em todo o código entregável: **0 erros**. Há 5 avisos preexistentes de navegação em `src/components/site/home.tsx`, arquivo não alterado nesta entrega.
- `tests/mockup-scenes.mjs`: **4/4**, incluindo geometrias finitas, normais, perfis distintos, apoio de todos os modelos em diversas poses, restauração/duplicação das seis alças, proporções, curvatura e validação da área de impressão.
- `tests/mockup-multi-scene.mjs`: **10/10**.
- `tests/mockup-movement.mjs`: **8/8**.
- `tests/art-quality.mjs`: **7/7**.
- Originais dos três modelos incluídos conferidos em **4096 × 4096 px**. Prévia leve e miniatura disponíveis separadamente.
- Inspeção de imports: runtime estático não depende da cena nem do estado 3D.
- `git diff --check`: sem erros de espaçamento.

## Verificações antigas com expectativas desatualizadas

A suíte preexistente `tests/admin-management.mjs` ainda simula apenas sessões individuais, não fornece `accessCodeUse.count` e espera o filtro antigo `browserHash`. O endpoint já usa vínculos em `AccessCodeUse` e agrega sessões universais na versão anterior a estas mudanças; a verificação de overview dessa suíte não passa sem atualizar seu mock. O endpoint de overview não foi alterado.

`tests/studio-access.mjs` fixa o nome/porta do banco e espera validade avulsa de 365 dias; a regra já existente no projeto é de um dia. Executando uma cópia temporária com somente essas duas expectativas ajustadas ao banco isolado e à regra atual, passaram **15 verificações de acesso**: vínculo, sessão única, validade, revogação, edição, reset, concorrência e admin. O teste original foi preservado.

Esses resultados não significam que todas as suítes antigas do repositório passam sem ajustes. O novo fluxo, as regressões 3D relacionadas e as verificações acima foram executados com sucesso.

## Limites de evidência

A validação descrita neste relatório ocorreu antes da publicação e não inclui homologação com hardware de todos os celulares. Uma fotografia arbitrária de caneca não foi tratada como um mockup automaticamente pronto: a preparação e seus limites estão descritos em LEIA-ME.md. As quatro fotos das alças não trazem medidas industriais; a implementação usa os perfis visuais fornecidos.

## Adição solicitada antes da finalização: cor do interior e seletor livre

- Corpo, alça e interior disponíveis separadamente nos controles principais, além de Caneca inteira.
- Seletor de saturação/brilho por arraste, faixa de tonalidade e entrada HEX.
- `tests/ceramic-colors.mjs`: **3/3**. Conversão RGB/HSV sem perda nas amostras de teste, conservação de tonalidade em branco/preto, edição independente, preservação da arte, restauração de projeto e proteção de peça bloqueada.
- Chromium no servidor standalone: arraste, teclado, entrada HEX válida/inválida, preservação das cores das outras partes e toque no celular confirmados.
- Exportação real da vista Topo / Interior: **133335 pixels** detectados na faixa roxa da cerâmica interna selecionada; não foi apenas uma atualização do campo de cor.
- Nenhum erro de execução do navegador. TypeScript e ESLint dos arquivos novos/alterados de cor sem erros. A compilação de produção foi repetida após a adição.
