import {uid,type DesignDocument,type DesignNode} from './design';

/** Layouts de divulgação; são documentos editáveis, não estampas de caneca.
 * O mockup enviado do Studio 3D continua sendo uma camada independente.
 * O acervo de 21 × 9,5 cm permanece em presets.ts.
 */
export const socialPresets=[
 {id:'feed-vitrine',name:'Vitrine Premium',description:'Destaque seu mockup com acabamento preto e laranja',format:'feed',background:'#0B0B0F',accent:'#FF7927',secondary:'#FFF3E8',title:'SUA ARTE EM DESTAQUE',subtitle:'PERSONALIZE E SURPREENDA',footer:'ENCOMENDE A SUA',category:'Vendas'},
 {id:'feed-presente',name:'Presente Especial',description:'Composição elegante para divulgar presentes',format:'feed',background:'#F8F0E8',accent:'#C87A58',secondary:'#49352F',title:'PRESENTES ÚNICOS',subtitle:'FEITOS COM CARINHO',footer:'UM DETALHE QUE ENCANTA',category:'Presentes'},
 {id:'feed-oferta',name:'Oferta Laranja',description:'Chamada comercial com espaço para o produto',format:'feed',background:'#19191F',accent:'#FF6A00',secondary:'#FFFFFF',title:'OFERTA ESPECIAL',subtitle:'SUA CANECA PERSONALIZADA',footer:'PEÇA A SUA AGORA',category:'Ofertas'},
 {id:'feed-aniversario',name:'Aniversário Encantador',description:'Apresente canecas de aniversário com leveza',format:'feed',background:'#2B2037',accent:'#FFB2B5',secondary:'#FFF5EF',title:'CELEBRE MOMENTOS',subtitle:'UM PRESENTE COM SEU TOQUE',footer:'PERSONALIZE COM UM NOME',category:'Aniversário'},
 {id:'feed-natal',name:'Natal Afetivo',description:'Vitrine natalina para canecas e lembranças',format:'feed',background:'#103128',accent:'#EFC180',secondary:'#FFF6E5',title:'MAGIA DO NATAL',subtitle:'PRESENTES COM SIGNIFICADO',footer:'SURPREENDA QUEM VOCÊ AMA',category:'Natal'},
 {id:'feed-fe',name:'Fé e Gratidão',description:'Visual delicado para presentes religiosos',format:'feed',background:'#F3EFE4',accent:'#AE9369',secondary:'#405849',title:'FÉ EM CADA DETALHE',subtitle:'UM PRESENTE QUE INSPIRA',footer:'FEITO ESPECIALMENTE PARA VOCÊ',category:'Gospel e Fé'},
 {id:'story-vitrine',name:'Story Profissional',description:'Divulgação vertical com bastante espaço para o mockup',format:'story',background:'#0B0B0F',accent:'#FF7B28',secondary:'#FFFFFF',title:'NOVIDADE POR AQUI',subtitle:'SEU PRESENTE PERSONALIZADO',footer:'FAÇA SUA ENCOMENDA',category:'Vendas'},
 {id:'story-oferta',name:'Story de Oferta',description:'Destaque a caneca e uma chamada comercial',format:'story',background:'#241B21',accent:'#FF6A00',secondary:'#FFF4E8',title:'OFERTA IMPERDÍVEL',subtitle:'PERSONALIZE DO SEU JEITO',footer:'CHAME NO DIRECT',category:'Ofertas'},
 {id:'story-presente',name:'Story para Presentear',description:'Cores suaves e chamada de presente',format:'story',background:'#F6E8E0',accent:'#D48D9B',secondary:'#563E50',title:'UM PRESENTE ÚNICO',subtitle:'CADA DETALHE CONTA',footer:'ESCOLHA A SUA ARTE',category:'Presentes'},
 {id:'story-aniversario',name:'Story de Aniversário',description:'Uma vitrine alegre para datas especiais',format:'story',background:'#282047',accent:'#FCAB7D',secondary:'#FFF3ED',title:'PARABÉNS EM GRANDE ESTILO',subtitle:'CANECAS PERSONALIZADAS',footer:'ENCOMENDE PARA CELEBRAR',category:'Aniversário'},
 {id:'story-natal',name:'Story Natalino',description:'Vitrine vertical para os presentes de Natal',format:'story',background:'#122C28',accent:'#EEC08B',secondary:'#F9F0DE',title:'NATAL PERSONALIZADO',subtitle:'MEMÓRIAS QUE FICAM',footer:'SURPREENDA NESTE NATAL',category:'Natal'},
 {id:'story-fe',name:'Story de Fé',description:'Anúncio vertical suave e inspirador',format:'story',background:'#F4F0E5',accent:'#B69C6A',secondary:'#425446',title:'FÉ QUE PRESENTEIA',subtitle:'CARINHO EM CADA DETALHE',footer:'PERSONALIZE SUA CANECA',category:'Gospel e Fé'},
] as const;

export type SocialPresetId=typeof socialPresets[number]['id'];
export type SocialFormat='feed'|'story';
export const isSocialLayoutSize=(width:number,height:number)=>width===1080&&(height===1350||height===1920||height===1080);

const rectangle=(x:number,y:number,w:number,h:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'rect',role:'template',x,y,w,h,angle:0,opacity:1,fill,...extra});
const ellipse=(x:number,y:number,r:number,fill:string,opacity=1):DesignNode=>({id:uid(),kind:'circle',role:'template',x,y,w:r,h:r,angle:0,opacity,fill});
const lettering=(value:string,x:number,y:number,w:number,h:number,size:number,fill:string,extra:Partial<DesignNode>={}):DesignNode=>({id:uid(),kind:'text',role:'template',text:value,x,y,w,h,size,fill,font:'Arial',bold:true,align:'center',angle:0,opacity:1,...extra});

/** Cria uma composição editável. Formas e textos são camadas comuns do editor.
 * O centro permanece livre para receber a foto do mockup à frente das decorações.
 */
export function makeSocialPreset(id:SocialPresetId):DesignDocument{
 const p=socialPresets.find(item=>item.id===id);
 if(!p)throw new Error('Modelo de divulgação não encontrado');
 const W=1080,H=p.format==='story'?1920:1350;
 const isLight=p.background.startsWith('#F');
 const deco=isLight?'#FFFFFF':'#FFFFFF';
 const topY=p.format==='story'?172:105;
 const footerY=H-(p.format==='story'?205:142);
 const bottomStripe=H-18;
 const nodes:DesignNode[]=[
  rectangle(0,0,W,15,p.accent),
  rectangle(0,bottomStripe,W,18,p.accent),
  ellipse(-235,Math.round(H*.28),490,p.accent,.17),
  ellipse(840,Math.round(H*.39),420,deco,isLight?.48:.065),
  ellipse(770,Math.round(H*.63),370,p.accent,.12),
  rectangle(85,topY-34,80,7,p.accent,{radius:4}),
  lettering(p.title,86,topY,908,p.format==='story'?134:106,p.format==='story'?76:67,p.secondary),
  lettering(p.subtitle,110,topY+(p.format==='story'?142:111),860,80,p.format==='story'?40:35,p.accent,{bold:false}),
  rectangle(140,footerY-26,800,116,p.accent,{radius:24}),
  lettering(p.footer,153,footerY,774,68,p.format==='story'?43:39,isLight?'#231A16':'#151017'),
 ];
 // A decoração não inclui mockup fictício, nem textos rasterizados.
 return {width:W,height:H,background:p.background,nodes};
}
