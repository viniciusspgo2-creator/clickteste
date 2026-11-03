/** Checks real bytes rather than relying on canvas.toBlob() MIME metadata.
 * Browsers are permitted to return PNG when requested WebP/JPEG is unsupported.
 * Saving the PNG with a .webp/.jpg extension would break downstream editors.
 */
export type ImageOutputFormat = 'png' | 'jpeg' | 'webp';
const PNG_SIGNATURE=[137,80,78,71,13,10,26,10] as const;
export function detectImageSignature(bytes:Uint8Array):ImageOutputFormat|null{
 if(bytes.length>=8&&PNG_SIGNATURE.every((value,i)=>bytes[i]===value))return 'png';
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'jpeg';
 if(bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&
  String.fromCharCode(...bytes.subarray(8,12))==='WEBP')return 'webp';
 return null;
}
const FORMAT_LABEL:Record<ImageOutputFormat,string>={png:'PNG',jpeg:'JPEG',webp:'WebP'};
export async function assertExportBlobFormat(blob:Blob,expected:ImageOutputFormat):Promise<void>{
 if(blob.size<12)throw new Error('O navegador produziu uma imagem vazia ou incompleta.');
 const prefix=new Uint8Array(await blob.slice(0,16).arrayBuffer());
 const actual=detectImageSignature(prefix);
 if(actual!==expected){
  if(actual)throw new Error(`O navegador devolveu ${FORMAT_LABEL[actual]} em vez de ${FORMAT_LABEL[expected]}. Escolha PNG ou utilize um navegador com suporte a ${FORMAT_LABEL[expected]}.`);
  throw new Error('O navegador produziu um arquivo de imagem não reconhecido. Nenhum download incorreto foi salvo.');
 }
}

/** Add exactly one correct pHYs (300 DPI) chunk, preserving all original PNG
 * pixel chunks and ancillary metadata. Some encoders place pHYs after sRGB,
 * so checking only the chunk immediately after IHDR can create duplicates.
 * This utility never decodes/re-encodes pixels or sends them to a server.
 */
const pngType=(bytes:Uint8Array,offset:number)=>String.fromCharCode(bytes[offset],bytes[offset+1],bytes[offset+2],bytes[offset+3]);
function crc32(bytes:Uint8Array,start:number,end:number){
 let crc=0xffffffff;
 for(let i=start;i<end;i++){
  crc^=bytes[i];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^(crc&1?0xedb88320:0);
 }
 return(crc^0xffffffff)>>>0;
}
export function addPngDpiToBytes(bytes:Uint8Array,dpi:number):Uint8Array{
 if(detectImageSignature(bytes)!=='png')throw new Error('A imagem não é um PNG válido para configurar o DPI.');
 if(!Number.isFinite(dpi)||dpi<=0||dpi>2400)throw new Error('Valor de DPI inválido.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const chunks:{start:number;end:number;type:string}[]=[];
 let pos=8,foundIhdr=false,foundIend=false;
 while(pos<bytes.length){
  if(bytes.length-pos<12)throw new Error('PNG truncado ao verificar os metadados DPI.');
  const length=view.getUint32(pos),end=pos+12+length;
  if(length>bytes.length-pos-12||end>bytes.length)throw new Error('PNG com tamanho de chunk inválido.');
  const type=pngType(bytes,pos+4);
  if(!foundIhdr&& (type!=='IHDR'||length!==13))throw new Error('PNG sem cabeçalho IHDR válido.');
  foundIhdr=true;chunks.push({start:pos,end,type});pos=end;
  if(type==='IEND'){
   if(length!==0||pos!==bytes.length)throw new Error('PNG com finalização inválida.');
   foundIend=true;break;
  }
 }
 if(!foundIhdr||!foundIend)throw new Error('PNG sem bloco final IEND.');
 const meters=Math.round(dpi/0.0254);
 const physical=new Uint8Array(21),pv=new DataView(physical.buffer);
 pv.setUint32(0,9);physical.set([112,72,89,115],4);pv.setUint32(8,meters);pv.setUint32(12,meters);physical[16]=1;
 pv.setUint32(17,crc32(physical,4,17));
 const keep=chunks.filter(c=>c.type!=='pHYs');
 const result=new Uint8Array(bytes.length+physical.length-chunks.filter(c=>c.type==='pHYs').reduce((n,c)=>n+c.end-c.start,0));
 result.set(bytes.subarray(0,8));let cursor=8;
 for(const chunk of keep){
  result.set(bytes.subarray(chunk.start,chunk.end),cursor);cursor+=chunk.end-chunk.start;
  if(chunk.type==='IHDR'){
   result.set(physical,cursor);cursor+=physical.length;
  }
 }
 return result;
}
export async function addPngDpiMetadata(blob:Blob,dpi:number):Promise<Blob>{
 const modified=addPngDpiToBytes(new Uint8Array(await blob.arrayBuffer()),dpi);
 return new Blob([modified],{type:'image/png'});
}
