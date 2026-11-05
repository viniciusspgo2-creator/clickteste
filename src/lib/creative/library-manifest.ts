/** Acervo curado para o Editor 2D. Sem imports de runtime/server, Prisma ou APIs.
 * A fonte Tabler @3.46.0 é carregada somente quando o usuário abre a biblioteca.
 * Os demais itens são descritos estaticamente. Nunca misturar personagens protegidos.
 */
import {ENABLE_ICONS_TAB} from './editor-flags';
import backgroundCatalog from './background-catalog.json';
import uploadedItems from './uploaded-library.json';
import type {StockIcon} from './stock-icons';

export type LibraryTab='Modelos'|'Stickers'|'Elementos'|'Formas'|'Molduras e Faixas'|'Fundos e Padrões'|'Frases';
export type LibraryCategory='Aniversário'|'Dia das Mães'|'Dia dos Pais'|'Namorados e Casal'|'Infantil e Bebê'|'Profissões'|'Gospel e Fé'|'Festa e Formatura'|'Pets'|'Humor'|'Empresa e Contato'|'Esporte e Lazer'|'Natureza e Flores';
export type LibraryItem={
 id:string;nome:string;tags:string[];categoria:LibraryCategory;arquivo:string;
 miniatura?:string;estilo?:string;paleta?:string;
 formato:'SVG'|'PNG'|'WEBP'|'TEXTO';tipoCor:'monocromatico-editavel'|'colorido-fechado'|'texto-editavel';
 licenca:'MIT'|'ISC'|'Apache-2.0'|'CC0-1.0'|'Autoral'|'Enviado pelo usuário';origem:string;aba:LibraryTab;
};
export const LIBRARY_CATEGORIES:LibraryCategory[]=['Aniversário','Dia das Mães','Dia dos Pais','Namorados e Casal','Infantil e Bebê','Profissões','Gospel e Fé','Festa e Formatura','Pets','Humor','Empresa e Contato','Esporte e Lazer','Natureza e Flores'];
export const LIBRARY_TABS:LibraryTab[]=['Modelos','Stickers','Elementos','Formas','Molduras e Faixas','Fundos e Padrões','Frases'];
export const LIBRARY_RELEASE={
 tabler:'@tabler/icons@3.46.0',
 fluent:'microsoft/fluentui-emoji@1ffb34c752ecf5d402f04cfb4b392c77f57c54bc',
 noto:'googlefonts/noto-emoji@v2.048',
 lucide:'lucide-icons/lucide@1980e3d59b0fa1a2aeb566d5902b25ee98204001',
 phosphor:'phosphor-icons/core@2b75f3ad12b420c9504ef05df8d2564a28f8500e',
};

