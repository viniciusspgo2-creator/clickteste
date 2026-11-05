# Guias puxadas das réguas

As réguas do editor agora criam linhas-guia, no fluxo conhecido de editores como o CorelDRAW:

- Arraste da régua **superior para baixo** para criar uma guia horizontal.
- Arraste da régua **lateral para a direita** para criar uma guia vertical.
- Arraste uma linha existente para reposicioná-la. Ao aproximar do centro da página, ela encaixa; Alt suspende esse encaixe.
- Para remover, solte a linha fora da arte ou selecione e use Delete. Esc cancela um arraste em andamento.
- Em **Guias livres**, informe a posição exata em mm/pixels, trave linhas, oculte-as ou limpe a lista. Recomenda-se travar as guias depois de posicioná-las para selecionar objetos sobre as linhas sem deslocá-las.
- Objetos e textos encaixam suas bordas ou centros nas linhas, respeitando o botão de encaixe inteligente. Alt durante o arraste do objeto suspende a atração. Guias ocultas deixam de atrair; guias travadas continuam servindo para encaixe.
- Arrastes criam uma única etapa de desfazer. As guias são salvas no `.cgdesign` e no rascunho; cada aba tem suas próprias linhas. Projetos antigos, sem guias, continuam abrindo.

As guias são auxiliares de edição. Não são desenhadas pelo renderizador e não aparecem em PNG, JPEG, WebP ou MP4. **Área segura** é o novo rótulo do botão que já mostrava a margem de impressão, distinguindo essa margem das guias livres.

## Recursos mais visíveis

A barra abaixo das opções do canvas apresenta a instrução de puxar guias e os atalhos **Biblioteca de artes** e **Importar SVG editável**. Ao selecionar um objeto, outra barra permite centralizar, ordenar, duplicar, travar ou apagar sem procurar no inspetor. Textos ganham negrito, itálico e cor nessa barra. SVGs têm acesso direto à edição das cores por parte. As colunas e o fluxo de edição existentes foram preservados.

## Implementação e validação

`DesignDocument.guides` é opcional e contém IDs, eixo, posição em pixels do documento e trava. O importador valida IDs únicos, coordenadas finitas e no máximo 100 guias. As coordenadas são calculadas pelo retângulo atual do canvas; zoom e rolagem não alteram a unidade armazenada. Trocar entre modelos internos mantém as guias, e abrir um novo documento usa as guias do arquivo aberto.

```bash
node tests/ruler-guides.mjs
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/ruler-guides-browser.mjs
```

O teste Chromium verifica criação nos dois eixos, reposicionamento, travas, encaixe de objetos, ocultação, posição em mm, zoom, remoção fora da página, cancelamento, desfazer/refazer, isolamento de abas e reabertura do projeto. Compara o SHA-256 do PNG com as linhas ligadas/desligadas. Também confere a barra contextual e se a arte inteira cabe na área móvel ao ajustar o zoom.
