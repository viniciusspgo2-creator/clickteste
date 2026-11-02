"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Crown,
  KeyRound,
  Loader2,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { LIBRARY_URL, DISCOVERY_SUPPORT_URL } from "@/lib/studio-links";
const SESSION = "cg_studio_session";
function readSession() {
  try {
    return sessionStorage.getItem(SESSION);
  } catch {
    return null;
  }
}
const ERRORS: Record<string, string> = {
  invalid: "Código inválido ou revogado. Confira o código com o suporte.",
  expired: "Seu acesso expirou. Fale com o suporte para renovar.",
  browser:
    "Este código já está vinculado a outro navegador. Solicite a troca ao suporte.",
  full: "O código universal atingiu o limite de usuários autorizados. Solicite ao suporte uma nova vaga ou outro código.",
  session:
    "Sua sessão foi encerrada ou substituída por outro acesso. Entre novamente.",
  rate: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  network:
    "Não foi possível verificar seu acesso. Confira sua conexão e tente novamente.",
};
export function PremiumGate({ children, title = "Studio Mockup 3D", backHref = "/" }: { children: React.ReactNode; title?: string; backHref?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "locked" | "open">(
    "checking",
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("Premium");
  const [name, setName] = useState("");
  const check = useCallback(async (claim = false) => {
    let token: string | null = null;
    try {
      token = readSession();
      const response = await fetch("/api/access/session", {
        method: claim && token ? "POST" : "GET",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (readSession() !== token) return;
      if (!response.ok) throw new Error("network");
      if (data.ok) {
        if (data.sessionToken)
          sessionStorage.setItem(SESSION, data.sessionToken);
        setPlan(data.plan);
        setName(data.clientName || "");
        setStatus("open");
      } else {
        if (token) setError(ERRORS[data.reason] || ERRORS.session);
        sessionStorage.removeItem(SESSION);
        setStatus("locked");
      }
    } catch {
      if (readSession() === token) {
        setError(ERRORS.network);
        setStatus("locked");
      }
    }
  }, []);
  useEffect(() => {
    void check(true);
    const timer = setInterval(() => {
      void check();
    }, 15000);
    const focus = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", focus);
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", focus);
      window.removeEventListener("focus", focus);
    };
  }, [check]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/access/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(ERRORS[data.reason] || ERRORS.network);
        return;
      }
      sessionStorage.setItem(SESSION, data.sessionToken);
      setCode("");
      setPlan(data.plan);
      setName(data.clientName || "");
      setStatus("open");
    } catch {
      setError(ERRORS.network);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    if (plan === "Admin Master") {
      router.push("/");
      return;
    }
    const token = readSession();
    sessionStorage.removeItem(SESSION);
    setStatus("locked");
    if (token)
      await fetch("/api/access/session", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
  };
  if (status === "checking")
    return (
      <div className="cg-access-status grid min-h-screen place-items-center">
        <p className="flex items-center gap-3">
          <Loader2 className="animate-spin" />
          Verificando seu acesso…
        </p>
      </div>
    );
  if (status === "open")
    return (
      <>
        <div className="cg-access-bar flex flex-wrap items-center justify-between gap-2 bg-[#171411] px-4 py-2 text-xs text-white">
          <span>
            <Crown className="mr-2 inline h-3 w-3 text-amber-400" />
            {plan}
            {name && ` · ${name}`}
          </span>
          <span className="flex gap-4">
            <Link href="/bonus">Bônus gratuitos</Link>
            <button onClick={logout}>Sair</button>
          </span>
        </div>
        {children}
      </>
    );
  return (
    <div className="cg-access-login grid min-h-[80vh] place-items-center bg-[#0c0d0e] px-5 py-12 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#161719] p-7 sm:p-10">
        <Link href={backHref} className="text-sm text-neutral-400">
          ← Conhecer {title}
        </Link>
        <Crown className="mb-4 mt-8 h-9 w-9 text-amber-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Exclusivo para assinantes
        </p>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        <p className="mt-4 leading-relaxed text-neutral-300">
          {title === "Studio Mockup 3D" ? "O Studio está" : "O Mockup de Cenários está"} incluso para assinantes da{" "}
          <a
            href={LIBRARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Biblioteca de Artes Click & Gruda
          </a>
          . Por <strong className="text-white">R$ 47,90</strong>, você adquire a
          Biblioteca com acesso vitalício: milhares de artes para canecas,
          atualizações e organização por categorias e datas sazonais.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-3">
          <label htmlFor="premium-code" className="block text-sm">
            Seu código de acesso
          </label>
          <input
            id="premium-code"
            className="w-full rounded-xl border border-white/20 bg-black/30 p-3 font-mono uppercase outline-none focus:border-orange-400"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={32}
            placeholder="CG-XXXXXXXXXXXX"
            required
            autoComplete="off"
          />
          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 p-3 font-semibold text-black disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {title === "Studio Mockup 3D" ? "Entrar no Studio" : "Entrar no editor"}
          </button>
        </form>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-neutral-400">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          Código pessoal, vinculado a um navegador. Um novo login encerra a
          sessão anterior em até 15 segundos. Para trocar de navegador, fale com
          o suporte.
        </p>
        <a
          href={DISCOVERY_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 p-3 text-sm text-orange-300"
        >
          <MessageCircle className="h-4 w-4" />
          Quero conhecer antes · WhatsApp
        </a>
        <p className="mt-3 text-center text-xs text-neutral-500">
          Já tem a Biblioteca? Peça seu código pessoal ao suporte.
        </p>
      </div>
    </div>
  );
}
