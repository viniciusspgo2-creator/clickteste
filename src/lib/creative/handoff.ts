/** Compartilhamento local Studio 3D -> Editor. Nunca trafega via API. */
const NAME='cg-creative-local-v1';
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
export async function readHandoff():Promise<Blob|null>{
 const db=await openDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);
  const req=store.get('latest');
  req.onsuccess=()=>{const data=req.result as {blob:Blob;createdAt:number}|undefined;
   store.delete('latest');resolve(data&&Date.now()-data.createdAt<24*3600e3?data.blob:null);
  };req.onerror=()=>reject(req.error);
 });}finally{db.close()}
}
