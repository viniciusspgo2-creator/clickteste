/** Optional AI assistant. Never receives images/projects, only the question, area and locale.
 * Owner configures OPENAI_API_KEY on Vercel; rate limiting here is per-instance and
 * must be upgraded to shared KV before making high-volume public access available.
 */
import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
const actionsByArea={
 editor:['backgrounds','templates','texts','elements','personagens','uploads','guides','export'],
 studio:['arts','base','models','scene','light','camera','effects','compose'],
 templates:[]
} as const;
const frequency=new Map<string,{start:number,count:number}>();
const knowledge=`Você é o assistente especializado da Click & Gruda, para o Studio Mockup 3D, Studio Templates e Editor de Artes PARA SUBLIMAÇÃO DE CANECAS. Conhecimento validado:
- No Editor: estampa padrão 21 × 9,5 cm (2480 × 1122 px), área visível aproximada 19 × 8,5 cm; upload temporário e privado no navegador; exportar .cgdesign; layers, sombra, recorte, textos curvos, elementos e templates.
- A transferência Studio → Editor leva PNG da caneca sem sombra do chão; sombra pode ser aplicada manualmente pelo Editor.
- Studio 3D: trocar modelo/alça, material fosco/verniz, mover câmera e caneca, Bocão, iluminação, sombra de contato, presets e exportações.
- Studio Templates: layouts prontos, imagens do Admin e templates inteligentes do usuário; conteúdo de terceiros requer direitos de redistribuição.
- PDF: escolha de página, trecho de texto extraído como objeto e fundo raster. Não promete recompor imagens, fontes e vetores originais.
- PSD: camadas de pixels RGB/8 bit com compressão raw/RLE/ZIP; textos nativos, PSB, ajustes e objetos inteligentes não viram entidades Photoshop editáveis.
- MP4: vídeo de fundo, texto/objetos com animações de entrada e pontos na linha do tempo até 20s. Exportação H.264 local sem áudio, em navegadores WebCodecs compatíveis.
- Templates inteligentes .cgtemplate: cenário, sombra, máscara de luminância e área de encaixe; a máscara também funciona quando a caneca é importada depois.
- Nunca solicite senhas ou tokens. Não invente botões ou acesso administrativo. Uma ação só pode ser sugerida (sem executar) e requer confirmação explícita do usuário.
Responda sempre em português, inglês ou espanhol conforme locale do usuário. Seja conciso. Retorne JSON com chaves reply (string), action (string enum ou null), label (string ou null).`;
export async function POST(req:NextRequest){
 const key=process.env.OPENAI_API_KEY;
 if(!key)return NextResponse.json({ok:false,reason:'not_configured'},{status:503});
 const forwarded=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
 const ip=forwarded.slice(0,80),now=Date.now();const previous=frequency.get(ip);
 const slot=previous&&now-previous.start<3600000?previous:{start:now,count:0};slot.count++;frequency.set(ip,slot);
 if(frequency.size>5000)for(const [k,v] of frequency)if(now-v.start>3600000)frequency.delete(k);
 if(slot.count>24)return NextResponse.json({ok:false,reason:'too_many_requests'},{status:429});
 try{
  // Prevent unusually large bodies from reaching the provider, and block cross-site form abuse.
  if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({ok:false,reason:'request_too_large'},{status:413});
  const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).host!==req.nextUrl.host)return NextResponse.json({ok:false,reason:'forbidden'},{status:403});}catch{return NextResponse.json({ok:false,reason:'forbidden'},{status:403});}}
  const body=await req.json();const question=typeof body?.question==='string'?body.question.trim():'';
  const rawArea=body?.area;const area:keyof typeof actionsByArea=rawArea==='studio'||rawArea==='templates'?rawArea:'editor';
  const locale=['pt','en','es'].includes(body?.locale)?body.locale:'pt';
  if(!question||question.length>600)return NextResponse.json({ok:false,reason:'invalid_question'},{status:400});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  let result:Response;
  try{result=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:process.env.CREATIVE_ASSISTANT_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.2,max_tokens:500,messages:[{role:'system',content:knowledge},{role:'user',content:JSON.stringify({area,locale,question})}]})});}finally{clearTimeout(timer)}
  if(!result.ok)return NextResponse.json({ok:false,reason:'provider_error'},{status:502});
  const provider=await result.json();const content=provider?.choices?.[0]?.message?.content;
  const output=JSON.parse(typeof content==='string'?content:'{}');
  const reply=typeof output.reply==='string'?output.reply.slice(0,1400):'Consulte o guia da ferramenta.';
  const allowed:readonly string[]=actionsByArea[area];
  const action=allowed.find(a=>a===output.action)||null;
  // AI cannot invoke commands: it merely proposes an action understood by the client.
  return NextResponse.json({ok:true,reply,action,label:action&&typeof output.label==='string'?output.label.slice(0,70):null},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false,reason:'unavailable'},{status:503});}
}
