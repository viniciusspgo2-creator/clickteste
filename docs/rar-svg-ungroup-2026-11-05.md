# RARs e Desagrupar SVG

44 itens adicionados: 39 SVGs e 5 WebPs. A prancha geométrica foi dividida em 12 formas; 23 AI únicos dos ZIPs internos foram convertidos em SVG, preservando os personagens como objetos completos. Foram removidos fundos retangulares de página quando reconhecidos com segurança. Duplicatas foram descartadas.

## Limitação de transferência

`ARQUIVOS JUNTOS.rar` não foi processado: o upload excede o limite de 32 MiB por arquivo. Para continuar, é necessário reenviar dividido em partes menores que 32 MiB. `novosss.rar` e `outros.rar` foram processados, incluindo os ZIPs internos.

## Imagens rasterizadas

Quatro SVGs continham imagens raster embutidas. Outro SVG tinha 2,5 MB e mais de 5.000 partes, excedendo os limites de edição. Esses cinco desenhos foram incluídos como WebP, preservando a aparência original. Não são desagrupáveis.

## Como usar

Selecione um SVG vetorial no canvas e clique **Desagrupar SVG** no painel de propriedades. A função separa um nível por vez, conserva grupos internos, estilos, referências a degradês, máscaras locais e transformações. As camadas podem ser movidas, apagadas, recoloridas e novamente desagrupadas. A sombra global é removida, com aviso na interface. Desfazer/refazer restaura a operação inteira em uma etapa.

Limites: até 200 objetos por operação, 1.000 camadas no documento e os limites existentes de importação SVG. Não há separação semântica automática de personagens fundidos em um path. Transparência global, recorte, máscara do editor, borracha e efeitos precisam ser removidos antes da separação. Grupos com composição própria permanecem inteiros.

## Verificação

Testes de navegador: recomposição visual de fragmentos, grupos nomeados, transformações, degradês, rejeição segura, operação real no editor, desfazer/refazer e backup portátil; decodificação dos 44 materiais e reinserção dos 39 SVGs sanitizados. TypeScript e testes de catálogo/arquivos/precisão/guias passaram. ESLint dos módulos novos passou; o editor mantém os mesmos 9 erros e 2 avisos anteriores, sem novos diagnósticos.

## Itens e origem

