import { uid, type DesignDocument,type DesignNode } from './design';
/** Modelos editáveis para a área total de 21 × 9,5 cm (2480 × 1122 px).
 * Textos importantes permanecem na área segura aproximada de 19 × 8,5 cm.
 * IDs anteriores preservados para compatibilidade com links e projetos existentes.
 */
export const builtInPresets = [
 {id:'elite',name:'Vitrine Elite',category:'Minimalista',description:'Preto sofisticado, título e área livre para foto'},
 {id:'minimal',name:'Editorial',category:'Minimalista',description:'Clean, suave e editável'},
 {id:'natal',name:'Natal Elegante',category:'Natal',description:'Verde profundo, dourado e mensagem natalina'},
 {id:'oferta',name:'Oferta Premium',category:'Comercial',description:'Para divulgar produtos ou serviços'},
 {id:'aniversario',name:'Aniversário especial',category:'Aniversário',description:'Personalize nome e mensagem de aniversário'},
 {id:'maes',name:'Para a melhor mãe',category:'Dia das Mães',description:'Estampa com mensagem carinhosa'},
 {id:'profissao',name:'Orgulho da profissão',category:'Profissões',description:'Homenageie quem ama o que faz'},
 {id:'gospel',name:'Fé que inspira',category:'Gospel e Fé',description:'Mensagens de esperança e gratidão'},
 {id:'infantil',name:'Meu mundo colorido',category:'Infantil e Bebê',description:'Infantil delicado e alegre'},
 {id:'casal',name:'Nossa história',category:'Namorados e Casal',description:'Mensagem romântica e espaço para fotos'},
] as const;
export type PresetId=typeof builtInPresets[number]['id'];
const W=2480,H=1122;
const rect=(x:number,y:number,w:number,h:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'rect',x,y,w,h,fill,angle:0,opacity:1,...extra});
const circle=(x:number,y:number,w:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'circle',x,y,w,h:w,fill,angle:0,opacity:1,...extra});
const text=(txt:string,x:number,y:number,w:number,h:number,size:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'text',text:txt,x,y,w,h,size,fill,angle:0,opacity:1,bold:true,font:'Arial',...extra});
export function makeBuiltInPreset(id:PresetId):DesignDocument{
 const D=(background:string,nodes:DesignNode[]):DesignDocument=>({width:W,height:H,background,nodes:nodes.map(n=>({...n,role:'template'}))});
 if(id==='elite')return D('#0b0b0f',[
  rect(0,0,W,18,'#ff6a00'),rect(0,H-22,W,22,'#ff6a00'),circle(1550,110,920,'#231711',{opacity:.8}),
  text('SUA HISTÓRIA',180,220,1350,165,124,'#ffffff'),text('MERECE SER LEMBRADA',180,405,1650,124,76,'#ffa56a'),
  rect(180,680,1020,10,'#ff6a00',{radius:5}),text('Edite este texto e personalize sua arte',180,735,1580,126,52,'#ece5de',{bold:false}),
 ]);
 if(id==='minimal')return D('#f4efe7',[
  rect(0,0,W,20,'#ce9361'),circle(1620,70,1020,'#e6d4c5',{opacity:.6}),circle(1810,360,620,'#f8f5ef'),
  text('UM CARINHO',180,275,1580,172,129,'#342923'),text('EM FORMA DE PRESENTE',180,470,1840,125,81,'#bc7447'),
  rect(190,725,840,8,'#b98560',{radius:4}),text('Seu nome e sua mensagem especial',180,775,1640,94,49,'#5f524b',{bold:false}),
 ]);
 if(id==='natal')return D('#10251c',[
  rect(0,0,W,24,'#d7ac60'),rect(0,H-24,W,24,'#d7ac60'),circle(1810,60,580,'#194432'),circle(2050,680,360,'#9e292a',{opacity:.7}),
  text('FELIZ NATAL',180,240,1880,200,155,'#fff8e8'),text('Paz, amor e bons momentos',185,480,1800,135,79,'#edc886'),
  rect(185,710,1020,9,'#d7ac60',{radius:5}),text('Com carinho, seu nome',185,756,1320,105,59,'#f6ead5'),
 ]);
 if(id==='oferta')return D('#18171a',[
  rect(0,0,380,H,'#ff791c'),rect(0,H-30,W,30,'#ff791c'),circle(1770,90,720,'#30231c'),
  text('OFERTA ESPECIAL',470,210,1800,168,143,'#ffffff'),text('SEU PRODUTO AQUI',475,420,1750,128,92,'#ffa55c'),
  rect(485,650,1080,130,'#ff791c',{radius:32}),text('Personalize preço e mensagem',510,681,1630,72,54,'#191315'),
 ]);
 if(id==='aniversario')return D('#241a31',[
  circle(1770,35,580,'#65448f'),circle(1960,710,310,'#ec8c53'),circle(135,780,240,'#ecb5b4'),
  text('FELIZ ANIVERSÁRIO!',185,200,1900,168,131,'#fff7ee'),text('SEU NOME',180,398,1700,160,129,'#ffc985'),
  rect(185,635,1080,10,'#f5c27e',{radius:6}),text('Que seu dia seja inesquecível!',185,700,1880,140,72,'#f7dfea'),
 ]);
 if(id==='maes')return D('#fff2ec',[
  circle(1720,75,730,'#f7ced0',{opacity:.9}),circle(2080,675,280,'#b96b71',{opacity:.5}),
  text('MÃE,',190,205,1850,160,152,'#834c55'),text('SEU AMOR TRANSFORMA TUDO',195,420,2040,170,93,'#9d5b66'),
  rect(190,650,960,9,'#d88e9e',{radius:5}),text('Com amor, seu nome',190,720,1740,106,66,'#76535c'),
 ]);
 if(id==='profissao')return D('#16242d',[
  rect(0,0,W,23,'#fba94c'),rect(2000,0,480,H,'#213c4b'),circle(1850,230,490,'#31576c'),
  text('ORGULHO DE SER',185,240,1960,140,116,'#d9e7ef'),text('SUA PROFISSÃO',185,430,1990,170,132,'#ffc16c'),
  text('Seu nome • Sua paixão',185,720,1760,110,69,'#f6f0e9'),
 ]);
 if(id==='gospel')return D('#f8f3e9',[
  rect(0,0,W,16,'#a58d62'),circle(1690,85,710,'#eae2c8',{opacity:.8}),
  text('FÉ, ESPERANÇA',195,242,1960,170,128,'#4e5c46'),text('E GRATIDÃO',195,440,1860,150,130,'#9b8050'),
  rect(195,668,890,8,'#a58d62',{radius:5}),text('Uma bênção a cada dia',195,730,1680,109,66,'#68765b'),
 ]);
 if(id==='infantil')return D('#ecf5ff',[
  circle(1740,80,680,'#ffcad5'),circle(150,70,190,'#ffda86'),circle(2150,770,265,'#a0e2d4'),
  text('MEU MUNDO',185,220,1830,175,137,'#426999'),text('É MAIS COLORIDO',185,424,1980,145,109,'#e67c85'),
  rect(190,700,850,11,'#ffb05e',{radius:6}),text('Seu nome especial',190,765,1790,110,69,'#5c8693'),
 ]);
 return D('#251826',[
  circle(1720,50,740,'#6e3b59',{opacity:.9}),circle(1820,380,560,'#ae7189',{opacity:.7}),
  text('NOSSA HISTÓRIA',190,235,1980,168,135,'#fff4ed'),text('É MEU PRESENTE FAVORITO',195,450,2050,142,85,'#ffc0ac'),
  rect(190,700,1080,9,'#f2a5a1',{radius:5}),text('Seu nome + meu nome',190,765,1880,108,72,'#fff4ed'),
 ]);
}
