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
  return !origin || origin === new URL(req.url).origin;
}

export function sessionDeadline(now: Date, expiresAt: Date | null, remember: boolean) {
  const end = now.getTime() + (remember ? REMEMBER_SECONDS : SESSION_SECONDS) * 1000;
  return new Date(Math.min(end, expiresAt?.getTime() ?? end));
}
