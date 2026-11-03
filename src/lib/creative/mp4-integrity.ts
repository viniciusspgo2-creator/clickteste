/** Structural validation of a locally muxed MP4 before allowing a download.
 * This is a container/sample-table check, NOT a substitute for decoding the
 * video in the target browser. It never makes a network request.
 */
export type Mp4IntegrityReport={width:number;height:number;frames:number;codec:'avc1'|'avc3';bytes:number};
type Box={type:string;start:number;payload:number;end:number};
const MAX_BOXES=10_000;
const readName=(view:DataView,position:number)=>String.fromCharCode(
 view.getUint8(position),view.getUint8(position+1),view.getUint8(position+2),view.getUint8(position+3));
/** Reject malformed box lengths and integer overflow rather than trusting untrusted byte buffers. */
function boxes(view:DataView,start:number,end:number):Box[]{
 if(start<0||end>view.byteLength||start>end)throw new Error('MP4 com limites de estrutura inválidos.');
 const output:Box[]=[];let cursor=start;
 while(cursor<end){
  if(end-cursor<8)throw new Error('MP4 com caixa incompleta.');
  const size32=view.getUint32(cursor);
  const type=readName(view,cursor+4);
  let header=8;
  let size:number;
  if(size32===1){
   if(end-cursor<16)throw new Error('MP4 com tamanho estendido incompleto.');
   const large=view.getBigUint64(cursor+8);if(large>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('MP4 maior do que o limite suportado.');
   size=Number(large);header=16;
  }else size=size32===0?end-cursor:size32;
  if(size<header||size>end-cursor)throw new Error('MP4 com caixa truncada ou tamanho inválido.');
  output.push({type,start:cursor,payload:cursor+header,end:cursor+size});
  if(output.length>MAX_BOXES)throw new Error('MP4 com estruturas excessivas.');
  cursor+=size;
 }
 return output;
}
function requireBox(items:Box[],type:string){
 const match=items.find(b=>b.type===type);
 if(!match)throw new Error(`MP4 incompleto: estrutura ${type} ausente.`);
 return match;
}
const children=(view:DataView,box:Box)=>boxes(view,box.payload,box.end);
export function inspectRenderedMp4(
 buffer:ArrayBuffer,expected:{width:number;height:number;frames:number},
):Mp4IntegrityReport{
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<128)throw new Error('O arquivo MP4 está vazio ou incompleto.');
 if(!Number.isSafeInteger(expected.frames)||expected.frames<1||!Number.isSafeInteger(expected.width)||!Number.isSafeInteger(expected.height)||expected.width<2||expected.height<2)
  throw new Error('As dimensões ou a quantidade de quadros esperadas são inválidas.');
 const view=new DataView(buffer);
 const root=boxes(view,0,buffer.byteLength);
 const ftyp=requireBox(root,'ftyp');
 if(ftyp.end-ftyp.payload<8)throw new Error('MP4 sem identificação válida de formato.');
 const mdat=requireBox(root,'mdat');
 if(mdat.end<=mdat.payload)throw new Error('MP4 sem dados de vídeo.');
 const moov=requireBox(root,'moov');
 const tracks=children(view,moov).filter(b=>b.type==='trak');
 if(!tracks.length)throw new Error('MP4 sem faixa de vídeo.');
 let videoTrack:Box|undefined;
 for(const track of tracks){
  const mdia=children(view,track).find(b=>b.type==='mdia');if(!mdia)continue;
  const handler=children(view,mdia).find(b=>b.type==='hdlr');
  if(handler&&handler.end-handler.payload>=12&&readName(view,handler.payload+8)==='vide'){
   videoTrack=mdia;break;
  }
 }
 if(!videoTrack)throw new Error('MP4 sem trilha de vídeo reconhecível.');
 const minf=requireBox(children(view,videoTrack),'minf');
 const stbl=requireBox(children(view,minf),'stbl');
 const stblChildren=children(view,stbl);
 const stsd=requireBox(stblChildren,'stsd');
 if(stsd.end-stsd.payload<16||view.getUint32(stsd.payload+4)<1)throw new Error('MP4 sem descrição de codec.');
 const entries=boxes(view,stsd.payload+8,stsd.end);
 const sample=entries.find(b=>b.type==='avc1'||b.type==='avc3');
 if(!sample)throw new Error('O arquivo não possui faixa H.264/AVC válida.');
 if(sample.end-sample.payload<28)throw new Error('Faixa H.264 sem dimensões válidas.');
 const width=view.getUint16(sample.payload+24),height=view.getUint16(sample.payload+26);
 const stsz=requireBox(stblChildren,'stsz');
 if(stsz.end-stsz.payload<12)throw new Error('MP4 com tabela de quadros incompleta.');
 const frames=view.getUint32(stsz.payload+8);
 if(width!==expected.width||height!==expected.height)
  throw new Error(`MP4 com resolução inesperada (${width}×${height}; esperado ${expected.width}×${expected.height}).`);
 if(frames!==expected.frames)
  throw new Error(`MP4 com quadros incompletos (${frames} de ${expected.frames}). A exportação foi interrompida.`);
 return {width,height,frames,codec:sample.type as 'avc1'|'avc3',bytes:buffer.byteLength};
}
