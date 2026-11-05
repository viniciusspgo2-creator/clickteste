import bundledAssets from './bundled-library.json';
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
export const tablerIconUrl=(name:string,style:'outline'|'filled'='outline')=>style==='outline'&&Object.hasOwn(bundledAssets,`tabler-${name}`)?`/creative-library/${(bundledAssets as Record<string,string>)[`tabler-${name}`]}`:`https://cdn.jsdelivr.net/npm/@tabler/icons@3.46.0/icons/${style}/${encodeURIComponent(name)}.svg`;
export async function iconDataUrl(name:string,color='#fa842c'){
 if(!validName(name))throw Error('Nome de ícone inválido.');
 let response=await fetch(tablerIconUrl(name),{cache:'force-cache'});
 if(!response.ok)response=await fetch(tablerIconUrl(name,'filled'),{cache:'force-cache'});
 if(!response.ok)throw Error(`Ícone ${name} indisponível no catálogo.`);
 let svg=await response.text();
 if(svg.length>25000||!/^\s*<svg\s/i.test(svg)||/<script|<foreignObject|\bon\w+\s*=|<!DOCTYPE|<image\b|<use\b|href=/i.test(svg))throw Error('SVG não passou na validação.');
 svg=svg.replace(/currentColor/g,/^#[0-9a-fA-F]{6}$/.test(color)?color:'#fa842c');
 return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** O índice é consultado apenas quando o painel de ícones/objetos está aberto.
 * A versão dos SVGs permanece fixada, evitando downloads massivos no build.
 * Em caso de rede indisponível, os ícones básicos continuam utilizáveis.
 */
let catalogPromise:Promise<StockIcon[]>|undefined;
const validName=(name:string)=>/^[a-z0-9][a-z0-9-]{0,90}$/.test(name);
export const parseTablerIndex=(json:unknown):StockIcon[]=>{
 if(!json||typeof json!=='object')return [];
 const raw=json as {icons?:unknown};
 const map=raw?.icons&&typeof raw.icons==='object'?raw.icons:json;
 const list=Array.isArray(json)?json:Array.isArray(raw?.icons)?raw.icons:map&&typeof map==='object'?Object.entries(map).map(([name,detail])=>({name,...(detail&&typeof detail==='object'?detail as Record<string,unknown>:{})})):[];
 return list.flatMap(entry=>{
  if(!entry||typeof entry!=='object')return [];
  const meta=entry as Record<string,unknown>,name=String(meta.name||'');if(!validName(name))return [];
  const styles=meta.styles as Record<string,unknown>|undefined;
  if(styles&&!styles.outline)return [];
  const category=typeof meta.category==='string'?meta.category:'Vetoriais';
  const tags=Array.isArray(meta.tags)?meta.tags.filter(t=>typeof t==='string').join(' '):'';
  const label=typeof meta.label==='string'?meta.label.slice(0,2000):tags?`${name.replace(/-/g,' ')} ${tags}`:name.replace(/-/g,' ');
  return [{name,label,category}];
 });
};
export function loadTablerCatalog():Promise<StockIcon[]>{
 if(catalogPromise)return catalogPromise;
 catalogPromise=(async()=>{
  for(const url of ['/creative-library/tabler-catalog.json','https://cdn.jsdelivr.net/npm/@tabler/icons@3.46.0/icons.json'])try{
   const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new Error('Índice indisponível');
   const catalog=parseTablerIndex(await response.json());
   if(catalog.length>=1000)return catalog;
  }catch{/* Tentar índice público alternativo. */}
  try{
   const response=await fetch('https://api.iconify.design/collection?prefix=tabler');
   if(!response.ok)throw new Error('Índice alternativo indisponível');
   const data=await response.json() as {categories?:Record<string,string[]>;uncategorized?:string[]};
   const result:StockIcon[]=[];
   for(const [category,names] of Object.entries(data.categories||{}))for(const name of names)if(validName(name))result.push({name,label:name.replace(/-/g,' '),category});
   for(const name of data.uncategorized||[])if(validName(name))result.push({name,label:name.replace(/-/g,' '),category:'Outros'});
   if(result.length>=1000)return result;
  }catch{/* O editor continua com os itens locais. */}
  return stockIcons;
 })();return catalogPromise;
}
