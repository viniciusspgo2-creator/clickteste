# Canecas independentes no Editor

Em **Exportar → Imagem → Continuar a criação no Editor de Artes**:

- **Enviar canecas separadas** renderiza cada caneca visível inteira, com fundo transparente, em uma camada independente. Prepare os ângulos de frente/verso no 3D antes de enviar. Não recorta uma foto das canecas juntas: as partes encobertas são renderizadas também.
- **Enviar composição completa** conserva o envio anterior de um PNG com o conjunto.

Cada captura isolada enquadra a peça inteira, incluindo a alça, preservando a direção da câmera. O zoom de apresentação não recorta essas camadas. A captura usa 2000 × 2000 px com supersampling e remove apenas margens transparentes. Sombra de chão não acompanha o arquivo; a iluminação da cerâmica permanece. A sombra pode ser definida para cada camada no Editor.

A captura não altera o histórico, os ângulos ou a visibilidade persistida do Studio. As demais peças ficam temporariamente invisíveis e são restauradas inclusive em erro. A fila de renderização é compartilhada com a prévia de imagem. Fechar a exportação interrompe os próximos passos do envio sem navegar ou gravar um lote parcial.

O lote fica somente no IndexedDB do navegador, expira após 24 horas e é escrito em uma única transação após todas as capturas. Há limites de 32 peças e 80 MB comprimidos. O leitor aceita o formato anterior de PNG único. Nenhum upload, nova tabela ou alteração de conta é necessário.

O Editor prepara e decodifica todas as camadas antes de aplicar o novo documento 1080 × 1350. Elas começam distribuídas, com proporção protegida e nomes do Studio. Mudanças feitas durante a leitura impedem a substituição do trabalho atual. O gatilho da URL é removido depois do sucesso; o rascunho mantém cada camada após recarregar. Modelos sociais e o formato Story continuam disponíveis no Editor.

## Validação

`tests/separate-mockup-handoff-browser.mjs` usa os componentes reais do Studio e do Editor, Chromium/WebGL e IndexedDB. Compara capturas de uma caneca com a outra sobreposta/oculta, injeta falha de codificação, usa o botão real para transferir, movimenta uma camada, reabre o rascunho e verifica a compatibilidade com PNG único. Os atalhos de inspeção existem apenas no bundle do teste.
