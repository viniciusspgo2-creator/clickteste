# Fixtures sintéticas do visualizador

Sem dados, fotografias ou artes de usuários. Não são referências de fotorrealismo ou presets de Bocão.

- `artwork.svg`: transparência externa, cores saturadas, cinza, branco, preto, texto pequeno e linhas finas.
- `base.svg`: imagem inferior independente.
- `legacy-v1.cgstudio`: versão 1, uma peça, arte lateral e inferior; campos opcionais de acabamentos e edição novos ausentes. Mantém o contrato anterior, sem estado do visualizador.
- `multi-assets-v1.cgstudio`: duas peças com artes diferentes, base, fundo sintético e HDRI neutro de 4 × 2 pixels incorporados. O HDRI não é uma referência fotográfica.

Os projetos incorporam os SVGs em data URLs e usam os importadores reais do Studio. O teste de navegador importa o projeto legado, verifica assets e abre o resultado do exportador real. O caso com múltiplas peças verifica também a persistência portátil e IndexedDB. A navegação do visualizador não grava nada no projeto.