/** A identidade do item e o caminho são imutáveis. Somente stickers 3D do Fluent. */
const fluentGroups:[LibraryCategory,string][]=[
 ['Namorados e Casal','Red heart|Orange heart|Yellow heart|Green heart|Blue heart|Purple heart|Black heart|White heart|Brown heart|Broken heart|Heart with arrow|Heart with ribbon|Sparkling heart|Growing heart|Beating heart|Two hearts|Revolving hearts|Smiling face with hearts|Smiling face with heart-eyes|Face blowing a kiss'],
 ['Aniversário','Party popper|Confetti ball|Balloon|Wrapped gift|Birthday cake|Shortcake|Cupcake|Sparkles|Glowing star'],
 ['Natureza e Flores','Cherry blossom|Rose|Sunflower|Tulip|Bouquet|Hibiscus|Four leaf clover|Butterfly|Honeybee|Sun|Rainbow|Cloud'],
 ['Pets','Dog face|Cat face|Unicorn|Teddy bear|Rabbit face'],
 ['Humor','Grinning face|Grinning face with big eyes|Face with tears of joy|Smiling face with smiling eyes|Winking face|Smiling face with sunglasses|Smiling face with halo'],
 ['Infantil e Bebê','Baby bottle|Teddy bear|Balloon|Star'],
 ['Festa e Formatura','Graduation cap|Trophy|Medal|Fireworks|Microphone|Musical note|Crown'],
 ['Profissões','Artist palette|Paintbrush|Pencil|Books|Camera|Laptop'],
 ['Esporte e Lazer','Soccer ball|Basketball|Trophy|Medal|Headphone|Camera'],
 ['Gospel e Fé','Latin cross|Church|Dove'],
 ['Dia das Mães','Bouquet|Rose|Tulip|Sparkling heart|Heart with ribbon'],
 ['Dia dos Pais','Trophy|Medal|Crown|Handshake'],
 ['Empresa e Contato','Mobile phone|Laptop|Camera|Handshake'],
];
const portugues:Record<string,string>={
 'Red heart':'Coração vermelho','Orange heart':'Coração laranja','Yellow heart':'Coração amarelo','Green heart':'Coração verde','Blue heart':'Coração azul','Purple heart':'Coração roxo','Black heart':'Coração preto','White heart':'Coração branco','Brown heart':'Coração marrom','Broken heart':'Coração partido','Heart with arrow':'Coração com flecha','Heart with ribbon':'Coração com laço','Sparkling heart':'Coração brilhante','Growing heart':'Coração crescente','Beating heart':'Coração pulsante','Two hearts':'Dois corações','Revolving hearts':'Corações girando','Smiling face with hearts':'Rosto apaixonado','Smiling face with heart-eyes':'Olhos de coração','Face blowing a kiss':'Enviando beijo',
 'Party popper':'Lança confete','Confetti ball':'Bola de confete','Balloon':'Balão de festa','Wrapped gift':'Presente embrulhado','Birthday cake':'Bolo de aniversário','Shortcake':'Bolo confeitado','Cupcake':'Cupcake','Sparkles':'Brilhos','Glowing star':'Estrela brilhante','Cherry blossom':'Flor de cerejeira','Rose':'Rosa','Sunflower':'Girassol','Tulip':'Tulipa','Bouquet':'Buquê de flores','Hibiscus':'Hibisco','Four leaf clover':'Trevo de quatro folhas','Butterfly':'Borboleta','Honeybee':'Abelha','Sun':'Sol','Rainbow':'Arco-íris','Cloud':'Nuvem',
 'Dog face':'Rosto de cachorro','Cat face':'Rosto de gato','Unicorn':'Unicórnio','Teddy bear':'Ursinho de pelúcia','Rabbit face':'Coelhinho','Grinning face':'Rosto sorridente','Grinning face with big eyes':'Sorriso alegre','Face with tears of joy':'Rindo de chorar','Smiling face with smiling eyes':'Rosto feliz','Winking face':'Piscadinha','Smiling face with sunglasses':'Rosto com óculos','Smiling face with halo':'Anjinho','Baby':'Bebê','Baby bottle':'Mamadeira','Star':'Estrela',
 'Graduation cap':'Chapéu de formatura','Trophy':'Troféu','Medal':'Medalha','Fireworks':'Fogos de artifício','Microphone':'Microfone','Musical note':'Nota musical','Crown':'Coroa','Artist palette':'Paleta de pintura','Paintbrush':'Pincel','Pencil':'Lápis','Books':'Livros','Camera':'Câmera','Laptop':'Computador','Soccer ball':'Bola de futebol','Basketball':'Bola de basquete','Headphone':'Fone de ouvido','Folded hands':'Mãos em oração','Latin cross':'Cruz','Church':'Igreja','Dove':'Pomba','Handshake':'Aperto de mãos','Mobile phone':'Celular',
};
const fluents=new Map<string,LibraryItem>();
for(const [category,names] of fluentGroups){
 for(const en of names.split('|')){
  const slug=en.toLowerCase().replace(/ /g,'_');
  const id=`fluent-${slug}`;
  if(fluents.has(id))continue;
  fluents.set(id,{id,nome:portugues[en]||en,tags:[en.toLowerCase(),portugues[en]||en,category,'figurinha','adesivo','sticker'],categoria:category,
   arquivo:en==='Medal'?'assets/Sports medal/3D/sports_medal_3d.png':`assets/${en}/3D/${slug}_3d.png`,formato:'PNG',tipoCor:'colorido-fechado',licenca:'MIT',origem:'microsoft/fluentui-emoji',aba:'Stickers'});
 }
}
/** Somente os desenhos em svg/ da tag v2.048 (Apache-2.0), nunca fontes OFL. */
const notoGroups:[LibraryCategory,string][]=[
 ['Gospel e Fé','1f64f:Mãos em oração|1f54a:Pomba da paz|1f56f:Vela|262e:Símbolo da paz|1f9ff:Amuleto'],
 ['Aniversário','1f36d:Pirulito|1f36c:Doces|1f36b:Chocolate|1f36a:Biscoito|1f366:Sorvete|1f367:Raspadinha|1f368:Sobremesa|1f36e:Pudim'],
 ['Infantil e Bebê','1f9f8:Ursinho|1f9e9:Quebra-cabeça|1f3a0:Carrossel infantil|1f9f6:Novelo colorido|1f3b2:Jogo de dados|1f3a8:Paleta artística'],
 ['Natureza e Flores','1f340:Trevo|1f341:Folha de outono|1f342:Folhas caindo|1f343:Folha ao vento|1f331:Broto|1f33f:Ramo de planta|1f332:Pinheiro|1f333:Árvore|1f334:Palmeira|1f335:Cacto|1f336:Pimenta|1f347:Uva|1f34e:Maçã vermelha|1f353:Morango|1f34d:Abacaxi'],
 ['Esporte e Lazer','1f3b8:Violão|1f3b9:Teclado musical|1f3ba:Trompete|1f3bb:Violino|1f3c4:Surfe|1f3c6:Troféu dourado|1f3c5:Medalha esportiva|1f6b2:Bicicleta|1f3d5:Acampamento'],
 ['Profissões','1f52c:Microscópio|1f52d:Telescópio|1f4da:Livros empilhados|1f4d0:Régua triangular|1f4cf:Régua|1f58a:Caneta|1f58d:Giz de cera|1f4bd:Minidisco|1f50d:Lupa'],
 ['Pets','1f41e:Joaninha|1f41f:Peixe|1f420:Peixe tropical|1f422:Tartaruga|1f41a:Concha marinha|1f98a:Raposa|1f98b:Borboleta'],
 ['Empresa e Contato','1f4e7:Envelope de email|1f4e6:Encomenda|1f4cb:Prancheta|1f4cc:Alfinete|1f4ce:Clipe|1f4cd:Localizador|1f4e2:Alto-falante'],
];
export const NOTO_STICKERS:LibraryItem[]=notoGroups.flatMap(([categoria,list])=>list.split('|').map(part=>{
 const [code,nome]=part.split(':');return {id:`noto-${code}`,nome,tags:[nome,categoria,'sticker','emoji','desenho','ilustracao'],categoria,arquivo:`svg/emoji_u${code}.svg`,formato:'SVG',
 tipoCor:'colorido-fechado',licenca:'Apache-2.0',origem:'googlefonts/noto-emoji',aba:'Stickers'} as LibraryItem;
}));
export const STICKERS=[...fluents.values(),...NOTO_STICKERS];

