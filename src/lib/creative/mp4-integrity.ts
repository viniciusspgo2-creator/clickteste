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
/** Read all sample sizes and chunk offsets so that a plausible stsz count alone
 * cannot conceal missing/corrupted video bytes. The editor generates a single
 * non-fragmented AVC track, so the full sample table must be present. */
function assertVideoSamplesInsideMdat(
 view:DataView,table:Box[],mdat:Box,frameCount:number,
):void{
 const stsz=requireBox(table,'stsz');
 if(stsz.end-stsz.payload<12)throw new Error('MP4 com tabela de quadros incompleta.');
 const defaultSize=view.getUint32(stsz.payload+4);
 const declaredCount=view.getUint32(stsz.payload+8);
 if(declaredCount!==frameCount)throw new Error('MP4 com contagem de amostras divergente.');
 if(defaultSize===0&&stsz.end-stsz.payload<12+frameCount*4)
  throw new Error('MP4 com tabela de tamanhos truncada.');
 const sizeAt=(i:number)=>defaultSize||view.getUint32(stsz.payload+12+i*4);
 const stsc=requireBox(table,'stsc');
 if(stsc.end-stsc.payload<8)throw new Error('MP4 com mapa de chunks incompleto.');
 const mapCount=view.getUint32(stsc.payload+4);
 if(mapCount<1||stsc.end-stsc.payload<8+mapCount*12)
  throw new Error('MP4 com mapa de chunks truncado.');
 const offsetBox=table.find(b=>b.type==='stco'||b.type==='co64');
 if(!offsetBox)throw new Error('MP4 sem tabela de offsets de vídeo.');
 if(offsetBox.end-offsetBox.payload<8)throw new Error('MP4 com offsets incompletos.');
 const is64=offsetBox.type==='co64';
 const offsetCount=view.getUint32(offsetBox.payload+4);
 if(offsetCount<1||offsetBox.end-offsetBox.payload<8+offsetCount*(is64?8:4))
  throw new Error('MP4 com tabela de offsets truncada.');
 const offsetAt=(i:number):number=>{
  if(!is64)return view.getUint32(offsetBox.payload+8+i*4);
  const value=view.getBigUint64(offsetBox.payload+8+i*8);
  if(value>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('MP4 com offset de vídeo inválido.');
  return Number(value);
 };
 let sampleIndex=0,mapIndex=0,previousFirstChunk=0;
 const maps:{firstChunk:number;samplesPerChunk:number}[]=[];
 for(let i=0;i<mapCount;i++){
  const pos=stsc.payload+8+i*12;
  const firstChunk=view.getUint32(pos);
  const samplesPerChunk=view.getUint32(pos+4);
  const descriptionIndex=view.getUint32(pos+8);
  if(firstChunk<=previousFirstChunk||firstChunk>offsetCount||samplesPerChunk<1||descriptionIndex<1)
   throw new Error('MP4 com mapa de chunks inválido.');
  maps.push({firstChunk,samplesPerChunk});previousFirstChunk=firstChunk;
 }
 if(maps[0].firstChunk!==1)throw new Error('MP4 com primeiro chunk inválido.');
 for(let chunk=1;chunk<=offsetCount;chunk++){
  if(mapIndex+1<maps.length&&maps[mapIndex+1].firstChunk===chunk)mapIndex++;
  const chunkOffset=offsetAt(chunk-1);
  const sampleCount=maps[mapIndex].samplesPerChunk;
  if(sampleIndex+sampleCount>frameCount)throw new Error('MP4 declara mais amostras do que quadros.');
  let totalBytes=0;
  for(let i=0;i<sampleCount;i++){
   const sampleBytes=sizeAt(sampleIndex++);
   if(sampleBytes===0)throw new Error('MP4 contém quadro H.264 sem dados.');
   totalBytes+=sampleBytes;
  }
  if(chunkOffset<mdat.payload||chunkOffset+totalBytes>mdat.end)
   throw new Error('MP4 com quadro fora da área de dados mdat. O arquivo pode estar incompleto.');
 }
 if(sampleIndex!==frameCount)throw new Error('MP4 sem offsets para todos os quadros H.264.');
}
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
 assertVideoSamplesInsideMdat(view,stblChildren,mdat,frames);
 return {width,height,frames,codec:sample.type as 'avc1'|'avc3',bytes:buffer.byteLength};
}
