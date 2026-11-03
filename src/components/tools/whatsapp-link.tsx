'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard, downloadBlob } from '@/lib/helpers';
import { useToolsStore } from '@/lib/tools-store';
import {
  MessageCircle, Copy, ExternalLink, QrCode, Link2, Wand2, CheckCircle2,
  XCircle, History, Trash2, Share2, FileCode2, Loader2, Sparkles,
} from 'lucide-react';

const COUNTRIES = [
  { ddi: '55', label: '🇧🇷 Brasil +55' },
  { ddi: '1', label: '🇺🇸 EUA/Canadá +1' },
  { ddi: '351', label: '🇵🇹 Portugal +351' },
  { ddi: '54', label: '🇦🇷 Argentina +54' },
  { ddi: '595', label: '🇵🇾 Paraguai +595' },
  { ddi: '598', label: '🇺🇾 Uruguai +598' },
  { ddi: '44', label: '🇬🇧 Reino Unido +44' },
  { ddi: '34', label: '🇪🇸 Espanha +34' },
];

const MSG_TEMPLATES = [
  { label: 'Saudação', text: 'Olá! Vim pelo seu link e gostaria de mais informações.' },
  { label: 'Orçamento', text: 'Olá! Gostaria de solicitar um orçamento.' },
  { label: 'Suporte', text: 'Olá! Preciso de ajuda com…' },
  { label: 'Pedido', text: 'Olá! Quero fazer um pedido:' },
];

interface SavedLink {
  slug: string;
  phone: string;
  message: string;
  shortUrl: string;
  createdAt: string;
}

