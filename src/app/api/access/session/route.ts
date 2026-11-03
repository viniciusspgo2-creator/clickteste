import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  browserToken,
  checkPremiumSession,
  hashToken,
  newToken,
} from "@/lib/premium-session";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    return NextResponse.json(await checkPremiumSession(req), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "network" }, { status: 503 });
  }
}
// Claim on page load as well: duplicated tabs inherit sessionStorage. Rotating
// the token prevents those tabs from silently sharing one active session.
export async function POST(req: Request) {
  try {
    const access = await checkPremiumSession(req);
    if (!access.ok || requireAdmin(req))
      return NextResponse.json(access, {
        headers: { "Cache-Control": "no-store" },
      });
    const browser = browserToken(req)!;
    const oldToken = req.headers.get("authorization")!.replace(/^Bearer /, "");
    const sessionToken = newToken();
    const now = new Date();
    const updated = access.accessMode === "universal"
      ? await db.accessCodeUse.updateMany({
          where: {
            deviceId: hashToken(browser), sessionHash: hashToken(oldToken),
            sessionExpiresAt: { gt: now },
            code: { accessMode: "universal", active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          },
          data: { sessionHash: hashToken(sessionToken) },
        })
      : await db.accessCode.updateMany({
          where: {
            browserHash: hashToken(browser), sessionHash: hashToken(oldToken),
            active: true, sessionExpiresAt: { gt: now },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          data: { sessionHash: hashToken(sessionToken) },
        });
    return NextResponse.json(
      updated.count
        ? { ...access, sessionToken }
        : { ok: false, reason: "session" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, reason: "network" }, { status: 503 });
  }
}
export async function DELETE(req: Request) {
  const browser = browserToken(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (browser && /^[a-f0-9]{64}$/.test(token)) {
    const [browserHash, sessionHash] = [hashToken(browser), hashToken(token)];
    await db.$transaction([
      db.accessCode.updateMany({ where: { browserHash, sessionHash }, data: { sessionHash: null, sessionExpiresAt: null } }),
      db.accessCodeUse.updateMany({ where: { deviceId: browserHash, sessionHash }, data: { sessionHash: null, sessionExpiresAt: null } }),
    ]);
  }
  return NextResponse.json({ ok: true });
}