- Capivara astronauta (WEBP): `uploads/rar-2026/rar-20261105-0-1.webp` — origem: `novosss.rar / novosss/creativecanvasdesign-capybara-10314924.svg`
- Coração aquarela azul e amarelo (WEBP): `uploads/rar-2026/rar-20261105-1-1.webp` — origem: `novosss.rar / novosss/manuchi-ukraine-7424066.svg`
- Mão com coração (SVG): `uploads/rar-2026/rar-20261105-2-1.svg` — origem: `novosss.rar / novosss/paftdrunk-hands-7107606e.svg`
- Mãos com laço de amor (WEBP): `uploads/rar-2026/rar-20261105-3-1.webp` — origem: `novosss.rar / novosss/paftdrunk-hands-7107606.svg`
- Casal apaixonado (SVG): `uploads/rar-2026/rar-20261105-4-1.svg` — origem: `novosss.rar / novosss/dandelion_tea-couple-7738917.svg`
- Capivara com café (WEBP): `uploads/rar-2026/rar-20261105-5-1.webp` — origem: `novosss.rar / novosss/creativecanvasdesign-capybara-10298276.svg`
- Capivara lendo (WEBP): `uploads/rar-2026/rar-20261105-6-1.webp` — origem: `novosss.rar / novosss/creativecanvasdesign-capybara-10301917.svg`
- Patinha laranja com coração (SVG): `uploads/rar-2026/rar-20261105-7-1.svg` — origem: `outros.rar / outros/yayangart-cat-8239223.svg`
- Patinha preta com coração (SVG): `uploads/rar-2026/rar-20261105-8-1.svg` — origem: `outros.rar / outros/yayangart-cat-8239213.svg`
- Flor mascote (SVG): `uploads/rar-2026/rar-20261105-10-1.svg` — origem: `outros.rar / converted/vectorportal-o7zXqpbvHk3Tk1k1469UMU2WxxmFwRruF2rXSXJY.svg`
- Rena natalina (SVG): `uploads/rar-2026/rar-20261105-11-1.svg` — origem: `outros.rar / converted/vectorportal-nrP0dwaOyQhRDEOz4ObS6BShfzwdNigVqiCiOWOI.svg`
- Picolé mascote (SVG): `uploads/rar-2026/rar-20261105-12-1.svg` — origem: `outros.rar / converted/vectorportal-sEN8G7iqK7EsAeAMShQ3TXxe0pQtRe7eAsn7XNr5.svg`
- Sorvete mascote (SVG): `uploads/rar-2026/rar-20261105-13-1.svg` — origem: `outros.rar / converted/vectorportal-9cRCsFauEWKuGPH8zOf5JfJPnn6TisZinw97qtaB.svg`
- Sol mascote (SVG): `uploads/rar-2026/rar-20261105-14-1.svg` — origem: `outros.rar / converted/vectorportal-c2CyDma5rLOrF4Cl7PZ1BfoA0fpaaTj8cD7zigsS.svg`
- Cogumelo mascote (SVG): `uploads/rar-2026/rar-20261105-15-1.svg` — origem: `outros.rar / converted/vectorportal-aFvCm0wDckDMZhW5RCY7DTxccKNgHCSxqtfhBw3C.svg`
- Árvore de Natal (SVG): `uploads/rar-2026/rar-20261105-16-1.svg` — origem: `outros.rar / converted/vectorportal-RNoenNMgGqXgvX90tweWlrtlKcQ97Z7Z3yEcH37S.svg`
- Lareira natalina (SVG): `uploads/rar-2026/rar-20261105-17-1.svg` — origem: `outros.rar / converted/vectorportal-AyKrTAPNSBwzpWun0SwiO3f5Qsz3dCiSzYhGaR6l.svg`
- Presente com balões (SVG): `uploads/rar-2026/rar-20261105-18-1.svg` — origem: `outros.rar / converted/vectorportal-QziWopabwFP2O8HmtQdLihADvpQ2E44umNx7O223.svg`
- Menina natalina (SVG): `uploads/rar-2026/rar-20261105-19-1.svg` — origem: `outros.rar / converted/vectorportal-HLdRYS0WvidhhXDg2e3fefkahhX5oZRr9AVYT7zk.svg`
- Fantasma mascote (SVG): `uploads/rar-2026/rar-20261105-20-1.svg` — origem: `outros.rar / converted/vectorportal-PGLuQri6ObqjQaVBUgUdXrslEBFbI0zUy1RUAwMW.svg`
- Papai Noel na chaminé (SVG): `uploads/rar-2026/rar-20261105-21-1.svg` — origem: `outros.rar / converted/vectorportal-9zYtN8axa1BI9dGmV6bCZIcYtKpScTn72Elr52Dq.svg`
- Papai Noel com presentes (SVG): `uploads/rar-2026/rar-20261105-22-1.svg` — origem: `outros.rar / converted/vectorportal-SO8TNKSLSjaIhkFr01gtbTJDAqD2AMVJYzxtfGd1.svg`
- Carro com pinheiro (SVG): `uploads/rar-2026/rar-20261105-23-1.svg` — origem: `outros.rar / converted/vectorportal-H8iyARaHKFDxsxMam3PO1FxfaGMjZ88MIUHs4D1W.svg`
- Arco-íris mascote (SVG): `uploads/rar-2026/rar-20261105-24-1.svg` — origem: `outros.rar / converted/vectorportal-9EtNFI0QRWcfMYrrV4qmu5wM3JPB2MTrMR72Nnkr.svg`
- Coração mascote (SVG): `uploads/rar-2026/rar-20261105-25-1.svg` — origem: `outros.rar / converted/vectorportal-h1Ap4jPcu32lIz4MRuLHGVaSjugHjiCrkgfZeB4l.svg`
- Foguete mascote (SVG): `uploads/rar-2026/rar-20261105-26-1.svg` — origem: `outros.rar / converted/vectorportal-U4y0v3jWEiPMARHhaawbO3Pc3RyJIUhny0tyMaSR.svg`
- Disco natalino (SVG): `uploads/rar-2026/rar-20261105-27-1.svg` — origem: `outros.rar / converted/vectorportal-ShB1Si3Rkee7gccE7Mc8n761STRt5H0mJfBQfWh7.svg`
- Presente mascote (SVG): `uploads/rar-2026/rar-20261105-28-1.svg` — origem: `outros.rar / converted/vectorportal-hAulurwZNSPDKxetdqVQo1VBvgYBd0GwSnd201ph.svg`
- Videogame mascote (SVG): `uploads/rar-2026/rar-20261105-29-1.svg` — origem: `outros.rar / converted/vectorportal-p5i4liwoT4YPyTSBfzF7xloMPAhDfDvfVVFDCexC.svg`
- Sinos de Natal (SVG): `uploads/rar-2026/rar-20261105-30-1.svg` — origem: `outros.rar / converted/vectorportal-uEMAwxwPm1at3rzpg8tWHIOMJyw8wuyoQtobbDAv.svg`
- Casal em viagem (SVG): `uploads/rar-2026/rar-20261105-31-1.svg` — origem: `outros.rar / converted/vectorportal-JwDEEok5GZmfd9UXLDLggyg21H1CmqlYqFx6BHlg.svg`
- Estrela mascote (SVG): `uploads/rar-2026/rar-20261105-32-1.svg` — origem: `outros.rar / converted/vectorportal-qNNs8QN01nmq8PbQ7cxZaYbBfcqXsLQzdwAluIqc.svg`
- Forma geométrica 1 (SVG): `uploads/rar-2026/rar-20261105-33-1.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 2 (SVG): `uploads/rar-2026/rar-20261105-33-2.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 3 (SVG): `uploads/rar-2026/rar-20261105-33-3.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 4 (SVG): `uploads/rar-2026/rar-20261105-33-4.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 5 (SVG): `uploads/rar-2026/rar-20261105-33-5.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 6 (SVG): `uploads/rar-2026/rar-20261105-33-6.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 7 (SVG): `uploads/rar-2026/rar-20261105-33-7.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 8 (SVG): `uploads/rar-2026/rar-20261105-33-8.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 9 (SVG): `uploads/rar-2026/rar-20261105-33-9.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 10 (SVG): `uploads/rar-2026/rar-20261105-33-10.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 11 (SVG): `uploads/rar-2026/rar-20261105-33-11.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
- Forma geométrica 12 (SVG): `uploads/rar-2026/rar-20261105-33-12.svg` — origem: `outros.rar / outros/set-of-geometric-shapessvg-extracted/Set of geometric shapes.svg`
