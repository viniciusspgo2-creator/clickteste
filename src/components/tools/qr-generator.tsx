'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCodeStyling, { type Options } from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard, buildPixPayload } from '@/lib/helpers';
import { useToolsStore } from '@/lib/tools-store';
import {
  Link2, Type, MessageCircle, QrCode, Wifi, IdCard, Mail, MessageSquare,
  Phone, Download, Copy, ImagePlus, Palette, Settings2, Trash2,
  Sparkles, RefreshCcw,
} from 'lucide-react';

type ContentTab = 'url' | 'texto' | 'whatsapp' | 'pix' | 'wifi' | 'vcard' | 'email' | 'sms' | 'tel';

const DOT_TYPES = [
  { value: 'square', label: 'Quadrado' },
  { value: 'dots', label: 'Bolinhas' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'classy', label: 'Clássico' },
  { value: 'classy-3', label: 'Clássico 3' },
  { value: 'extra-rounded', label: 'Super Suave' },
] as const;

const CORNER_SQUARE_TYPES = [
  { value: 'square', label: 'Quadrado' },
  { value: 'dot', label: 'Círculo' },
  { value: 'extra-rounded', label: 'Suave' },
] as const;

const CORNER_DOT_TYPES = [
  { value: 'square', label: 'Quadrado' },
  { value: 'dot', label: 'Círculo' },
] as const;

const PRESETS = [
  { name: 'Laranja C&G', dots: '#e8703a', dots2: '#ffab7e', bg: '#ffffff', dot: 'rounded', corner: 'extra-rounded', cornerDot: 'dot' },
  { name: 'Dourado', dots: '#b8860b', dots2: '#ffd700', bg: '#fffdf5', dot: 'extra-rounded', corner: 'dot', cornerDot: 'dot' },
  { name: 'Floresta', dots: '#166534', dots2: '#4ade80', bg: '#f7fef9', dot: 'dots', corner: 'extra-rounded', cornerDot: 'dot' },
  { name: 'Grafite', dots: '#111111', dots2: '#555555', bg: '#ffffff', dot: 'square', corner: 'square', cornerDot: 'square' },
  { name: 'Cereja', dots: '#9f1239', dots2: '#fb7185', bg: '#fff5f7', dot: 'classy', corner: 'extra-rounded', cornerDot: 'dot' },
  { name: 'Noite', dots: '#f3ede4', dots2: '#e8703a', bg: '#0a0908', dot: 'extra-rounded', corner: 'extra-rounded', cornerDot: 'dot' },
] as const;

const EC_LEVELS = [
  { value: 'L', label: 'Baixa (7%) — mais leve' },
  { value: 'M', label: 'Média (15%) — recomendada' },
  { value: 'Q', label: 'Alta (25%)' },
  { value: 'H', label: 'Máxima (30%) — ideal c/ logo' },
] as const;

interface ContentState {
  url: string;
  texto: string;
  waPhone: string;
  waMessage: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
  pixAmount: string;
  pixTxid: string;
  pixDesc: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: string;
  wifiHidden: boolean;
  vName: string;
  vOrg: string;
  vTitle: string;
  vPhone: string;
  vEmail: string;
  vSite: string;
  vAddress: string;
  mailTo: string;
  mailSubject: string;
  mailBody: string;
  smsTo: string;
  smsMsg: string;
  telTo: string;
}

const INITIAL_CONTENT: ContentState = {
  url: 'https://',
  texto: '',
  waPhone: '', waMessage: '',
  pixKey: '', pixName: '', pixCity: '', pixAmount: '', pixTxid: '', pixDesc: '',
  wifiSsid: '', wifiPassword: '', wifiEncryption: 'WPA', wifiHidden: false,
  vName: '', vOrg: '', vTitle: '', vPhone: '', vEmail: '', vSite: '', vAddress: '',
  mailTo: '', mailSubject: '', mailBody: '',
  smsTo: '', smsMsg: '',
  telTo: '',
};