/** Complementos de ícones sem triplicar o mesmo desenho: uma família por temática. */
const lucideCurated:[string,string,LibraryCategory][]=[
 ['ambulance','Ambulância','Profissões'],['accessibility','Acessibilidade','Profissões'],['alarm-clock','Despertador','Profissões'],['anvil','Bigorna','Profissões'],['aperture','Diafragma fotográfico','Profissões'],['atom','Átomo','Profissões'],['badge-check','Selo aprovado','Empresa e Contato'],['bed-double','Cama de casal','Empresa e Contato'],['book-heart','Livro com coração','Dia das Mães'],['briefcase-medical','Maleta médica','Profissões'],['cake-slice','Fatia de bolo','Aniversário'],['cooking-pot','Panela de cozinha','Profissões'],['flask-conical','Laboratório','Profissões'],['graduation-cap','Chapéu de formando','Festa e Formatura'],['heart-handshake','Mãos unidas com coração','Gospel e Fé'],['hospital','Hospital','Profissões'],['landmark','Monumento','Empresa e Contato'],['leafy-green','Folhas verdes','Natureza e Flores'],['microscope','Microscópio','Profissões'],['piano','Piano','Esporte e Lazer'],['scissors','Tesoura de costura','Profissões'],['shovel','Pá','Profissões'],['siren','Sirene','Profissões'],['sprout','Muda verde','Natureza e Flores'],['syringe','Seringa médica','Profissões'],['thumbs-up','Joinha','Humor']
];
const phosphorCurated:[string,string,LibraryCategory][]=[
 ['baby-carriage','Carrinho de bebê','Infantil e Bebê'],['barbell','Barra de musculação','Esporte e Lazer'],['bowl-food','Tigela de comida','Pets'],['broom','Vassoura','Profissões'],['carrot','Cenoura','Natureza e Flores'],['chef-hat','Chapéu de chef','Profissões'],['egg','Ovo','Natureza e Flores'],['envelope','Envelope de carta','Empresa e Contato'],['first-aid','Primeiros socorros','Profissões'],['flower','Flor delicada','Natureza e Flores'],['hand-heart','Mão com coração','Dia das Mães'],['house','Casinha','Empresa e Contato'],['mailbox','Caixa de correio','Empresa e Contato'],['music-notes','Notas musicais','Esporte e Lazer'],['paw-print','Patinha','Pets'],['plant','Planta em vaso','Natureza e Flores'],['stethoscope','Estetoscópio','Profissões'],['wrench','Chave de manutenção','Profissões'],['watch','Relógio de pulso','Dia dos Pais'],['wine','Taça de vinho','Namorados e Casal'],['yarn','Novelo de lã','Profissões'],['balloon','Balão em traço','Aniversário'],['brain','Cérebro','Profissões'],['guitar','Guitarra','Esporte e Lazer'],['sun','Sol estilizado','Natureza e Flores']
];
export const COMPLEMENTARY_ICONS:LibraryItem[]=[
 ...lucideCurated.map(([file,nome,categoria])=>({id:`lucide-${file}`,nome,tags:[nome,categoria,'icone','vetor','arte','simbolo'],categoria,arquivo:file,formato:'SVG' as const,tipoCor:'monocromatico-editavel' as const,licenca:'ISC' as const,origem:'lucide-icons/lucide',aba:'Elementos' as const})),
 ...phosphorCurated.map(([file,nome,categoria])=>({id:`phosphor-${file}`,nome,tags:[nome,categoria,'icone','vetor','arte','simbolo'],categoria,arquivo:file,formato:'SVG' as const,tipoCor:'monocromatico-editavel' as const,licenca:'MIT' as const,origem:'phosphor-icons/core',aba:'Elementos' as const})),
];
const RESERVED_ICON_NAMES=new Set([...lucideCurated,...phosphorCurated].map(x=>x[0]));

