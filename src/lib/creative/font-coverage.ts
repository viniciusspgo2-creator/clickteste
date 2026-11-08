/** Auditoria de mapa Unicode em TrueType/OpenType e WOFF1, sem bibliotecas pesadas.
 * WOFF2: não classificamos sem decodificação; é melhor avisar que presumir suporte.
 */
import {inflateSync} from 'node:zlib';
const PT='áéíóúâêôãõàçÁÉÍÓÚÂÊÔÃÕÀÇ';
export type FontCoverage='pt-br-completo'|'pt-br-parcial'|'sem-acentos'|'acentos-nao-verificados';
function table(bytes:Buffer,ext:string):Buffer|null{
 if(ext==='woff2')return null;
 if(ext==='woff'){
  if(bytes.toString('ascii',0,4)!=='wOFF')return null;
  const count=bytes.readUInt16BE(12);if(count>200)return null;
  for(let i=0;i<count;i++){
   const offset=44+20*i;if(offset+20>bytes.length)return null;
   if(bytes.toString('ascii',offset,offset+4)!=='cmap')continue;
   const start=bytes.readUInt32BE(offset+4),size=bytes.readUInt32BE(offset+8),original=bytes.readUInt32BE(offset+12);
   if(start+size>bytes.length||original>4_000_000)return null;
   const segment=bytes.subarray(start,start+size);
   return original>size?inflateSync(segment,{maxOutputLength:4*1024*1024}):segment;
  }
  return null;
 }
 if(bytes.length<12||!['OTTO','true','typ1'].includes(bytes.toString('ascii',0,4))&&bytes.readUInt32BE(0)!==0x00010000)return null;
 const count=bytes.readUInt16BE(4);if(count>200)return null;
 for(let i=0;i<count;i++){
  const offset=12+16*i;if(offset+16>bytes.length)return null;
  if(bytes.toString('ascii',offset,offset+4)!=='cmap')continue;
  const start=bytes.readUInt32BE(offset+8),length=bytes.readUInt32BE(offset+12);
  if(start+length>bytes.length||length>4_000_000)return null;
  return bytes.subarray(start,start+length);
 }
 return null;
}
function supports(cmap:Buffer,cp:number):boolean|null{
 if(cmap.length<4)return null;
 const count=cmap.readUInt16BE(2);if(count>256||4+8*count>cmap.length)return null;
 const candidates:{offset:number;score:number}[]=[];
 for(let i=0;i<count;i++){
  const r=4+i*8,pid=cmap.readUInt16BE(r),enc=cmap.readUInt16BE(r+2),offset=cmap.readUInt32BE(r+4);
  if(offset+2>=cmap.length)continue;
  const fmt=cmap.readUInt16BE(offset);
  if(fmt!==4&&fmt!==12)continue;
  candidates.push({offset,score:(fmt===12?20:0)+(pid===3?10:0)+(enc===10?3:0)});
 }
 if(!candidates.length)return null;candidates.sort((a,b)=>b.score-a.score);
 for(const {offset} of candidates){
  const fmt=cmap.readUInt16BE(offset);
  try{
   if(fmt===12){
    const groups=cmap.readUInt32BE(offset+12);if(groups>50000)return null;
    for(let i=0;i<groups;i++){
     const p=offset+16+12*i;if(p+12>cmap.length)break;
     const first=cmap.readUInt32BE(p),last=cmap.readUInt32BE(p+4),id=cmap.readUInt32BE(p+8);
     if(cp>=first&&cp<=last)return id+cp-first!==0;
    }
    return false;
   }
   if(fmt===4){
    const segCount=cmap.readUInt16BE(offset+6)/2;
    if(!Number.isInteger(segCount)||segCount>20000)return null;
    const end=offset+14,start=end+segCount*2+2,delta=start+segCount*2,range=delta+segCount*2;
    if(range+segCount*2>cmap.length)return null;
    for(let i=0;i<segCount;i++){
     const s=cmap.readUInt16BE(start+i*2),e=cmap.readUInt16BE(end+i*2);
     if(cp<s||cp>e)continue;
     const d=cmap.readInt16BE(delta+i*2),ro=cmap.readUInt16BE(range+i*2);
     if(ro===0)return ((cp+d)&65535)!==0;
     const loc=range+i*2+ro+2*(cp-s);
     if(loc+2>cmap.length)return null;
     const id=cmap.readUInt16BE(loc);return id!==0&&((id+d)&65535)!==0;
    }
    return false;
   }
  }catch{return null;}
 }
 return null;
}
export function classifyFont(bytes:Buffer,ext:string):{status:FontCoverage;missing:string}{
 try{
  const cmap=table(bytes,ext);if(!cmap)return{status:'acentos-nao-verificados',missing:''};
  let yes=0;let missing='';
  for(const c of PT){const has=supports(cmap,c.codePointAt(0)!);if(has===null)return{status:'acentos-nao-verificados',missing:''};if(has)yes++;else missing+=c;}
  return{status:yes===PT.length?'pt-br-completo':yes===0?'sem-acentos':'pt-br-parcial',missing};
 }catch{return{status:'acentos-nao-verificados',missing:''};}
}
