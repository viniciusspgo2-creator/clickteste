# Validação de staging — check-list obrigatório

- [ ] `npm ci` concluiu com sucesso, sem alterações inesperadas no lock.
- [ ] `npx prisma generate && npx tsc --noEmit` sem erros.
- [ ] `npm run build:staging` sem falhas.
- [ ] Banco Neon **de testes** recebeu `CreativeAsset` sem modificar dados da produção.
- [ ] Cadastro admin (PNG, SVG seguro, JPEG, WebP, WOFF2, MP4, Lottie JSON) e edição de tags/categoria e despublicação.
- [ ] Itens publicados aparecem nos painéis de templates, elementos, fundos e fontes do Editor e na galeria de Templates.
- [ ] Itens rascunho não são retornados ao público; exclusão realmente apaga do R2 e Neon.
- [ ] Arquivos do usuário NÃO aparecem em logs de POST nem em bucket R2/Neon.
- [ ] Editor: importação local, seleção, movimentação, resize, rotate, undo/redo, salvar/abrir .cgdesign, PNG/JPEG/WebP 50/100/200%, presets.
- [ ] PDF primeira página rasterizado de forma coerente; PSD rejeitado com aviso claro (não fingir importação).
- [ ] Studio 3D original: upload, acabamento, todas as poses, sombra, 1-4 canecas, screenshot, vídeo, GIF, lotes, folha, projeto local.
- [ ] Nova ponte Studio → Editor usa PNG transparente IndexedDB, sem POST de dados.
- [ ] Tela única de composição e adaptação a telas de 320, 768, 1440 px.
- [ ] WebGL em GPU integrada e nos navegadores Chromium/Firefox/Safari.
- [ ] Verificar `R2_ACCOUNT_ID` etc. separados do ambiente de produção.

**Estado atual:** TS/TSX sintaticamente verificados com TypeScript global; instalação de dependências e build real impedidos por DNS sem acesso ao registry do npm. Não homologado para deploy em produção.