export const SHAPES:[string,string,LibraryTab,LibraryCategory][]=[
 ['star5','Estrela de cinco pontas','Formas','Festa e Formatura'],['star6','Estrela de seis pontas','Formas','Festa e Formatura'],['sparkle4','Brilho de quatro pontas','Formas','Aniversário'],['heart','Coração cheio','Formas','Namorados e Casal'],['heart-outline','Coração contornado','Formas','Namorados e Casal'],['heart-double','Coração duplo','Formas','Namorados e Casal'],['cloud','Nuvem','Formas','Infantil e Bebê'],['bubble','Bolha','Formas','Infantil e Bebê'],['speech','Balão de fala','Formas','Humor'],['seal','Selo serrilhado','Formas','Empresa e Contato'],['tag','Etiqueta','Formas','Empresa e Contato'],['arrow','Seta decorativa','Formas','Empresa e Contato'],['divider','Linha divisória','Formas','Empresa e Contato'],['confetti','Confetes','Formas','Aniversário'],['circle','Círculo','Formas','Infantil e Bebê'],['diamond','Losango','Formas','Festa e Formatura'],['triangle','Triângulo','Formas','Empresa e Contato'],['hexagon','Hexágono','Formas','Empresa e Contato'],
 ['ribbon','Faixa de título','Molduras e Faixas','Festa e Formatura'],['ribbon-curved','Faixa curva','Molduras e Faixas','Aniversário'],['banner','Banner reto','Molduras e Faixas','Empresa e Contato'],['banner-folded','Faixa dobrada','Molduras e Faixas','Festa e Formatura'],['frame-rounded','Moldura arredondada','Molduras e Faixas','Dia das Mães'],['frame-double','Moldura dupla','Molduras e Faixas','Dia dos Pais'],['frame-circle','Moldura circular rendada','Molduras e Faixas','Namorados e Casal'],['frame-heart','Moldura coração','Molduras e Faixas','Namorados e Casal'],['frame-polaroid','Polaroid com legenda','Molduras e Faixas','Infantil e Bebê'],['frame-oval','Moldura oval','Molduras e Faixas','Natureza e Flores'],['frame-star','Moldura estrelada','Molduras e Faixas','Festa e Formatura']
];
export const NATIVE_SHAPES:LibraryItem[]=SHAPES.flatMap(([id,nome,aba,categoria])=>['solido','contorno','duplo'].filter(v=>v!=='duplo'||id.startsWith('frame')||id.includes('heart')).map(variant=>({
 id:`original-${id}-${variant}`,nome:`${nome}${variant==='solido'?'':variant==='contorno'?' · contorno':' · dupla'}`,
 tags:[nome,categoria,'formas','moldura',variant,'personalizar','vetor'],categoria,arquivo:`native:${id}:${variant}`,formato:'SVG' as const,
 tipoCor:'monocromatico-editavel' as const,licenca:'Autoral' as const,origem:'Click & Gruda (original)',aba,
})));

