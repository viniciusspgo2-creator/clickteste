import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  catalogSelect,
  listCatalog,
  serializeItem,
} from "@/lib/mockup-scenes/server";
import {
  catalogInput,
  MAX_FILE_BYTES,
  MAX_IMAGE_PIXELS,
  validatePublication,
} from "@/lib/mockup-scenes/validation";
export const runtime = "nodejs";
const fail = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status });
export async function GET(req: Request) {
  if (!requireAdmin(req)) return fail("Não autorizado.", 401);
  try {
    return NextResponse.json(
      { ok: true, ...(await listCatalog(new URL(req.url).searchParams, true)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail(
      "Não foi possível carregar o catálogo. Confira a conexão com o banco.",
      503,
    );
  }
}
export async function POST(req: Request) {
  if (!requireAdmin(req)) return fail("Não autorizado.", 401);
  if (Number(req.headers.get("content-length")) > MAX_FILE_BYTES + 16384)
    return fail("O limite é de 4 MB por imagem.", 413);
  try {
    const form = await req.formData(),
      file = form.get("image"),
      kind = form.get("kind");
    if (kind !== "model" && kind !== "background")
      return fail("Tipo de item inválido.");
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES)
      return fail("Envie uma imagem de até 4 MB.");
    const input = catalogInput.parse(
      JSON.parse(String(form.get("metadata") || "{}")),
    );
    validatePublication(kind, input.status, input.surface);
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: "error",
    });
    const meta = await image.metadata();
    if (
      !["png", "jpeg", "webp"].includes(meta.format || "") ||
      (meta.pages ?? 1) > 1
    )
      return fail("Use PNG, JPEG ou WebP estático.");
    if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 1000)
      return fail(
        "A imagem precisa ter pelo menos 1000 px em cada lado. Recomendamos 2000 px ou mais.",
      );
    if (kind === "model" && !meta.hasAlpha)
      return fail(
        "O modelo deve ter fundo transparente. Envie uma caneca recortada em PNG ou WebP.",
      );
    if (kind === "model") {
      const stats = await image.clone().stats();
      if (stats.channels.length < 4 || stats.channels[3].min === 255)
        return fail("Remova o fundo da caneca antes de cadastrar o modelo.");
    }
    // Decode and re-encode, removing metadata and preventing disguised file types.
    const encoded =
      kind === "model"
        ? await image.rotate().png().toBuffer({ resolveWithObject: true })
        : await image
            .rotate()
            .jpeg({ quality: 94, mozjpeg: true })
            .toBuffer({ resolveWithObject: true });
    if (encoded.data.length > MAX_FILE_BYTES)
      return fail("A imagem processada ultrapassa 4 MB. Reduza as dimensões.");
    const thumbnail = sharp(encoded.data).resize({
      width: 480,
      height: 480,
      fit: "inside",
      withoutEnlargement: true,
    });
    const thumbnailBytes =
      kind === "model"
        ? await thumbnail.png().toBuffer()
        : await thumbnail.jpeg({ quality: 85 }).toBuffer();
    const item = await db.mockupSceneItem.create({
      data: {
        kind,
        name: input.name,
        category: input.category,
        tags: JSON.stringify(input.tags),
        status: input.status,
        surface:
          kind === "model" && input.surface
            ? JSON.stringify(input.surface)
            : null,
        imageBytes: new Uint8Array(encoded.data),
        thumbnailBytes: new Uint8Array(thumbnailBytes),
        mimeType: kind === "model" ? "image/png" : "image/jpeg",
        width: encoded.info.width,
        height: encoded.info.height,
      },
      select: catalogSelect,
    });
    return NextResponse.json(
      { ok: true, item: serializeItem(item) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return fail("Dados do cadastro inválidos.");
    if (
      error instanceof Error &&
      (error.name === "ZodError" || /impressão/.test(error.message))
    )
      return fail(
        error.name === "ZodError"
          ? "Confira o nome, a categoria e a área de impressão."
          : error.message,
      );
    return fail(
      "Não foi possível salvar. Confira o arquivo e a conexão com o banco.",
    );
  }
}
