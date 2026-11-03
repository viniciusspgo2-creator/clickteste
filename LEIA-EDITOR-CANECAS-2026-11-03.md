# Editor de Artes — Correção de PSD e novas ferramentas (03/11/2026)

## O que foi alterado

1. **Rastros de PSD**: a cópia visível do canvas agora limpa o quadro anterior (`clearRect`) antes de compor o novo desenho. Isso corrige o efeito de silhuetas acumuladas nas camadas transparentes durante a movimentação. A renderização/exportação de cada camada raster permanece a mesma.
2. **Duas abas no mesmo editor**: no máximo duas composições abertas; cada uma tem documento, histórico (desfazer/refazer), seleção e estado de salvamento independentes. A segunda aba começa vazia, ideal para importar outro PSD ou `.cgdesign`. A transferência é por seleção de camada, **Copiar (Ctrl+C)**, alternar aba, **Colar (Ctrl+V)**. Recortar camada (Ctrl+X) também é suportado.
3. **Borracha**: selecione uma imagem, abra as Propriedades e ative *Borracha livre*. Apaga áreas daquela camada apenas; Ctrl+Z desfaz. O estado é salvo no `.cgdesign` e utilizado na exportação. Para limpar a borracha sem perder o original: *Restaurar áreas apagadas*.
4. **Recorte**: os quatro controles já existentes para corte percentual continuam; *Aplicar recorte* cria uma versão recortada da imagem em camada, preservando a proporção. Ctrl+Z restaura. Máscaras continuam disponíveis.
5. **Curva Bézier**: em *Elementos → Curva Bézier*, adicione uma curva de quatro pontos. Arraste os dois extremos e os dois controles (alças) no palco; cor e espessura ficam nas Propriedades.
6. **Cores**: texto, retângulos, elipses, curvas e imagens possuem degradê linear ou radial com duas cores e ângulo. Em imagens, aplica-se à silhueta do objeto/ícone; fotografias mantêm as cores originais no modo sólido. A transparência continua no controle *Opacidade*.
7. **Guias**: botão laranja pulsante, com animação desativada quando o sistema prefere movimento reduzido.
8. **Ícones e objetos**: fonte Tabler Icons (licença MIT), catálogo de milhares consultado apenas quando o painel é aberto. Lista inicial com 72 cartões, botão para mostrar mais 72; miniaturas de ícones pretos aparecem em branco no fundo escuro. A biblioteca local original segue funcionando quando o índice remoto está indisponível.

## Segurança, desempenho e limites

- O projeto completo permanece **no navegador**. A segunda aba não é incluída no único rascunho automático; salve **cada aba** por `Salvar no navegador` e, preferencialmente, exporte um `.cgdesign` para cada arte antes de sair.
- O controle de duas abas limita os documentos **simultaneamente abertos**. Não há sincronização entre dispositivos nem histórico compartilhado entre abas.
- O catálogo ampliado depende de conexão de internet para carregar a lista e os SVGs escolhidos. Fontes de ícones: https://github.com/tabler/tabler-icons (MIT), SVGs em jsDelivr na versão 3.46.0, índice alternativo Iconify. A biblioteca original aparece em caso de falha de rede.
- PSDs importados continuam sujeitos ao formato já suportado: **PSD RGB/8 bits com camadas raster**; textos PSD, máscaras vetoriais complexas e smart objects não viram elementos editáveis nativos.
- Borracha e gradiente sobre uma imagem criam uma composição por camada no canvas; camadas grandes exigem mais RAM. O cache de efeitos já existente continua limitado pelo orçamento de pixels.

## Verificação

- `node scripts/verify-source.mjs`
- `npm run verify:creative` — 217 testes (211 anteriores + 6 novos).
- **Não foi possível rodar o build Next.js completo neste ambiente**, porque o pacote fornecido não contém `node_modules` e o ambiente não tem acesso ao registro NPM. No ambiente de deploy, faça `npm ci` e `npm run build` (ou use o build automático da Vercel).

Nenhum arquivo `.env` real foi criado nem chaves foram adicionadas ao pacote.
