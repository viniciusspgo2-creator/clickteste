import 'server-only';
/* ============================================================
   Autenticação do Painel Admin — sessão HMAC + senha scrypt
   ============================================================ */

import { createHmac, randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { sameOriginMutation } from '@/lib/studio-access-options';

export const ADMIN_COOKIE = 'cg_admin';
const SESSION_HOURS = 12;

const IS_PROD = process.env.NODE_ENV === 'production';

function secret(): string {
  const fromEnv = process.env.ADMIN_SECRET;
  if (fromEnv) return fromEnv;
  // Em produção NÃO existe segredo padrão: sem ADMIN_SECRET o login falha (500)
  // em vez de assinar cookies com uma chave pública conhecida.
  if (IS_PROD) throw new Error('ADMIN_SECRET não configurado nas variáveis de ambiente.');
  return 'click-gruda-secret-local-dev-2026';
}

/* ---------------- senha ---------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** senha efetiva: hash salvo no banco (alterável no painel) → senão env → senão padrão */
export async function checkAdminPassword(password: string): Promise<boolean> {
  if (!password || password.length > 1024) return false;
  // A database outage must not reactivate an obsolete environment password.
  const row = await db.siteConfig.findUnique({ where: { key: 'admin_pass_hash' } });
  if (row) {
    const [salt, hash, extra] = row.value.split(':');
    // Preserve older scrypt salts; only new hashes use the current random salt.
    if (extra || !salt || salt.length > 1024 || !/^[a-f0-9]{128}$/i.test(hash || '')) return false;
    const candidate = await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (error, value) => error ? reject(error) : resolve(value)));
    return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
  }
  // Em produção, sem ADMIN_PASSWORD (e sem senha salva no banco) ninguém entra.
  const fallback = process.env.ADMIN_PASSWORD || (IS_PROD ? '' : 'gruda2026');
  if (!fallback) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(fallback);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setAdminPassword(password: string): Promise<void> {
  const salt = randomBytes(16).toString('hex');
  const hash = await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (error, value) => error ? reject(error) : resolve(value)));
  const value = `${salt}:${hash.toString('hex')}`;
  await db.siteConfig.upsert({
    where: { key: 'admin_pass_hash' },
    update: { value },
    create: { key: 'admin_pass_hash', value },
  });
}

/* ---------------- sessão ---------------- */

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createAdminToken(): string {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = b64url(JSON.stringify({ exp }));
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || token.length > 1024 || token.split('.').length !== 2) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false; // sem ADMIN_SECRET em produção → nenhuma sessão é válida
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof data.exp === 'number' && Number.isFinite(data.exp) && data.exp > Date.now();
  } catch {
    return false;
  }
}

/** guarda de rota para as APIs administrativas */
export function requireAdmin(req: Request): boolean {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !sameOriginMutation(req)) return false;
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(ADMIN_COOKIE + '='));
  try { return verifyAdminToken(match ? decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)) : null); }
  catch { return false; }
}

/* ---------------- rate limit simples em memória ---------------- */

const attemptScopes = new Map<string, Map<string, { count: number; resetAt: number }>>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const scope = key.split(':', 1)[0];
  let attempts = attemptScopes.get(scope);
  if (!attempts) { attempts = new Map(); attemptScopes.set(scope, attempts); }
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    if (attempts.size >= 5000) {
      for (const [item, value] of attempts) if (now > value.resetAt) attempts.delete(item);
      // Never clear active counters under pressure: that bypassed the limits.
      if (attempts.size >= 5000 && !entry) return false;
    }
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

/* ---------------- data local (São Paulo) ---------------- */

export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export function isoDaysAgoInSaoPaulo(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}
