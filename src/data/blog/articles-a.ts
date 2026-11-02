/* ============================================================
   Artigos do blog — Grupo A (Sublimação e Mockups)
   Task 5-a · 8 artigos SEO em pt-BR
   ============================================================ */

import { CTA_LINKS, type BlogArticle } from './types';

export const ARTICLES_A: BlogArticle[] = [
  // ----------------------------------------------------------
  // 1. O que é Sublimação: Guia Completo para Iniciantes
  // ----------------------------------------------------------
  {
    slug: 'o-que-e-sublimacao-guia-completo-iniciantes',
    title: 'O que é Sublimação: Guia Completo para Iniciantes em 2026',
    description:
      'Entenda o que é sublimação, quanto custa montar seu mini estúdio, quanto dá de lucro por caneca e siga o passo a passo para vender canecas personalizadas.',
    category: 'Sublimação',
    tags: ['sublimação', 'canecas personalizadas', 'começar um negócio', 'guia para iniciantes'],
    date: '2026-09-20',
    keywords: ['o que é sublimação', 'sublimação de canecas', 'como começar na sublimação', 'lucro canecas personalizadas', 'equipamentos sublimação'],
    content: [
      {
        type: 'p',
        text: 'Se você já viu canecas personalizadas com estampas vibrantes que não descascam e não racham, viu sublimação em ação. A sublimação é o processo de transferir uma imagem impressa em papel especial para uma superfície revestida de poliéster usando calor e pressão. A tinta, aquecida a cerca de 180 graus, vira gás e se funde ao revestimento da caneca, virando parte do próprio objeto. O resultado é uma estampa permanente, resistente a lavagens e com aspecto profissional. É por isso que a técnica domina o mercado de canecas personalizadas no Brasil.',
      },
      { type: 'h2', text: 'Como a sublimação funciona na prática' },
      {
        type: 'p',
        text: 'O nome técnico é sublimação térmica: a tinta pula a fase líquida quando aquecida e vira gás, que penetra nos poros do revestimento de poliéster. Quando esfria, volta ao estado sólido já travado dentro da camada do objeto. Por isso a estampa não forma película por cima, como acontece com adesivos e serigrafia, e sim uma imagem integrada ao produto. Sem revestimento, a sublimação não funciona em cerâmica comum.',
      },
      {
        type: 'p',
        text: 'Na prática, você precisa dominar três pilares para ter resultado consistente:',
      },
      {
        type: 'ul',
        items: [
          'Papel sublimático: papel com camada especial que segura a tinta seca e a libera com o calor.',
          'Tinta de sublimação: corante específico do processo, aplicado em impressoras compatíveis com bulk ink.',
          'Superfície com revestimento: canecas, chaveiros e tecidos com no mínimo 70 por cento de poliéster.',
        ],
      },
      { type: 'h2', text: 'Por que canecas são o produto ideal para começar' },
      {
        type: 'p',
        text: 'Entre todos os itens sublimáveis, a caneca branca 11oz é o produto que melhor combina custo baixo, giro rápido e margem alta. Ela custa em média de R$ 4,50 a R$ 7,00 no atacado, é produzida em cerca de 3 minutos de prensa e tem aceitação universal: presente de Dia das Mães, amigo secreto, brinde de empresa e item de uso diário. A logística também é simples: uma caixa com 36 canecas ocupa meio metro quadrado e não tem validade. Com um catálogo pronto, você produz conforme o pedido chega e evita capital parado.',
      },
      { type: 'h2', text: 'Equipamentos básicos e quanto custa cada um' },
      {
        type: 'p',
        text: 'O investimento inicial para montar um mini estúdio em casa caiu muito nos últimos anos. Um kit completo cabe em uma mesa e produz de 20 a 40 canecas por dia sem dificuldade. Veja as faixas de preço praticadas no Brasil em 2026:',
      },
      {
        type: 'ul',
        items: [
          'Prensa de canecas de cilindro: de R$ 800 a R$ 1.500, conforme analógica ou digital, simples ou dupla.',
          'Impressora compatível com bulk ink de sublimação: de R$ 900 a R$ 1.400, sendo os EcoTank os mais usados.',
          'Kit de tinta de sublimação 4 cores: de R$ 120 a R$ 250, rende centenas de impressões.',
          'Papel sublimático A4: de R$ 0,50 a R$ 1,20 por folha em pacotes de 100.',
          'Canecas brancas 11oz com revestimento: de R$ 4,50 a R$ 7,00 em caixas fechadas.',
          'Fita térmica, luva e grade de apoio: cerca de R$ 50 no total.',
        ],
      },
      { type: 'h2', text: 'O processo passo a passo para sublimar sua primeira caneca' },
      {
        type: 'p',
        text: 'Com o equipamento em mãos, o fluxo de produção é sempre o mesmo e vira automático com a prática. A cada ciclo você ganha velocidade e desperdiça menos insumo. Siga esta ordem:',
      },
      {
        type: 'ol',
        items: [
          'Escolha ou crie a arte em alta resolução, com no mínimo 300 DPI no tamanho real de impressão, cerca de 21 por 8,7 cm.',
          'Imprima a arte espelhada no papel sublimático, na configuração de melhor qualidade da impressora.',
          'Recorte a folha, posicione na caneca e fixe com fita térmica, sem bolhas nem rugas.',
          'Prense a 180 graus por 180 segundos, com pressão firme e uniforme.',
          'Retire o papel ainda quente com luva, em movimento único e contínuo para evitar fantasmas.',
          'Deixe esfriar naturalmente sobre uma grade e confira o resultado antes de embalar.',
        ],
      },
      { type: 'h2', text: 'Quanto custa produzir uma caneca e quanto dá de lucro' },
      {
        type: 'p',
        text: 'Fazer as contas antes de vender é o que separa um hobby de um negócio. Abaixo está uma tabela de custo realista para uma caneca branca 11oz com arte completa, com preços de 2026 para compras em volumes pequenos:',
      },
      {
        type: 'ul',
        items: [
          'Caneca branca 11oz revestida: R$ 5,50',
          'Papel sublimático (fração A4): R$ 0,80',
          'Tinta de sublimação por impressão: R$ 0,30',
          'Energia elétrica por ciclo de prensa: R$ 0,15',
          'Caixa de presente e plástico bolha: R$ 1,80',
          'Custo total de produção: cerca de R$ 8,55 por caneca',
        ],
      },
      {
        type: 'p',
        text: 'Vendendo cada caneca entre R$ 29,90 e R$ 39,90, faixa comum no varejo online, o lucro bruto por peça fica entre R$ 21,00 e R$ 31,00. Produzindo 10 canecas por dia em 25 dias úteis, são 250 peças no mês, com faturamento potencial de R$ 7.400 a R$ 9.900 e custo de insumos de aproximadamente R$ 2.140. O segredo está em multiplicar os usos de cada arte e nunca competir pelo preço mais baixo da praça.',
      },
      { type: 'h2', text: 'Os erros que mais travam os iniciantes' },
      {
        type: 'p',
        text: 'A maioria dos problemas de quem começa tem solução simples e repetível. Os três campeões de retrabalho são a arte em baixa resolução, que imprime serrilhada; a temperatura ou o tempo incorretos, que lavam a cor; e a caneca de má qualidade, que amarela ou descasca na primeira lavagem. Teste sempre uma unidade antes do lote, anote a configuração que funcionou e repita a mesma combinação de papel, tinta e prensa.',
      },
      {
        type: 'p',
        text: 'Se quiser pular a etapa mais demorada, que é criar artes em alta resolução, a Biblioteca de Artes do Click & Gruda oferece centenas de modelos prontos para sublimar. O download é imediato, com pagamento único e uso livre no catálogo. Cada arte chega no tamanho certo para a caneca 11oz.',
      },
      {
        type: 'cta',
        title: 'Biblioteca de Artes para Canecas',
        text: 'Centenas de artes em alta resolução, prontas para sublimar e começar a vender hoje mesmo.',
        href: CTA_LINKS.biblioteca,
        label: 'Conhecer a Biblioteca de Artes',
      },
    ],
    faq: [
      {
        q: 'Preciso de computador para fazer sublimação de canecas?',
        a: 'Não necessariamente: dá para editar e imprimir artes pelo celular. Um computador simples, porém, facilita o controle de resolução e cores. Um notebook básico se paga na produtividade com o tempo.',
      },
      {
        q: 'A estampa da sublimação sai na lavagem?',
        a: 'Não, quando a caneca tem revestimento de qualidade e a prensa está regulada. A tinta vira parte do revestimento e resiste a lava-louças e micro-ondas. Estampa que sai na lavagem indica caneca ruim, temperatura baixa ou tempo curto.',
      },
      {
        q: 'Posso sublimar em caneca de cerâmica comum, sem revestimento?',
        a: 'Não. A tinta só se fixa em polímeros, como o revestimento das canecas próprias para sublimação. Em cerâmica comum, a imagem não adere ou sai por completo na primeira lavagem.',
      },
      {
        q: 'Quanto tempo leva para aprender sublimação?',
        a: 'O processo mecânico se aprende em poucos dias de testes. O que exige rodagem é a calibração fina de temperatura, tempo e cores. Em duas a três semanas de produção regular você entrega peças em nível profissional.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 2. Como Escolher Canecas para Sublimação
  // ----------------------------------------------------------
  {
    slug: 'como-escolher-canecas-para-sublimacao-11oz-15oz',
    title: 'Como Escolher Canecas para Sublimação: 11oz, 15oz e Tipos de Revestimento',
    description:
      'Saiba diferenciar canecas 11oz e 15oz, brancas, mágicas e de interior colorido, testar a qualidade do revestimento e escolher o melhor fornecedor.',
    category: 'Sublimação',
    tags: ['canecas para sublimação', 'caneca 11oz', 'caneca 15oz', 'revestimento', 'fornecedores'],
    date: '2026-09-24',
    keywords: ['canecas para sublimação', 'caneca 11oz', 'caneca 15oz', 'caneca mágica', 'qualidade do revestimento'],
    content: [
      {
        type: 'p',
        text: 'A qualidade da sua caneca sublimada começa muito antes da prensa: começa na escolha do insumo certo. Canecas aparentemente iguais podem ter revestimentos de qualidade muito diferente, e escolher errado significa estampas lavadas, amareladas ou que somem na primeira lavagem. Neste guia, você vai entender os tipos de caneca para sublimação, a diferença entre 11oz e 15oz, como testar o revestimento e como escolher fornecedor sem queimar dinheiro em lote ruim.',
      },
      { type: 'h2', text: 'Os principais tipos de caneca para sublimação' },
      {
        type: 'p',
        text: 'Todas as canecas para sublimação têm em comum o revestimento polimérico branco que recebe a tinta sublimática. O que muda entre os modelos é o acabamento e onde esse revestimento está aplicado. Conheça as cinco famílias que dominam o mercado brasileiro:',
      },
      {
        type: 'ul',
        items: [
          'Branca clássica: o padrão do mercado, com interior e alça brancos, a mais barata e a que entrega as cores mais fiéis.',
          'Interior colorido: branca por fora, com interior e alça coloridos, ideal para dar destaque ao produto sem perder a área de estampa.',
          'Colorida por fora: com pintura colorida externa, geralmente recebendo a arte em uma janela branca circular.',
          'Mágica: revestida de tinta termossensível preta que revela a imagem com líquido quente, vendida com margem bem maior.',
          'Formatos especiais: alça em coração, cone e outros nichos de presente, com menos giro e preço mais alto.',
        ],
      },
      { type: 'h2', text: '11oz ou 15oz: qual tamanho escolher' },
      {
        type: 'p',
        text: 'A caneca 11oz equivale a 325 ml e responde por cerca de 80 por cento das vendas do mercado brasileiro. Ela é a medida padrão das prensas de canecas, tem o melhor custo por unidade e a maior variedade de artes disponíveis. Se você está montando o primeiro catálogo, comece por ela: menos variável, mais giro e menos risco de estoque parado.',
      },
      {
        type: 'p',
        text: 'A caneca 15oz tem 450 ml, corpo mais largo e mais alto, e funciona como a versão premium da linha. Ela custa de 40 a 70 por cento mais para produzir, exige tempo de prensa maior, cerca de 210 a 240 segundos, e nem toda prensa de cilindro simples acomoda bem o diâmetro maior. Em troca, sustenta preços de venda mais altos e funciona muito bem em presentes corporativos e kits de casal, combinada com a 11oz.',
      },
      { type: 'h2', text: 'Como testar a qualidade do revestimento' },
      {
        type: 'p',
        text: 'Não confie no preço nem na promessa da embalagem: o único teste confiável é prensar. Antes de fechar qualquer lote grande, rode este protocolo com duas ou três unidades de amostra. O custo do teste é menor que R$ 10 e protege centenas de reais de insumo:',
      },
      {
        type: 'ol',
        items: [
          'Pressione uma folha de papel sublimático em branco a 180 graus por 180 segundos. Se a caneca amarelar ou manchar, o revestimento é ruim.',
          'Sublime uma arte colorida com degradês e pretos densos. As cores devem sair vivas, sem aspecto pálido ou lavado.',
          'Lave a caneca sublimada em lava-louças cinco vezes seguidas. A estampa deve permanecer idêntica à saída da prensa.',
          'Raspe levemente a borda e o interior com a unha. Revestimento bom não solta pó nem descasca.',
        ],
      },
      { type: 'h2', text: 'Fornecedores nacionais vs importados' },
      {
        type: 'p',
        text: 'Fornecedores nacionais, como atacadistas de sublimação e distribuidores de insumos, entregam em dias, facilitam trocas e costumam manter o padrão de revestimento estável entre lotes. O preço por caneca fica entre R$ 4,50 e R$ 8,00, dependendo do volume e da região. Para quem vende com prazo prometido ao cliente, essa previsibilidade vale a diferença de preço.',
      },
      {
        type: 'p',
        text: 'Canecas importadas, compradas direto de marketplaces internacionais, chegam a custar de R$ 3,00 a R$ 5,00 por unidade em caixas de 36, mas exigem espera de semanas, correm risco de quebra no transporte e podem variar de qualidade entre lotes. A estratégia comum de quem já produz em escala é manter o estoque base com fornecedor nacional e testar lotes importados em pequenas quantidades antes de escalar a compra.',
      },
      { type: 'h2', text: 'Preço médio por unidade e onde comprar' },
      {
        type: 'p',
        text: 'Para planejar custo e margem, trabalhe com faixas de preço em vez de valores únicos, porque volume e região mudam tudo. Use as referências abaixo, baseadas em práticas comuns do mercado brasileiro em 2026. E sempre peça cotação por caixa fechada antes de fechar a compra:',
      },
      {
        type: 'ul',
        items: [
          'Atacadista nacional de sublimação: R$ 4,50 a R$ 8,00 por unidade em caixa de 36.',
          'Lojas de insumos locais e papelarias técnicas: R$ 6,00 a R$ 10,00, com compra fracionada.',
          'Importado por marketplace internacional: R$ 3,00 a R$ 5,00, mais frete e risco de quebra.',
          'Caneca 15oz nacional: R$ 7,50 a R$ 12,00 por unidade em volume.',
          'Caneca mágica nacional: R$ 12,00 a R$ 18,00 por unidade em volume.',
        ],
      },
      { type: 'h2', text: 'Erros de compra que custam caro' },
      {
        type: 'p',
        text: 'Três armadilhas derrubam a margem de quem começa. A primeira é comprar um lote enorme de um fornecedor novo sem testar: se o revestimento for ruim, você sublima retrabalho em dezenas de peças. A segunda é misturar lotes diferentes no mesmo pedido do cliente, o que gera canecas com tons de branco diferentes lado a lado. A terceira é escolher caneca pelo preço sem conferir se o diâmetro encaixa direito na sua prensa, o que causa estampas com sombras nas bordas.',
      },
      {
        type: 'p',
        text: 'Com o insumo certo em mãos, a próxima etapa é mostrar o produto para o cliente do jeito que ele compra: com imagem realista. No Mockup Studio do Click & Gruda você aplica a arte em uma caneca 3D fotorrealista, com luz de estúdio e fundo transparente, e exporta a imagem em minutos. Assim você monta o catálogo antes mesmo de produzir a primeira unidade física.',
      },
      {
        type: 'cta',
        title: 'Mockup Studio: veja antes de produzir',
        text: 'Aplique sua arte na caneca 3D fotorrealista e monte o catálogo sem gastar uma única unidade de estoque.',
        href: CTA_LINKS.mockup,
        label: 'Abrir o Mockup Studio',
      },
    ],
    faq: [
      {
        q: 'A caneca 11oz serve em qualquer prensa de canecas?',
        a: 'Praticamente todas as prensas de canecas do mercado foram projetadas para o diâmetro da 11oz, que é o padrão da indústria. Para a 15oz, confira se o cilindro da sua prensa tem ajuste de diâmetro ou se existe adaptador específico para o modelo maior.',
      },
      {
        q: 'Caneca de interior colorido sublima igual à branca?',
        a: 'Sim, a área de estampa é a mesma faixa branca externa e o ciclo de prensa é praticamente igual. A diferença está no acabamento e no preço. Muitos vendedores usam o interior colorido como diferencial visual em kits e presentes temáticos.',
      },
      {
        q: 'Quantas canecas vêm em uma caixa padrão?',
        a: 'O padrão do mercado brasileiro é a caixa com 36 unidades, embaladas individualmente em divisórias de papelão. Para volumes maiores, alguns fornecedores oferecem caixas de 72 unidades com desconto progressivo no preço por caneca.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 3. 10 Erros Comuns na Sublimação de Canecas
  // ----------------------------------------------------------
  {
    slug: 'erros-comuns-sublimacao-canecas-como-evitar',
    title: '10 Erros Comuns na Sublimação de Canecas (e Como Evitar Todos)',
    description:
      'Arte borrada, cor lavada e fantasma na estampa: veja os 10 erros mais comuns na sublimação de canecas e a solução prática para corrigir cada um deles.',
    category: 'Sublimação',
    tags: ['erros de sublimação', 'defeitos em canecas', 'solução de problemas', 'prensa de canecas'],
    date: '2026-09-28',
    keywords: ['erros sublimação', 'estampa pálida', 'fantasma na sublimação', 'defeitos canecas sublimadas', 'prensa de canecas'],
    content: [
      {
        type: 'p',
        text: 'Todo sublimador experiente já perdeu canecas com os mesmos erros que derrubam o seu resultado agora. A boa notícia é que quase todo defeito de sublimação tem causa identificável e correção simples. Neste artigo, você vai ver os 10 erros mais comuns na sublimação de canecas, o sintoma de cada um e a solução prática para nunca mais repetir o prejuízo.',
      },
      { type: 'h2', text: 'Erros de arte e arquivo' },
      { type: 'h3', text: 'Erro 1: arte com pouca resolução' },
      {
        type: 'p',
        text: 'O sintoma é a estampa serrilhada, com letras borradas e bordas pixeladas. A causa é imprimir imagens baixadas da internet ou capturas de tela, que têm 72 DPI e não suportam ampliação. Trabalhe sempre com arquivos em no mínimo 300 DPI no tamanho real de impressão, cerca de 21 por 8,7 cm na caneca 11oz. Se a arte veio pequena, não amplie na marra: recrie ou busque uma versão vetorial.',
      },
      { type: 'h3', text: 'Erro 2: espelhamento errado' },
      {
        type: 'p',
        text: 'Arte impressa sem espelhar sai com o texto invertido, e arte espelhada duas vezes chega ao mesmo problema por outro caminho. A regra é simples: imprima sempre com a opção espelhar ativada, porque o papel encosta na caneca com a face da tinta voltada para o objeto. Faça um teste com um texto pequeno e fixe a configuração no perfil de impressão para nunca mais esquecer.',
      },
      { type: 'h2', text: 'Erros de temperatura e tempo' },
      { type: 'h3', text: 'Erro 3: temperatura errada' },
      {
        type: 'p',
        text: 'Temperatura abaixo do necessário deixa a estampa pálida e a cor lavada; temperatura excessiva amarela o revestimento e queima os tons claros. O padrão seguro para canecas é 180 graus Celsius. Se o resultado varia entre ciclos, desconfie do termostato e calibre com um termômetro externo de contato, ajustando o valor real no painel.',
      },
      { type: 'h3', text: 'Erro 4: tempo errado' },
      {
        type: 'p',
        text: 'Menos de 150 segundos costuma sublimar só a camada superficial da tinta, e a estampa sai com aparência de lavada. Acima de 240 segundos, o excesso de calor espalha a tinta e cria fantasmas ao redor das cores. Para a caneca branca 11oz, use 180 segundos como ponto de partida e ajuste em incrementos de 15 segundos conforme o teste.',
      },
      { type: 'h3', text: 'Erro 5: prensa desregulada' },
      {
        type: 'p',
        text: 'Pressão fraca deixa áreas sem contato, geralmente perto da alça, onde a estampa falha em faixas claras. Pressão exagerada amassa o papel contra a caneca e marca vincos. Ajuste a pressão para firme e uniforme: o papel deve ficar travado sem rugas, e o cilindro deve fechar com esforço moderado nos dois lados.',
      },
      { type: 'h2', text: 'Erros de manuseio' },
      { type: 'h3', text: 'Erro 6: papel mal fixado' },
      {
        type: 'p',
        text: 'Papel que se move entre a caneca e a prensa causa imagem dupla e sombras deslocadas, o famoso fantasma. Fixe a folha com fita térmica em duas ou três posições, esticada e sem rugas, e confira se ela não desliza antes de fechar a prensa. Na retirada, puxe em movimento único e contínuo para não arrastar a tinta recém-transferida.',
      },
      { type: 'h3', text: 'Erro 7: esfriamento brusco' },
      {
        type: 'p',
        text: 'Apoiar a caneca quente direto sobre metal frio ou molhar a base provoca choque térmico, que racha a cerâmica ou craquela o revestimento. Após a prensa, coloque a caneca sobre uma grade ou madeira e deixe esfriar naturalmente antes de embalar. Esse detalhe evita perdas silenciosas que aparecem dias depois, com o cliente reclamando de caneca trincada.',
      },
      { type: 'h3', text: 'Erro 8: umidade no papel' },
      {
        type: 'p',
        text: 'Papel sublimático absorve umidade do ar e, quando pressionado, o vapor mancha a estampa com áreas claras aleatórias. Guarde as folhas em saco plástico selado, com o pacote fechado. Em dias úmidos, pré-seque o papel na prensa por alguns segundos, com folha de proteção por cima, ou pressione o papel por 5 segundos a seco antes do ciclo completo.',
      },
      { type: 'h2', text: 'Erros de insumo e de processo' },
      { type: 'h3', text: 'Erro 9: caneca de má qualidade' },
      {
        type: 'p',
        text: 'Revestimento pobre amarela com o calor, descasca na lavagem e não segura a cor. O sintoma típico é a mesma arte sair perfeita em uma caneca e pálida em outra do mesmo lote. Compre de fornecedor que informe o padrão do revestimento, teste cada lote novo com uma unidade e aprove cada caixa com o papel em branco antes de produzir.',
      },
      { type: 'h3', text: 'Erro 10: não testar antes de vender em quantidade' },
      {
        type: 'p',
        text: 'O erro mais caro é fechar um pedido de 50 canecas e descobrir o defeito só na entrega. Reserve sempre uma unidade de cada lote para teste com a arte real do cliente, confira cores, posição e acabamento, e só então rode o volume completo. Cinco minutos de teste evitam a perda de um lote inteiro e da reputação que você construiu em meses.',
      },
      { type: 'h2', text: 'Monte uma rotina que evita retrabalho' },
      {
        type: 'p',
        text: 'Transforme tudo isso em checklist fixo de produção: arte em 300 DPI espelhada, caneca aprovada no teste, papel seco e bem fixado, 180 graus por 180 segundos, retirada em movimento único e esfriamento natural. Anote a configuração exata que funciona na sua máquina, porque cada prensa tem personalidade. Com rotina disciplinada, o refugo cai para menos de 1 por cento e a margem agradece.',
      },
      {
        type: 'p',
        text: 'A produtividade também depende do que acontece fora da prensa. Orçamentos, links de WhatsApp, QR Code e otimização de imagens consomem tempo precioso quando feitos no improviso. As ferramentas gratuitas do Click & Gruda resolvem tudo isso em um só lugar, direto no navegador.',
      },
      {
        type: 'cta',
        title: 'Ferramentas gratuitas para quem vende canecas',
        text: 'Orçamento, QR Code, links de WhatsApp e mais de 40 utilidades em um só lugar, sem pagar nada.',
        href: CTA_LINKS.ferramentas,
        label: 'Abrir as Ferramentas',
      },
    ],
    faq: [
      {
        q: 'Por que minha estampa sai pálida mesmo com 180 graus?',
        a: 'As causas mais comuns são temperatura real menor que a do painel, tempo insuficiente, tinta vencida ou revestimento ruim. Calibre com termômetro externo, estenda o tempo em 15 segundos e teste o lote com uma folha em branco.',
      },
      {
        q: 'O que causa o efeito fantasma na sublimação?',
        a: 'Movimento do papel durante a prensa ou retirada brusca após o ciclo. Fixe a folha com fita térmica, confira a tensão antes de fechar a máquina e remova com movimento único usando luva de silicone.',
      },
      {
        q: 'Posso reaproveitar o papel sublimático usado?',
        a: 'Não. A tinta sublima por completo no primeiro ciclo e o papel perde a camada de revestimento. Reutilizar gera estampas falhadas e manchadas, e a economia de centavos vira prejuízo de produto inteiro.',
      },
      {
        q: 'Quanto eu perco por caneca com refugo alto?',
        a: 'Com custo médio de R$ 8,50 por caneca, cada peça refugada em um lote de 10 consome cerca de 12 por cento da margem. Refugo acima de 3 por cento indica problema de calibração ou de insumo.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 4. Temperatura e Tempo de Prensa para Canecas
  // ----------------------------------------------------------
  {
    slug: 'temperatura-e-tempo-prensa-canecas-sublimacao',
    title: 'Temperatura e Tempo de Prensa para Canecas: Tabela Prática',
    description:
      'Tabela prática de temperatura e tempo de prensa para canecas 11oz, 15oz e mágicas, com ajustes por tipo de prensa e dicas para calibrar sua máquina.',
    category: 'Sublimação',
    tags: ['temperatura de prensa', 'tempo de sublimação', 'prensa de canecas', 'calibração'],
    date: '2026-10-02',
    keywords: ['temperatura prensa canecas', 'tempo de prensa sublimação', '180 graus 180 segundos', 'calibrar prensa de canecas', 'tabela sublimação'],
    content: [
      {
        type: 'p',
        text: 'Temperatura e tempo são os dois parafusos que definem se a sua sublimação sai perfeita ou pálida. A boa notícia é que a caneca é o produto mais previsível da sublimação: com a tabela certa e uma prensa calibrada, você repete o mesmo resultado centenas de vezes. Neste guia, você encontra os valores de referência para cada tipo de caneca, os ajustes por tipo de prensa e o método para calibrar sua máquina de uma vez por todas.',
      },
      { type: 'h2', text: 'A regra de ouro: 180 graus por 180 segundos' },
      {
        type: 'p',
        text: 'Para a caneca branca 11oz, padrão da indústria, os valores de partida são 180 graus Celsius por 180 segundos em prensa de cilindro com pressão firme. Essa combinação garante a sublimação completa da tinta no revestimento, com cores saturadas e sem amarelado. A partir desse ponto, ajustes finos de 5 a 15 graus ou de 10 a 15 segundos resolvem as particularidades da sua máquina e dos seus insumos. Use a tabela abaixo como referência rápida de produção:',
      },
      {
        type: 'ul',
        items: [
          'Caneca branca 11oz: 180 °C por 180 segundos.',
          'Caneca 15oz: 180 °C por 210 a 240 segundos.',
          'Caneca mágica: 165 a 170 °C por 150 a 180 segundos.',
          'Caneca de interior colorido: 180 °C por 180 a 200 segundos.',
          'Caneca colorida com janela branca: 180 °C por 180 segundos.',
        ],
      },
      { type: 'h2', text: 'Ajustes por tipo de prensa' },
      {
        type: 'p',
        text: 'A prensa de cilindro envolve a caneca por completo e distribui calor de forma uniforme, por isso os valores da tabela funcionam direto. Já a prensa plana adaptada com manta térmica aquece por contato em uma faixa de cada vez e exige rotação manual da caneca no meio do ciclo. Nesse caso, some de 15 a 30 segundos ao tempo total, divida o ciclo em duas voltas e marque a posição inicial com fita para não pular nenhuma área da estampa.',
      },
      {
        type: 'p',
        text: 'Outra diferença importante está na recuperação de temperatura. Prensas analógicas mais simples demoram a voltar ao ponto ajustado após cada ciclo e entregam a segunda caneca mais pálida que a primeira. Espere o painel estabilizar de novo antes de iniciar a próxima peça, mesmo que isso adicione 30 a 60 segundos por caneca. Produção boa é produção repetível, não produção apressada.',
      },
      { type: 'h2', text: 'Variações por tipo de caneca' },
      {
        type: 'p',
        text: 'A caneca 15oz tem mais massa de cerâmica e mais área de contato, então precisa de tempo extra para o calor atravessar a parede: comece com 210 segundos e suba até 240 se a estampa sair pálida perto da base. A caneca mágica pede temperatura menor, entre 165 e 170 graus, porque o revestimento termossensível degrada com excesso de calor e perde a capacidade de voltar ao preto. O interior colorido normalmente aguenta o ciclo padrão, mas confirme com o fornecedor, pois alguns revestimentos escurecem acima de 200 segundos de exposição.',
      },
      { type: 'h2', text: 'Como calibrar sua prensa' },
      {
        type: 'p',
        text: 'Cada prensa tem personalidade, e o painel pode marcar 180 graus enquanto a superfície real está em 168. Sem calibração, você ajusta no escuro e queima insumo à toa. Siga este protocolo:',
      },
      {
        type: 'ol',
        items: [
          'Aqueça a prensa por 20 minutos e meça a temperatura real da superfície de contato com termômetro infravermelho.',
          'Compare com o valor do painel e ajuste o offset da máquina, se houver, ou compense na configuração dos ciclos.',
          'Sublime uma arte de teste com degradês, tons de pele e preto denso.',
          'Repita o mesmo teste três vezes seguidas: os três resultados devem ser idênticos.',
          'Registre a configuração final e cole uma etiqueta com os valores na própria prensa.',
        ],
      },
      { type: 'h2', text: 'O teste do papel que revela problemas' },
      {
        type: 'p',
        text: 'Antes de gastar uma caneca, faça o teste do papel: pressione uma folha de papel sublimático com a arte e depois pressione uma folha em branco na caneca aprovada. A folha com arte mostra se a impressão está nítida e bem saturada antes do ciclo. A folha em branco revela manchas de umidade e pontos frios da prensa, que aparecem como áreas com transferência irregular. Esse duplo teste custa centavos e diagnostica a maior parte dos problemas antes do prejuízo.',
      },
      { type: 'h2', text: 'Consistência: o segredo é anotar tudo' },
      {
        type: 'p',
        text: 'Duas prensas do mesmo modelo, lado a lado, produzem resultados diferentes. Por isso, a única fonte de verdade confiável é o seu caderno de testes: data, marca da caneca, lote do papel, temperatura, tempo e pressão de cada produção aprovada. Quando um lote novo chegar, você repete a receita e só ajusta se o teste falhar.',
      },
      {
        type: 'quote',
        text: 'Quem não anota o resultado de hoje refaz o mesmo erro toda semana. O caderno de testes é o ativo mais barato e mais valioso do seu estúdio de sublimação.',
      },
      {
        type: 'p',
        text: 'Com a produção estabilizada, o próximo passo é garantir que o preço cobre todos os custos e ainda dá lucro de verdade. A ferramenta de Orçamento do Click & Gruda calcula itens, descontos e condições de pagamento em um PDF profissional que você envia direto para o cliente. Com o custo real na mão, você para de vender no achismo e passa a negociar com segurança.',
      },
      {
        type: 'cta',
        title: 'Calculadora de Orçamento gratuita',
        text: 'Monte orçamentos profissionais com seus custos reais de produção e envie em PDF para o cliente.',
        href: CTA_LINKS.orcamento,
        label: 'Abrir o Orçamento',
      },
    ],
    faq: [
      {
        q: 'A prensa marca 180 graus, mas a estampa sai pálida. O que pode ser?',
        a: 'Provavelmente a temperatura real da superfície está abaixo do que o painel indica. Meça com termômetro infravermelho após 20 minutos de aquecimento, ajuste o offset ou compense subindo 10 a 15 graus, e repita o teste três vezes para confirmar estabilidade.',
      },
      {
        q: 'Caneca mágica pode ser prensada a 180 graus?',
        a: 'Não é recomendado. O revestimento termossensível degrada com calor excessivo e perde a reversibilidade, ou seja, a caneca pode não voltar ao preto. Use entre 165 e 170 graus por 150 a 180 segundos e teste uma unidade de cada lote novo.',
      },
      {
        q: 'Quanto tempo de prensa para a caneca 15oz?',
        a: 'Comece com 210 segundos a 180 graus e ajuste até 240 segundos se a estampa sair pálida perto da base. A 15oz tem mais massa de cerâmica e diâmetro maior, então precisa de tempo extra comparada à caneca 11oz.',
      },
      {
        q: 'Preciso girar a caneca no meio do ciclo?',
        a: 'Somente em prensas planas adaptadas, que aquecem uma faixa por vez: gire a caneca na metade do ciclo para cobrir a área restante, somando 15 a 30 segundos ao tempo total. Em prensa de cilindro, o ciclo único já cobre toda a volta da caneca.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 5. O que São Mockups e Por Que Eles Vendem 3x Mais
  // ----------------------------------------------------------
  {
    slug: 'o-que-sao-mockups-e-por-que-vendem-mais',
    title: 'O que São Mockups e Por Que Eles Vendem 3x Mais',
    description:
      'Descubra o que é um mockup, por que imagens realistas vendem muito mais que artes planas e onde usar mockups de canecas para vender todos os dias.',
    category: 'Mockups',
    tags: ['mockup', 'vendas', 'canecas personalizadas', 'marketing'],
    date: '2026-10-05',
    keywords: ['o que é mockup', 'mockup de caneca', 'mockup 3d', 'vender canecas personalizadas', 'imagem que vende'],
    content: [
      {
        type: 'p',
        text: 'Você monta a arte, imprime, prensa e a caneca fica linda. Mas o cliente só vai descobrir isso depois de comprar, e a decisão de compra acontece muito antes, na tela do celular. É exatamente aí que entra o mockup: a ponte entre a arte plana no computador e o produto final na cabeça de quem compra. Neste artigo, você vai entender o que é um mockup, por que ele multiplica a conversão e como usar isso a seu favor sem gastar nada.',
      },
      { type: 'h2', text: 'O que é um mockup, na prática' },
      {
        type: 'p',
        text: 'Mockup é a simulação realista de como a sua arte fica aplicada no produto final. No lugar de mostrar um retângulo plano com um desenho, você mostra a caneca de verdade, com a arte envolvendo o corpo curvo, seguindo a perspectiva e recebendo luz, sombra e reflexo do verniz. O cliente vê o produto como ele vai chegar em casa, e não um rascunho técnico que ele precisa imaginar sozinho.',
      },
      {
        type: 'p',
        text: 'Um bom mockup de caneca tem três ingredientes. O primeiro é a projeção cilíndrica correta, que curva a arte exatamente como no objeto real. O segundo é a iluminação de estúdio, que dá volume e materialidade ao produto. O terceiro é o fundo limpo, que destaca a caneca. Quando falta um desses três, o resultado parece colado no editor e passa confiança de amador.',
      },
      { type: 'h2', text: 'A psicologia: o cliente compra o resultado final' },
      {
        type: 'p',
        text: 'Ninguém compra tinta e cerâmica: a pessoa compra o café da manhã com a frase que combina com ela, o presente que vai arrancar um sorriso, a caneca da firma que o chefe vai elogiar. A arte plana obriga o cliente a fazer o trabalho mental de imaginar tudo isso, e a maioria não faz, apenas rola o feed. O mockup entrega a cena pronta, emocional e pronta para desejar.',
      },
      {
        type: 'p',
        text: 'É por isso que lojas que trocam a arte plana por mockups realistas relatam salto imediato em engajamento e conversão, com queda acentuada de perguntas pedindo para visualizar a arte no produto. Quando o cliente já vê o resultado, sobra apenas a decisão de comprar. Menos dúvida significa menos mensagem perdida no meio do caminho e mais venda fechada no primeiro contato.',
      },
      { type: 'h2', text: 'Arte plana vs mockup realista' },
      {
        type: 'p',
        text: 'A diferença entre os dois formatos aparece no comportamento de quem compra. A arte plana transfere para o cliente o trabalho de imaginar o resultado; o mockup transfere para ele o desejo pronto. Compare as duas situações:',
      },
      {
        type: 'ul',
        items: [
          'Com arte plana: o cliente pergunta como fica, demora para decidir, some no meio da conversa e pede desconto por desconfiança.',
          'Com mockup realista: o cliente visualiza o produto, decide sozinho, chega pedindo a arte que viu no story e paga o preço cheio.',
          'Com arte plana: o catálogo parece lista de desenhos e concorre por preço.',
          'Com mockup realista: o catálogo parece loja de marca e concorre por valor percebido.',
        ],
      },
      { type: 'h2', text: 'Onde usar mockups para vender mais' },
      {
        type: 'p',
        text: 'Um único mockup bem feito rende semanas de conteúdo e vira peça central em todos os seus canais. A vantagem é que o custo de produção é zero depois da primeira exportação. Distribua assim:',
      },
      {
        type: 'ul',
        items: [
          'Instagram: feed, stories e reels com a caneca em ângulo 3/4 ou girando.',
          'Catálogo no WhatsApp: imagens nomeadas por tema, prontas para enviar em segundos.',
          'Status do WhatsApp: a vitrine mais barata e mais esquecida do comércio brasileiro.',
          'Marketplaces: anúncio com imagem principal limpa eleva a taxa de clique.',
          'Site e vitrine física: posters com mockups dão aspecto de loja profissional.',
        ],
      },
      { type: 'h2', text: 'Tipos de mockup de caneca' },
      {
        type: 'p',
        text: 'Existem três famílias principais. O mockup fotográfico usa uma caneca física branca fotografada em estúdio: é realista, mas lento e caro para escalar, já que cada arte nova exige nova sessão de fotos. O mockup 3D renderizado é gerado no computador com um modelo tridimensional, permitindo ângulos, luzes e variações infinitas sem tocar no estoque. E o mockup em vídeo ou turntable mostra o produto girando, formato que hoje ganha alcance maior nos algoritmos sociais porque demonstra o objeto de todos os lados.',
      },
      { type: 'h2', text: 'Como fazer mockups de caneca de graça' },
      {
        type: 'p',
        text: 'O Mockup Studio do Click & Gruda entrega a família 3D completa no navegador, sem instalar nada. Você sobe a arte, o sistema aplica a projeção cilíndrica com curvatura real, você escolhe entre presets de luz de estúdio, ajusta o ângulo da câmera virtual e exporta a imagem em alta resolução, inclusive com fundo transparente para compor nos seus posts. Tudo de graça, em minutos, sem caneca física e sem estúdio fotográfico. É o mesmo tipo de motor usado por quem vende centenas de peças por mês para manter o catálogo atualizado toda semana.',
      },
      {
        type: 'cta',
        title: 'Mockup Studio: seu estúdio 3D gratuito',
        text: 'Suba a arte, aplique na caneca 3D fotorrealista e exporte imagens prontas para vender, tudo no navegador.',
        href: CTA_LINKS.mockup,
        label: 'Abrir o Mockup Studio',
      },
    ],
    faq: [
      {
        q: 'Mockup engana o cliente?',
        a: 'Não, desde que mostre o produto real com a arte real. O mockup é a representação fiel do resultado final, igual à foto de catálogo de qualquer indústria. O que seria desonesto é simular material, cor ou tamanho diferentes do que você entrega.',
      },
      {
        q: 'Preciso saber usar programas de edição pesados para fazer mockups?',
        a: 'Não. Ferramentas como o Mockup Studio do Click & Gruda fazem a projeção, a luz e a câmera por você: basta subir a imagem da arte, ajustar posição e tamanho e exportar. O fluxo inteiro leva poucos minutos e roda no navegador.',
      },
      {
        q: 'Mockup serve para outros produtos além de canecas?',
        a: 'Sim, existe mockup para camiseta, chaveiro, garrafa, mousepad e praticamente qualquer produto sublimável. Comece pelas canecas, que são o produto de maior giro, e amplie o catálogo visual conforme as linhas de produto crescerem.',
      },
      {
        q: 'Quantos mockups devo ter no catálogo?',
        a: 'Pelo menos um por arte em ângulo 3/4 e, para as artes mais vendidas, três variações: vista 3/4, close de detalhe e vista frontal. Com 30 a 50 mockups organizados por tema, seu catálogo já parece de loja grande.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 6. Mockup 3D vs Foto Real
  // ----------------------------------------------------------
  {
    slug: 'mockup-3d-vs-foto-real-quando-usar-cada',
    title: 'Mockup 3D vs Foto Real: Quando Usar Cada Um no Seu Negócio',
    description:
      'Compare mockup 3D e foto real de canecas: custo, velocidade, variações e impacto nas vendas, e monte um fluxo que usa o melhor dos dois mundos.',
    category: 'Mockups',
    tags: ['mockup 3d', 'foto real', 'catálogo', 'estratégia de vendas'],
    date: '2026-10-07',
    keywords: ['mockup 3d vs foto', 'mockup de caneca', 'foto de produto', 'catálogo de canecas', 'prova social'],
    content: [
      {
        type: 'p',
        text: 'Mockup 3D e foto real não são rivais: são ferramentas com missões diferentes dentro do mesmo funil de vendas. O erro comum é escolher um e abandonar o outro, perdendo velocidade ou credibilidade no caminho. Neste artigo, você vai entender o que cada formato entrega de melhor, ver um comparativo direto e sair com um fluxo simples para usar os dois a favor do seu negócio de canecas personalizadas.',
      },
      { type: 'h2', text: 'O que cada formato entrega' },
      {
        type: 'p',
        text: 'O mockup 3D é a imagem do produto gerada por computador, com um modelo tridimensional da caneca recebendo a sua arte com curvatura, luz e sombra calculadas em tempo real. A foto real é a fotografia do objeto físico depois de produzido, capturada com câmera ou celular em estúdio ou em uma cena do dia a dia. Um começa antes da produção; o outro só existe depois que a caneca está pronta. Essa diferença de momento define quando cada um brilha.',
      },
      { type: 'h2', text: 'As forças do mockup 3D' },
      {
        type: 'p',
        text: 'O grande trunfo do 3D é a velocidade com escala: em minutos você aplica a arte, gira a câmera, troca a luz e exporta dezenas de variações sem produzir uma única unidade física. Isso muda a economia do catálogo inteiro. Veja o que o formato entrega:',
      },
      {
        type: 'ul',
        items: [
          'Custo zero por imagem: não gasta insumo, prensa nem sessão de fotos.',
          'Variações infinitas: ângulos, lentes, fundos e luzes diferentes com poucos cliques.',
          'Fundo transparente: PNG com alfa para compor em qualquer post, flyer ou banner.',
          'Catálogo antes do estoque: você vende a arte e só produz depois do pedido.',
          'Padrão visual: todas as imagens com a mesma luz e o mesmo enquadramento.',
        ],
      },
      { type: 'h2', text: 'As forças da foto real' },
      {
        type: 'p',
        text: 'A foto real trabalha onde o 3D não chega: na confiança. Ela prova que o produto existe, mostra textura de verdade e encaixa a caneca em contextos com que o cliente se identifica. É o formato que fecha vendas, não apenas o que abre.',
      },
      {
        type: 'ul',
        items: [
          'Prova social: caneca nas mãos de clientes reais e depoimentos com imagem.',
          'Contexto de uso: mesa de escritório, café da manhã, presente sendo aberto.',
          'Detalhes técnicos: textura do verniz, acabamento da alça, embalagem.',
          'Conteúdo espontâneo: bastidores da produção humanizam a marca.',
        ],
      },
      { type: 'h2', text: 'Comparativo direto' },
      {
        type: 'p',
        text: 'Quando a dúvida bater na hora de escolher, volte a este comparativo. Nenhum formato é melhor em tudo. Ele resume o papel de cada um nas decisões do dia a dia:',
      },
      {
        type: 'ul',
        items: [
          'Custo por imagem: o mockup 3D sai de graça; a foto real consome insumo, tempo e eventualmente estúdio.',
          'Tempo por imagem: o 3D leva minutos; a foto exige produção, cenário e edição.',
          'Variações: o 3D é praticamente ilimitado; cada foto nova é um novo custo.',
          'Prova social: a foto real ganha disparado, porque mostra o produto existindo.',
          'Antes da produção: só o 3D é possível, já que a foto depende do objeto pronto.',
          'Escala de catálogo: com 3D você renova a vitrine toda semana sem estoque.',
        ],
      },
      { type: 'h2', text: 'O fluxo recomendado: mockup no catálogo, foto na prova social' },
      {
        type: 'p',
        text: 'O fluxo que funciona para a maioria das lojas é simples e cíclico. Primeiro, crie ou compre a arte e gere o mockup 3D imediatamente: é ele que entra no catálogo, no Instagram e nos stories para validar demanda. Quando um modelo vender bem, produza as unidades e fotografe o resultado final, incluindo cenas de uso. Depois, use essas fotos como prova social nos anúncios do mesmo produto que o mockup lançou. O mockup abre a venda, e a foto confirma a compra.',
      },
      {
        type: 'p',
        text: 'Esse ciclo também protege o seu caixa. Você testa 10 artes novas em mockup sem gastar um real de insumo, identifica as 3 que o público aprovou e só investe em produção nelas. Catálogo grande, estoque enxuto e zero caneca parada na prateleira.',
      },
      { type: 'h2', text: 'Quando o mockup fotorrealista dispensa a foto' },
      {
        type: 'p',
        text: 'Os motores 3D modernos chegaram a um ponto em que a diferença para a foto quase desaparece na velocidade de rolagem do feed. Materiais com PBR, que simulam como a luz se comporta no verniz da cerâmica, combinados com iluminação de estúdio e sombras de contato realistas geram imagens que o cliente não distingue de fotografia. Para catálogo, vitrine e anúncio de produto padrão, o fotorrealista resolve sozinho. Guarde a foto real para o que é irrepetível: o cliente real segurando a caneca que comprou.',
      },
      {
        type: 'p',
        text: 'Quer ver na prática? O Mockup Studio do Click & Gruda roda no navegador com caneca 3D de geometria real, materiais físicos e presets de luz de estúdio, com exportação em alta resolução e fundo transparente. Em cinco minutos, a sua arte sai do plano para o fotorrealista.',
      },
      {
        type: 'cta',
        title: 'Gere seu mockup 3D agora',
        text: 'Caneca 3D fotorrealista, luz de estúdio e fundo transparente direto no navegador, de graça.',
        href: CTA_LINKS.mockup,
        label: 'Abrir o Mockup Studio',
      },
    ],
    faq: [
      {
        q: 'O cliente reclama se a imagem for mockup?',
        a: 'Não, desde que o mockup seja fiel ao produto entregue: mesma caneca, mesma posição da arte e mesmas cores. Catálogos de e-commerce inteiros funcionam assim. O problema só aparece quando a imagem promete algo diferente do que chega em casa.',
      },
      {
        q: 'Preciso de câmera boa para as fotos reais?',
        a: 'Um celular recente resolve a maior parte: luz natural difusa de janela, fundo neutro e enquadramento estável. O que valoriza a foto não é o equipamento, e sim a cena: mão segurando, ambiente real e produto limpo.',
      },
      {
        q: 'Posso usar só mockups e nunca fotografar?',
        a: 'Dá para vender assim, mas você deixa a prova social na mesa, e ela é um dos gatilhos mais fortes de conversão. O ideal é o híbrido: mockup para escala e catálogo, foto real para confiança e conteúdo de bastidores.',
      },
      {
        q: 'Onde encaixo o mockup em vídeo?',
        a: 'No topo do funil: reels e stories com a caneca girando ou revelando a arte têm alcance maior que a imagem estática e funcionam como vitrine que para o dedo. Deixe os vídeos para as artes campeãs de venda.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 7. Como Fazer Mockups de Canecas que Parecem Fotos
  // ----------------------------------------------------------
  {
    slug: 'como-fazer-mockups-canecas-que-parecem-fotos',
    title: 'Como Fazer Mockups de Canecas que Parecem Fotos Profissionais',
    description:
      'Aprenda a criar mockups de canecas fotorrealistas no Mockup Studio: arte em 300 DPI, projeção cilíndrica, luz de estúdio e os ângulos que mais vendem.',
    category: 'Mockups',
    tags: ['mockup de caneca', 'tutorial', 'mockup fotorrealista', 'Mockup Studio'],
    date: '2026-10-10',
    keywords: ['como fazer mockup de caneca', 'mockup fotorrealista', 'mockup 3d gratuito', 'projeção cilíndrica', 'Mockup Studio'],
    content: [
      {
        type: 'p',
        text: 'Existem dois tipos de mockup: o que parece colagem de aplicativo e o que para o cliente com cara de fotografia de estúdio. A diferença não está no equipamento, e sim em uma sequência de decisões técnicas que qualquer pessoa consegue seguir. Neste guia prático, você vai preparar a arte, aplicar na caneca com projeção cilíndrica, escolher a luz e o ângulo certos e exportar no tamanho ideal para cada canal, tudo no Mockup Studio do Click & Gruda.',
      },
      { type: 'h2', text: 'Prepare a arte antes de abrir o estúdio' },
      {
        type: 'p',
        text: 'Mockup bom começa com arquivo bom, e quase todo problema de renderização nasce na arte. Cinco minutos de checagem evitam retrabalho no estúdio. Antes de subir a imagem, confira estes pontos:',
      },
      {
        type: 'ul',
        items: [
          'Resolução de 300 DPI no tamanho real da área de impressão, cerca de 21 por 8,7 cm na caneca 11oz.',
          'Cores dentro da faixa segura de impressão: evite neon puro e verde-limão eletrônico, que a sublimação nunca alcança.',
          'Arquivo em PNG ou JPG de alta qualidade, sem compressão exagerada.',
          'Arte na posição final de leitura, sem espelhar: o espelhamento é só na hora de imprimir o papel.',
        ],
      },
      { type: 'h2', text: 'Aplique a arte com projeção cilíndrica' },
      {
        type: 'p',
        text: 'O que separa o amador do profissional é a curvatura. Na caneca real, a arte envolve um cilindro: as linhas verticais se curvam nas laterais e a imagem se comprime levemente nas bordas. No Mockup Studio, o motor projeta a arte com geometria cilíndrica real sobre o modelo 3D da caneca, então esse comportamento acontece naturalmente. Seu trabalho é ajustar escala e posição com o controle de wrap de 360 graus até a composição ficar equilibrada, conferindo o painel de DPI efetivo para garantir que a arte não perdeu nitidez.',
      },
      { type: 'h2', text: 'Escolha a luz que vende' },
      {
        type: 'p',
        text: 'A luz é 80 por cento do realismo. Os presets de estúdio do Mockup Studio montam cenas com luz principal, luz de preenchimento e luz de recorte, além do reflexo de ambiente no verniz da cerâmica. Como regra prática, use luz suave e difusa para artes pastel e presentes femininos, com sombras longas e delicadas; use luz mais contrastada para artes com preto, tipografia forte e estilos corporativos. Evite sempre a luz chapada e sem direção, que aplana o produto e denuncia o render.',
      },
      { type: 'h2', text: 'Os ângulos que mais vendem' },
      {
        type: 'p',
        text: 'Cada ângulo tem uma função diferente dentro do funil de vendas. As três composições abaixo cobrem praticamente todo catálogo, então monte as três para cada arte campeã. Elas se complementam, não competem:',
      },
      {
        type: 'ul',
        items: [
          'Vista 3/4, com a caneca girada cerca de 45 graus: é o ângulo campeão, mostra frente e lateral com profundidade; use como imagem principal.',
          'Close no detalhe: aproxime a câmera virtual com lente de 50 a 85 mm para destacar textura, tipografia e a curva da alça; perfeito para stories.',
          'Vista herói, frontal e centrada: composição simétrica para capas de catálogo, banners e anúncios de marca.',
        ],
      },
      { type: 'h2', text: 'Fundo transparente e exportação no tamanho certo' },
      {
        type: 'p',
        text: 'Exporte com fundo transparente em PNG para compor o mockup em qualquer cenário: dentro de um post com a sua identidade visual, em um flyer de promoção ou em um banner de marketplace. Com o fundo em alfa, o mesmo arquivo serve para campanhas inteiras sem novo render. Para os usos mais comuns, siga este guia de tamanhos:',
      },
      {
        type: 'ul',
        items: [
          'Instagram feed: 1080 por 1080 pixels, ou 1080 por 1350 no formato retrato.',
          'Stories e reels: 1080 por 1920 pixels.',
          'Marketplaces: 1200 por 1200 pixels com fundo branco puro.',
          'Impresso e banner: exporte em escala 2x ou 4x para garantir nitidez.',
        ],
      },
      { type: 'h2', text: 'Erros de mockup amador que afastam o cliente' },
      {
        type: 'p',
        text: 'Alguns defeitos denunciam o mockup amador à primeira vista e custam confiança na hora da venda. Cada item abaixo é rápido de corrigir no estúdio. Revise o material contra esta lista antes de publicar qualquer post:',
      },
      {
        type: 'ul',
        items: [
          'Arte esticada ou torta, com tipografia deformada pela projeção.',
          'Sombra dura e artificial, ou ausência total de sombra, deixando a caneca flutuando.',
          'Luz amarelada de lâmpada doméstica que suja o branco da cerâmica.',
          'Bordas serrilhadas na arte por resolução baixa.',
          'Arte cortada pela alça ou posicionada de forma desequilibrada.',
          'Fundo sujo, com marcas e gradientes acidentais.',
        ],
      },
      {
        type: 'p',
        text: 'Com o fluxo dominado, um mockup profissional sai em menos de cinco minutos, e um catálogo de 30 artes se resolve em uma tarde. Para abastecer esse catálogo, a Biblioteca de Artes do Click & Gruda entrega artes prontas em alta resolução, pensadas para sublimação, com download imediato e pagamento único. É o atalho para manter a vitrine sempre cheia sem desenhar nada do zero.',
      },
      {
        type: 'cta',
        title: 'Teste agora no Mockup Studio',
        text: 'Aplique sua arte na caneca 3D com projeção cilíndrica real, luz de estúdio e exportação em alta resolução.',
        href: CTA_LINKS.mockup,
        label: 'Abrir o Mockup Studio',
      },
      {
        type: 'cta',
        title: 'Artes prontas em alta resolução',
        text: 'Abasteça o catálogo com centenas de artes para sublimação, com pagamento único e download imediato.',
        href: CTA_LINKS.biblioteca,
        label: 'Ver a Biblioteca de Artes',
      },
    ],
    faq: [
      {
        q: 'Preciso espelhar a arte para o mockup?',
        a: 'Não. O espelhamento faz parte apenas da impressão no papel sublimático, porque o papel toca a caneca com a face da tinta. No mockup, a arte entra na posição final de leitura, igual ao produto pronto na mão do cliente.',
      },
      {
        q: 'Qual o melhor tamanho de mockup para o Instagram?',
        a: 'Para o feed, exporte em 1080 por 1350 pixels no formato retrato, que ocupa mais tela e gera mais atenção que o quadrado. Para stories e reels, use 1080 por 1920. Com fundo transparente, você adapta o mesmo mockup aos dois formatos.',
      },
      {
        q: 'O mockup 3D substitui a foto do produto?',
        a: 'Para catálogo e anúncios, sim: com materiais físicos e luz de estúdio, o fotorrealista é praticamente indistinguível na velocidade do feed. Mantenha fotos reais para prova social, com clientes e cenas de uso, onde a fotografia tem vantagem.',
      },
      {
        q: 'Minha arte tem 150 DPI. Posso usar no mockup?',
        a: 'Dá para visualizar, mas o resultado final perde nitidez, principalmente nos closes. Recrie ou obtenha a arte em 300 DPI no tamanho real de impressão; se quiser, a Biblioteca de Artes já entrega arquivos na especificação correta para canecas.',
      },
    ],
  },

  // ----------------------------------------------------------
  // 8. Caneca Mágica
  // ----------------------------------------------------------
  {
    slug: 'caneca-magica-como-funciona-e-como-vender',
    title: 'Caneca Mágica: Como Funciona a Revelação Térmica e Como Vender Mais',
    description:
      'Entenda como a caneca mágica revela a imagem com o calor, quais cuidados tomar na sublimação e como usar o efeito para cobrar até 3 vezes mais.',
    category: 'Mockups',
    tags: ['caneca mágica', 'revelação térmica', 'presentes', 'precificação'],
    date: '2026-10-12',
    keywords: ['caneca mágica', 'caneca que revela com calor', 'caneca revelação', 'como vender caneca mágica', 'sublimação caneca mágica'],
    content: [
      {
        type: 'p',
        text: 'A caneca mágica é o produto com maior fator de surpresa da sublimação: fria, ela é toda preta; com líquido quente, a imagem revela em segundos. Esse efeito transforma um simples presente em uma pequena experiência, e experiência é o que permite cobrar mais. Neste artigo, você vai entender como funciona a revelação térmica, como produzir sem erros e como cobrar a margem que ela merece.',
      },
      { type: 'h2', text: 'O que é a caneca mágica' },
      {
        type: 'p',
        text: 'A caneca mágica é uma caneca comum para sublimação coberta por uma camada de tinta termossensível preta, aplicada sobre o revestimento que recebe a sublimação. Em temperatura ambiente, a camada é opaca e esconde tudo por baixo. Com líquido quente, a superfície aquece, a camada fica transparente e a imagem sublimada aparece. Ao esfriar, o preto volta e a imagem desaparece. O ciclo se repete por milhares de usos, se a produção for feita corretamente.',
      },
      { type: 'h2', text: 'Como funciona a física da revelação' },
      {
        type: 'p',
        text: 'O segredo está nos pigmentos leucocrômicos, microcápsulas que mudam de estrutura molecular com o calor. Abaixo de cerca de 45 graus, elas refletem a luz e formam o preto opaco. Acima dessa faixa, a estrutura muda, a luz atravessa e a camada fica transparente, expondo a estampa logo abaixo. É o mesmo princípio das canecas de mudança de cor de décadas atrás, hoje com qualidade muito superior, porque a arte fica gravada por sublimação e não pintada por cima.',
      },
      { type: 'h2', text: 'Cuidados de produção: temperatura menor e teste sempre' },
      {
        type: 'p',
        text: 'A camada termossensível é mais sensível ao calor que o revestimento comum, então a configuração da prensa muda. Pequenos excessos custam a reversibilidade do efeito. Ajuste os parâmetros antes do primeiro ciclo:',
      },
      {
        type: 'ul',
        items: [
          'Use entre 165 e 170 graus, em vez dos 180 padrão da caneca branca.',
          'Tempo de 150 a 180 segundos, começando sempre pelo menor valor.',
          'Teste uma unidade de cada lote novo antes de produzir o pedido completo.',
          'Confira a reversibilidade: a caneca precisa voltar ao preto uniforme após esfriar.',
          'Evite ciclos duplos por desespero com cor pálida; prefira ajustar o tempo em 10 segundos.',
        ],
      },
      {
        type: 'p',
        text: 'O erro clássico é prensar a mágica como se fosse branca: o excesso de calor degrada o pigmento, amarela o revestimento e a caneca perde a reversibilidade. Cada lote pode reagir diferente, porque a espessura da camada preta varia entre fabricantes. O teste de uma unidade custa alguns reais e protege um pedido inteiro.',
      },
      { type: 'h2', text: 'Ideias de venda que exploram o efeito' },
      {
        type: 'p',
        text: 'O efeito de revelação é um presente embrulhado em outra surpresa, e os temas certos transformam isso em altíssima conversão. Use o momento da revelação como narrativa de venda, e não como detalhe técnico. Algumas ideias que funcionam muito bem no Brasil:',
      },
      {
        type: 'ul',
        items: [
          'Presente romântico: foto do casal que só aparece com o café quente, campeã no Dia dos Namorados.',
          'Chá revelador de gestante: imagem que revela o sexo do bebê só quando o líquido quente entra, perfeita para festa ou vídeo da família.',
          'Mensagem secreta corporativa: brinde que revela o slogan da empresa com o café, memorável em eventos.',
          'Foto que só aparece quente: ótima para presente de mãe e pai, com foto dos filhos.',
          'Datas sazonais: Natal, aniversários e amigo secreto, com personagens que se revelam na xícara.',
        ],
      },
      { type: 'h2', text: 'Como mostrar o efeito para o cliente' },
      {
        type: 'p',
        text: 'O maior desafio de vender caneca mágica é que a foto estática não mostra o melhor do produto: a revelação. A solução é o vídeo curto de antes e depois, com a caneca preta, a água quente sendo despejada e a imagem surgindo em movimento. Esse formato tem altíssima retenção em reels e stories e costuma ser o conteúdo com mais alcance da semana. No catálogo, inclua as duas imagens, a fria e a revelada, para que quem não assiste vídeo também entenda o efeito.',
      },
      {
        type: 'p',
        text: 'Para gerar essas imagens sem produzir unidade física, o Mockup Studio do Click & Gruda tem simulação de caneca mágica com revelação. Você aplica a arte, alterna entre o estado frio e o revelado e exporta as duas versões em alta resolução. Com os dois arquivos, monta o vídeo de antes e depois ou o carrossel de anúncio em minutos.',
      },
      { type: 'h2', text: 'Precificação: por que cobrar de 2 a 3 vezes mais' },
      {
        type: 'p',
        text: 'A mágica custa de R$ 12,00 a R$ 18,00 no atacado nacional, contra R$ 4,50 a R$ 7,00 da branca comum, ou seja, de 2 a 3 vezes mais caro para produzir. A precificação precisa refletir isso e ainda capturar o valor percebido do efeito: enquanto a branca gira entre R$ 29,90 e R$ 39,90, a mágica sustenta de R$ 55,00 a R$ 79,90 com folga, principalmente em temas de presente. Você vende emoção e surpresa, e não apenas cerâmica com estampa.',
      },
      {
        type: 'p',
        text: 'Some a isso o posicionamento: a mágica é produto de ocasião, vendido com vídeo e storytelling, e não item de prateleira. Anuncie com a narrativa da revelação em vez da foto da caneca preta. Quem entende isso para de competir por preço e passa a vender experiência.',
      },
      {
        type: 'cta',
        title: 'Simule a caneca mágica em 3D',
        text: 'Aplique a arte e gere as imagens fria e revelada com o simulador de caneca mágica do Mockup Studio.',
        href: CTA_LINKS.mockup,
        label: 'Abrir o Mockup Studio',
      },
    ],
    faq: [
      {
        q: 'A caneca mágica perde o efeito com o tempo?',
        a: 'Quando produzida na temperatura correta, o ciclo de revelação se mantém por milhares de usos. O que mata o efeito é o excesso de calor na prensa, que degrada o pigmento. Use 165 a 170 graus, teste o lote e o efeito dura anos.',
      },
      {
        q: 'A caneca mágica pode ir ao micro-ondas e à lava-louças?',
        a: 'O micro-ondas acelera o envelhecimento do pigmento e a lava-louças com ciclo quente também reduz a vida do efeito. Oriente o cliente a lavar à mão e usar o micro-ondas com moderação. A estampa sublimada em si não sai; o cuidado é com a camada preta.',
      },
      {
        q: 'Por que a caneca mágica custa mais caro que a branca?',
        a: 'A camada termossensível e o processo extra de revestimento elevam o custo de fábrica, e o preço no atacado fica 2 a 3 vezes maior. Em troca, o efeito permite vender com margem superior, geralmente entre R$ 55,00 e R$ 79,90 por unidade.',
      },
      {
        q: 'Como divulgar a caneca mágica sem ter uma unidade física?',
        a: 'Use o Mockup Studio: a simulação de caneca mágica com revelação gera as imagens fria e revelada da sua arte, que você monta em vídeo ou carrossel de antes e depois. Assim o cliente entende o efeito antes mesmo da primeira produção.',
      },
    ],
  },
];
