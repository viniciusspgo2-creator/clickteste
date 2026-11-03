/** Compartilhamento local Studio 3D -> Editor. Nunca trafega via API. */
const NAME='cg-creative-local-v1';
const HANDOFF_TTL_MS=24*60*60*1000;
const STORE='handoff';
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
/** Lê sem consumir. Retomar a navegação não apaga o mockup do dispositivo.
 * Somente o Editor com ?from=mockup deve carregar esta transferência; o rascunho
 * do usuário tem prioridade nos demais acessos. O conteúdo expira em 24 h.
 */
export async function readHandoff():Promise<Blob|null>{
 const db=await openDB();
 try{
  return await new Promise<Blob|null>((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly');
   const request=tx.objectStore(STORE).get('latest');
   let data:{blob:Blob;createdAt:number}|undefined;
   request.onsuccess=()=>{data=request.result as typeof data;};
   tx.oncomplete=()=>resolve(data?.blob&&Number.isFinite(data.createdAt)&&Date.now()-data.createdAt<HANDOFF_TTL_MS&&data.createdAt<=Date.now()?data.blob:null);
   tx.onerror=()=>reject(tx.error||new Error('Falha ao abrir transferência local'));
   tx.onabort=()=>reject(tx.error||new Error('Leitura do mockup interrompida'));
  });
 }finally{db.close()}
}
