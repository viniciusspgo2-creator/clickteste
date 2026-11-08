import {NextResponse} from 'next/server';
import {readBodyBytes,RequestBodyError} from '@/lib/security/request-body';
import {libraryIntegrationEnabled} from '@/lib/studio-access-options';
import {LibraryRequestError,parseLibraryEvent,validLibrarySignature} from '@/lib/studio-library/contract';
import {provisionLibraryAccess} from '@/lib/studio-library/provision';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
export async function POST(req:Request){
 if(!libraryIntegrationEnabled())return NextResponse.json({ok:false,error:'Integração desativada.'},{status:404,headers});
 const secret=process.env.STUDIO_LIBRARY_WEBHOOK_SECRET;
 if(!secret||secret.length<32||secret===process.env.ADMIN_SECRET||secret===process.env.ADMIN_PASSWORD)return NextResponse.json({ok:false,error:'Integração não configurada.'},{status:503,headers});
 try{
  if(Number(req.headers.get('content-length')||0)>8192)throw new LibraryRequestError('Corpo muito grande.',413);
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(await readBodyBytes(req,8192));if(Buffer.byteLength(raw,'utf8')>8192)throw new LibraryRequestError('Corpo muito grande.',413);
  if(!validLibrarySignature(req,raw,secret))return NextResponse.json({ok:false,error:'Não autorizado.'},{status:401,headers});
  const result=await provisionLibraryAccess(parseLibraryEvent(raw));
  return NextResponse.json(result,{headers});
 }catch(e){return NextResponse.json({ok:false,error:(e instanceof LibraryRequestError||e instanceof RequestBodyError)?e.message:'Falha temporária. Reenvie o mesmo evento.'},{status:(e instanceof LibraryRequestError||e instanceof RequestBodyError)?e.status:503,headers});}
}
