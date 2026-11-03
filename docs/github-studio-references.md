# Referências GitHub para o Studio 3D

Pesquisa verificada em **28/10/2026** por leitura dos repositórios públicos, licenças, documentação e `git ls-remote`. Os projetos abaixo foram escolhidos pela utilidade no Studio e pela compatibilidade com a base existente. Nenhuma dependência foi instalada por esta pesquisa; nenhum código ou recurso visual de demonstração foi copiado.

| Projeto | Aplicação concreta | Situação no Clicktools | Licença verificada / cuidado |
| --- | --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | Esmalte com `MeshPhysicalMaterial`, verniz sobre a estampa, iluminação física, PMREM e controle consistente de cor/exposição. | **Já utilizado**, versão instalada `0.186.1`. Prioridade: corrigir a composição do material existente antes de acrescentar efeitos. | [MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE). Recursos de exemplos podem ter licenças próprias. |
| [Drei](https://github.com/pmndrs/drei) | Softboxes com `Lightformer` dentro de `Environment`, reflexos de estúdio, sombras de contato e ferramentas de transformação. | **Já utilizado**, `10.7.9`. O rig existente já contém esses componentes; o ganho está em fazê-los responder aos controles e balancear as luzes. | [MIT](https://github.com/pmndrs/drei/blob/master/LICENSE). Evitar presets de HDRI dependentes de CDN em produção; preferir ambiente procedural ou arquivo próprio com licença conhecida. |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | Integração React do renderer, eventos de ponteiro em objetos, controle do ciclo de render e suspensão quando apropriado. | **Já utilizado**, `9.8.1`; compatível com o React 19 instalado. Adequado para arrastar canecas e evitar disputa entre gesto de objeto e câmera. | [MIT](https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE). Gerenciar captura/cancelamento do ponteiro e descarte de recursos GPU. |
| [Motion](https://github.com/motiondivision/motion) | Transições de layout e gestos para apresentação de recursos; animações que respeitam preferência por movimento reduzido. | A família **já está presente** como `framer-motion`, versão instalada `12.43.0`. O efeito de cards expansíveis também pode ser feito com CSS e estado React, sem migração de pacote. | [MIT](https://github.com/motiondivision/motion/blob/main/LICENSE.md). O projeto diferencia código aberto e recursos pagos; não importar itens do Motion+ sem licença. |
| [Postprocessing](https://github.com/pmndrs/postprocessing) | Candidato para uma evolução futura de antialiasing, color grading e efeitos combinados em menos passes. | **Somente avaliado, não adotado**. O Studio já possui `EffectComposer` e passes do próprio Three.js. A versão de referência `6.39.5` declara `three >=0.168.0 <0.187.0`, compatível com o Three instalado. | [Zlib](https://github.com/pmndrs/postprocessing/blob/main/LICENSE.md), não MIT. Uma migração exige comparação de memória, transparência na exportação e cor; não corrige falta de verniz por si só. |

## Decisões técnicas que a pesquisa sustenta

- Priorizar a base já instalada: material cerâmico correto, ambiente refletido e controles conectados oferecem mais valor imediato que adicionar outra biblioteca.
- `Environment` com filhos captura o conteúdo em um cubemap. Com `frames={1}`, mudanças nas softboxes precisam de recaptura explícita. A identidade do ambiente deve acompanhar os parâmetros que alteram seu conteúdo, como luz principal, preenchimento, recorte, cor e rotação.
- `Lightformer` representa a forma refletida das softboxes. Sua intensidade, tamanho e posição definem a faixa de brilho; bloom não substitui esse reflexo.
- A documentação do Drei alerta que seus presets de ambiente usam arquivos externos e não são destinados a servir como infraestrutura de produção. O ambiente procedural atual evita esse acoplamento.
- Manter uma única conversão final de cor e tone mapping coerente entre prévia e exportação. Se `Postprocessing` for adotado futuramente, seu pipeline deve substituir o atual de forma deliberada; não empilhar dois composers.
- Antes de importar qualquer HDRI, textura ou imagem dos exemplos, verificar a licença do **arquivo**, além da licença da biblioteca. A licença MIT do código não autoriza automaticamente todos os recursos de demonstração.

## Fontes técnicas consultadas

- [Drei: Environment](https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx) — captura de cubemap, `frames`, intensidade/rotação e observação sobre presets.
- [Drei: Lightformer](https://github.com/pmndrs/drei/blob/master/docs/staging/lightformer.mdx) — formas de luz emissivas usadas no ambiente refletido.
- [Three.js: MeshPhysicalMaterial](https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshPhysicalMaterial.js) e [PMREMGenerator](https://github.com/mrdoob/three.js/blob/dev/src/extras/PMREMGenerator.js) — material com clearcoat e pré-filtragem do ambiente.
- [React Three Fiber: README](https://github.com/pmndrs/react-three-fiber/blob/master/readme.md) — integração React e compatibilidade das versões principais.
- [Motion: README](https://github.com/motiondivision/motion/blob/main/README.md) — gestos, springs e transições de layout; distinção entre biblioteca e Motion+.
- [Postprocessing: README](https://github.com/pmndrs/postprocessing/blob/main/README.md) e [package.json](https://github.com/pmndrs/postprocessing/blob/main/package.json) — gerenciamento de cor, precisão dos buffers e intervalo de compatibilidade com Three.

HEADs remotos observados nesta pesquisa: Three.js `83f6bd095356c68334df7d9b7ec03a0abebff3fc`; Drei `bf6f4addf47467d3885de272d94ca5127f6ef68f`; R3F `d74622ea8ed717f7212d7e19d65ff3e325508389`; Motion `9ba8846b6819172cb829e65a9f46433a4de377ab`; Postprocessing `9cf03cff26615636a564d8bfddf765edb8917441`. Esses registros identificam a consulta e não alteram as versões travadas no projeto. As recomendações acima não equivalem a funcionalidades implementadas ou testes visuais aprovados.