export function WhatsAppLink() {
  const { toast } = useToast();
  const { setActiveTool } = useToolsStore();

  const [ddi, setDdi] = useState('55');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'invalid' | 'taken'>('idle');
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedLink[]>([]);

  // histórico local
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cg-wa-history');
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveHistory = (items: SavedLink[]) => {
    setHistory(items);
    try {
      localStorage.setItem('cg-wa-history', JSON.stringify(items.slice(0, 20)));
    } catch { /* ignore */ }
  };

  const digits = (s: string) => s.replace(/\D/g, '');

  const fullPhone = useMemo(() => (ddi === '55' ? digits(phone) : `${ddi}${digits(phone)}`), [ddi, phone]);

  const waUrl = useMemo(() => {
    if (!fullPhone || fullPhone.length < 8) return '';
    return `https://wa.me/${fullPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }, [fullPhone, message]);

  const phonePretty = useMemo(() => {
    const d = digits(phone);
    if (ddi === '55' && d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
    if (ddi === '55' && d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `+${ddi} ${d}`;
  }, [ddi, phone]);

  // verificação de slug com debounce
  useEffect(() => {
    const clean = slug.trim();
    if (!clean) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wl?slug=${encodeURIComponent(clean)}`);
        const json = await res.json();
        setSlugStatus(json.available ? 'ok' : json.error ? 'invalid' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [slug]);

  const createCustomLink = async () => {
    if (!waUrl || !fullPhone) {
      toast({ title: 'Informe um número válido primeiro', variant: 'destructive' });
      return;
    }
    if (slugStatus !== 'ok') {
      toast({ title: 'Escolha um nome personalizado disponível', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/wl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim(), phone: fullPhone, message, title: phonePretty }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao criar link');
      setCreatedUrl(json.shortUrl);
      saveHistory([{ slug: json.slug, phone: fullPhone, message, shortUrl: json.shortUrl, createdAt: new Date().toISOString() }, ...history]);
      toast({ title: '🎉 Link personalizado criado!', description: json.shortUrl });
    } catch (err) {
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const copy = async (text: string, label = 'Link copiado!') => {
    const ok = await copyToClipboard(text);
    toast({ title: ok ? label : 'Não foi possível copiar', variant: ok ? 'default' : 'destructive' });
  };

  const share = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Fale comigo no WhatsApp', url });
      } catch { /* cancelado */ }
    } else {
      copy(url);
    }
  };

  const downloadHtmlRedirect = () => {
    if (!waUrl) return;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${waUrl}">
<title>Redirecionando para o WhatsApp…</title>
<style>
  body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0908;color:#f3ede4;text-align:center}
  a{color:#e8703a;font-weight:600}
</style>
</head>
<body>
<div>
  <p style="font-size:20px;font-weight:600">Abrindo conversa no WhatsApp…</p>
  <p style="color:#a89c8e;margin:8px 0 16px">${phonePretty}</p>
  <a href="${waUrl}">Clique aqui se não for redirecionado</a>
</div>
<script>window.location.replace("${waUrl}");</script>
</body>
</html>`;
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `whatsapp-${slug.trim() || digits(phone) || 'link'}.html`);
    toast({ title: 'Arquivo HTML baixado!', description: 'Hospede em qualquer site (ex: Vercel, Netlify) para ter seu próprio link.' });
  };

  const removeHistory = (slugRemove: string) => {
    saveHistory(history.filter((h) => h.slug !== slugRemove));
  };

  const slugHint = {
    idle: '3-40 caracteres: letras, números, hífen ou underline',
    checking: 'Verificando disponibilidade…',
    ok: 'Nome disponível! 🎉',
    invalid: 'Nome inválido. Use apenas letras, números, - ou _',
    taken: 'Este nome já está em uso 😕',
  }[slugStatus];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {/* Formulário */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-whats/15 text-whats"><MessageCircle className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Dados da conversa</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div>
              <Label>País (DDI)</Label>
              <Select value={ddi} onValueChange={setDdi}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.ddi} value={c.ddi}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="wa-phone">WhatsApp (DDD + número)</Label>
              <Input
                id="wa-phone" inputMode="tel" placeholder="62 9 9999-8888" value={phone}
                onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="wa-msg">Mensagem pré-preenchida (opcional)</Label>
            <Textarea
              id="wa-msg" placeholder="Olá! Vim pelo seu link…" value={message}
              onChange={(e) => setMessage(e.target.value)} className="mt-1.5 min-h-24"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {MSG_TEMPLATES.map((t) => (
                <button
                  key={t.label} onClick={() => setMessage(t.text)}
                  className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs transition-all hover:border-whats/60 hover:bg-whats/10 active:scale-95"
                >
                  ✉️ {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Link personalizado */}
        <section className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="aurora -right-10 -top-16 h-40 w-40 bg-brand/30" aria-hidden />
          <div className="relative mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Wand2 className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Link personalizado com seu nome</h3>
            <Badge className="ml-auto border-primary/40 bg-primary/15 text-xs text-primary-foreground">Exclusivo</Badge>
          </div>

          <p className="relative mb-4 text-sm leading-relaxed text-muted-foreground">
            Em vez de compartilhar <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground/70">wa.me/5562999998888</span>,
            crie um link elegante com o nome que você quiser — <strong className="text-foreground">sem números na frente</strong>:
          </p>

          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-11 flex-1 items-center overflow-hidden rounded-lg border border-border bg-secondary/40 focus-within:border-primary/60">
              <span className="hidden shrink-0 border-r border-border bg-muted/60 px-3 py-3 font-mono text-xs text-muted-foreground sm:block">
                {typeof window !== 'undefined' ? window.location.host : 'seu-site'} /wl/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="minha-loja"
                className="h-11 flex-1 rounded-none border-0 bg-transparent font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {slugStatus === 'checking' && <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground" />}
              {slugStatus === 'ok' && <CheckCircle2 className="mr-3 h-4 w-4 text-whats" />}
              {(slugStatus === 'taken' || slugStatus === 'invalid') && <XCircle className="mr-3 h-4 w-4 text-destructive" />}
            </div>
            <Button
              onClick={createCustomLink}
              disabled={creating || slugStatus !== 'ok' || !fullPhone}
              className="h-11 gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Criar meu link
            </Button>
          </div>
          <p className={`relative mt-2 text-xs ${slugStatus === 'ok' ? 'text-whats' : slugStatus === 'taken' || slugStatus === 'invalid' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {slugHint}
          </p>

          {createdUrl && (
            <div className="relative mt-4 animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-whats/30 bg-whats/10 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-whats">
                <CheckCircle2 className="h-4 w-4" /> Seu link personalizado está pronto:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded bg-background/60 px-3 py-2 text-sm text-foreground">{createdUrl}</code>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => copy(createdUrl, 'Link personalizado copiado!')} className="h-9 gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(createdUrl, '_blank')} className="h-9 gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Testar
                  </Button>
                  <Button size="sm" onClick={() => setActiveTool('qr', createdUrl)} className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                    <QrCode className="h-3.5 w-3.5" /> QR
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Quem abrir esse link cai direto na sua conversa do WhatsApp — o número fica invisível.
              </p>
            </div>
          )}
        </section>

        {/* Histórico */}
        {history.length > 0 && (
          <section className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display text-base font-semibold">Seus links criados neste dispositivo</h3>
              <Badge variant="secondary" className="ml-auto">{history.length}</Badge>
            </div>
            <div className="thin-scroll max-h-64 space-y-2 overflow-y-auto pr-1">
              {history.map((h) => (
                <div key={h.slug} className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 transition-colors hover:border-primary/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-foreground">/{h.slug}</p>
                    <p className="text-[11px] text-muted-foreground">{h.shortUrl}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(h.shortUrl)} className="h-8 w-8 p-0"><Copy className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(h.shortUrl, '_blank')} className="h-8 w-8 p-0"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => removeHistory(h.slug)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Preview lateral */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <h3 className="font-display mb-4 text-lg font-semibold">Link padrão gerado</h3>

          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Pré-visualização</p>
            <div className="break-all rounded-lg bg-background/70 p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
              {waUrl || 'Informe um número válido…'}
            </div>
            {phonePretty && waUrl && (
              <p className="mt-2 text-xs text-muted-foreground">Contato: <span className="text-foreground">{phonePretty}</span></p>
            )}
          </div>

          <Separator className="my-5" />

          <div className="space-y-2">
            <Button
              onClick={() => copy(waUrl)}
              disabled={!waUrl}
              className="w-full gap-2 bg-whats font-medium text-white transition-transform hover:bg-whats/90 active:scale-[0.98]"
            >
              <Copy className="h-4 w-4" /> Copiar link do WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!waUrl} onClick={() => window.open(waUrl, '_blank')} className="gap-2">
                <ExternalLink className="h-4 w-4" /> Abrir conversa
              </Button>
              <Button variant="outline" disabled={!waUrl} onClick={() => share(waUrl)} className="gap-2">
                <Share2 className="h-4 w-4" /> Compartilhar
              </Button>
              <Button variant="outline" disabled={!waUrl} onClick={() => setActiveTool('qr', waUrl)} className="gap-2 text-primary hover:bg-primary/10">
                <QrCode className="h-4 w-4" /> Gerar QR Code
              </Button>
              <Button variant="outline" disabled={!waUrl} onClick={downloadHtmlRedirect} className="gap-2">
                <FileCode2 className="h-4 w-4" /> Baixar HTML
              </Button>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Como funciona o link personalizado:</strong> criamos um endereço curto com o nome que você escolher.
                Ao abrir, o visitante é levado automaticamente para sua conversa — profissional e fácil de memorizar.
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
