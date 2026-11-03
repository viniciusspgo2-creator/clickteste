/** Read the AI question with a strict byte budget AND a complete-request deadline.
 * A stalled chunked upload must not occupy a serverless function indefinitely.
 * Neither customer media nor a project document is accepted at this endpoint.
 */
export class AssistantRequestError extends Error {
  constructor(public readonly status:400|408|413|415, message:string){super(message);this.name='AssistantRequestError';}
}
export const ASSISTANT_REQUEST_TIMEOUT_MS=8_000;

export async function readAssistantBody(
 request:Request,limit=4096,timeoutMs=ASSISTANT_REQUEST_TIMEOUT_MS,
):Promise<unknown>{
 if(!Number.isSafeInteger(limit)||limit<1||!Number.isFinite(timeoutMs)||timeoutMs<1)
  throw new AssistantRequestError(400,'Limites de leitura inválidos.');
 const contentType=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
 if(contentType!=='application/json')throw new AssistantRequestError(415,'JSON obrigatório.');
 const declared=Number(request.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>limit)throw new AssistantRequestError(413,'Pergunta muito grande.');
 if(!request.body)throw new AssistantRequestError(400,'Corpo JSON ausente.');
 if(request.signal.aborted)throw new AssistantRequestError(408,'Envio da pergunta interrompido.');
 const reader=request.body.getReader();
 const chunks:Uint8Array[]=[];
 let total=0,complete=false;
 let rejectOnInterrupt!:(error:AssistantRequestError)=>void;
 const interrupted=new Promise<never>((_resolve,reject)=>{rejectOnInterrupt=reject;});
 const onAbort=()=>rejectOnInterrupt(new AssistantRequestError(408,'Envio da pergunta interrompido.'));
 request.signal.addEventListener('abort',onAbort,{once:true});
 const timer=setTimeout(()=>rejectOnInterrupt(new AssistantRequestError(408,'O envio da pergunta excedeu o tempo limite.')),timeoutMs);
 try{
  // Check once more after subscribing to close the abort registration race.
  if(request.signal.aborted)onAbort();
  while(true){
   const {done,value}=await Promise.race([reader.read(),interrupted]);
   if(done){complete=true;break;}
   total+=value.byteLength;
   if(total>limit)throw new AssistantRequestError(413,'Pergunta muito grande.');
   chunks.push(value);
  }
 }finally{
  clearTimeout(timer);
  request.signal.removeEventListener('abort',onAbort);
  if(!complete)void reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
 const bytes=new Uint8Array(total);let offset=0;
 for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{throw new AssistantRequestError(400,'JSON inválido.');}
}
