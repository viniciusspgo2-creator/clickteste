import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { MOCKUP_SCENES_ENABLED } from "@/lib/features";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    return new Response(null, { status: 404 });
  try {
    const admin = requireAdmin(req),
      thumb = new URL(req.url).searchParams.get("thumb") === "1";
    if (!MOCKUP_SCENES_ENABLED && !admin) return new Response(null,{status:404});
    const row = await db.mockupSceneItem.findFirst({
      where: { id, ...(admin ? {} : { status: "published" }) },
      select: {
        imageBytes: !thumb,
        thumbnailBytes: thumb,
        mimeType: true,
        updatedAt: true,
      },
    });
    if (!row) return new Response(null, { status: 404 });
    const etag = `"${id}-${row.updatedAt.getTime()}${thumb ? "-thumb" : ""}"`;
    // Always revalidate publication state; unpublishing must revoke draft access.
    const headers = {
      "Content-Type": row.mimeType,
      "Cache-Control": "private, no-cache",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    };
    if (req.headers.get("if-none-match") === etag)
      return new Response(null, { status: 304, headers });
    let bytes = thumb ? row.thumbnailBytes : row.imageBytes;
    if (!bytes && thumb)
      bytes =
        (
          await db.mockupSceneItem.findUnique({
            where: { id },
            select: { imageBytes: true },
          })
        )?.imageBytes ?? null;
    if (!bytes) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(bytes), { headers });
  } catch {
    return new Response(null, { status: 503 });
  }
}
