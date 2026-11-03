# CLICKTOOLS / Studio 3D — pacote de entrega do Bocão

**Data da revisão:** 02/11/2026  
**Objetivo:** entregar o Studio com a entrada do Bocão em destaque, rotação livre, interface simplificada e inspeção que não altera a pose da caneca.

## 1. O que mudou

- Navegação principal simplificada: Produto → Estampa → Bocão → Cenário → Luz e sombra. Controles especializados em **Mais**.
- Aba e botão de acesso direto ao Bocão; rotação por arraste, teclas, slider e passos de 1°/90°.
- Ajuste independente da escala e da posição da arte inferior e referência frontal na prévia circular.
- Painel de propriedades recolhido inicialmente; palco ampliável no desktop.
- Inspeção da base com câmera temporária que se restaura ao voltar, trocar de peça, desmontar o painel ou iniciar a exportação. **Para inspecionar a base quando estiver apontada ao piso, incline/deite a caneca primeiro.** Não é um sistema de câmera que atravesse o chão.
- Preservação da textura lateral, da geometria, do shader cerâmico, das cenas, dos exportadores, do formato `.cgstudio` e do estado local.

## 2. Testar antes de promover para produção

Na pasta que contém `package.json`:

```sh
npm ci
npm run verify:studio
```

O segundo comando **não publica**, **não executa `prisma db push`** nem aplica migrações. Ele roda testes existentes + Bocão, gera o cliente Prisma local, executa TypeScript, ESLint e `next build` diretamente. Ele pode falhar se o ambiente não alcançar o Google Fonts ou o registro npm; isso precisa ser resolvido no ambiente de teste, nunca desativando verificações. Se precisar de build isolado, use `npm run build:studio-safe`.

**Atenção:** o comando legado `npm run build` **continua inalterado** e executa `prisma db push --skip-generate` automaticamente. Antes de configurá-lo na Vercel, confirme se essa sincronização do banco é intencional e segura. Como não há alterações em `prisma/schema.prisma` nesta entrega, para testar o Studio recomenda-se `npm run build:studio-safe`, em ambiente onde o esquema do banco já esteja atualizado. O comando de build seguro não faz migrações automaticamente.

Há `bun.lock` e `package-lock.json`; este pacote foi preparado para `npm ci` com `package-lock.json`. Confirme o gerenciador de pacotes configurado na Vercel e sua versão de Node antes de enviar o deploy. Não troque lockfiles apenas para passar uma compilação.

## 3. Checklist visual obrigatório no preview da Vercel

- [ ] Abrir o Studio em desktop e celular. Ver **Bocão** na navegação principal e o atalho na Estampa.
- [ ] Selecionar caneca, carregar estampa lateral e imagem do Bocão. Verificar que a imagem inferior é independente da lateral.
- [ ] Arrastar o círculo pelo mouse/toque, atravessar 0°/359°, usar −1°/+1° e −90°/+90°, mudar tamanho e centralizar. Confirmar a direção da boca **no 3D**.
- [ ] Em caneca deitada/inclinada, usar **Enquadrar a base**, voltar e conferir que a caneca não mudou de pose. Abrir exportação e conferir que a câmera de inspeção não contaminou a composição.
- [ ] Salvar, atualizar a página e reabrir projeto local; exportar/importar `.cgstudio`. Testar duas canecas com Bocão independente.
- [ ] Exportar PNG e vídeo, comparando a arte inferior, enquadramento, transparência e estado da câmera antes/depois.
- [ ] Conferir que material, reflexo, cor cerâmica, alça, fundos, opções avançadas e demais controles continuam iguais.
- [ ] Em uma sessão real de teste, verificar avisos/comunicados com PostgreSQL e regras de autenticação; a API simulada não comprova isso.

## 4. Resultados que de fato temos nesta entrega

- 12/12 testes independentes do Bocão passaram.
- 6/6 testes isolados do visualizador final passaram.
- 213 arquivos TypeScript/TSX analisados sem erros de **sintaxe**. Isto **não** é uma checagem completa de tipos.
- Os arquivos originais de geometria, shader cerâmico, exportação, estado do projeto e Prisma foram comparados byte a byte e estão idênticos ao `TOK.zip`.
- Não foi possível instalar dependências neste ambiente (`registry.npmjs.org` sem resolução DNS), logo **não** foi possível concluir `tsc --noEmit`, ESLint, `next build`, Playwright/WebGL, validação real de PostgreSQL ou homologação em dispositivos reais.

## 5. O que não foi incluído deliberadamente

- Mudança de shader, material ou iluminação. O acabamento já aprovado não foi modificado.
- Enquadramento exato na exportação: permanece o modo automático existente.
- Preset automático de Bocão que detecta olhos/boca na estampa: o controle continua manual, sem reconhecimento de personagens.
- Deploy na Vercel, alteração de banco ou migração de produção.

**Critério de aprovação:** build seguro sem erros, testes automatizados passando e conferência visual real no ambiente preview. Não promover um deploy apenas porque a integridade do arquivo ZIP passou.
