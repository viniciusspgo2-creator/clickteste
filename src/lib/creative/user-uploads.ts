/** Importação somente no navegador. O conteúdo do cliente nunca é enviado ao backend.
 * SVGs são sanitizados e preservados como vetores com cores editáveis.
 */
import {asDataUrl} from './design';
import {sanitizeEditableSvg,svgDataUrl} from './editable-svg';
const MAX_BYTES=24*1024*1024;
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
/** Retorna uma data URI local. SVG preserva paths, cores e gradientes. */
export async function readLocalAsset(file:File):Promise<string>{
 if(!file.size||file.size>MAX_BYTES)throw new Error('O limite de upload local é 24 MB por arquivo.');
 if(/\.svg$/i.test(file.name))return svgDataUrl(sanitizeEditableSvg(await file.text()));
 const head=new Uint8Array(await file.slice(0,32).arrayBuffer());
 if(!validImage(head,file.name))throw new Error(`Formato inválido ou não compatível com o Editor: ${file.name}. Use PNG, JPG/JFIF, SVG, WebP, AVIF, BMP ou GIF.`);
 return asDataUrl(file);
}
