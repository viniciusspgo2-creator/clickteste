import {createHmac,randomBytes} from 'node:crypto'
import {NextResponse} from 'next/server'
import {BROWSER_COOKIE,browserToken} from '@/lib/premium-session'
import {establishUnifiedStudioSession} from '@/lib/unified-studio-session'
import {writeStudioCookie} from '@/lib/studio-session-cookie'
export const runtime='nodejs'
const destinations={ '3d':'/mockup-caneca-3d/studio', '2d':'/mockup-cenarios/editor',editor:'/editor-artes/editor' } as const
export async function GET(req:Request){
 const secret=process.env.UNIFIED_SSO_SECRET,portal=process.env.PORTAL_SSO_ORIGIN||process.env.NEXT_PUBLIC_PORTAL_URL
 if(!secret||secret.length<32||!portal)return Response.json({error:'SSO não configurado.'},{status:503})
 const ticket=new URL(req.url).searchParams.get('ticket')||''
 if(!/^[-a-zA-Z0-9_]+\.[-a-zA-Z0-9_]{43}$/.test(ticket)||ticket.length>220)return Response.json({error:'Solicitação inválida.'},{status:400})
 let target:URL
 try {target=new URL(portal);if(target.username||target.password||target.pathname!=='/'||target.search||target.hash||!(["https:"].includes(target.protocol)||(process.env.NODE_ENV!=='production'&&target.hostname==='localhost'&&target.protocol==='http:')))throw Error()}catch{return Response.json({error:'Portal de login inválido.'},{status:503})}
 try{
  const response=await fetch(new URL('/api/sso/studio/verify',target.origin),{method:'POST',headers:{'Content-Type':'application/json','X-Studio-SSO-Signature':createHmac('sha256',secret).update(ticket).digest('hex')},body:JSON.stringify({ticket}),cache:'no-store',signal:AbortSignal.timeout(8000),redirect:'error'})
  if(!response.ok)return Response.json({error:'Sua sessão expirou ou você não tem acesso ao Studio. Volte ao painel e tente novamente.'},{status:403,headers:{'Cache-Control':'no-store'}})
  const data=await response.json() as {ok:boolean;user?:{id:string;name:string;registeredAt:string;tool:keyof typeof destinations;kind:string;expiresAt:string|null;override:string}}
  if(!data.ok||!data.user||!destinations[data.user.tool])return Response.json({error:'Resposta de login inválida.'},{status:403})
  const browser=browserToken(req)||randomBytes(32).toString('hex')
  const session=await establishUnifiedStudioSession(data.user,browser)
  // Atrás do Caddy o req.url é o endereço interno (0.0.0.0:3003); o destino
  // público vem de NEXT_PUBLIC_SITE_URL, como em studio-access-options.ts.
  const site=process.env.NEXT_PUBLIC_SITE_URL
  const base=site?new URL(site).origin:new URL(req.url).origin
  const redirect=NextResponse.redirect(new URL(destinations[data.user.tool],base),303)
  writeStudioCookie(redirect,req,session.sessionToken,false,session.sessionExpiresAt)
  redirect.cookies.set(BROWSER_COOKIE,browser,{httpOnly:true,sameSite:'strict',secure:new URL(req.url).protocol==='https:',path:'/',maxAge:365*86400})
  redirect.headers.set('Cache-Control','private, no-store');redirect.headers.set('Referrer-Policy','no-referrer')
  return redirect
 }catch{return Response.json({error:'Não foi possível concluir o login integrado. Tente novamente pelo painel do cliente.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
