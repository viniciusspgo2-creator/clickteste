/** Server-only switches. Defaults preserve the deployed access system. */
export const persistentSessionsEnabled = () => process.env.STUDIO_PERSISTENT_SESSIONS === '1';
export const monitoringEnabled = () => process.env.STUDIO_MONITORING_ENABLED === '1';
export const libraryIntegrationEnabled = () => process.env.STUDIO_LIBRARY_INTEGRATION_ENABLED === '1';
export const REMEMBER_SECONDS = 30 * 86400;
export const SESSION_SECONDS = 12 * 3600;
export const ONLINE_WINDOW_MS = 90_000;

export function sameOriginMutation(req: Request) {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  // Atrás de proxy reverso (Caddy) o req.url é o endereço interno
  // (https://localhost:3001) e a origem pública chega nos headers
  // encaminhados. Sem aceitar a origem pública, o navegador recebe
  // 403 "Origem não autorizada." no login admin e nas demais mutações.
  const allowed = new Set<string>([new URL(req.url).origin]);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try { allowed.add(new URL(site).origin); } catch { /* URL inválida: ignora */ }
  }
  const fwdHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (fwdHost) {
    const proto = req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '');
    allowed.add(`${proto}://${fwdHost}`);
  }
  return allowed.has(origin);
}

export function sessionDeadline(now: Date, expiresAt: Date | null, remember: boolean) {
  const end = now.getTime() + (remember ? REMEMBER_SECONDS : SESSION_SECONDS) * 1000;
  return new Date(Math.min(end, expiresAt?.getTime() ?? end));
}
