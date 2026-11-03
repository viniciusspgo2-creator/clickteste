# Click & Gruda V3.9 — Camadas, pré-impressão e estabilidade

## Base
A versão foi criada por cópia da **V3.8 que compilou na Vercel**, sem tocar na plataforma original. Não há mudança de banco, rotas públicas ou novas dependências.

## Implementado

1. **Aba Camadas no Editor**: lista do objeto mais à frente ao mais atrás, seleção pelo nome, ocultar/mostrar, bloquear/desbloquear, avançar e recuar. As ações de visibilidade, bloqueio e ordem participam do histórico desfazer/refazer e são salvas no `.cgdesign` / rascunho local.
2. **Templates inteligentes**: planos de cenário e primeiro plano deixam de capturar os cliques destinados ao mockup. Continuam disponíveis pelo painel Camadas, com modo explícito "Mover esta camada de cenário no palco" quando desbloqueada. A mudança de template inteligente abre o painel Camadas.
3. **Bloqueio real de edição**: seleção de camadas bloqueadas não permite alterar suas propriedades, duplicar ou excluir; o botão de desbloqueio continua acessível.
4. **Visibilidade na prévia e na exportação**: o renderizador Canvas filtra camadas invisíveis; o mesmo renderizador é utilizado para gerar imagens e sobreposições MP4.
5. **Histórico menos pesado**: gestos do mouse usam snapshots imutáveis por referência, em vez de realizar `structuredClone` de toda a composição (incluindo dados base64) a cada gesto. Não há limite fixo de etapas, mas o navegador tem limites físicos de memória.
6. **Pré-impressão**: antes da exportação PNG/JPEG/WebP, verifica o formato 21×9,5 cm / 300 DPI, aponta textos fora da área visível aproximada de 19×8,5 cm, alerta sobre elementos invisíveis e informa que vídeo de fundo não entra em imagem estática. Avisos não substituem a prova física.
7. **Idiomas**: tradução básica dos novos controles de Camadas para português/inglês/espanhol, sem declarar o sistema inteiro traduzido.

## Testes executados neste ambiente
- `npm run verify:creative`: **27/27 aprovados**, com verificação de 254 arquivos de código e 648 imports locais.
- `python tests/v37-browser.py`: testes isolados no Chromium com PSD de camadas ZIP, máscaras + recoloração, animações e encaixe de templates aprovados.
- `python tests/v39-browser.py`: renderização de camadas ocultas, reveladas e foreground, conferindo RGBA real de pixels aprovada.
- A verificação estática do código não substitui o TypeScript completo, o build do Next.js nem testes E2E na aplicação.

## Limitações / validação necessária
- Não foi possível instalar as dependências do npm neste ambiente: erro de resolução DNS do registry.npmjs.org. **O comando `npm run build` não foi executado com dependências instaladas.** Verifique o build no projeto de testes Vercel.
- Verificar visualmente no navegador a movimentação e a seleção com templates que usam imagens e máscaras reais, no desktop e no mobile.
- Testar exportação MP4 real e IA com API configurada. Esses fluxos não foram homologados nesta rodada.
- PSD/PDF complexos ainda têm limitações estruturais e a alça 3D ainda precisa de calibração física para igualdade exata com a fotografia de referência.

## Checklist de teste na `clickteste`
1. Abrir Editor > Camadas. Criar 3 objetos, alternar Olho e Cadeado; verificar que o download não inclui os invisíveis.
2. Aplicar template inteligente de demonstração, importar uma caneca; conseguir selecionar a caneca sem que o plano frontal intercepte o clique.
3. Abrir o plano frontal na aba Camadas, desbloquear e ativar "Mover esta camada de cenário no palco" para reposicioná-lo.
4. Alterar ordem das camadas, desfazer e refazer.
5. Criar arte 21×9,5 cm, colocar um texto fora da área visível e abrir Exportar; conferir alerta.
6. Testar um texto e uma imagem com redimensionamento, salvar e reabrir `.cgdesign`.
7. Testar os fluxos Studio 3D → Editor → Template → exportação (PNG). Conferir shadows e encaixe.
8. No desktop e no mobile, confirmar que os botões de Camadas são legíveis e que o painel rola sem sobrepor o Canvas.

## Deploy
Atualize somente o repositório/projeto `clickteste`. Faça commit dos arquivos dentro de `clicktools-main` (não da pasta que contém o ZIP). Não é necessário executar Prisma `db push` nem trocar `DATABASE_URL`. Confirme o status **Ready** e depois execute o checklist no navegador antes de publicar qualquer mudança em produção.
