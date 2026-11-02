import { uid, type DesignDocument,type DesignNode } from './design';
export const builtInPresets = [
 {id:'elite',name:'Vitrine Elite',category:'Campanha',description:'Preto, laranja e destaque central'},
 {id:'minimal',name:'Editorial',category:'Minimalista',description:'Apresentação com amplo espaço visual'},
 {id:'natal',name:'Natal Elegante',category:'Sazonal',description:'Contraste e elegância natalina'},
 {id:'oferta',name:'Oferta Premium',category:'Comercial',description:'Tipografia de alto contraste'},
] as const;
export type PresetId=typeof builtInPresets[number]['id'];
const rect=(x:number,y:number,w:number,h:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'rect',x,y,w,h,fill,angle:0,opacity:1,...extra});
const circle=(x:number,y:number,w:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'circle',x,y,w,h:w,fill,angle:0,opacity:1,...extra});
const text=(txt:string,x:number,y:number,w:number,h:number,size:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'text',text:txt,x,y,w,h,size,fill,angle:0,opacity:1,bold:true,font:'Arial',...extra});
const logo=():DesignNode=>({id:uid(),kind:'image',src:'/creative-brand/logo-vertical.png',x:420,y:1200,w:240,h:160,angle:0,opacity:1});
export function makeBuiltInPreset(id:PresetId):DesignDocument{
 const D=(background:string,nodes:DesignNode[]):DesignDocument=>({width:1080,height:1350,background,nodes});
 if(id==='elite')return D('#09090d',[
  rect(0,0,1080,18,'#f47c1f'),circle(670,380,750,'#20130f'),circle(150,430,470,'#241710',{opacity:.6}),
  text('ESTAMPA PARA CANECAS',90,110,900,80,40,'#e8a16d'),
  text('SUA ARTE,',85,200,910,96,93,'#ffffff'),text('OUTRO NÍVEL.',85,295,910,115,91,'#ff8c25'),
  rect(250,995,580,30,'#e77d24',{radius:15,shadow:25}),
  text('MODELO DEMONSTRATIVO',220,1110,640,55,27,'#aaa3a0'),
  rect(80,1254,920,3,'#ba6b31'),text('ACESSE: CLICKGRUDA.COM.BR',140,1278,800,48,26,'#ffba86'),
 ]);
 if(id==='minimal')return D('#f0eee9',[
  rect(0,0,1080,12,'#e6731f'),rect(0,1140,1080,210,'#171717'),
  text('APRESENTAÇÃO',108,100,864,90,34,'#d4763c'),text('FEITA PARA',108,182,864,84,68,'#1d1c1d'),
  text('IMPRESSIONAR.',108,265,864,100,72,'#1d1c1d'),
  circle(290,525,600,'#f9f6f2',{opacity:.75}),
  rect(210,1035,660,15,'#dda06b',{radius:8,shadow:15}),
  text('DESIGN • REALISMO • CRIATIVIDADE',140,1165,800,45,28,'#ef9e64'),
  text('CLICKGRUDA.COM.BR',140,1235,800,55,33,'#ffffff'),
 ]);
 if(id==='natal')return D('#101a15',[
  rect(0,0,1080,15,'#ad8141'),circle(820,280,680,'#1e3328',{opacity:.8}),
  text('MOMENTOS ESPECIAIS',80,120,920,55,36,'#eaca90'),
  text('UM PRESENTE',76,230,928,92,81,'#fff8e8'),text('COM AFETO',76,325,928,93,84,'#efc38a'),
  rect(190,1040,700,20,'#ad8141',{radius:10,shadow:28}),
  circle(35,910,225,'#9e2d2a',{opacity:.9}),circle(900,875,195,'#a22f2b'),
  text('ESTAMPA PARA CANECAS',140,1115,800,60,34,'#f1dbad'),
  text('CLICKGRUDA.COM.BR',140,1215,800,58,37,'#ffffff'),
 ]);
 return D('#181616',[
  rect(0,0,1080,260,'#f58828'),rect(0,1270,1080,80,'#f58828'),
  text('OFERTA ESPECIAL',80,60,920,125,91,'#13100f'),
  text('MAIS QUE UMA',84,308,912,80,59,'#ffffff'),
  text('CANECA.',85,382,910,108,101,'#ffa15a'),
  circle(750,620,540,'#332117'),
  rect(210,1035,660,23,'#f58828',{radius:12,shadow:20}),
  text('DÊ VIDA À SUA IDEIA',105,1100,870,65,50,'#f6f0eb'),
  text('ACESSE CLICKGRUDA.COM.BR',100,1275,880,65,32,'#1d1310'),
 ]);
}
