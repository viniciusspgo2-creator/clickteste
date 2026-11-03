/** Format .cgtemplate: ZIP with manifest.json and optional backdrop/foreground/mask/shadow images.
 * A slot defines a proposed position for an existing local mug; the mug image remains local.
 */
import JSZip from 'jszip';
import {uid,type DesignDocument,type DesignNode} from './design';
type Slot={x:number;y:number;w:number;h:number};
/** Ajusta qualquer mockup ao encaixe sem esticar, preservando sua imagem e efeitos. */
export function fitMockupIntoSlot(node:DesignNode,slot:Slot,maskSrc?:string,scaleFactor=1):DesignNode{
 if(!Number.isFinite(scaleFactor)||scaleFactor<0.5||scaleFactor>1.5)throw new Error('Escala de encaixe inválida');
 if(!Number.isFinite(node.w)||!Number.isFinite(node.h)||node.w<=0||node.h<=0||!Number.isFinite(slot.w)||!Number.isFinite(slot.h)||slot.w<=0||slot.h<=0)throw new Error('Dimensões inválidas para encaixar a caneca');
 const scale=Math.min(slot.w/node.w,slot.h/node.h)*scaleFactor;
 const w=node.w*scale,h=node.h*scale;
 return {...node,x:slot.x+(slot.w-w)/2,y:slot.y+(slot.h-h)/2,w,h,angle:0,maskSrc};
}

type Manifest={format:'clickgruda-smart-template';version:1;name:string;width:number;height:number;background?:string;foreground?:string;shadow?:string;mask?:string;slot?:Slot};
/** Templates importados não são confiáveis: valide o manifesto antes de alocar
 * imagens. Os caminhos permitidos só podem referenciar recursos do ZIP. */
export function validateSmartManifest(value:unknown):Manifest{
 const m=value as Manifest|null;
 if(!m||typeof m!=='object'||m.format!=='clickgruda-smart-template'||m.version!==1||
   typeof m.name!=='string'||m.name.trim().length===0||m.name.length>120||
   !Number.isInteger(m.width)||!Number.isInteger(m.height)||
   m.width<100||m.height<100||m.width>4096||m.height>4096)
  throw new Error('Manifesto do template inválido.');
 for(const key of ['background','foreground','shadow','mask'] as const){
  const path=m[key];
  if(path!==undefined&&(typeof path!=='string'||path.length>200))
   throw new Error(`Imagem ${key} inválida no manifesto.`);
  if(path)validPath(path);
 }
 if(m.slot!==undefined){
  const v=m.slot;
  if(!v||typeof v!=='object'||
   [v.x,v.y,v.w,v.h].some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>1)||
   v.w<=0||v.h<=0||v.x+v.w>1.001||v.y+v.h>1.001)
   throw new Error('Área de encaixe inválida no manifesto.');
 }
 return m;
}
const data=(bytes:Uint8Array,mime:string)=>new Promise<string>((resolve,reject)=>{
 const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Arquivo do template inválido'));reader.readAsDataURL(new Blob([new Uint8Array(bytes)],{type:mime}));
});
function validPath(path:string){if(path.startsWith('/')||path.includes('..')||!/^[-_\w./ ]+\.(png|jpe?g|webp)$/i.test(path))throw new Error('O template contém um caminho de imagem inválido');return path;}
export async function importSmartTemplate(file:File,current:DesignDocument):Promise<{document:DesignDocument;warning:string}>{
 if(file.size>50*1024*1024)throw new Error('Template maior que 50 MB');
 const archive=await JSZip.loadAsync(await file.arrayBuffer(),{checkCRC32:true});
 const entry=archive.file('manifest.json');if(!entry)throw new Error('Template sem manifest.json');
 const manifest=validateSmartManifest(JSON.parse(await entry.async('text')));
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
 const adapted=retain.map(n=>({...n,
  x:n.x*factor+offsetX,y:n.y*factor+offsetY,w:n.w*factor,h:n.h*factor,
  size:n.size===undefined?undefined:n.size*factor,
  shadow:n.shadow===undefined?undefined:n.shadow*factor,
  shadowX:n.shadowX===undefined?undefined:n.shadowX*factor,
  shadowY:n.shadowY===undefined?undefined:n.shadowY*factor,
  blur:n.blur===undefined?undefined:n.blur*factor,
  strokeWidth:n.strokeWidth===undefined?undefined:n.strokeWidth*factor,
  curve:n.curve===undefined?undefined:n.curve*factor,
  wave:n.wave===undefined?undefined:n.wave*factor,
  tracking:n.tracking===undefined?undefined:n.tracking*factor,
  depth:n.depth===undefined?undefined:n.depth*factor,
  keyframes:n.keyframes?.map(k=>({...k,x:k.x*factor+offsetX,y:k.y*factor+offsetY,w:k.w*factor,h:k.h*factor}))
 }));
 const mug=adapted.find(n=>n.id===currentMug?.id);
 const slot=manifest.slot?normalized(manifest.slot):undefined;
 if(mug&&slot){Object.assign(mug,fitMockupIntoSlot(mug,slot,mask));}
 // When changing to an unmasked template, drop only the previous template's
 // automatic mask; never remove a different, user-authored mask.
 if(mug&&!slot&&current.smartTemplate?.maskSrc&&mug.maskSrc===current.smartTemplate.maskSrc) mug.maskSrc=undefined;
 const imgNode=(src:string,role:DesignNode['role'],name:string,shadowOpacity=1):DesignNode=>({id:uid(),kind:'image',role,layerName:name,src,x:0,y:0,w:manifest.width,h:manifest.height,angle:0,opacity:shadowOpacity,aspectLock:true,locked:role==='background'});
 const nodes:DesignNode[]=[];
 if(bg)nodes.push(imgNode(bg,'background','Cenário'));
 if(shadow)nodes.push(imgNode(shadow,'template','Sombra de integração',.75));
 nodes.push(...adapted);
 if(fg)nodes.push(imgNode(fg,'foreground','Primeiro plano / mãos'));
 return {document:{width:manifest.width,height:manifest.height,background:'#ffffff',nodes,smartTemplate:slot?{slot,maskSrc:mask}:undefined},warning:mug?'Mockup mantido, encaixado na área indicada. Confira a perspectiva e a máscara antes de exportar.':'Template aberto. Importe um mockup do Studio para usar a área de encaixe.'};
}
