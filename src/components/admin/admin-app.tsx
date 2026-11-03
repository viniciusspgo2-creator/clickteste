"use client";
import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowRight, BarChart3, Check, ChevronRight, ExternalLink, Eye, EyeOff, KeyRound, LayoutDashboard, Image as ImageIcon, Loader2, LockKeyhole, LogOut, RefreshCw, LibraryBig, Settings, ShieldCheck, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CodesPanel } from "./codes-panel";
import { AdminDashboard } from "./dashboard";
import { AnnouncementsPanel } from "./announcements-panel";
import { ScenesPanel } from "./scenes-panel";
import { CreativeAssetsPanel } from "./creative-assets-panel";
import "./creative-assets.css";
import "./admin.css";
import { MOCKUP_SCENES_ENABLED } from "@/lib/features";
interface SeoForm { siteName:string; defaultTitle:string; titleTemplate:string; description:string; keywords:string; siteUrl:string; ogImage:string; twitterCreator:string; gaId:string }
type Tab='overview'|'codigos'|'visitas'|'cenarios'|'criativo'|'config'|'comunicados';
const inputCls='w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-orange-400/60';
const allTabs=[{id:'comunicados',label:'Comunicados',icon:Sparkles,description:'Avisos úteis, no momento certo.'},{id:'overview',label:'Visão geral',icon:LayoutDashboard,description:'O essencial, sem perder os detalhes.'},{id:'codigos',label:'Códigos de acesso',icon:KeyRound,description:'Organize clientes e libere novas possibilidades.'},{id:'visitas',label:'Análise de tráfego',icon:BarChart3,description:'Transforme a navegação em informação.'},{id:'criativo',label:'Biblioteca Criativa',icon:LibraryBig,description:'Templates, fontes, elementos e animações para os novos editores.'},{id:'cenarios',label:'Mockup de Cenários',icon:ImageIcon,description:'Cenários sazonais e modelos estáticos, bem organizados.'},{id:'config',label:'Configurações',icon:Settings,description:'A identidade e a segurança da sua plataforma.'}]as const;
const tabs=allTabs.filter(item=>item.id!=="cenarios"||MOCKUP_SCENES_ENABLED);
export function AdminApp(){
 const [authed,setAuthed]=useState<boolean|null>(null),[password,setPassword]=useState(''),[showPw,setShowPw]=useState(false),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState(''),[tab,setTab]=useState<Tab>('overview'),[refresh,setRefresh]=useState(0);
 const expire=useCallback(()=>setAuthed(false),[]);
 useEffect(()=>{const abort=new AbortController();fetch('/api/admin/login',{cache:'no-store',signal:abort.signal}).then(r=>r.json()).then(d=>setAuthed(d.authed===true)).catch(()=>{if(!abort.signal.aborted)setAuthed(false)});return()=>abort.abort()},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(!password||loginBusy)return;setLoginBusy(true);setLoginError('');try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}),d=await r.json();if(r.ok&&d.ok)setAuthed(true);else setLoginError(d.error||'Não foi possível entrar.')}catch{setLoginError('Falha de conexão. Tente novamente.')}finally{setLoginBusy(false);setPassword('')}}
 async function logout(){try{const r=await fetch('/api/admin/login',{method:'DELETE'});if(!r.ok)throw new Error();setAuthed(false)}catch{setLoginError('Não foi possível encerrar a sessão. Tente novamente.')}}
 if(authed===null)return <div className="cg-admin ad-session-loading"><Loader2 className="ad-spin"/><span>Preparando sua central…</span></div>;
 if(!authed)return <div className="cg-admin ad-login"><div className="ad-login-art"><a className="ad-wordmark" href="/"><img src="/cg-home/logo-clickgruda.webp" width="158" height="40" alt="Click & Gruda"/><span>PAINEL DE CONTROLE</span></a><div className="ad-login-copy"><span className="ad-eyebrow">SEU TRABALHO MERECE UMA BOA VISÃO</span><h1>Crie possibilidades.<br/><em>Cuide de cada acesso.</em></h1><p>Acompanhe o movimento da plataforma, organize seus clientes e deixe a operação fluir.</p><div className="ad-login-orbit" aria-hidden="true"><span/><i><KeyRound size={42}/></i><b><ShieldCheck size={25}/></b><small><Activity size={23}/></small></div></div><span className="ad-login-foot">CLICK & GRUDA · STUDIO MOCKUP 3D</span></div><div className="ad-login-side"><form className="ad-login-card" onSubmit={login}><span className="ad-login-icon"><LockKeyhole size={25}/></span><span className="ad-eyebrow">ACESSO RESTRITO</span><h2>Bem-vindo à sua central.</h2><p>Entre com sua senha administrativa para continuar.</p><label htmlFor="admin-password">Senha do painel</label><div className="ad-password"><input id="admin-password" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" autoFocus placeholder="Digite sua senha"/><button type="button" aria-label={showPw?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowPw(!showPw)}>{showPw?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{loginError&&<div className="ad-error-banner" role="alert">{loginError}</div>}<button className="ad-primary" disabled={loginBusy||!password}>{loginBusy?<Loader2 className="ad-spin" size={17}/>:<ArrowRight size={17}/>}Entrar no painel</button><span className="ad-login-security"><ShieldCheck size={14}/>Sessão protegida e acesso administrativo.</span><a href="/">← Voltar para o site</a></form></div></div>;
 const current=tabs.find(item=>item.id===tab)??tabs[0];
 return <div className="cg-admin ad-shell"><aside className="ad-sidebar"><a href="/" className="ad-wordmark"><img src="/cg-home/logo-clickgruda.webp" width="150" height="38" alt="Click & Gruda"/><span>CONTROL CENTER</span></a><div className="ad-workspace-badge"><span className="ad-workspace-icon"><Sparkles size={18}/></span><div><strong>Click & Gruda</strong><span>Área administrativa</span></div><i/></div><span className="ad-nav-label">VISÃO & OPERAÇÃO</span><nav aria-label="Seções administrativas">{tabs.map(item=><button key={item.id} aria-current={tab===item.id?'page':undefined} onClick={()=>setTab(item.id)}><item.icon size={18}/><span>{item.label}</span>{tab===item.id&&<ChevronRight size={14}/>}</button>)}</nav><div className="ad-sidebar-bottom"><a href="/mockup-caneca-3d/studio"><ExternalLink size={16}/>Abrir Studio 3D</a>{MOCKUP_SCENES_ENABLED&&<a href="/mockup-cenarios/editor"><ExternalLink size={16}/>Abrir Mockup de Cenários</a>}<a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>Visitar o site</a><div className="ad-secure-card"><ShieldCheck size={19}/><div><strong>Acesso administrativo</strong><p>Códigos e dados protegidos pela sua sessão.</p></div></div><button onClick={logout}><LogOut size={16}/>Encerrar sessão</button></div></aside>
 <div className="ad-main"><header className="ad-main-header"><div><span className="ad-breadcrumb">Admin<ChevronRight size={12}/>{current.label}</span><strong>{current.description}</strong></div><div className="ad-header-actions"><button className="ad-icon-button" aria-label="Atualizar dados do painel" onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={18}/></button><button className="ad-icon-button" aria-label="Encerrar sessão administrativa" onClick={logout}><LogOut size={17}/></button><span className="ad-header-divider"/><div className="ad-admin-profile"><span>CG</span><div><strong>Administrador</strong><small>Sessão protegida</small></div></div></div></header><main className="ad-main-content">{loginError&&<p className="ad-error-banner" role="alert">{loginError}</p>}{tab==='comunicados'&&<AnnouncementsPanel refreshKey={refresh} onUnauthorized={expire}/>} {tab==='overview'&&<AdminDashboard refreshKey={refresh} onNavigate={()=>setTab('codigos')} onUnauthorized={expire}/>} {tab==='visitas'&&<AdminDashboard refreshKey={refresh} trafficOnly onNavigate={()=>setTab('codigos')} onUnauthorized={expire}/>} {tab==='codigos'&&<CodesPanel refreshKey={refresh} onUnauthorized={expire}/>} {tab==='criativo'&&<CreativeAssetsPanel onUnauthorized={expire}/>} {MOCKUP_SCENES_ENABLED&&tab==='cenarios'&&<ScenesPanel refreshKey={refresh} onUnauthorized={expire}/>} {tab==='config'&&<div className="ad-config" key={refresh}><div className="ad-page-intro"><div><span className="ad-eyebrow">IDENTIDADE & SEGURANÇA</span><h1>Os detalhes que sustentam o todo.</h1><p>Atualize a apresentação nos buscadores e mantenha seu acesso seguro.</p></div></div><ConfigTab onLogout={expire}/></div>}</main><footer className="ad-footer"><span>Click & Gruda · Central administrativa</span><span>Dados reais. Decisões mais claras.</span></footer></div></div>;
}

