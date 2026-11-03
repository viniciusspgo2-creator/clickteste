/** User-supplied fonts are loaded ONLY in the current browser tab.
 * No upload requests, no public bundling of fonts whose redistribution rights are unknown.
 */
export type LocalTypeface={name:string;status:'pt-br-completo'|'pt-br-parcial'|'sem-acentos'|'acentos-nao-verificados';missing:string};
const CHARS=Array.from('áéíóúâêôãõàçÁÉÍÓÚÂÊÔÃÕÀÇ');
const MAX_FONT_BYTES=8*1024*1024,MAX_ZIP_BYTES=80*1024*1024,MAX_FONTS=60;
function cmapFor(input:ArrayBuffer){
 const dv=new DataView(input);if(dv.byteLength<12)return null;
 const magic=dv.getUint32(0);if(magic!==0x00010000&&magic!==0x4f54544f&&magic!==0x74727565)return null;
 const tables=dv.getUint16(4);if(tables>200)return null;
 for(let i=0;i<tables;i++){
  const base=12+i*16;if(base+16>dv.byteLength)return null;
  if(dv.getUint32(base)===0x636d6170){const offset=dv.getUint32(base+8),length=dv.getUint32(base+12);return offset+length<=dv.byteLength?{dv,offset,length}:null;}
 }
 return null;
}
export function classifyLocalTypeface(input:ArrayBuffer):Pick<LocalTypeface,'status'|'missing'>{
 try{
  const cm=cmapFor(input);if(!cm)return{status:'acentos-nao-verificados',missing:''};
  const {dv,offset,length}=cm,end=offset+length;const count=dv.getUint16(offset+2);
  if(count>256||offset+4+count*8>end)return{status:'acentos-nao-verificados',missing:''};
  const candidates=[] as {start:number;format:number;score:number}[];
  for(let i=0;i<count;i++){
   const p=offset+4+i*8,platform=dv.getUint16(p),encoding=dv.getUint16(p+2),start=offset+dv.getUint32(p+4);
   if(start+16>end)continue;const format=dv.getUint16(start);
   if(format===4||format===12)candidates.push({start,format,score:(format===12?20:0)+(platform===3?10:0)+(encoding===10?3:0)});
  }
  candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)return{status:'acentos-nao-verificados',missing:''};
  const {start,format}=candidates[0];let covered=0,missing='';
  for(const c of CHARS){const code=c.codePointAt(0)!;let glyph=0;
   if(format===12){const groups=dv.getUint32(start+12);if(groups>50000||start+16+groups*12>end)return{status:'acentos-nao-verificados',missing:''};
    for(let i=0;i<groups;i++){const p=start+16+i*12,lo=dv.getUint32(p),hi=dv.getUint32(p+4);if(code>=lo&&code<=hi){glyph=dv.getUint32(p+8)+code-lo;break;}}
   }else{
    const segments=dv.getUint16(start+6)/2,segEnd=start+14,segStart=segEnd+2*segments+2,delta=segStart+2*segments,range=delta+2*segments;
    if(segments>20000||range+2*segments>end)return{status:'acentos-nao-verificados',missing:''};
    for(let i=0;i<segments;i++){const lo=dv.getUint16(segStart+i*2),hi=dv.getUint16(segEnd+i*2);if(code<lo||code>hi)continue;
     const d=dv.getInt16(delta+i*2),r=dv.getUint16(range+i*2);
     if(!r)glyph=(code+d)&0xffff;else{const p=range+2*i+r+2*(code-lo);if(p+2<=end){const rawGlyph=dv.getUint16(p);glyph=rawGlyph?(rawGlyph+d)&0xffff:0};}break;
    }
   }
   if(glyph)covered++;else missing+=c;
  }
  return{status:covered===CHARS.length?'pt-br-completo':covered===0?'sem-acentos':'pt-br-parcial',missing};
 }catch{return{status:'acentos-nao-verificados',missing:''};}
}
function readableFontName(filename:string){return filename.replace(/^.*[/\\]/,'').replace(/\.(otf|ttf|woff2?|zip)$/i,'').replace(/[_-]+/g,' ').replace(/['"\<>]/g,'').replace(/\s+/g,' ').trim().slice(0,90);}
function supported(filename:string){return /\.(ttf|otf|woff2?)$/i.test(filename)}
const loaded=new Map<string,FontFace>();
async function loadFont(name:string,bytes:ArrayBuffer):Promise<LocalTypeface>{
 if(bytes.byteLength>MAX_FONT_BYTES)throw new Error('Arquivo de fonte acima de 8 MB.');
 const status=classifyLocalTypeface(bytes);const fontName=readableFontName(name);
 if(!fontName)throw new Error('Fonte sem nome de arquivo válido.');
 // Evita interferir em famílias diferentes com o mesmo nome, mantendo identificador único.
 const unique=`Local · ${fontName}`;
 const face=new FontFace(unique,bytes);await face.load();document.fonts.add(face);loaded.set(unique,face);
 return {name:unique,...status};
}
/** Returns an explicit, bounded batch. No remote storage; users must keep original font files. */
export async function loadBrowserFonts(files:FileList|File[]):Promise<{fonts:LocalTypeface[];skipped:number}>{
 const list=Array.from(files),result:LocalTypeface[]=[];let skipped=0;
 for(const file of list){
  if(result.length>=MAX_FONTS)break;
  if(/\.zip$/i.test(file.name)){
   if(file.size>MAX_ZIP_BYTES){skipped++;continue;}
   const JSZip=(await import('jszip')).default;
   const zip=await JSZip.loadAsync(file);
   for(const item of Object.values(zip.files)){
    if(result.length>=MAX_FONTS)break;
    if(item.dir||!supported(item.name)||item.name.startsWith('__MACOSX/')||item.name.includes('/._'))continue;
    const declaredSize=(item as typeof item & {_data?:{uncompressedSize?:number}})._data?.uncompressedSize;
    if(typeof declaredSize!=='number'||declaredSize>MAX_FONT_BYTES){skipped++;continue;}
    try{const raw=await item.async('arraybuffer');if(raw.byteLength>MAX_FONT_BYTES){skipped++;continue;}result.push(await loadFont(item.name,raw));}catch{skipped++;}
   }
  }else if(supported(file.name)){
   try{result.push(await loadFont(file.name,await file.arrayBuffer()));}catch{skipped++;}
  }else skipped++;
 }
 return {fonts:result,skipped};
}
