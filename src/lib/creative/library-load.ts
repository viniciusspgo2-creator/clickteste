/** Descarga isolada de assets da biblioteca. Somente endereços aprovados e fixados.
 * SVG nunca é aplicado ou exibido sem sanitização por lista de permissão.
 */
import type {StockIcon} from './stock-icons';
import {ENABLE_ICONS_TAB} from './editor-flags';
import bundledAssets from './bundled-library.json';
import {LIBRARY_RELEASE,type LibraryItem} from './library-manifest';
import {nativeShapeSvg,nativeBackgroundSvg} from './library-native';
import {sanitizeEditableSvg,svgDataUrl} from './editable-svg';
import {expandedBackgroundSvg} from './expanded-backgrounds';
import {kawaiiSvg} from './library-kawaii';

const TABLER_URL='https://cdn.jsdelivr.net/npm/@tabler/icons@3.46.0/';
const FLUENT_REV='1ffb34c752ecf5d402f04cfb4b392c77f57c54bc';
const FLUENT_BASE=`https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@${FLUENT_REV}/`;
const NOTO_BASE='https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.048/';
const LUCIDE_BASE='https://cdn.jsdelivr.net/gh/lucide-icons/lucide@1980e3d59b0fa1a2aeb566d5902b25ee98204001/icons/';
const PHOSPHOR_BASE='https://cdn.jsdelivr.net/gh/phosphor-icons/core@2b75f3ad12b420c9504ef05df8d2564a28f8500e/assets/regular/';
const SAFE_ICON=/^[a-z0-9][a-z0-9-]{0,80}$/;
const SAFE_UPLOAD=/^uploads\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/;
export function libraryAssetUrl(item:LibraryItem){
 if(Object.hasOwn(bundledAssets,item.id))return `/creative-library/${(bundledAssets as Record<string,string>)[item.id]}`;
 if(item.origem==='tabler/tabler-icons'&&SAFE_ICON.test(item.arquivo))return `${TABLER_URL}icons/outline/${encodeURIComponent(item.arquivo)}.svg`;
 if(item.origem==='microsoft/fluentui-emoji'&&/^assets\/[\w -]+\/3D\/[a-z0-9_-]+_3d\.png$/.test(item.arquivo))return FLUENT_BASE+item.arquivo.split('/').map(encodeURIComponent).join('/');
 if(item.origem==='googlefonts/noto-emoji'&&/^svg\/emoji_u[0-9a-f_]+\.svg$/.test(item.arquivo))return NOTO_BASE+item.arquivo;
 if(item.origem==='lucide-icons/lucide'&&SAFE_ICON.test(item.arquivo))return LUCIDE_BASE+encodeURIComponent(item.arquivo)+'.svg';
 if(item.origem==='phosphor-icons/core'&&SAFE_ICON.test(item.arquivo))return PHOSPHOR_BASE+encodeURIComponent(item.arquivo)+'.svg';
 throw new Error('Origem do material não autorizada.');
}
const svgCache=new Map<string,Promise<string>>();
function validateColor(color:string){return /^#[a-f0-9]{6}$/i.test(color)?color:'#ff6a00'}
const allowedTags=new Set(['svg','g','path','rect','circle','ellipse','polygon','polyline','line','defs','linearGradient','radialGradient','stop','clipPath']);
const allowedAttrs=new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','fill-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-opacity','fill-opacity','opacity','transform','id','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','clip-path','preserveAspectRatio']);
function safeAttrValue(name:string,value:string){
 if(value.length>(name==='d'?80000:20000)||/javascript:|data:|https?:|file:|expression\s*\(|@import|<|>|[\\]/i.test(value))return false;
 if(/url\s*\(/i.test(value)&&!/^url\(#[a-zA-Z][\w-]{0,80}\)$/.test(value))return false;
 if(name==='id'&&!/^[A-Za-z][\w-]{0,80}$/.test(value))return false;
 if(name==='d'&&!/^[MmLlHhVvCcSsQqTtAaZz\s0-9+.,eE-]+$/.test(value))return false;
 return true;
}
/** Parse detached SVG; rebuilds a completely new SVG with whitelisted nodes/attrs. */
export function sanitizeLibrarySvg(source:string,color='#ff6a00'){
 if(source.length>90000||!/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b/i.test(source))throw new Error('SVG inválido ou grande demais.');
 if(typeof DOMParser==='undefined'||typeof XMLSerializer==='undefined')throw new Error('Visualização de SVG indisponível.');
 const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
 if(parsed.getElementsByTagName('parsererror').length||parsed.documentElement.localName!=='svg')throw new Error('SVG não pode ser lido.');
 const out=document.implementation.createDocument('http://www.w3.org/2000/svg','svg',null);
 const root=out.documentElement,validColor=validateColor(color);
 let count=0;
 const append=(input:Element,output:Element)=>{
  for(const attr of Array.from(input.attributes)){
   if(attr.name==='style'){
    for(const declaration of attr.value.split(';')){
     const colon=declaration.indexOf(':');if(colon<0)continue;
     const key=declaration.slice(0,colon).trim(),value=declaration.slice(colon+1).trim();
     if(allowedAttrs.has(key)&&safeAttrValue(key,value))output.setAttribute(key,value.replace(/currentColor/g,validColor));
    }
    continue;
   }
   if(!allowedAttrs.has(attr.name)||!safeAttrValue(attr.name,attr.value))continue;
   let value=attr.value.replace(/currentColor/g,validColor);
   if(attr.name==='xmlns')continue;
   output.setAttribute(attr.name,value);
  }
  for(const child of Array.from(input.children)){
   if(!allowedTags.has(child.localName))continue;
   if(++count>500)throw new Error('SVG complexo demais.');
   const node=out.createElementNS('http://www.w3.org/2000/svg',child.localName);
   append(child,node);output.appendChild(node);
  }
 };
 append(parsed.documentElement,root);
 root.setAttribute('xmlns','http://www.w3.org/2000/svg');
 if(!root.hasAttribute('viewBox'))root.setAttribute('viewBox','0 0 24 24');
 // Icon source files are often 24 × 24. Insert them at an editable print size,
 // preserving their viewBox ratio instead of producing nearly invisible layers.
 const viewBox=(root.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
 const valid=viewBox.length===4&&viewBox.every(Number.isFinite)&&viewBox[2]>0&&viewBox[3]>0;
 if(!valid)throw new Error('Dimensões do vetor inválidas.');
 const scale=512/Math.max(viewBox[2],viewBox[3]);
 root.setAttribute('width',String(Math.max(1,Math.round(viewBox[2]*scale))));
 root.setAttribute('height',String(Math.max(1,Math.round(viewBox[3]*scale))));
 return new XMLSerializer().serializeToString(root);
}
function asDataUrl(svg:string){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;}
async function fetchText(url:string){
 const response=await fetch(url,{cache:'force-cache'});
 if(!response.ok)throw new Error('Não foi possível baixar este elemento.');
 const length=Number(response.headers.get('content-length')||0);
 if(length>90000)throw new Error('SVG maior que o permitido.');
 const text=await response.text();if(text.length>90000)throw new Error('SVG maior que o permitido.');return text;
}
export function previewLibraryAsset(item:LibraryItem,color='#ff6a00',width=2480,height=1122,strokeWidth=24):Promise<string>{
 if(item.arquivo.startsWith('pattern:'))return expandedBackgroundSvg(item.arquivo,width,height,svg=>sanitizeLibrarySvg(svg));
 if(item.arquivo.startsWith('kawaii:'))return Promise.resolve(kawaiiSvg(item.arquivo,color));
 if(item.arquivo.startsWith('native:'))return Promise.resolve(nativeShapeSvg(item.arquivo,color,strokeWidth));
 if(item.arquivo.startsWith('background:'))return Promise.resolve(nativeBackgroundSvg(item.arquivo,width,height));
 if(item.formato==='TEXTO')return Promise.resolve('');
 if(item.miniatura&&SAFE_UPLOAD.test(item.miniatura))return Promise.resolve(`/creative-library/${item.miniatura}`);
 if(item.formato==='PNG'||item.formato==='WEBP')return Promise.resolve(libraryAssetUrl(item));
 const key=`${item.id}|${validateColor(color)}`;
 let cached=svgCache.get(key);
 if(!cached){
  cached=fetchText(libraryAssetUrl(item)).then(svg=>asDataUrl(sanitizeLibrarySvg(svg,color))).catch(e=>{svgCache.delete(key);throw e;});
  svgCache.set(key,cached);
  if(svgCache.size>120){const first=svgCache.keys().next().value;if(first)svgCache.delete(first);}
 }
 return cached;
}
export async function loadLibraryImage(item:LibraryItem,color='#ff6a00',width=2480,height=1122,strokeWidth=24){
 if(item.formato==='TEXTO')throw new Error('Utilize o botão de adicionar texto.');
 if(item.formato==='SVG'&&item.licenca==='Enviado pelo usuário'){
  const response=await fetch(libraryAssetUrl(item),{cache:'force-cache'});if(!response.ok)throw new Error('SVG indisponível.');
  const source=await response.text();return svgDataUrl(sanitizeEditableSvg(source));
 }
 if(item.formato==='SVG')return previewLibraryAsset(item,color,width,height,strokeWidth);
 const response=await fetch(libraryAssetUrl(item),{cache:'force-cache'});
 if(!response.ok)throw new Error('Sticker não disponível. Escolha outro ou tente novamente.');
 const contentType=response.headers.get('content-type')||'';
 if(!contentType.includes('image/png')&&!contentType.includes('image/webp')&&!contentType.includes('octet-stream'))throw new Error('Arquivo de sticker inválido.');
 const blob=await response.blob();if(blob.size>8*1024*1024)throw new Error('Sticker muito grande para o editor.');
 return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Falha ao ler o sticker.'));reader.onerror=()=>reject(new Error('Falha ao ler o sticker.'));reader.readAsDataURL(blob);});
}
/** índice oficial hospedado no mesmo pacote Tabler versionado; sem Iconify ou outras fontes. */
export async function loadApprovedTablerCatalog():Promise<StockIcon[]>{
 if(!ENABLE_ICONS_TAB)return [];
 const {stockIcons,parseTablerIndex}=await import('./stock-icons');
 for(const url of ['/creative-library/tabler-catalog.json',`${TABLER_URL}icons.json`]){
  try{
   const response=await fetch(url,{cache:'force-cache',signal:AbortSignal.timeout(8000)});
   if(!response.ok)continue;
   const found=parseTablerIndex(await response.json());
   if(found.length>=1000)return found;
  }catch{/* Keep local shapes and phrases usable when a catalog is unavailable. */}
 }
 return stockIcons;
}

export const librarySourceRevisions=LIBRARY_RELEASE;
