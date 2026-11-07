# Revisão do acervo para impressão — 7 de novembro de 2026

Os dois lotes recentes (`rar-2026` e `nov-2026`, 361 itens) foram removidos a pedido do usuário. Os 288 primeiros elementos enviados permanecem com seus arquivos e identificadores originais. Os recursos nativos, os fundos e os padrões não fazem parte da remoção.

O novo lote usa curvas SVG reais ou PNGs originais sem perdas. As miniaturas WebP de até 192 px servem somente para navegação; inserir um item carrega o arquivo completo. A biblioteca informa o formato vetorial ou as dimensões reais do PNG. Uma imagem raster continua limitada pela resolução original; tamanho de impressão adequado depende da dimensão utilizada na arte.

## Critérios utilizados

- Inspeção da estrutura real de cada fonte: a extensão SVG/AI não comprova a existência de vetores. As 64 prévias Adobe contendo JPEG/marca d'água ficaram de fora.
- Conversão das fontes vetoriais sem rasterização, sem redução da precisão das curvas e sem simplificação destrutiva. Cores, transparência, contornos, gradientes e recortes locais são preservados.
- Remoção de fundos retangulares identificados e divisão por objetos completos. A recomposição das partes é comparada com a fonte limpa, incluindo preenchimentos internos e cobertura alfa. A inspeção visual adicional descarta conjuntos que conservem fragmentos de personagens vizinhos, mesmo quando a recomposição passe.
- PNGs mantêm a resolução original. Apenas margens transparentes podem ser aparadas sem reamostragem; os hashes dos pixels decodificados comprovam igualdade com o recorte original. Perfis ICC são mantidos.
- Arquivos que exigiriam reconstruir partes escondidas, melhorar artificialmente uma prévia, cortar corpos ou perder detalhes foram descartados. Personagens dos lotes antigos removidos não foram reintroduzidos.
- Coleções temáticas e categorias de ocasião separam materiais escolares, Natal, Halloween, astrologia, animais, formas, molduras e frases. Arquivos iguais são deduplicados.

## Rastreabilidade

[print-audit.json](print-audit.json) registra os arquivos aprovados, fonte e membro do ZIP, hashes de origem e saída, dimensões, comparação dos PNGs, indicadores de recomposição dos SVGs, itens removidos e hashes dos primeiros 288 preservados. Também lista os 13 ZIPs que excederam o limite de transferência de 32 MiB da ferramenta e não puderam ser analisados. Eles não foram considerados aprovados.

Arquivos enviados pelo usuário conservam essa identificação de origem; não é atribuída licença aberta às ilustrações.

## Verificação

```sh
node --test tests/uploaded-library.mjs
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/new-collections-browser.mjs
npm run verify:creative
```

O teste de navegador usa Playwright, Chromium e esbuild no mesmo mecanismo dos demais testes visuais do projeto. Verifica todos os novos materiais com o sanitizador do editor e a decodificação real, carregamento sob demanda, inserção sem sombra automática, PNG grande, backup/reabertura e exportação transparente.
