import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { requireAdmin, rateLimit } from '@/lib/admin-auth';
import { clientAddress } from '@/lib/security/rate-limit';
import { monitoringEnabled, persistentSessionsEnabled } from '@/lib/studio-access-options';

export const BROWSER_COOKIE = 'cg_studio_browser';
export const ACCESS_COOKIE = 'cg_studio_access';
export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
const validToken = (value: string | undefined) => value && /^[a-f0-9]{64}$/.test(value) ? value : null;
function cookie(req: Request, name: string) {
  return req.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
}
export const browserToken = (req: Request) => validToken(cookie(req, BROWSER_COOKIE));
export function accessCredential(req: Request) {
  const bearer = validToken(req.headers.get('authorization')?.replace(/^Bearer /, ''));
  const stored = cookie(req, ACCESS_COOKIE), persistent = persistentSessionsEnabled();
  // Session-only cookies also authorize image/font tags in legacy bearer mode.
  // Its explicit bearer contract and lack of browser persistence stay intact.
  if (stored && /^[ps]\.[a-f0-9]{64}$/.test(stored) && (persistent || stored[0] === 's') && (persistent || !bearer))
    return { token: stored.slice(2), remember: stored[0] === 'p', fromCookie: true };
  return bearer ? { token: bearer, remember: false, fromCookie: false } : null;
}
export const accessPlan = (type: string) => type === 'library_trial' ? 'Teste da Biblioteca' : type === 'library' ? 'Biblioteca Click Gruda' : 'Studio Temporário';
export type StudioIdentity = {
  codeId: string; browserHash: string; sessionHash: string;
  accessMode: 'individual' | 'universal'; sessionExpiresAt: Date;
  expiresAt: Date | null; remember: boolean; fromCookie: boolean;
};
export type StudioAccess = { ok: true; plan: string; clientName?: string; accessMode?: 'individual' | 'universal'; expiresAt?: string | null } | { ok: false; reason: string };
type Resolution = { access: StudioAccess; identity?: StudioIdentity };

/** Internal identity stays server-side. Public callers receive only access. */
export async function resolvePremiumSession(req: Request): Promise<Resolution> {
  // The existing master authentication remains first and fully independent.
  if (requireAdmin(req)) return { access: { ok: true, plan: 'Admin Master' } };
  if (!rateLimit('session-resolution:' + clientAddress(req), 1200, 60000)) return { access: { ok: false, reason: 'rate' } };
  const credential = accessCredential(req), browser = browserToken(req);
  if (!credential || !browser) return { access: { ok: false, reason: 'session' } };
  const now = new Date(), sessionHash = hashToken(credential.token), browserHash = hashToken(browser);
  const individual = await db.accessCode.findFirst({ where: { sessionHash, browserHash, accessMode: 'individual' } });
  const use = individual ? null : await db.accessCodeUse.findFirst({ where: { deviceId: browserHash, sessionHash, code: { accessMode: 'universal' } }, include: { code: true } });
  const code = individual ?? use?.code;
  if (!code || !code.active) return { access: { ok: false, reason: 'session' } };
  if (code.expiresAt && code.expiresAt <= now) return { access: { ok: false, reason: 'expired' } };
  const sessionExpiresAt = individual?.sessionExpiresAt ?? use?.sessionExpiresAt;
  if (!sessionExpiresAt || sessionExpiresAt <= now) return { access: { ok: false, reason: 'session' } };
  if (monitoringEnabled()) {
    const presence = await db.studioPresence.findUnique({ where: { codeId_browserHash: { codeId: code.id, browserHash } }, select: { blockedAt: true } });
    if (presence?.blockedAt) return { access: { ok: false, reason: 'blocked' } };
  }
  const accessMode = individual ? 'individual' : 'universal';
  return {
    access: { ok: true, plan: accessPlan(code.clientType), clientName: code.clientName, accessMode, expiresAt: code.expiresAt?.toISOString() ?? null },
    identity: { codeId: code.id, browserHash, sessionHash, accessMode, sessionExpiresAt, expiresAt: code.expiresAt, remember: credential.remember, fromCookie: credential.fromCookie },
  };
}
export async function checkPremiumSession(req: Request) { return (await resolvePremiumSession(req)).access; }
