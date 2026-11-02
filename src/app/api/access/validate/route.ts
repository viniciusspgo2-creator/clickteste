import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/admin-auth";
import {
  BROWSER_COOKIE,
  browserToken,
  hashToken,
  newToken,
} from "@/lib/premium-session";

export const runtime = "nodejs";
export async function POST(req: Request) {
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const code = String(body.code ?? "")
    .trim()
    .toUpperCase();
  if (!code || code.length > 32)
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`studio-login:${ip}`, 30, 10 * 60_000))
    return NextResponse.json({ ok: false, reason: "rate" }, { status: 429 });
  const browser = browserToken(req) ?? newToken();
  const browserHash = hashToken(browser);
  const sessionToken = newToken();
  const now = new Date();
  try {
    // Acquire a row lock before assigning a browser slot; prevents concurrent
    // requests from exceeding the shared-code limit across server instances.
    const result = await db.$transaction(async (tx) => {
      const lookup = await tx.accessCode.findUnique({ where: { code }, select: { id: true } });
      if (!lookup) return { ok: false as const, reason: "invalid" };
      // Read AFTER the row lock to see changes to quotas, revocation and dates.
      await tx.$queryRaw`SELECT id FROM "AccessCode" WHERE id = ${lookup.id} FOR UPDATE`;
      const row = await tx.accessCode.findUnique({ where: { id: lookup.id } });
      if (!row || !row.active) return { ok: false as const, reason: "invalid" };
      if (row.expiresAt && row.expiresAt <= now)
        return { ok: false as const, reason: "expired" };
      if (row.accessMode === "universal") {
        const current = await tx.accessCodeUse.findUnique({
          where: { codeId_deviceId: { codeId: row.id, deviceId: browserHash } },
        });
        if (!current) {
          const used = await tx.accessCodeUse.count({ where: { codeId: row.id } });
          if (used >= Math.max(1, Math.min(row.maxUses, 100)))
            return { ok: false as const, reason: "full" };
        }
        const sessionExpiresAt = new Date(now.getTime() + 12 * 3600_000);
        await tx.accessCodeUse.upsert({
          where: { codeId_deviceId: { codeId: row.id, deviceId: browserHash } },
          create: { codeId: row.id, deviceId: browserHash, sessionHash: hashToken(sessionToken), sessionExpiresAt },
          update: { usedAt: now, sessionHash: hashToken(sessionToken), sessionExpiresAt },
        });
      } else {
        // Preserve the original single-browser binding for personal codes.
        const updated = await tx.accessCode.updateMany({
          where: {
            id: row.id, active: true,
            AND: [
              { OR: [{ browserHash: null }, { browserHash }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            ],
          },
          data: { browserHash, sessionHash: hashToken(sessionToken), sessionExpiresAt: new Date(now.getTime() + 12 * 3600_000) },
        });
        if (!updated.count) return { ok: false as const, reason: "browser" };
        await tx.accessCodeUse.upsert({
          where: { codeId_deviceId: { codeId: row.id, deviceId: browserHash } },
          create: { codeId: row.id, deviceId: browserHash },
          update: { usedAt: now },
        });
      }
      return {
        ok: true as const, sessionToken, clientName: row.clientName,
        plan: row.clientType === "library" ? "Biblioteca Click Gruda" : "Studio Temporário",
      };
    });
    const response = NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
    if (result.ok)
      response.cookies.set(BROWSER_COOKIE, browser, {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(req.url).protocol === "https:",
        path: "/",
        maxAge: 365 * 86400,
      });
    return response;
  } catch (error) {
    console.error(
      "Studio access unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ ok: false, reason: "network" }, { status: 503 });
  }
}
