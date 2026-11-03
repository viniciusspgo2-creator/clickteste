/** Lê perguntas da IA com um limite real de bytes, inclusive quando
 * o navegador omite Content-Length (requisições chunked).
 * Nenhum arquivo de projeto, imagem ou credencial é necessário neste endpoint.
 */
export class AssistantRequestError extends Error {
  constructor(public readonly status:400|413|415, message:string){super(message);this.name='AssistantRequestError';}
}
export async function readAssistantBody(request:Request,limit=4096):Promise<unknown>{
  const contentType=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if(contentType!=='application/json')throw new AssistantRequestError(415,'JSON obrigatório.');
  const declared=Number(request.headers.get('content-length'));
  if(Number.isFinite(declared)&&declared>limit)throw new AssistantRequestError(413,'Pergunta muito grande.');
  if(!request.body)throw new AssistantRequestError(400,'Corpo JSON ausente.');
  const reader=request.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      total+=value.byteLength;
      if(total>limit){await reader.cancel().catch(()=>{});throw new AssistantRequestError(413,'Pergunta muito grande.');}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;
  for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{throw new AssistantRequestError(400,'JSON inválido.');}
}
