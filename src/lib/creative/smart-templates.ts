/** Format .cgtemplate: ZIP with manifest.json and optional backdrop/foreground/mask/shadow images.
 * A slot defines a proposed position for an existing local mug; the mug image remains local.
 */
import JSZip from 'jszip';
import {uid,type DesignDocument,type DesignNode} from './design';
type Slot={x:number;y:number;w:number;h:number};
type Manifest={format:'clickgruda-smart-template';version:1;name:string;width:number;height:number;background?:string;foreground?:string;shadow?:string;mask?:string;slot?:Slot};
const data=(bytes:Uint8Array,mime:string)=>new Promise<string>((resolve,reject)=>{
 const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Arquivo do template inválido'));reader.readAsDataURL(new Blob([new Uint8Array(bytes)],{type:mime}));
});
function validPath(path:string){if(path.startsWith('/')||path.includes('..')||!/^[-_\w./ ]+\.(png|jpe?g|webp)$/i.test(path))throw new Error('O template contém um caminho de imagem inválido');return path;}
export async function importSmartTemplate(file:File,current:DesignDocument):Promise<{document:DesignDocument;warning:string}>{
 if(file.size>50*1024*1024)throw new Error('Template maior que 50 MB');
 const archive=await JSZip.loadAsync(await file.arrayBuffer(),{checkCRC32:true});
 const entry=archive.file('manifest.json');if(!entry)throw new Error('Template sem manifest.json');
 const manifest=JSON.parse(await entry.async('text')) as Manifest;
 if(manifest.format!=='clickgruda-smart-template'||manifest.version!==1||!Number.isFinite(manifest.width)||!Number.isFinite(manifest.height)||manifest.width<100||manifest.height<100||manifest.width>4096||manifest.height>4096)throw new Error('Formato ou dimensões do template inválidos');
 if(Object.keys(archive.files).length>30)throw new Error('Template com arquivos demais; limite de 30 entradas.');
 let totalUncompressed=0;
 const image=async(path:string|undefined)=>{
  if(!path)return undefined;validPath(path);const f=archive.file(path);
  if(!f)throw new Error(`Imagem ausente no pacote: ${path}`);
  const bytes=await f.async('uint8array');if(bytes.byteLength>12*1024*1024)throw new Error('Imagem do template acima de 12 MB');
  totalUncompressed+=bytes.byteLength;if(totalUncompressed>30*1024*1024)throw new Error('Imagens descompactadas excedem 30 MB');
  const mime=/\.png$/i.test(path)?'image/png':/\.webp$/i.test(path)?'image/webp':'image/jpeg';return data(bytes,mime);
 };
 const [bg,fg,shadow,mask]=await Promise.all([image(manifest.background),image(manifest.foreground),image(manifest.shadow),image(manifest.mask)]);
 const normalized=(s:Slot)=>{const coordinates=[s.x,s.y,s.w,s.h];if(coordinates.some(v=>!Number.isFinite(v)||v<0||v>1)||s.w===0||s.h===0||s.x+s.w>1.001||s.y+s.h>1.001)throw new Error('Área de encaixe inválida');return {x:s.x*manifest.width,y:s.y*manifest.height,w:s.w*manifest.width,h:s.h*manifest.height};};
 const currentMug=current.nodes.find(n=>n.role==='mockup');const retain=current.nodes.filter(n=>n.role!=='background'&&n.role!=='template'&&n.role!=='foreground');
 const factor=Math.min(manifest.width/current.width,manifest.height/current.height);
 const offsetX=(manifest.width-current.width*factor)/2,offsetY=(manifest.height-current.height*factor)/2;
 const adapted=retain.map(n=>({...n,x:n.x*factor+offsetX,y:n.y*factor+offsetY,w:n.w*factor,h:n.h*factor,size:n.size?n.size*factor:undefined}));
 const mug=adapted.find(n=>n.id===currentMug?.id);
 const slot=manifest.slot?normalized(manifest.slot):undefined;
 if(mug&&slot){const scale=Math.min(slot.w/Math.max(1,mug.w),slot.h/Math.max(1,mug.h));
  mug.w*=scale;mug.h*=scale;mug.x=slot.x+(slot.w-mug.w)/2;mug.y=slot.y+(slot.h-mug.h)/2;
  mug.maskSrc=mask; // clear any incompatible mask from the previous template
 }
 const imgNode=(src:string,role:DesignNode['role'],name:string,shadowOpacity=1):DesignNode=>({id:uid(),kind:'image',role,layerName:name,src,x:0,y:0,w:manifest.width,h:manifest.height,angle:0,opacity:shadowOpacity,aspectLock:true,locked:role==='background'});
 const nodes:DesignNode[]=[];
 if(bg)nodes.push(imgNode(bg,'background','Cenário'));
 if(shadow)nodes.push(imgNode(shadow,'template','Sombra de integração',.75));
 nodes.push(...adapted);
 if(fg)nodes.push(imgNode(fg,'foreground','Primeiro plano / mãos'));
 return {document:{width:manifest.width,height:manifest.height,background:'#ffffff',nodes,smartTemplate:slot?{slot,maskSrc:mask}:undefined},warning:mug?'Mockup mantido, encaixado na área indicada. Confira a perspectiva e a máscara antes de exportar.':'Template aberto. Importe um mockup do Studio para usar a área de encaixe.'};
}
