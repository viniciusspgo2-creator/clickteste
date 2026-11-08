import 'server-only';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { db } from '@/lib/db';

const PREFIX = '__security_rate_v1:';
let cleanupAt = 0;
/** Vercel overwrites forwarding headers at its trusted ingress. Other hosts must
 * do the same. Unparseable addresses share a bucket rather than minting keys. */
export function clientAddress(req: Request): string {
  const candidate = (process.env.VERCEL === '1' ? req.headers.get('x-vercel-forwarded-for') : null)
    || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  const first = candidate.split(',')[0].trim();
  return isIP(first) ? first : 'unknown';
}
/** Atomic, cross-instance counters in the existing key/value table. No schema
 * change and no access/account rows are involved. A local limiter runs first. */
export async function takeSharedRateLimit(scope: string, identity: string, max: number, windowMs: number) {
  const now = Date.now(), resetAt = now + windowMs;
  const key = PREFIX + scope + ':' + createHash('sha256').update(identity).digest('hex');
  const rows = await db.$queryRaw<{ value: string }[]>`
    INSERT INTO "SiteConfig" ("key", "value", "updatedAt")
    VALUES (${key}, jsonb_build_object('count', 1, 'resetAt', ${resetAt}::bigint)::text, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE SET
      "value" = CASE WHEN ("SiteConfig"."value"::jsonb->>'resetAt')::bigint <= ${now}::bigint
        THEN EXCLUDED."value"
        ELSE jsonb_set("SiteConfig"."value"::jsonb, '{count}',
          to_jsonb(LEAST(("SiteConfig"."value"::jsonb->>'count')::int + 1, ${max + 1}::int)))::text END,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "value"`;
  const value = JSON.parse(rows[0].value) as { count: number; resetAt: number };
  if (now >= cleanupAt) {
    cleanupAt = now + 3600000;
    // Bounded housekeeping touches this namespace only, never SEO or passwords.
    await db.$executeRaw`DELETE FROM "SiteConfig" WHERE starts_with("key", ${PREFIX})
      AND "updatedAt" < ${new Date(now - 86400000)} AND "key" IN
      (SELECT "key" FROM "SiteConfig" WHERE starts_with("key", ${PREFIX})
       AND "updatedAt" < ${new Date(now - 86400000)} ORDER BY "updatedAt" LIMIT 256)`.catch(() => {});
  }
  return { allowed: value.count <= max, retryAfter: Math.max(1, Math.ceil((value.resetAt - now) / 1000)) };
}
