/**
 * Serializes the automatic browser draft. IndexedDB transactions may finish out
 * of order, so a reset/import must run AFTER any in-flight draft write and
 * BEFORE writes created for the new document.
 *
 * Every reset invalidates queued snapshots from the previous document. Nothing
 * is uploaded; the caller supplies IndexedDB write/delete functions.
 */
export class DraftWriteQueue {
 private tail:Promise<void>=Promise.resolve();
 private generation=0;

 private enqueue<T>(work:()=>Promise<T>):Promise<T>{
  const result=this.tail.then(work);
  this.tail=result.then(()=>undefined,()=>undefined);
  return result;
 }

 save(isCurrent:()=>boolean,write:()=>Promise<void>):Promise<boolean>{
  const generation=this.generation;
  return this.enqueue(async()=>{
   if(generation!==this.generation||!isCurrent())return false;
   await write();
   return generation===this.generation&&isCurrent();
  });
 }

 /** Invalidates pending writes and deletes only after any active write settles. */
 reset(remove:()=>Promise<void>):Promise<void>{
  this.generation++;
  return this.enqueue(remove);
 }
}