export const PALETTES:[string,string,string,LibraryCategory][]=[
 ['Rosê delicado','#f9dce5','#bc678b','Dia das Mães'],['Romance vinho','#2e101f','#dd668c','Namorados e Casal'],['Azul bebê','#d7effa','#6ab4df','Infantil e Bebê'],['Verde bebê','#dbf4de','#76c8ac','Infantil e Bebê'],['Dourado elegante','#27201f','#e6ba74','Festa e Formatura'],['Noite azul','#0c1c39','#4d7ac8','Dia dos Pais'],['Laranja vibrante','#25181a','#ff8a30','Aniversário'],['Lavanda','#e4d5ff','#a489df','Natureza e Flores'],['Verde floresta','#092b22','#a6c88f','Natureza e Flores'],['Creme suave','#f6e9d5','#d9b795','Dia das Mães'],['Pêssego','#fff0df','#f6ab94','Aniversário'],['Cinza pro','#151820','#757d91','Empresa e Contato'],['Roxo fé','#25162b','#bc9bd4','Gospel e Fé'],['Vermelho festa','#721e33','#f8b65b','Festa e Formatura'],['Branco minimal','#ffffff','#ced0d7','Empresa e Contato']
];
export const PATTERN_TYPES:[string,string][]=[['degrade','Degradê'],['bolinhas','Poás'],['listras','Listras'],['estrelas','Estrelas'],['coracoes','Corações'],['confete','Confetes'],['ondas','Ondas']];
export const BACKGROUND_ITEMS:LibraryItem[]=PALETTES.flatMap(([nome,a,b,categoria],index)=>PATTERN_TYPES.map(([pattern,label])=>({
 id:`bg-${index}-${pattern}`,nome:`${label} · ${nome}`,tags:[label,nome,categoryAlias(categoria),'fundo','padrao','textura','caneca'],estilo:'Clássicos',paleta:nome,categoria,arquivo:`background:${index}:${pattern}`,
 formato:'SVG' as const,tipoCor:'monocromatico-editavel' as const,licenca:'Autoral' as const,origem:'Click & Gruda (original)',aba:'Fundos e Padrões' as const
})));
export const EXPANDED_BACKGROUND_ITEMS:LibraryItem[]=PALETTES.flatMap(([paleta,,,categoria],index)=>backgroundCatalog.map(pattern=>({
 id:`pattern-${pattern.id}-${index}`,nome:`${pattern.nome} · ${paleta}`,tags:[...pattern.tags,pattern.estilo,paleta,'fundo','padrao','textura','estampa'],
 categoria,arquivo:`pattern:${pattern.id}:${index}`,formato:'SVG',tipoCor:'colorido-fechado',licenca:pattern.source==='original'?'Autoral':'MIT',
 origem:pattern.source==='original'?'Click & Gruda (original)':'Pattern Monster',aba:'Fundos e Padrões',estilo:pattern.estilo,paleta,
})));
export const BACKGROUND_STYLES=['Clássicos',...new Set(EXPANDED_BACKGROUND_ITEMS.map(item=>item.estilo!))];
function categoryAlias(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}

