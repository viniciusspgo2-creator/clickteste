# Realismo na mesa

No editor, use **Integrar à mesa**, na faixa acima da área de trabalho. Sem uma imagem selecionada, o botão aplica o efeito a todas as canecas visíveis e desbloqueadas recebidas do Studio. Com uma imagem selecionada, aplica somente a ela.

A integração mede a transparência do PNG para localizar a base física e adiciona uma sombra fina do contorno, além de uma projeção suave. Aplicar a sombra não move, redimensiona ou prende a caneca. O botão **Prender nesta posição** é opcional e captura a altura atual do ponto de contato, sem estimar a mesa por uma área genérica do template. Arrastar para os lados continua permitido. Ao redimensionar ou girar, o ponto de contato permanece na linha. **Soltar da mesa** permite voltar a mover livremente, mantendo a sombra; **Remover integração** remove os dois efeitos. Desfazer restaura o estado anterior.

Em **Realismo na mesa**, no painel de propriedades, ajuste intensidade, suavidade, direção, comprimento e linha da mesa. A linha verde é uma guia do editor e não aparece no arquivo exportado. A altura atual da base é preservada inclusive ao ativar o apoio. Trocar um cenário fotográfico existente preserva a composição proporcionalmente ao novo canvas e libera o apoio anterior; a mesa do novo fundo pode estar em outra altura. O reenquadramento genérico de templates inteligentes não é oferecido nesses fundos fotográficos. Esse recurso não reconhece mesas arbitrárias por IA: o usuário pode corrigir a linha conforme a perspectiva e a superfície da imagem. PNGs com fundo transparente dão o resultado adequado. Fotos com fundo opaco precisam de recorte prévio.

Tudo é calculado no navegador, sem serviços pagos, envio de imagem ou dependência de rede. As opções ficam no documento e no backup `.cgdesign`. A prévia e a exportação usam o mesmo renderizador. A sombra usa dimensões relativas à caneca, respeita recorte, borracha e máscaras e acompanha escala, cópia e mudança de cenário. Se alterar o recorte ou a base da imagem depois do encaixe, use Integrar à mesa novamente para recalibrar o apoio.

Validação: `npm run verify:creative` inclui testes de transparência, alvos e restrição geométrica. `tests/grounding-browser.mjs` verifica o fluxo real de duas canecas, controles, movimento, redimensionamento, soltura, tela estreita e pixels da sombra no PNG exportado. Usa o harness e as dependências de navegador externas já adotadas pelos testes de browser (`STUDIO_TEST_TOOLS`, `CHROMIUM_PATH`).

## Referências técnicas consultadas

- [Three.js: exemplo de sombras de contato](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shadow_contact.html).
- [Drei: implementação ContactShadows](https://github.com/pmndrs/drei/blob/master/src/core/ContactShadows.tsx).

Esses exemplos renderizam profundidade de uma cena 3D sobre um plano e desfocam o resultado. Um PNG isolado não contém geometria, profundidade ou o plano real da fotografia. A correção 2D usa o alfa do arquivo existente e um contorno estreito da base; não importa essas bibliotecas nem promete a reconstrução da cena ou detecção automática de mesa. O efeito não modifica pixels opacos da caneca.
