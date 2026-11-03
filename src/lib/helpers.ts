'use client';

/* ============ Helpers gerais ============ */

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function slugifyFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

/* ============ Impressão via iframe (Orçamento / Contrato → PDF) ============ */

export function printHtmlDocument(title: string, bodyHtml: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #16181d; font-size: 13px; line-height: 1.55; }
  h1, h2, h3 { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 10px; text-align: left; vertical-align: top; }
  @page { margin: 14mm; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) return;
  win.focus();
  // pequeno atraso para garantir renderização
  setTimeout(() => {
    win.print();
    setTimeout(() => iframe.remove(), 800);
  }, 250);
}

/* ============ PIX — payload EMV BR Code (estático) ============ */

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function sanitize(str: string, max: number): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 .\-]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max);
}

export interface PixParams {
  key: string; // CPF/CNPJ/email/telefone/aleatória
  merchantName: string;
  city: string;
  amount?: number; // opcional
  txid?: string;
  description?: string; // opcional, aparece no extrato do pagador
}

export function buildPixPayload({ key, merchantName, city, amount, txid, description }: PixParams): string {
  let merchantAccount = emv('00', 'BR.GOV.BCB.PIX') + emv('01', key.trim());
  if (description && description.trim()) {
    merchantAccount += emv('02', sanitize(description, 40));
  }

  const cleanTxid = (txid ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const name = sanitize(merchantName, 25) || 'MERCHANT';
  const citySan = sanitize(city, 15) || 'BRASIL';

  let payload =
    emv('00', '01') +
    emv('01', '12') +
    emv('26', merchantAccount) +
    emv('52', '0000') +
    emv('53', '986');

  if (amount && amount > 0) {
    payload += emv('54', amount.toFixed(2));
  }

  payload +=
    emv('58', 'BR') +
    emv('59', name) +
    emv('60', citySan) +
    emv('62', emv('05', cleanTxid));

  payload += '6304';
  return payload + crc16(payload);
}

/* ============ Data URI de imagem ============ */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