export function QrGenerator() {
  const { qrSeed, setActiveTool } = useToolsStore();
  const { toast } = useToast();

  const [tab, setTab] = useState<ContentTab>('url');
  const [content, setContent] = useState<ContentState>(INITIAL_CONTENT);

  const [dotType, setDotType] = useState<string>('extra-rounded');
  const [cornerSquareType, setCornerSquareType] = useState<string>('extra-rounded');
  const [cornerDotType, setCornerDotType] = useState<string>('dot');
  const [useGradient, setUseGradient] = useState(true);
  const [color1, setColor1] = useState('#e8703a');
  const [color2, setColor2] = useState('#ffab7e');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTransparent, setBgTransparent] = useState(false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientRotation, setGradientRotation] = useState(0);
  const [ecLevel, setEcLevel] = useState<string>('Q');
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(16);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoSize, setLogoSize] = useState(0.4);
  const [logoMargin, setLogoMargin] = useState(6);
  const [hideBgDots, setHideBgDots] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [ready, setReady] = useState(false);
  void ready;

  // Pré-preenchimento vindo da ferramenta WhatsApp
  useEffect(() => {
    if (qrSeed) {
      setTab('url');
      setContent((c) => ({ ...c, url: qrSeed }));
      setActiveTool('qr'); // limpa seed
    }
     
  }, [qrSeed]);

  const digits = (s: string) => s.replace(/\D/g, '');

  const data = useMemo((): string => {
    switch (tab) {
      case 'url': {
        const u = content.url.trim();
        if (!u || u === 'https://') return '';
        return /^https?:\/\//i.test(u) ? u : `https://${u}`;
      }
      case 'texto':
        return content.texto;
      case 'whatsapp': {
        const p = digits(content.waPhone);
        if (!p) return '';
        const msg = content.waMessage ? `?text=${encodeURIComponent(content.waMessage)}` : '';
        return `https://wa.me/${p}${msg}`;
      }
      case 'pix': {
        if (!content.pixKey || !content.pixName || !content.pixCity) return '';
        try {
          return buildPixPayload({
            key: digits(content.pixKey) || content.pixKey.trim(),
            merchantName: content.pixName,
            city: content.pixCity,
            amount: content.pixAmount ? parseFloat(content.pixAmount.replace(',', '.')) : undefined,
            txid: content.pixTxid,
            description: content.pixDesc,
          });
        } catch {
          return '';
        }
      }
      case 'wifi': {
        if (!content.wifiSsid) return '';
        const enc = content.wifiEncryption === 'nopass' ? 'nopass' : content.wifiEncryption;
        const pass = enc !== 'nopass' ? `P:${content.wifiPassword};` : '';
        const hidden = content.wifiHidden ? 'H:true;' : '';
        return `WIFI:T:${enc};S:${content.wifiSsid};${pass}${hidden};`;
      }
      case 'vcard': {
        if (!content.vName) return '';
        return [
          'BEGIN:VCARD', 'VERSION:3.0',
          `FN:${content.vName}`,
          content.vOrg && `ORG:${content.vOrg}`,
          content.vTitle && `TITLE:${content.vTitle}`,
          content.vPhone && `TEL;TYPE=CELL:${content.vPhone}`,
          content.vEmail && `EMAIL:${content.vEmail}`,
          content.vSite && `URL:${content.vSite}`,
          content.vAddress && `ADR:;;${content.vAddress}`,
          'END:VCARD',
        ].filter(Boolean).join('\n');
      }
      case 'email': {
        if (!content.mailTo) return '';
        const q: string[] = [];
        if (content.mailSubject) q.push(`subject=${encodeURIComponent(content.mailSubject)}`);
        if (content.mailBody) q.push(`body=${encodeURIComponent(content.mailBody)}`);
        return `mailto:${content.mailTo}${q.length ? `?${q.join('&')}` : ''}`;
      }
      case 'sms':
        return content.smsTo ? `SMSTO:${digits(content.smsTo)}:${content.smsMsg}` : '';
      case 'tel':
        return content.telTo ? `tel:${digits(content.telTo)}` : '';
    }
  }, [tab, content]);

  const options = useMemo<Options>(() => ({
    width: size,
    height: size,
    type: 'canvas',
    data: data || 'https://clickgruda.vercel.app',
    image: logoUrl,
    margin,
    qrOptions: { errorCorrectionLevel: ecLevel as 'L' | 'M' | 'Q' | 'H' },
    dotsOptions: {
      type: dotType as NonNullable<Options['dotsOptions']>['type'],
      ...(useGradient
        ? {
            gradient: {
              type: gradientType,
              rotation: (gradientRotation * Math.PI) / 180,
              colorStops: [
                { offset: 0, color: color1 },
                { offset: 1, color: color2 },
              ],
            },
          }
        : { color: color1 }),
    },
    cornersSquareOptions: {
      type: cornerSquareType as NonNullable<Options['cornersSquareOptions']>['type'],
      color: color1,
    },
    cornersDotOptions: {
      type: cornerDotType as NonNullable<Options['cornersDotOptions']>['type'],
      color: color1,
    },
    backgroundOptions: { color: bgTransparent ? 'rgba(0,0,0,0)' : bgColor },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: logoMargin,
      imageSize: logoSize as 0.1 | 0.2 | 0.3 | 0.4 | 0.5,
      hideBackgroundDots: hideBgDots,
    },
  }), [data, size, margin, ecLevel, dotType, useGradient, gradientType, gradientRotation,
       color1, color2, cornerSquareType, cornerDotType, bgColor, bgTransparent,
       logoUrl, logoMargin, logoSize, hideBgDots]);

  // Inicializa uma única vez
  useEffect(() => {
    if (containerRef.current && !qrRef.current) {
      qrRef.current = new QRCodeStyling(options);
      qrRef.current.append(containerRef.current);
      setReady(true);
    }
     
  }, []);

  // Atualiza em qualquer mudança de opção
  useEffect(() => {
    qrRef.current?.update(options);
  }, [options]);

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Envie uma imagem (PNG, JPG, SVG…)', variant: 'destructive' });
      return;
    }
    setLogoFile(f);
    setLogoUrl(URL.createObjectURL(f));
    if (ecLevel !== 'H') setEcLevel('H'); // logo pede correção máxima
    toast({ title: 'Logo adicionado!', description: 'Correção de erros ajustada para Máxima automaticamente.' });
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoUrl(undefined);
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setColor1(p.dots);
    setColor2(p.dots2);
    setBgColor(p.bg);
    setDotType(p.dot);
    setCornerSquareType(p.corner);
    setCornerDotType(p.cornerDot);
    setUseGradient(true);
    setBgTransparent(false);
    toast({ title: `Tema "${p.name}" aplicado` });
  };

  const download = async (ext: 'png' | 'jpeg' | 'webp' | 'svg') => {
    if (!data) {
      toast({ title: 'Preencha o conteúdo primeiro', variant: 'destructive' });
      return;
    }
    try {
      await qrRef.current?.download({ name: 'qr-code-clickgruda', extension: ext });
      toast({ title: 'Download iniciado!', description: `Arquivo .${ext.toUpperCase()} salvo.` });
    } catch {
      toast({ title: 'Falha ao baixar', variant: 'destructive' });
    }
  };

  const copyData = async () => {
    if (!data) return;
    const ok = await copyToClipboard(data);
    toast({ title: ok ? 'Conteúdo copiado!' : 'Não foi possível copiar', variant: ok ? 'default' : 'destructive' });
  };

  const hasContent = Boolean(data);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      {/* ============ Coluna esquerda: configuração ============ */}
      <div className="space-y-6">
        {/* Conteúdo */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><QrCode className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Conteúdo do QR Code</h3>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as ContentTab)}>
            <TabsList className="mb-4 grid h-auto w-full grid-cols-3 flex-wrap gap-1 bg-muted/60 sm:grid-cols-5 lg:grid-cols-9">
              {([
                ['url', Link2, 'URL'],
                ['texto', Type, 'Texto'],
                ['whatsapp', MessageCircle, 'Zap'],
                ['pix', QrCode, 'PIX'],
                ['wifi', Wifi, 'Wi-Fi'],
                ['vcard', IdCard, 'vCard'],
                ['email', Mail, 'E-mail'],
                ['sms', MessageSquare, 'SMS'],
                ['tel', Phone, 'Tel'],
              ] as const).map(([id, Icon, label]) => (
                <TabsTrigger key={id} value={id} className="flex h-9 flex-col gap-0.5 px-2 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="url" className="space-y-3">
              <Label htmlFor="qr-url">Endereço do site</Label>
              <Input id="qr-url" placeholder="https://seusite.com.br" value={content.url} onChange={(e) => setContent({ ...content, url: e.target.value })} className="h-11" />
            </TabsContent>

            <TabsContent value="texto" className="space-y-3">
              <Label htmlFor="qr-text">Texto livre</Label>
              <Textarea id="qr-text" placeholder="Digite qualquer texto…" value={content.texto} onChange={(e) => setContent({ ...content, texto: e.target.value })} className="min-h-28" />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-3">
              <div>
                <Label htmlFor="qr-wa">Número com DDD (só números)</Label>
                <Input id="qr-wa" inputMode="tel" placeholder="62999998888" value={content.waPhone} onChange={(e) => setContent({ ...content, waPhone: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="qr-wa-msg">Mensagem pré-preenchida (opcional)</Label>
                <Textarea id="qr-wa-msg" placeholder="Olá! Vim pelo QR Code…" value={content.waMessage} onChange={(e) => setContent({ ...content, waMessage: e.target.value })} className="min-h-20" />
              </div>
            </TabsContent>

            <TabsContent value="pix" className="space-y-3">
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
                QR Code PIX estático (BR Code). Funciona com CPF, CNPJ, e-mail, telefone ou chave aleatória. Dica: cole o telefone com DDI + DDD.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pix-key">Chave PIX</Label>
                  <Input id="pix-key" placeholder="CPF/CNPJ/e-mail/telefone" value={content.pixKey} onChange={(e) => setContent({ ...content, pixKey: e.target.value })} className="h-11" />
                </div>
                <div>
                  <Label htmlFor="pix-amount">Valor (R$, opcional)</Label>
                  <Input id="pix-amount" inputMode="decimal" placeholder="0,00" value={content.pixAmount} onChange={(e) => setContent({ ...content, pixAmount: e.target.value })} className="h-11" />
                </div>
                <div>
                  <Label htmlFor="pix-name">Nome do recebedor</Label>
                  <Input id="pix-name" placeholder="NOME COMPLETO" value={content.pixName} onChange={(e) => setContent({ ...content, pixName: e.target.value })} className="h-11" />
                </div>
                <div>
                  <Label htmlFor="pix-city">Cidade</Label>
                  <Input id="pix-city" placeholder="GOIANIA" value={content.pixCity} onChange={(e) => setContent({ ...content, pixCity: e.target.value })} className="h-11" />
                </div>
                <div>
                  <Label htmlFor="pix-txid">Identificador/TXID (opcional)</Label>
                  <Input id="pix-txid" placeholder="PEDIDO123" value={content.pixTxid} onChange={(e) => setContent({ ...content, pixTxid: e.target.value })} className="h-11" />
                </div>
                <div>
                  <Label htmlFor="pix-desc">Descrição (opcional)</Label>
                  <Input id="pix-desc" placeholder="Pagamento pedido #123" value={content.pixDesc} onChange={(e) => setContent({ ...content, pixDesc: e.target.value })} className="h-11" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wifi" className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="wifi-ssid">Nome da rede (SSID)</Label>
                <Input id="wifi-ssid" value={content.wifiSsid} onChange={(e) => setContent({ ...content, wifiSsid: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="wifi-enc">Segurança</Label>
                <Select value={content.wifiEncryption} onValueChange={(v) => setContent({ ...content, wifiEncryption: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">Rede aberta (sem senha)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {content.wifiEncryption !== 'nopass' && (
                <div>
                  <Label htmlFor="wifi-pass">Senha</Label>
                  <Input id="wifi-pass" value={content.wifiPassword} onChange={(e) => setContent({ ...content, wifiPassword: e.target.value })} className="h-11" />
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Switch id="wifi-hidden" checked={content.wifiHidden} onCheckedChange={(v) => setContent({ ...content, wifiHidden: v })} />
                <Label htmlFor="wifi-hidden">Rede oculta</Label>
              </div>
            </TabsContent>

            <TabsContent value="vcard" className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="v-name">Nome completo *</Label>
                <Input id="v-name" value={content.vName} onChange={(e) => setContent({ ...content, vName: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="v-org">Empresa</Label>
                <Input id="v-org" value={content.vOrg} onChange={(e) => setContent({ ...content, vOrg: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="v-title">Cargo</Label>
                <Input id="v-title" value={content.vTitle} onChange={(e) => setContent({ ...content, vTitle: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="v-phone">Telefone</Label>
                <Input id="v-phone" value={content.vPhone} onChange={(e) => setContent({ ...content, vPhone: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="v-email">E-mail</Label>
                <Input id="v-email" type="email" value={content.vEmail} onChange={(e) => setContent({ ...content, vEmail: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="v-site">Site</Label>
                <Input id="v-site" value={content.vSite} onChange={(e) => setContent({ ...content, vSite: e.target.value })} className="h-11" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="v-address">Endereço</Label>
                <Input id="v-address" value={content.vAddress} onChange={(e) => setContent({ ...content, vAddress: e.target.value })} className="h-11" />
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3">
              <div>
                <Label htmlFor="mail-to">E-mail de destino</Label>
                <Input id="mail-to" type="email" value={content.mailTo} onChange={(e) => setContent({ ...content, mailTo: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="mail-sub">Assunto</Label>
                <Input id="mail-sub" value={content.mailSubject} onChange={(e) => setContent({ ...content, mailSubject: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="mail-body">Mensagem</Label>
                <Textarea id="mail-body" value={content.mailBody} onChange={(e) => setContent({ ...content, mailBody: e.target.value })} className="min-h-20" />
              </div>
            </TabsContent>

            <TabsContent value="sms" className="space-y-3">
              <div>
                <Label htmlFor="sms-to">Número de telefone</Label>
                <Input id="sms-to" inputMode="tel" value={content.smsTo} onChange={(e) => setContent({ ...content, smsTo: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label htmlFor="sms-msg">Mensagem</Label>
                <Textarea id="sms-msg" value={content.smsMsg} onChange={(e) => setContent({ ...content, smsMsg: e.target.value })} className="min-h-20" />
              </div>
            </TabsContent>

            <TabsContent value="tel">
              <Label htmlFor="tel-to">Número de telefone</Label>
              <Input id="tel-to" inputMode="tel" value={content.telTo} onChange={(e) => setContent({ ...content, telTo: e.target.value })} className="h-11" />
            </TabsContent>
          </Tabs>
        </section>

        {/* Personalização visual */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Palette className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Cores & Estilo</h3>
          </div>

          <div className="mb-5">
            <Label className="mb-2 text-xs text-muted-foreground">Temas rápidos</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="group flex items-center gap-2 rounded-full border border-border bg-secondary/60 py-1.5 pl-1.5 pr-3 text-xs transition-all hover:border-primary/50 hover:bg-secondary active:scale-95"
                >
                  <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: `linear-gradient(135deg, ${p.dots}, ${p.dots2})` }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Estilo dos módulos</Label>
                <Select value={dotType} onValueChange={setDotType}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estilo dos olhos (cantos)</Label>
                <Select value={cornerSquareType} onValueChange={setCornerSquareType}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{CORNER_SQUARE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pupilas dos olhos</Label>
                <Select value={cornerDotType} onValueChange={setCornerDotType}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{CORNER_DOT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <Label htmlFor="grad" className="text-xs">Gradiente nos módulos</Label>
                <Switch id="grad" checked={useGradient} onCheckedChange={setUseGradient} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">{useGradient ? 'Cor inicial' : 'Cor dos módulos'}</Label>
                  <div className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2">
                    <input type="color" aria-label="Cor 1" value={color1} onChange={(e) => setColor1(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="font-mono text-xs text-muted-foreground">{color1}</span>
                  </div>
                </div>
                {useGradient && (
                  <div className="flex-1">
                    <Label className="text-xs">Cor final</Label>
                    <div className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2">
                      <input type="color" aria-label="Cor 2" value={color2} onChange={(e) => setColor2(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" />
                      <span className="font-mono text-xs text-muted-foreground">{color2}</span>
                    </div>
                  </div>
                )}
              </div>
              {useGradient && (
                <>
                  <div>
                    <Label className="text-xs">Tipo de gradiente</Label>
                    <Select value={gradientType} onValueChange={(v) => setGradientType(v as 'linear' | 'radial')}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="radial">Radial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Rotação: {gradientRotation}°</Label>
                    <Slider value={[gradientRotation]} min={0} max={360} step={15} onValueChange={([v]) => setGradientRotation(v)} className="mt-2" />
                  </div>
                </>
              )}
              <div>
                <Label className="text-xs">Cor de fundo</Label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2">
                    <input type="color" aria-label="Cor de fundo" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="font-mono text-xs text-muted-foreground">{bgColor}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                    <Switch id="bg-transp" checked={bgTransparent} onCheckedChange={setBgTransparent} />
                    <Label htmlFor="bg-transp" className="text-xs">Transparente</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><ImagePlus className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Logo no centro</h3>
            {logoFile && <Badge variant="secondary" className="ml-auto max-w-40 truncate">{logoFile.name}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="sr-only" onChange={onLogoChange} />
              <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                <ImagePlus className="h-4 w-4" /> Escolher imagem
              </span>
            </label>
            {logoFile && (
              <Button variant="outline" size="sm" onClick={removeLogo} className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </Button>
            )}
          </div>
          {logoFile && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Tamanho: {Math.round(logoSize * 100)}%</Label>
                <Slider value={[logoSize * 100]} min={15} max={60} step={5} onValueChange={([v]) => setLogoSize(v / 100)} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Margem do logo: {logoMargin}px</Label>
                <Slider value={[logoMargin]} min={0} max={30} step={1} onValueChange={([v]) => setLogoMargin(v)} className="mt-2" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="hide-dots" checked={hideBgDots} onCheckedChange={setHideBgDots} />
                <Label htmlFor="hide-dots" className="text-xs">Limpar pontos atrás</Label>
              </div>
            </div>
          )}
        </section>

        {/* Avançado */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Settings2 className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Configurações avançadas</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label className="text-xs">Correção de erros</Label>
              <Select value={ecLevel} onValueChange={setEcLevel}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{EC_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tamanho: {size}px</Label>
              <Slider value={[size]} min={200} max={1000} step={20} onValueChange={([v]) => setSize(v)} className="mt-3" />
            </div>
            <div>
              <Label className="text-xs">Margem: {margin}px</Label>
              <Slider value={[margin]} min={0} max={60} step={2} onValueChange={([v]) => setMargin(v)} className="mt-3" />
            </div>
          </div>
        </section>
      </div>

      {/* ============ Coluna direita: preview ============ */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <section className="glass-card glow-brand rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pré-visualização</h3>
            <Badge variant={hasContent ? 'default' : 'secondary'} className={hasContent ? 'border-primary/40 bg-primary/20 text-primary-foreground' : ''}>
              {hasContent ? 'Pronto' : 'Aguardando conteúdo'}
            </Badge>
          </div>

          <div className="relative mx-auto w-fit rounded-2xl border border-border bg-[repeating-conic-gradient(#1c1613_0%_25%,#151110_0%_50%)] bg-[length:20px_20px] p-4">
            {!hasContent && (
              <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center text-xs text-muted-foreground">
                <span className="block font-medium">Preencha algum conteúdo ao lado 👈</span>
              </div>
            )}
            <div ref={containerRef} className={`overflow-hidden rounded-xl ${hasContent ? 'qr-shimmer' : 'opacity-40'}`} />
          </div>

          <Separator className="my-5" />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Baixar em alta qualidade</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => download('png')} className="gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95">
                <Download className="h-4 w-4" /> PNG
              </Button>
              <Button onClick={() => download('svg')} variant="outline" className="gap-2 border-primary/40 text-primary transition-transform hover:bg-primary/10 active:scale-95">
                <Download className="h-4 w-4" /> SVG vetorial
              </Button>
              <Button onClick={() => download('jpeg')} variant="outline" className="gap-2 transition-transform active:scale-95">
                <Download className="h-4 w-4" /> JPEG
              </Button>
              <Button onClick={() => download('webp')} variant="outline" className="gap-2 transition-transform active:scale-95">
                <Download className="h-4 w-4" /> WEBP
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button onClick={copyData} variant="ghost" className="gap-2 text-muted-foreground">
                <Copy className="h-4 w-4" /> Copiar conteúdo
              </Button>
              <Button
                onClick={() => { qrRef.current?.update(options); toast({ title: 'QR atualizado!' }); }}
                variant="ghost" className="gap-2 text-muted-foreground"
              >
                <RefreshCcw className="h-4 w-4" /> Re-renderizar
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Conteúdo codificado:</p>
            <p className="thin-scroll max-h-20 overflow-y-auto break-all font-mono text-[11px] leading-relaxed text-foreground/80">
              {data || '—'}
            </p>
          </div>

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Dica: para QR Codes com logo, use correção de erros Alta ou Máxima para manter a leitura perfeita.
          </p>
        </section>
      </div>
    </div>
  );
}