function ConfigTab({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<SeoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/seo")
      .then((r) => r.json())
      .then(
        (d: {
          ok: boolean;
          seo?: Omit<SeoForm, "keywords"> & { keywords: string[] };
        }) => {
          if (d.ok && d.seo) setForm({ ...d.seo, keywords: d.seo.keywords.join(", ") });
          else setConfigError(true);
        },
      ).catch(() => setConfigError(true));
  }, []);

  const saveSeo = async () => {
    if (!form || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          keywords: form.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      toast(
        data.ok
          ? {
              title: "SEO salvo!",
              description:
                "Título, descrição e sitemap já usam os novos valores.",
            }
          : { title: data.error ?? "Falha ao salvar", variant: "destructive" },
      );
    } catch {
      toast({ title: "Falha de conexão ao salvar as configurações", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    if (pwBusy) return;
    if (next !== confirm) {
      toast({ title: "As senhas novas não coincidem", variant: "destructive" });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        toast({
          title: "Senha alterada!",
          description: "Use a nova senha no próximo login.",
        });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        toast({
          title: data.error ?? "Falha ao alterar",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Falha de conexão ao alterar a senha", variant: "destructive" });
    } finally {
      setPwBusy(false);
    }
  };

  if (configError) return <div className="ad-state ad-error" role="alert"><h2>Configurações indisponíveis</h2><p>Confira a conexão ou entre novamente. Use Atualizar dados do painel para tentar outra vez.</p></div>;
  if (!form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const set =
    (k: keyof SeoForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl border border-white/10 bg-[#131010] p-5"
        aria-label="Configuração de SEO"
      >
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <Settings className="h-4 w-4 text-primary" /> Configuração de SEO
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Esses valores alimentam o título, a descrição, as palavras-chave, o
          Open Graph, o sitemap.xml e o robots.txt do site — em tempo real.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="s-name"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Nome do site
            </label>
            <input
              id="s-name"
              value={form.siteName}
              onChange={set("siteName")}
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="s-url"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              URL do site (canônica)
            </label>
            <input
              id="s-url"
              value={form.siteUrl}
              onChange={set("siteUrl")}
              placeholder="https://seusite.com.br"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="s-title"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Título padrão (home)
            </label>
            <input
              id="s-title"
              value={form.defaultTitle}
              onChange={set("defaultTitle")}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="s-tpl"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Template de título das páginas (%s = título)
            </label>
            <input
              id="s-tpl"
              value={form.titleTemplate}
              onChange={set("titleTemplate")}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="s-desc"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Descrição do site (aparece no Google)
            </label>
            <textarea
              id="s-desc"
              value={form.description}
              onChange={set("description")}
              rows={2}
              maxLength={300}
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-neutral-600">
              {form.description.length}/300 — ideal: até 160
            </p>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="s-kw"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Palavras-chave (separadas por vírgula)
            </label>
            <textarea
              id="s-kw"
              value={form.keywords}
              onChange={set("keywords")}
              rows={2}
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="s-og"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Imagem de compartilhamento (OG)
            </label>
            <input
              id="s-og"
              value={form.ogImage}
              onChange={set("ogImage")}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="s-tw"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
              >
                Twitter/X @
              </label>
              <input
                id="s-tw"
                value={form.twitterCreator}
                onChange={set("twitterCreator")}
                placeholder="@suaMarca"
                className={inputCls}
              />
            </div>
            <div>
              <label
                htmlFor="s-ga"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-500"
              >
                Google Analytics ID
              </label>
              <input
                id="s-ga"
                value={form.gaId}
                onChange={set("gaId")}
                placeholder="G-XXXXXXX"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <button
          onClick={saveSeo}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Salvar SEO
        </button>
      </section>

      {/* senha */}
      <section
        className="rounded-2xl border border-white/10 bg-[#131010] p-5"
        aria-label="Alterar senha"
      >
        <h2 className="font-display flex items-center gap-2 text-sm font-bold text-white">
          <KeyRound className="h-4 w-4 text-primary" /> Senha do painel
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Troque a senha periodicamente. A nova senha é validada no próximo
          login (a sessão atual continua válida).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Senha atual"
            className={inputCls}
            autoComplete="current-password"
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Nova senha (mín. 6)"
            className={inputCls}
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmar nova senha"
            className={inputCls}
            autoComplete="new-password"
          />
        </div>
        <button
          onClick={changePw}
          disabled={pwBusy || !current || !next}
          className="mt-4 flex items-center gap-2 rounded-xl border border-primary/50 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-40"
        >
          {pwBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Alterar senha
        </button>
      </section>

      {/* encerrar sessão */}
      <section
        className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-5"
        aria-label="Encerrar sessão"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-white">
              Encerrar sessão neste navegador
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              A sessão expira sozinha em 12 horas.
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              onLogout();
            }}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10"
          >
            <X className="h-3.5 w-3.5" /> Sair agora
          </button>
        </div>
      </section>
    </div>
  );
}
