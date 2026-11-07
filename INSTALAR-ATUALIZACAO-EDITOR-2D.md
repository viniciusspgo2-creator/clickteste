# Atualização visual da entrada do Studio Click — 07/11/2026

## Como aplicar
1. Faça uma cópia de segurança do projeto original `clickteste-main`.
2. Extraia este arquivo ZIP na mesma pasta em que está a pasta `clickteste-main`, aceitando substituir os arquivos de mesmo nome.
3. Use seu ambiente de desenvolvimento habitual para executar `npm ci` e `npm run build` (ou `npm run build:studio-safe`).
4. Configure os links do Google Drive conforme o guia `GUIA-NOVA-PAGINA-EDITOR-2026-11-07.md`.
5. Publique a versão revisada na Vercel.

**Escopo:** alterada apenas a página de entrada `/editor-artes` e adicionada a rota `/editor-artes/ferramentas-guru` para informações de parceiro; `/editor-artes/editor` permanece intacta. O ZIP é uma atualização sobre o projeto original, não um substituto do repositório completo.

**Importante:** não foi possível executar o build completo neste ambiente porque a instalação de dependências npm não terminou. Passaram a verificação de imports locais e os testes automatizados específicos desta entrada. Teste o build em um ambiente com dependências antes do deploy.
