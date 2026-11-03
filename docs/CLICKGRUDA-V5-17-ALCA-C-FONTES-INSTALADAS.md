# V5.17 — Alça C 325 ml e instalação da coleção de fontes

**Origem:** ZIP completo V5.16 e arquivo `FONTES(2).rar` enviado pelo proprietário. **Destino:** apenas ambiente `clickteste`; não altera o banco, os buckets nem a produção.

## Alça

- Refiz o perfil `livesub` da caneca 325 ml como C contínuo, com 16 marcos, seção cerâmica mais robusta, encaixes discretos e continuidade do arco externo.
- Mantive o ID `livesub`, a geometria do corpo e todos os demais estilos, preservando `.cgstudio` existentes.
- Alça aplicada por padrão a canecas novas. A foto é uma referência visual, não uma malha 3D escaneada; a equivalência fotográfica só pode ser declarada depois de renderizar na `clickteste` e comparar em frente, costas, 3/4 e lateral.

## Fontes instaladas

- `scripts/install-font-collection.py` lê todos os ZIPs do RAR, incluindo arquivos com diretório central truncado mas entradas recuperáveis e extrai preferencialmente WOFF2, WOFF, OTF, TTF.
- Foram instaladas **597 faces distintas** de 167 pacotes ZIP internos do RAR; duas representações inválidas foram recuperadas por formato alternativo quando disponível. Cada face aparece como uma entrada pesquisável em **Fontes da sua coleção**; arquivos ficam em `public/fonts/clickgruda-collection/`.
- Fontes são carregadas sob demanda com `FontFace`, inclusive na reabertura e exportação de projetos: não faz downloads de centenas de arquivos ao entrar no Editor.
- Todos os nomes instalados estão no seletor de fontes da camada de texto. Os projetos armazenam o nome estável com prefixo `Coleção ·`.
- Inventário: `docs/FONTES-COLECAO-INSTALADA.csv`; resumo: `docs/FONTES-COLECAO-RESULTADO.json`.
- **Licenciamento:** fornecimento de arquivo não comprova autorização de redistribuição via site público. Antes de publicar o catálogo em produção, o proprietário deve verificar se cada licença permite web embedding e usos por assinantes. A instalação não concede direitos.

## Validação necessária

Compilar na Vercel com dependências presentes; testar exportação PNG/JPEG com fonts portuguesas, fontes sem acentos, reabrir projeto, verificar visual de alça C em WebGL no telefone e desktop; a construção por código não substitui esse teste visual. **Não enviar para produção sem aprovação.**

## Testes desta revisão

- Verificar `npm run verify:creative` e `tsc` estrito isolado de `typefaces.ts`.
- Teste próprio V5.17 confirma que 597 arquivos físicos estão presentes no pacote, com assinaturas de fonte válidas, nomes únicos, loader em cache e retry após falha.
- Chrome/Chromium real abriu 12 faces representativas de WOFF2, WOFF, OTF e TTF via FontFace e mediu texto sem fallback. O ambiente bloqueou requisições HTTP para localhost, então este ensaio usa URLs `data:`; o comportamento HTTP/CDN da Vercel segue pendente.
- Não foi possível compilar o projeto Next.js inteiro sem as dependências npm; não declarar deploy homologado por esses testes.
