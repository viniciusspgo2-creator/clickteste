/** Compartilhamento local Studio 3D -> Editor. Nunca trafega via API. */
const NAME='cg-creative-local-v1';
const HANDOFF_TTL_MS=24*60*60*1000;
const STORE='handoff';
export type MockupHandoffLayer={blob:Blob;name:string};
export type MockupHandoff={mode:'composition'|'separate';items:MockupHandoffLayer[]};
const MAX_HANDOFF_BYTES=80*1024*1024;
function validLayers(items:unknown):items is MockupHandoffLayer[]{
 if(!Array.isArray(items)||!items.length||items.length>32)return false;
 let bytes=0;
 return items.every(item=>item&&item.blob instanceof Blob&&item.blob.type==='image/png'&&
  item.blob.size>0&&typeof item.name==='string'&&item.name.length>0&&item.name.length<=120&&
  (bytes+=item.blob.size)<=MAX_HANDOFF_BYTES);
}
function openDB():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
export async function writeHandoff(blob:Blob){
 const db=await openDB();
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put({blob,createdAt:Date.now()},'latest');
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
 });}finally{db.close()}
}
/** Atomic write: partial captures never replace a previous successful handoff. */
export async function writeLayeredHandoff(items:MockupHandoffLayer[]){
 if(!validLayers(items))throw new Error('Não foi possível preparar as canecas. Envie até 32 peças, com total de até 80 MB em PNG.');
 const db=await openDB();
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put({version:2,mode:'separate',items,createdAt:Date.now()},'latest');
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Transferência interrompida. Tente novamente.'));
 });}finally{db.close()}
}
/** Lê sem consumir. Retomar a navegação não apaga o mockup do dispositivo.
 * Somente o Editor com ?from=mockup deve carregar esta transferência; o rascunho
 * do usuário tem prioridade nos demais acessos. O conteúdo expira em 24 h.
 */
export async function readHandoff():Promise<Blob|null>{
 return (await readEditorHandoff())?.items[0]?.blob??null;
}
/** Accept both existing single-PNG transfers and independent layers. */
export async function readEditorHandoff():Promise<MockupHandoff|null>{
 const db=await openDB();
 try{
  return await new Promise<MockupHandoff|null>((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly');
   const request=tx.objectStore(STORE).get('latest');
   let data:{blob?:Blob;createdAt:number;version?:number;mode?:string;items?:MockupHandoffLayer[]}|undefined;
   request.onsuccess=()=>{data=request.result as typeof data;};
   tx.oncomplete=()=>{
    if(!data||!Number.isFinite(data.createdAt)||Date.now()-data.createdAt>=HANDOFF_TTL_MS||data.createdAt>Date.now()){resolve(null);return;}
    if(data.version===2){resolve(data.mode==='separate'&&validLayers(data.items)?{mode:'separate',items:data.items}:null);return;}
    resolve(data.blob instanceof Blob?{mode:'composition',items:[{blob:data.blob,name:'Composição do Studio'}]}:null);
   };
   tx.onerror=()=>reject(tx.error||new Error('Falha ao abrir transferência local'));
   tx.onabort=()=>reject(tx.error||new Error('Leitura do mockup interrompida'));
  });
 }finally{db.close()}
}