const phrases:[LibraryCategory,string[]][]=[
 ['Aniversário',['Feliz aniversário!','Parabéns pelo seu dia!','Hoje é dia de celebrar','Que seus sonhos floresçam','Mais um ano de histórias','Viva a vida!','Celebre cada momento','Um brinde à felicidade']],
 ['Dia das Mães',['Mãe, meu porto seguro','Amor que não tem medida','Mãe, você é meu presente','Minha primeira amiga','Rainha da minha vida','Amor de mãe é para sempre','Mãe, minha inspiração','Para a melhor mãe']],
 ['Dia dos Pais',['Pai, meu herói','Orgulho de ser seu filho','Pai, você é incrível','Meu exemplo de vida','Amor de pai é eterno','Você merece o mundo','Meu parceiro de aventuras']],
 ['Namorados e Casal',['Você é meu lugar favorito','Nosso amor, nossa história','Juntos é meu lugar preferido','Eu escolheria você de novo','Amor em cada detalhe','Você me faz sorrir','Nosso para sempre','Amar é dividir sonhos']],
 ['Infantil e Bebê',['Bem-vindo, bebê!','Pequeno grande amor','A aventura começa aqui','Meu mundo colorido','Feito com amor','Pequenos sonhos, grandes conquistas','Crescendo e encantando']],
 ['Profissões',['Orgulho da minha profissão','Feito por mãos que criam','Profissional de coração','A dedicação faz diferença','Trabalho com propósito','Você faz a diferença','Apaixonado pelo que faço']],
 ['Gospel e Fé',['Deus cuida de mim','Fé que move montanhas','Abençoado além das palavras','Gratidão transforma','Deus é fiel','Entrego, confio e agradeço','Tudo tem seu tempo','Onde há fé, há esperança']],
 ['Festa e Formatura',['Consegui!','Uma conquista de cada vez','O melhor está por vir','Formei!','Valeu cada esforço','Meu momento chegou','Comemore essa vitória']],
 ['Pets',['Meu amor tem quatro patas','Lar é onde meu pet está','Patinhas e amor','Meu melhor amigo tem patas','Amor que late e mia','Vida boa com meu pet']],
 ['Humor',['Café primeiro, conversa depois','Acordei com sono','Sorria, é de graça!','Modo descanso ativado','Hoje eu mereço','Um dia de cada vez','Sextou!']],
 ['Empresa e Contato',['Feito especialmente para você','Obrigada pela preferência!','Seu negócio, sua paixão','Transformando ideias em presentes','Criado com carinho','Pequenos detalhes, grandes resultados']],
 ['Esporte e Lazer',['A paixão me move','Energia para vencer','É mais que um jogo','Vamos além!','Treino, foco e coragem','Acredite no seu potencial']],
 ['Natureza e Flores',['Floresça onde estiver','Cultive bons momentos','A beleza mora nos detalhes','Leveza para a alma','Que a vida floresça','Respire e agradeça']]
];
export const PHRASE_ITEMS:LibraryItem[]=phrases.flatMap(([categoria,strings])=>strings.map((nome,index)=>({
 id:`phrase-${categoryAlias(categoria).replace(/[^a-z0-9]+/g,'-')}-${index}`,nome,tags:[nome,categoria,'frase','mensagem','texto','personalizar'],categoria,arquivo:`text:${nome}`,formato:'TEXTO',
 tipoCor:'texto-editavel',licenca:'Autoral',origem:'Click & Gruda (original)',aba:'Frases'
})));

