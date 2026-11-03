/** Importação somente no navegador. O conteúdo do cliente nunca é enviado ao backend.
 * SVGs passam por uma validação estrita e são rasterizados localmente para edição segura.
 */
import {asDataUrl} from './design';
const MAX_BYTES=24*1024*1024;
const ALLOWED_SVG_TAGS=new Set(['svg','g','defs','path','rect','circle','ellipse','line','polyline','polygon','lineargradient','radialgradient','stop','clippath','mask','text','tspan']);
const ALLOWED_SVG_ATTRS=new Set(['xmlns','width','height','viewbox','preserveaspectratio','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','transform','fill','fill-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-dashoffset','opacity','fill-opacity','stroke-opacity','gradienttransform','gradientunits','offset','stop-color','stop-opacity','id','clip-path','mask','text-anchor','font-size','font-family','font-weight','font-style','letter-spacing','text-decoration']);
function validImage(bytes:Uint8Array,name:string):boolean{
 const extension=name.split('.').pop()?.toLowerCase()||'';
 const start=Array.from(bytes.slice(0,16)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const ascii=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
 if(extension==='png')return start.startsWith('89504e470d0a1a0a');
 if(['jpg','jpeg','jfif','jfi','jif'].includes(extension))return start.startsWith('ffd8ff');
 if(extension==='webp')return ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
 if(extension==='gif')return ascii(0,6)==='GIF87a'||ascii(0,6)==='GIF89a';
 if(extension==='bmp')return ascii(0,2)==='BM';
 if(extension==='avif')return ascii(4,8)==='ftyp'&&['avif','avis','mif1'].includes(ascii(8,12));
 return false;
}
function sanitizeSvg(source:string):Blob{
 if(source.length>1_500_000||/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source))throw new Error('SVG muito grande ou com XML inseguro.');
 const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
 if(parsed.querySelector('parsererror'))throw new Error('SVG inválido.');
 const root=parsed.documentElement;
 if(root.localName.toLowerCase()!=='svg')throw new Error('O arquivo não contém um SVG válido.');
 for(const el of Array.from(parsed.getElementsByTagName('*'))){
  if(!ALLOWED_SVG_TAGS.has(el.localName.toLowerCase()))throw new Error(`SVG contém um elemento não permitido: ${el.localName}.`);
  for(const attr of Array.from(el.attributes)){
   const key=attr.localName.toLowerCase(),value=attr.value;
   if(!ALLOWED_SVG_ATTRS.has(key)||/javascript:|data:|https?:|expression\s*\(|@import|<|>/i.test(value)||/url\s*\((?!\s*['"]?#[-\w]+['"]?\s*\))/i.test(value))throw new Error(`SVG com atributo não permitido: ${key}.`);
  }
 }
 if(!root.hasAttribute('xmlns'))root.setAttribute('xmlns','http://www.w3.org/2000/svg');
 const view=root.getAttribute('viewBox')?.split(/[ ,]+/).map(Number)||[];
 const w=Number(root.getAttribute('width')?.replace(/px$/i,''))||view[2]||1000;
 const h=Number(root.getAttribute('height')?.replace(/px$/i,''))||view[3]||1000;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>20000||h>20000)throw new Error('Dimensões SVG inválidas.');
 root.setAttribute('width',String(Math.round(Math.min(4800,w))));root.setAttribute('height',String(Math.round(Math.min(4800,h))));
 return new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml'});
}
/** Retorna um data URL PNG convertido localmente. GIF inclui somente o primeiro quadro. */
export async function readLocalAsset(file:File):Promise<string>{
 if(!file.size||file.size>MAX_BYTES)throw new Error('O limite de upload local é 24 MB por arquivo.');
 if(/\.svg$/i.test(file.name))return asDataUrl(sanitizeSvg(await file.text()));
 const head=new Uint8Array(await file.slice(0,32).arrayBuffer());
 if(!validImage(head,file.name))throw new Error(`Formato inválido ou não compatível com o Editor: ${file.name}. Use PNG, JPG/JFIF, SVG, WebP, AVIF, BMP ou GIF.`);
 return asDataUrl(file);
}
