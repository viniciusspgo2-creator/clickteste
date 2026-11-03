/** PSD v1 RGB/8-bit raw/RLE: local-only limited importer for independent raster layers.
 * Text, adjustments, smart objects, masks and vector paths are NOT recreated as editable text/paths.
 * Deliberately rejects unsupported PSD versions/compressions instead of silently flattening them.
 */
import {uid,type DesignNode,type DesignDocument} from './design';

class Reader {
 private view:DataView; pos=0;
 constructor(readonly bytes:Uint8Array){this.view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);}
 seek(p:number){if(!Number.isInteger(p)||p<0||p>this.bytes.length)throw new Error('PSD truncado ou inválido');this.pos=p;}
 skip(n:number){this.seek(this.pos+n)}
 u8(){this.check(1);return this.view.getUint8(this.pos++);}
 u16(){this.check(2);const v=this.view.getUint16(this.pos);this.pos+=2;return v;}
 i16(){this.check(2);const v=this.view.getInt16(this.pos);this.pos+=2;return v;}
 u32(){this.check(4);const v=this.view.getUint32(this.pos);this.pos+=4;return v;}
 i32(){this.check(4);const v=this.view.getInt32(this.pos);this.pos+=4;return v;}
 str(n:number){this.check(n);const v=new TextDecoder('latin1').decode(this.bytes.subarray(this.pos,this.pos+n));this.pos+=n;return v;}
 check(n:number){if(n<0||this.pos+n>this.bytes.length)throw new Error('PSD truncado ou inválido');}
}
type Channel={id:number,length:number};type PsdLayer={top:number;left:number;width:number;height:number;name:string;opacity:number;hidden:boolean;channels:Channel[];data:Record<number,Uint8Array>};
function decodePackBits(buffer:Uint8Array,offset:number,size:number,expected:number):Uint8Array{
 const out=new Uint8Array(expected);let o=0,p=offset,end=offset+size;
 if(end>buffer.length)throw new Error('Dados de camada PSD incompletos');
 while(p<end&&o<expected){const n=(buffer[p++]<<24)>>24;
  if(n>=0){const count=n+1;if(p+count>end||o+count>expected)throw new Error('RLE inválido');out.set(buffer.subarray(p,p+count),o);o+=count;p+=count;}
  else if(n>=-127){const count=1-n;if(p>=end||o+count>expected)throw new Error('RLE inválido');out.fill(buffer[p++],o,o+count);o+=count;}
 }
 if(o!==expected)throw new Error('RLE de camada incompleto');return out;
}
function decodeChannel(r:Reader,layer:PsdLayer,length:number):Uint8Array{
 const start=r.pos;const compression=r.u16();const count=layer.width*layer.height;
 if(count>20_000_000)throw new Error('Camada PSD muito grande');
 let out:Uint8Array;
 if(compression===0){r.check(count);out=r.bytes.slice(r.pos,r.pos+count);}
 else if(compression===1){
  const lengths=Array.from({length:layer.height},()=>r.u16());const parts:Uint8Array[]=[];
  for(const size of lengths){parts.push(decodePackBits(r.bytes,r.pos,size,layer.width));r.skip(size);}
  out=new Uint8Array(count);let p=0;for(const row of parts){out.set(row,p);p+=row.length;}
 }else throw new Error('PSD com compressão ZIP ou formato não suportado. Salve em PSD RGB/8 bits com RLE.');
 r.seek(start+length);return out;
}
export async function importPsdLayers(file:File):Promise<{document:DesignDocument;count:number;warning:string}>{
 if(file.size>75*1024*1024)throw new Error('PSD acima de 75 MB. Simplifique as camadas.');
 const r=new Reader(new Uint8Array(await file.arrayBuffer()));
 if(r.str(4)!=='8BPS'||r.u16()!==1)throw new Error('Somente PSD clássico versão 1 é suportado (PSB não).');
 r.skip(6);const channelCount=r.u16(),height=r.u32(),width=r.u32(),depth=r.u16(),mode=r.u16();
 if(depth!==8||mode!==3||channelCount<3||width<1||height<1||width>6000||height>6000)throw new Error('Importação de camadas exige PSD RGB 8 bits, até 6000 × 6000 px.');
 r.skip(r.u32());r.skip(r.u32());const layersAndMasksLength=r.u32();const outerEnd=r.pos+layersAndMasksLength;
 if(layersAndMasksLength<4||outerEnd>r.bytes.length)throw new Error('Este PSD não contém camadas reconhecíveis.');
 const infoLength=r.u32(),infoEnd=r.pos+infoLength;
 if(infoLength<2||infoEnd>outerEnd)throw new Error('Camadas PSD indisponíveis.');
 const layerCount=Math.abs(r.i16());if(layerCount>100)throw new Error('Este PSD excede o limite de 100 camadas locais.');
 const layers:PsdLayer[]=[];
 for(let i=0;i<layerCount;i++){
  const top=r.i32(),left=r.i32(),bottom=r.i32(),right=r.i32(),channels=r.u16();
  if(channels>20)throw new Error('Número de canais PSD inválido');
  const ch=Array.from({length:channels},()=>({id:r.i16(),length:r.u32()}));
  if(r.str(4)!=='8BIM')throw new Error('Assinatura de camada PSD inválida');
  r.skip(4);const opacity=r.u8()/255;r.u8();const flags=r.u8();r.u8();
  const extraLength=r.u32(),extraEnd=r.pos+extraLength;if(extraEnd>infoEnd)throw new Error('Dados extras PSD inválidos');
  r.skip(r.u32());r.skip(r.u32());
  const nameLen=r.u8();let name=r.str(nameLen);r.skip((4-(1+nameLen)%4)%4);
  while(r.pos+12<=extraEnd){
   const sig=r.str(4),key=r.str(4),len=r.u32(),blockEnd=r.pos+len;
   if(blockEnd>extraEnd)break;
   if((sig==='8BIM'||sig==='8B64')&&key==='luni'&&len>=4){
    const n=r.u32();if(n<256&&r.pos+n*2<=blockEnd){const codes=Array.from({length:n},()=>r.u16());name=String.fromCharCode(...codes);}
   }
   r.seek(blockEnd+(len%2));
  }
  r.seek(extraEnd);
  layers.push({top,left,width:Math.max(0,right-left),height:Math.max(0,bottom-top),name:name||`Camada ${i+1}`,opacity,hidden:!!(flags&2),channels:ch,data:{}});
 }
 for(const layer of layers)for(const channel of layer.channels){const start=r.pos;
  if(channel.length<2||start+channel.length>infoEnd)throw new Error('Canal PSD fora do arquivo');
  if(layer.width&&layer.height&&[0,1,2,-1].includes(channel.id))layer.data[channel.id]=decodeChannel(r,layer,channel.length);
  else r.skip(channel.length);
 }
 const nodes:DesignNode[]=[];
 // PSD records are conventionally ordered top-to-bottom; Canvas draws bottom-to-top.
 for(const layer of [...layers].reverse()){
  if(layer.hidden||!layer.width||!layer.height||!layer.data[0]||!layer.data[1]||!layer.data[2])continue;
  const canvas=document.createElement('canvas');canvas.width=layer.width;canvas.height=layer.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
  const image=ctx.createImageData(layer.width,layer.height),pixels=layer.width*layer.height;
  for(let j=0;j<pixels;j++){const p=j*4;image.data[p]=layer.data[0][j];image.data[p+1]=layer.data[1][j];image.data[p+2]=layer.data[2][j];image.data[p+3]=layer.data[-1]?.[j]??255;}
  ctx.putImageData(image,0,0);
  nodes.push({id:uid(),kind:'image',role:'content',layerName:layer.name,x:layer.left,y:layer.top,w:layer.width,h:layer.height,angle:0,opacity:layer.opacity,src:canvas.toDataURL('image/png'),aspectLock:true,shadow:0});
 }
 if(!nodes.length)throw new Error('Não foram encontradas camadas raster RGB visíveis. Exporte o PSD com camadas RGB de pixels.');
 return {document:{width,height,background:'transparent',nodes},count:nodes.length,warning:'Camadas raster ficam independentes e móveis. Texto, ajustes, máscaras vetoriais, efeitos e objetos inteligentes do Photoshop não são recriados como objetos editáveis.'};
}
