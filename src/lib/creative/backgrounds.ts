/** Fundos vetoriais autorais, leves e sem texto para estampas e apresentações de canecas. */
export const backgroundKits=[
 {id:'dark',name:'Preto Laranja',a:'#090a0e',b:'#242027',c:'#f47f24'},
 {id:'soft',name:'Creme Delicado',a:'#f4e9dc',b:'#f8d7ba',c:'#d69f79'},
 {id:'forest',name:'Verde Elegante',a:'#122a22',b:'#366955',c:'#cfac65'},
 {id:'navy',name:'Azul Noturno',a:'#101d39',b:'#27476c',c:'#a5c7e8'},
 {id:'pink',name:'Rosa Romântico',a:'#fae2e8',b:'#dd9bac',c:'#ffffff'},
 {id:'christmas',name:'Natal Premium',a:'#162b20',b:'#374f37',c:'#dfc28d'},
 {id:'gold',name:'Dourado Luxo',a:'#1e1613',b:'#4a2b1b',c:'#dca35d'},
 {id:'pastel',name:'Pastel Criativo',a:'#e1eff5',b:'#efd4e9',c:'#a0c7bd'},
 {id:'wood',name:'Terra & Madeira',a:'#755443',b:'#a57958',c:'#eed5b8'},
 {id:'purple',name:'Roxo Galáxia',a:'#1a122e',b:'#563a83',c:'#eb8cce'},
 {id:'white',name:'Branco Minimal',a:'#f8f8f7',b:'#dfe2e3',c:'#b5bec3'},
 {id:'orange',name:'Energia Laranja',a:'#ba411b',b:'#fc9135',c:'#ffcf8c'},
] as const;
export function backgroundSvg(id:string,w:number,h:number){
 const palette=backgroundKits.find(b=>b.id===id)||backgroundKits[0];
 const safeW=Math.max(100,Math.min(8192,Math.round(w))),safeH=Math.max(100,Math.min(8192,Math.round(h)));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${safeW}" height="${safeH}" viewBox="0 0 ${safeW} ${safeH}"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="${palette.a}"/><stop offset="1" stop-color="${palette.b}"/></linearGradient><radialGradient id="r"><stop stop-color="${palette.c}" stop-opacity=".32"/><stop offset="1" stop-color="${palette.c}" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#a)"/><ellipse cx="${safeW*.8}" cy="${safeH*.3}" rx="${safeW*.58}" ry="${safeH*.8}" fill="url(#r)"/><ellipse cx="${safeW*.12}" cy="${safeH*.85}" rx="${safeW*.42}" ry="${safeH*.7}" fill="url(#r)"/><path d="M 0 ${safeH*.75} Q ${safeW*.42} ${safeH*.48},${safeW} ${safeH*.85}" fill="none" stroke="${palette.c}" opacity=".2" stroke-width="${Math.max(2,safeH*.014)}"/></svg>`;
 return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
