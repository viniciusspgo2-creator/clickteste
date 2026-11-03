/** Ícones fornecidos sob demanda por Tabler Icons (MIT). Fonte fixa:
 * https://github.com/tabler/tabler-icons - licença https://github.com/tabler/tabler-icons/blob/main/LICENSE
 * O arquivo SVG vem de um CDN; o editor normaliza para data URI local antes de compor.
 */
export type StockIcon={name:string;label:string;category:string};
const entries:Record<string,string[]>={
 'Amor & presentes':['heart','hearts','gift','gift-card','bow','flower','flower-off','star','stars','sparkles','diamond','crown','balloon','confetti'],
 'Datas especiais':['cake','cake-roll','calendar-heart','christmas-tree','snowflake','sun','moon','bell','candle','cup','mug','home-heart'],
 'Animais & natureza':['cat','dog','paw','butterfly','leaf','plant','tree','trees','fish','bird','cloud','flame'],
 'Esporte & lazer':['ball-football','ball-basketball','trophy','medal','music','headphones','camera','camera-heart','gamepad','device-gamepad','bike','car'],
 'Negócios & redes':['brand-instagram','brand-facebook','brand-whatsapp','brand-tiktok','brand-youtube','at','mail','phone','shopping-bag','discount','percentage','truck'],
 'Setas & formas':['arrow-up','arrow-down','arrow-left','arrow-right','arrow-up-right','circle-check','circle-x','bolt','point','circle-dotted','hexagon','triangle'],
};
export const stockIcons:StockIcon[]=Object.entries(entries).flatMap(([category,items])=>items.map(name=>({name,label:name.replace(/-/g,' '),category})));
export const tablerIconUrl=(name:string)=>`https://cdn.jsdelivr.net/npm/@tabler/icons@3.46.0/icons/outline/${encodeURIComponent(name)}.svg`;
export async function iconDataUrl(name:string,color='#fa842c'){
 if(!stockIcons.some(x=>x.name===name))throw Error('Ícone não disponível no acervo.');
 const response=await fetch(tablerIconUrl(name),{cache:'force-cache'});
 if(!response.ok)throw Error(`Ícone ${name} indisponível no catálogo.`);
 let svg=await response.text();
 if(svg.length>25000||!/^\s*<svg\s/i.test(svg)||/<script|<foreignObject|\bon\w+\s*=|<!DOCTYPE|<image\b|<use\b|href=/i.test(svg))throw Error('SVG não passou na validação.');
 svg=svg.replace(/currentColor/g,/^#[0-9a-fA-F]{6}$/.test(color)?color:'#fa842c');
 return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
