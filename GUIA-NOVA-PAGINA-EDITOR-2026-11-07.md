# Nova página de entrada do Studio Click | 07/11/2026

## O que foi alterado

- `/editor-artes` mantém seu acesso protegido por `PremiumGate`, mas recebe novo layout inspirado no mockup aprovado: cenário de estúdio gráfico 3D com mascote, CTA laranja, cards escuros, seção de Google Drive, ferramentas de edição, referências, banner de parceiro, carrossel e rodapé com logotipo 3D.
- `/editor-artes/editor` e as funções do editor 2D **não foram alterados**.
- Nova página protegida `/editor-artes/ferramentas-guru` explica o serviço, divulga os exemplos de ferramentas e apresenta **somente** as ofertas de R$ 67,00 (30 dias) e R$ 177,00 (3 meses) usando os URLs de afiliado recebidos.
- Logos de marcas externas são buscados de seus favicons públicos pelo serviço de ícones do Google, sem substituir as identidades por desenhos de IA; conexão com a Internet necessária para visualizar esses favicons.
- As artes do hero, mascote e rodapé são arquivos WebP locais em `public/editor-welcome` para melhor desempenho.
- Todas as saídas externas abrem em outra aba com `rel` adequado. O carrossel possui botões e pausa em interação/redução de movimento.
- Foram incluídas reservas para banners, aulas e instruções futuras sem inventar conteúdos ou vídeos.

## AÇÃO NECESSÁRIA: links do Google Drive

A solicitação menciona quatro coleções, mas não trouxe as URLs. Elas permanecem corretamente marcadas como **Em breve** até configurar em **Settings → Environment Variables** da Vercel (Preview e Production) as chaves:

```
NEXT_PUBLIC_EDITOR_DRIVE_FUNDOS_URL=https://drive.google.com/drive/folders/...
NEXT_PUBLIC_EDITOR_DRIVE_PERSONAGENS_URL=https://drive.google.com/drive/folders/...
NEXT_PUBLIC_EDITOR_DRIVE_FORMAS_URL=https://drive.google.com/drive/folders/...
NEXT_PUBLIC_EDITOR_DRIVE_DIVERSOS_URL=https://drive.google.com/drive/folders/...
```

São permitidas apenas URLs HTTPS de `drive.google.com` ou `docs.google.com`; o recurso fica desabilitado sem URL. Variáveis `NEXT_PUBLIC_` são incorporadas durante o **build**, então é necessário fazer novo deploy após preenchê-las.

## Avisos

- Os sites de remoção de fundo podem limitar download HD no plano gratuito: a página evita prometer recursos não confirmados.
- Ferramentas Guru é um serviço terceiro com acesso compartilhado, e disponibilidade e catálogo podem mudar. A página informa que os links são de afiliado.
- Imagens originais geradas para este projeto e variantes de logotipo fornecidas pelo proprietário são reutilizadas exclusivamente nessa página.

## Referência do design aprovado

A captura original do layout aprovado está em `docs/EDITOR-2D-REFERENCIA-VISUAL-APROVADA.png`. Os textos e botões do novo código são nativos, acessíveis e adaptáveis ao tamanho de tela; não são uma única imagem estática.