const occasionTags:[LibraryCategory,RegExp,string[]][]=[
 ['Namorados e Casal',/heart|love|kiss|couple|ring|flower-heart|roses?|valentine|relationship|romance|wedding|diamond|hearts/i,['amor','coracao','casal','namorado','esposa','marido','romantico']],
 ['Aniversário',/birthday|cake|candle|balloon|gift|confetti|party|celebrat|stars|sparkle|present|cupcake/i,['aniversario','festa','parabens','presente']],
 ['Dia das Mães',/mother|woman|heart-handshake|flower|bouquet|family|woman-heart/i,['mae','mamae','amor','familia']],
 ['Dia dos Pais',/father|man|mustache|tools|briefcase|tie|grill|helmet/i,['pai','papae','familia','heroi']],
 ['Infantil e Bebê',/baby|toy|cradle|school|abc|alphabet|blocks|puzzle|teddy|balloon|child|kids|lollipop|unicorn/i,['bebe','infantil','crianca','menino','menina']],
 ['Profissões',/worker|doctor|nurse|teacher|stethoscope|medical|hammer|wrench|tool|paint|chef|school|police|firefighter|engineer|briefcase|building|office|work|job|tractor|truck/i,['profissao','trabalho','medico','professor','cozinheiro']],
 ['Gospel e Fé',/pray|cross|church|bible|angel|religion|faith|candle|peace|dove|sunrise/i,['fe','gospel','deus','oracao','igreja']],
 ['Festa e Formatura',/graduat|trophy|medal|award|confetti|party|certificate|cap|celebrat|sparkle|star/i,['festa','formatura','conquista','celebracao']],
 ['Pets',/paw|cat|dog|pet|rabbit|fish|bird|horse|animal|bone|butterfly/i,['cachorro','gato','pet','bicho','animal']],
 ['Humor',/mood|face|smile|laugh|emoji|joke|comic|wink|meme|mask/i,['humor','engracado','sorriso','risada']],
 ['Empresa e Contato',/phone|mail|message|chat|qr|wifi|at|building|store|shopping|business|address|map|contact|website|link|world|network|brand-instagram|brand-whatsapp/i,['empresa','negocio','contato','telefone','redes']],
 ['Esporte e Lazer',/ball|football|basket|sport|fitness|run|bike|bicycle|swim|trophy|medal|game|travel|music|guitar|camera|camping|mountain/i,['esporte','lazer','jogo','musica','corrida']],
 ['Natureza e Flores',/flower|leaf|plant|tree|forest|sun|moon|star|cloud|rain|water|fish|butterfly|nature|flower|mountain|seed|garden|wind|wave/i,['natureza','flores','flor','planta','jardim','paisagem']],
];
const tokenPortuguese:Record<string,string>={heart:'coração',hearts:'corações',flower:'flor',flowers:'flores',cat:'gato',dog:'cachorro',paw:'patinha',baby:'bebê',gift:'presente',cake:'bolo',star:'estrela',stars:'estrelas',sun:'sol',moon:'lua',cloud:'nuvem',home:'casa',school:'escola',book:'livro',music:'música',camera:'câmera',car:'carro',bike:'bicicleta',ball:'bola',trophy:'troféu',medal:'medalha',phone:'telefone',mail:'email',message:'mensagem',cup:'xícara',mug:'caneca',church:'igreja',cross:'cruz',hand:'mão',hands:'mãos',child:'criança',children:'crianças',man:'homem',woman:'mulher',family:'família',fire:'fogo',water:'água',tree:'árvore',leaf:'folha',paint:'pintura',brush:'pincel',sunflower:'girassol',butterfly:'borboleta',truck:'caminhão',doctor:'médico',nurse:'enfermeira',teacher:'professor',basketball:'basquete',football:'futebol',coffee:'café',party:'festa',wedding:'casamento',ring:'anel',smile:'sorriso',crown:'coroa',sparkles:'brilhos',balloon:'balão',confetti:'confete'};
const forbidden=/(^brand-(?!instagram$|facebook$|whatsapp$|youtube$|tiktok$)|marvel|dc-|pokemon|naruto|dragon-ball|nba|fifa|disney|batman|superman|team|flag|politic|weapon|gun|knife|bomb|skull|cannabis)/i;
const important=/(heart|gift|birthday|cake|star|sparkle|flower|baby|school|book|paw|dog|cat|bird|fish|leaf|tree|work|tool|hammer|paint|chef|phone|mail|chat|football|basket|trophy|medal|music|camera|party|cross|church|pray|teacher|doctor|nurse|flower|balloon|family|home|circle|arrow|label|ribbon|cloud|sun|moon|mountain|water|butterfly|diamond|crown|hand|woman|man|face|smile|bike|coffee|cup|mug|pet|animal|shopping|brush|certificate|letter|world|building|vehicle|truck|star)/i;
export function normalizeLibrarySearch(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();}
/** Curadoria determinística do índice oficial, sem criar nomes de arquivo imaginários. */
export function curatedFromTabler(catalog:StockIcon[]):LibraryItem[]{
 const visited=new Set<string>();
 const list:LibraryItem[]=[];
 for(const icon of catalog){
  const name=icon.name;
  if(visited.has(name)||RESERVED_ICON_NAMES.has(name)||forbidden.test(name)||!important.test(`${name} ${icon.label}`))continue;
  visited.add(name);
  const match=occasionTags.find(([_,regex])=>regex.test(`${name} ${icon.label}`));
  if(!match)continue;
  const [categoria,,aliases]=match;
  const chunks=name.split('-'),portuguese=chunks.map(w=>tokenPortuguese[w]||w);
  const nome=portuguese.join(' ').replace(/^./,x=>x.toLocaleUpperCase('pt-BR'));
  list.push({id:`tabler-${name}`,nome,tags:[...aliases,name.replaceAll('-',' '),...chunks.map(w=>tokenPortuguese[w]||w),icon.label,categoria],categoria,
   arquivo:name,formato:'SVG',tipoCor:'monocromatico-editavel',licenca:'MIT',origem:'tabler/tabler-icons',aba:'Elementos'});
 }
 // Intercala ocasiões para evitar que uma categoria consuma todo o limite.
 const queues=LIBRARY_CATEGORIES.map(category=>list.filter(x=>x.categoria===category).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')));
 const balanced:LibraryItem[]=[];
 let remaining=true;
 while(balanced.length<1600&&remaining){
  remaining=false;
  for(const queue of queues){
   const entry=queue.shift();if(entry){balanced.push(entry);remaining=true;}
   if(balanced.length>=1600)break;
  }
 }
 return balanced;
}
/** 24 ilustrações vetoriais originais, geradas localmente e recoloríveis. */
export const KAWAII_ITEMS:LibraryItem[]=([["coffee", "Café", "Humor"], ["cloud", "Nuvem", "Infantil e Bebê"], ["star", "Estrela", "Infantil e Bebê"], ["moon", "Lua", "Infantil e Bebê"], ["flower", "Flor", "Natureza e Flores"], ["cactus", "Cacto", "Natureza e Flores"], ["cat", "Gatinho", "Pets"], ["dog", "Cachorrinho", "Pets"], ["bear", "Ursinho", "Infantil e Bebê"], ["bunny", "Coelhinho", "Infantil e Bebê"], ["donut", "Donut", "Aniversário"], ["strawberry", "Morango", "Natureza e Flores"], ["avocado", "Abacate", "Humor"], ["mushroom", "Cogumelo", "Natureza e Flores"], ["bee", "Abelhinha", "Natureza e Flores"], ["butterfly", "Borboleta", "Natureza e Flores"], ["rocket", "Foguete", "Infantil e Bebê"], ["gift", "Presente", "Aniversário"], ["book", "Livrinho", "Profissões"], ["heart", "Coração", "Namorados e Casal"], ["rainbow", "Arco-íris", "Infantil e Bebê"], ["planet", "Planeta", "Infantil e Bebê"], ["balloon", "Balão", "Aniversário"], ["icecream", "Sorvete", "Aniversário"]] as [string,string,LibraryCategory][]).map(([id,nome,categoria])=>({
 id:`kawaii-${id}`,nome:`${nome} kawaii`,categoria,tags:[nome,categoria,'fofo','kawaii','desenho','ilustracao','sticker','infantil','sublimacao'],arquivo:`kawaii:${id}`,
 formato:'SVG',tipoCor:'monocromatico-editavel',licenca:'Autoral',origem:'Click & Gruda',aba:'Stickers',
}));
export const UPLOADED_ITEMS=uploadedItems as LibraryItem[];
export const STATIC_MANIFEST:LibraryItem[]=[...EXPANDED_BACKGROUND_ITEMS,...UPLOADED_ITEMS,...KAWAII_ITEMS,...STICKERS,...(ENABLE_ICONS_TAB?COMPLEMENTARY_ICONS:[]),...NATIVE_SHAPES,...BACKGROUND_ITEMS,...PHRASE_ITEMS];
export function libraryManifest(catalog:StockIcon[]):LibraryItem[]{
 const dynamic=ENABLE_ICONS_TAB?curatedFromTabler(catalog):[];
 return [...STATIC_MANIFEST,...dynamic];
}
export function libraryMatch(item:LibraryItem,term:string){
 const s=normalizeLibrarySearch(term);if(!s)return true;
 return normalizeLibrarySearch([item.nome,item.categoria,...item.tags].join(' ')).includes(s);
}
