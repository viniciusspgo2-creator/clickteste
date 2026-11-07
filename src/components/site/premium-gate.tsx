'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Crown,KeyRound,Loader2,ShieldCheck,MessageCircle} from 'lucide-react';
import {LIBRARY_URL,DISCOVERY_SUPPORT_URL} from '@/lib/studio-links';
import {StudioPresence} from './studio-presence';
const SESSION='cg_studio_session';
function readSession(){try{return sessionStorage.getItem(SESSION);}catch{return null;}}
function saveSession(token?:string){try{if(token)sessionStorage.setItem(SESSION,token);else sessionStorage.removeItem(SESSION);}catch{/* Cookie sessions also work when sessionStorage is unavailable. */}}
const ERRORS:Record<string,string>={invalid:'Código inválido ou revogado. Confira o código com o suporte.',expired:'Seu acesso expirou. Acesse a Biblioteca para continuar.',blocked:'Este navegador foi bloqueado pelo administrador. Fale com o suporte.',browser:'Este código já está vinculado a outro navegador. Solicite a troca ao suporte.',full:'O código universal atingiu o limite de usuários autorizados. Solicite ao suporte uma nova vaga ou outro código.',session:'Sua sessão foi encerrada ou substituída por outro acesso. Entre novamente.',rate:'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',network:'Não foi possível verificar seu acesso. Confira sua conexão e tente novamente.'};
export function PremiumGate({children,title='Studio Mockup 3D',backHref='/'}:{children:React.ReactNode;title?:string;backHref?:string}){
 const router=useRouter();
 const [status,setStatus]=useState<'checking'|'locked'|'open'>('checking'),[hasOpened,setHasOpened]=useState(false),[networkBlocked,setNetworkBlocked]=useState(false);
 const [code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[plan,setPlan]=useState('Premium'),[name,setName]=useState('');
 const [rememberAvailable,setRememberAvailable]=useState(false),[remember,setRemember]=useState(true),[monitoring,setMonitoring]=useState(false),[expiry,setExpiry]=useState<string|null>(null);
 const inFlight=useRef(false),epoch=useRef(0),authorizing=useRef(false),persistent=useRef(false),opened=useRef(false);
 const capabilities=(data:{capabilities?:{rememberBrowser?:boolean;monitoring?:boolean}})=>{if(data.capabilities){persistent.current=data.capabilities.rememberBrowser===true;setRememberAvailable(persistent.current);setMonitoring(data.capabilities.monitoring===true);}};
 const check=useCallback(async(claim=false)=>{
  if(inFlight.current||authorizing.current)return;inFlight.current=true;const generation=epoch.current,token=readSession();
  try{
   const response=await fetch('/api/access/session',{method:claim?'POST':'GET',cache:'no-store',headers:token?{Authorization:`Bearer ${token}`}:{}}),data=await response.json();
   if(generation!==epoch.current)return;
   capabilities(data);
   if(!response.ok)throw Error('network');
   if(data.ok){if(data.cookieSession)saveSession();else if(data.sessionToken)saveSession(data.sessionToken);setPlan(data.plan);setName(data.clientName||'');setExpiry(data.expiresAt??null);setStatus('open');opened.current=true;setHasOpened(true);setNetworkBlocked(false);setError('');}
   else{saveSession();setError(token||opened.current||data.reason!=='session'?(ERRORS[data.reason]||ERRORS.session):'');setStatus('locked');setNetworkBlocked(false);}
  }catch{if(generation===epoch.current){setError(ERRORS.network);setNetworkBlocked(true);setStatus(previous=>previous==='checking'?'locked':previous);}}
  finally{inFlight.current=false;}
 },[]);
 useEffect(()=>{
  void check(true);
  const timer=setInterval(()=>void check(persistent.current),15000);
  const focus=()=>{if(!document.hidden)void check(persistent.current);};
  document.addEventListener('visibilitychange',focus);window.addEventListener('focus',focus);
  return()=>{epoch.current++;clearInterval(timer);document.removeEventListener('visibilitychange',focus);window.removeEventListener('focus',focus);};
 },[check]);
 // The visible UI cannot keep editing beyond a known trial deadline during a network failure.
 useEffect(()=>{if(!expiry)return;let timer:ReturnType<typeof setTimeout>;const verify=()=>{const remaining=Date.parse(expiry)-Date.now();if(remaining<=0){epoch.current++;setError(ERRORS.expired);setStatus('locked');}else timer=setTimeout(verify,Math.min(remaining,2147483647));};verify();return()=>clearTimeout(timer);},[expiry]);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(authorizing.current)return;authorizing.current=true;epoch.current++;setBusy(true);setError('');
  try{
   const response=await fetch('/api/access/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,remember:rememberAvailable&&remember})}),data=await response.json();
   if(!response.ok||!data.ok){setError(ERRORS[data.reason]||ERRORS.network);return;}
   if(data.cookieSession)saveSession();else saveSession(data.sessionToken);
   setCode('');setPlan(data.plan);setName(data.clientName||'');setExpiry(data.expiresAt??null);setStatus('open');opened.current=true;setHasOpened(true);setNetworkBlocked(false);
  }catch{setError(ERRORS.network);}finally{authorizing.current=false;setBusy(false);}
 };
 const logout=async()=>{
  if(plan==='Admin Master'){router.push('/');return;}
  if(authorizing.current)return;authorizing.current=true;epoch.current++;
  try{const token=readSession(),r=await fetch('/api/access/session',{method:'DELETE',headers:token?{Authorization:`Bearer ${token}`}:{}});if(!r.ok)throw Error();saveSession();setStatus('locked');setNetworkBlocked(false);setError('');}
  catch{setError('Não foi possível encerrar a sessão. Tente novamente.');}finally{authorizing.current=false;}
 };
 const login=<div className="cg-access-login grid min-h-[80vh] place-items-center bg-[#0c0d0e] px-5 py-12 text-white"><div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#161719] p-7 sm:p-10">
  <Link href={backHref} className="text-sm text-neutral-400">← Conhecer {title}</Link><Crown className="mb-4 mt-8 h-9 w-9 text-amber-400"/><p className="text-xs font-bold uppercase tracking-widest text-amber-400">Bônus da Biblioteca de Artes</p><h1 className="mt-2 text-3xl font-bold">{title}</h1>
  <p className="mt-4 leading-relaxed text-neutral-300">O Studio Mockup e o Editor fazem parte do pacote da <a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="underline">Biblioteca de Artes Click & Gruda</a>. Entre com o código do seu acesso.</p>
  <form onSubmit={submit} className="mt-7 space-y-3"><label htmlFor="premium-code" className="block text-sm">Seu código de acesso</label><input id="premium-code" className="w-full rounded-xl border border-white/20 bg-black/30 p-3 font-mono uppercase outline-none focus:border-orange-400" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={32} placeholder="CG-XXXXXXXXXXXX" required autoComplete="off"/>
   {rememberAvailable&&<label className="flex gap-3 items-center text-sm"><input type="checkbox" title="Mantém o acesso neste navegador por até 30 dias renováveis, respeitando a validade do seu acesso." checked={remember} onChange={e=>setRemember(e.target.checked)}/>Lembrar neste navegador</label>}
   <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 p-3 font-semibold text-black disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<KeyRound className="h-4 w-4"/>}{title==='Studio Mockup 3D'?'Entrar no Studio':'Entrar no editor'}</button>
  </form>{error&&<p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
  <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-neutral-400"><ShieldCheck className="h-5 w-5 shrink-0"/>Código pessoal vinculado a um navegador. A validade do acesso e os bloqueios continuam sendo verificados.</p>
  <a href={DISCOVERY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 p-3 text-sm text-orange-300"><MessageCircle className="h-4 w-4"/>Falar com o suporte</a>
 </div></div>;
 if(status==='checking'&&!hasOpened)return <div className="cg-access-status grid min-h-screen place-items-center"><p className="flex items-center gap-3"><Loader2 className="animate-spin"/>Verificando seu acesso…</p></div>;
 return <>
  {hasOpened&&<div inert={status!=='open'||networkBlocked} aria-hidden={status!=='open'||networkBlocked||undefined}>
   <div className="cg-access-bar flex flex-wrap items-center justify-between gap-2 bg-[#171411] px-4 py-2 text-xs text-white"><span><Crown className="mr-2 inline h-3 w-3 text-amber-400"/>{plan}{name&&` · ${name}`}{expiry&&` · até ${new Date(expiry).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}`}</span><span className="flex gap-4"><Link href="/bonus">Bônus gratuitos</Link><button onClick={()=>void logout()}>Sair</button></span></div>
   <StudioPresence enabled={monitoring&&status==='open'&&!networkBlocked&&plan!=='Admin Master'}/>{children}
  </div>}
  {status!=='open'&&(hasOpened?<div role="dialog" aria-modal="true" aria-label="Verificar acesso" className="fixed inset-0 z-[1000] overflow-auto bg-black/80" onKeyDownCapture={e=>e.stopPropagation()}>{login}</div>:login)}
  {status==='open'&&networkBlocked&&<div role="alertdialog" aria-modal="true" aria-label="Verificação de acesso indisponível" className="fixed inset-0 z-[1000] grid place-items-center bg-black/80 p-6" onKeyDownCapture={e=>e.stopPropagation()}><div className="max-w-md rounded-xl bg-neutral-900 p-6 text-white"><h2 className="font-bold">Não foi possível confirmar seu acesso</h2><p className="my-4">Seu trabalho permanece aberto. Reconecte para continuar.</p><button className="rounded bg-orange-500 p-3 text-black" onClick={()=>void check(true)}>Tentar novamente</button></div></div>}
 </>;
}
