import {Unzip,UnzipInflate} from 'fflate';

export class TemplateArchiveError extends Error {}
const MAX_TOTAL=30*1024*1024,MAX_FILE=12*1024*1024;
type Entry={size:number;crc:number};
const crcTable=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
/** Inspect the directory before inflation; then bound actual output chunks too.
 * Never trust a ZIP's declared sizes alone or inflate every entry for CRC first. */
export function unpackTemplateArchive(bytes:Uint8Array,maxEntries=30):Map<string,Uint8Array>{
 const fail=():never=>{throw new TemplateArchiveError('Pacote inválido ou acima dos limites de segurança do template.');};
 try{
  if(bytes.length<22||bytes.length>50*1024*1024)fail();
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}}
  if(end<0)fail();
  const count=view.getUint16(end+10,true),directoryBytes=view.getUint32(end+12,true),directory=view.getUint32(end+16,true);
  if(!count||count>maxEntries||view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||directory+directoryBytes>end)fail();
  const entries=new Map<string,Entry>();let offset=directory,declared=0;
  for(let index=0;index<count;index++){
   if(offset+46>end||view.getUint32(offset,true)!==0x02014b50)fail();
   const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),size=view.getUint32(offset+24,true);
   const nameSize=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true),local=view.getUint32(offset+42,true);
   const next=offset+46+nameSize+extra+comment;
   if(next>directory+directoryBytes||local>=directory||(flags&1)||![0,8].includes(method))fail();
   const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(offset+46,offset+46+nameSize));
   if(!name||name.length>200||name.startsWith('/')||name.includes('..')||!/^[\w./ -]+$/.test(name)||entries.has(name))fail();
   if(size>(name==='manifest.json'?16384:MAX_FILE)||(declared+=size)>MAX_TOTAL)fail();
   if(!name.endsWith('/')&&!/\.(png|jpe?g|webp|json)$/i.test(name))fail();
   entries.set(name,{size,crc:view.getUint32(offset+16,true)});offset=next;
  }
  if(offset!==directory+directoryBytes||!entries.has('manifest.json'))fail();
  const files=new Map<string,Uint8Array>(),seen=new Set<string>();let actual=0;
  const archive=new Unzip(file=>{
   const entry=entries.get(file.name);if(!entry||seen.has(file.name))return fail();seen.add(file.name);
   const chunks:Uint8Array[]=[];let length=0;
   file.ondata=(error,chunk,done)=>{
    if(error)fail();length+=chunk.length;actual+=chunk.length;
    if(length>Math.min(entry.size,file.name==='manifest.json'?16384:MAX_FILE)||actual>MAX_TOTAL)fail();
    chunks.push(chunk);
    if(done){
     if(length!==entry.size)fail();
     const output=new Uint8Array(length);let at=0;for(const part of chunks){output.set(part,at);at+=part.length;}
     if(crc32(output)!==entry.crc)fail();
     if(!file.name.endsWith('/'))files.set(file.name,output);
    }
   };
   file.start();
  });
  archive.register(UnzipInflate);
  for(let i=0;i<bytes.length;i+=16384)archive.push(bytes.subarray(i,i+16384),i+16384>=bytes.length);
  if(seen.size!==entries.size)fail();
  return files;
 }catch(error){if(error instanceof TemplateArchiveError)throw error;return fail();}
}
