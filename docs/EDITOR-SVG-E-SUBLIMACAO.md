# SVG editável e preparação de canecas

## Trocar a cor da camiseta, cabelo ou outro detalhe

1. Em **Uploads**, importe um arquivo `.svg`.
2. Selecione o desenho na arte e abra **Propriedades → Cores do SVG**.
3. Em **Por parte**, clique na região da prévia ou escolha-a na lista. A prévia marca a região com contorno rosa, que não aparece na arte exportada.
4. Escolha a nova cor. Preenchimento e contorno são separados; a transparência é preservada. Partes com a mesma cor podem continuar diferentes — por exemplo, mudar só a camiseta e manter o cabelo.
5. Em **Por cor**, uma troca alcança todas as partes com a mesma cor e transparência. Paradas de degradê aparecem como cores próprias na lista.

Os nomes vêm de IDs/rótulos do arquivo. Quando não existem, o editor numera as partes. Ctrl+Z desfaz. A opção **Baixar SVG personalizado** preserva o vetor, e o `.cgdesign` guarda a versão editada para continuar depois. A exportação PNG renderiza as cores novas normalmente. Se houver recoloração global/tint ou degradê aplicado à silhueta, editar uma parte remove esse efeito global; as cores individuais passam a aparecer. Isso também pode ser desfeito.

O desenho continua sendo **uma camada de imagem vetorial**. Esse recurso edita cores, não transforma automaticamente todos os paths em camadas independentes nem altera seus pontos geométricos. Um único path com regiões fundidas não permite separar semanticamente roupa e cabelo. PNG/JPG embutidos, links, scripts, animações, filtros e referências `use` não são aceitos pelo importador. Exporte como SVG simples, sem imagens incorporadas; prefira converter textos em curvas para preservar fontes.

## Preparação de estampa

Em **Posição e alinhamento**, a unidade pode ser alterada para **milímetros a 300 DPI**. Largura e altura preservam a proporção de imagens/textos; formas podem liberar a proporção. Alterar o tamanho do texto acompanha também espaçamento, curvatura e outros efeitos tipográficos.

Nos formatos de caneca, **Duas faces da caneca** permite centralizar na face 1/2 e duplicar um elemento no lado oposto. A cópia mantém tamanho, cores e orientação; não espelha frases. Elementos largos demais ou fora da página devem ser reposicionados/redimensionados antes. Cada cópia é uma camada independente, sem vínculo automático de alterações futuras.

O botão **Faces** mostra centros de referência. Como as guias de impressão e a régua, esses marcadores não são exportados. A posição física deve ser conferida na caneca e na prensa usadas. Imprima em tamanho real, sem ajustar à página.

## Implementação e verificação

O SVG importado é reconstruído em um documento XML separado, com elementos e atributos permitidos. Classes CSS simples e estilos inline são resolvidos para atributos antes de editar. Nenhum markup importado usa `innerHTML`. A prévia clicável usa elementos React criados somente a partir do documento já sanitizado, com IDs isolados para evitar colisões. O conteúdo permanece no navegador, sem envio à API.

Testes:

```bash
node tests/creative-precision.mjs
npm run verify:creative
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/editable-svg-browser.mjs
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/creative-precision-browser.mjs
```

O teste SVG usa uma ilustração geométrica original com cabelo e camiseta inicialmente da mesma cor. Exercita clique na região, recoloração independente/global, transparência, prioridade CSS, gradientes, recortes, conteúdo malicioso, medidas em mm, cópia nas faces, cores no canvas final, download SVG/PNG e reabertura do projeto. As ferramentas de teste (esbuild/Playwright) podem ficar fora do checkout; não foram adicionadas dependências ao aplicativo.

As quatro referências web foram tentadas novamente em 05/11/2026 e continuaram bloqueadas pelo proxy com HTTP 403. Foram acrescentados ao rascunho de rede `openpaint.app`, `krafto.org`, `phmatray.github.io` e `getstickerpack.com`, preservando os domínios anteriores. O rascunho salvo não aplica nem publica a configuração. Não houve cópia de código ou assets desses sites.

O TypeScript do editor e de suas dependências é validado isoladamente. O build completo continua dependente da liberação de `binaries.prisma.sh`, bloqueio anterior a estas mudanças. Os testes isolados não comprovam autenticação, banco ou implantação.
