import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { catalogSelect, serializeItem } from "@/lib/mockup-scenes/server";
import {
  catalogInput,
  validatePublication,
} from "@/lib/mockup-scenes/validation";
export const runtime = "nodejs";
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!requireAdmin(req))
    return NextResponse.json(
      { ok: false, error: "Não autorizado." },
      { status: 401 },
    );
  try {
    const { id } = await params,
      input = catalogInput.parse(await req.json());
    const old = await db.mockupSceneItem.findUnique({
      where: { id },
      select: { kind: true },
    });
    if (!old)
      return NextResponse.json(
        { ok: false, error: "Item não encontrado." },
        { status: 404 },
      );
    validatePublication(old.kind, input.status, input.surface);
    const item = await db.mockupSceneItem.update({
      where: { id },
      data: {
        name: input.name,
        category: input.category,
        tags: JSON.stringify(input.tags),
        status: input.status,
        surface:
          old.kind === "model" && input.surface
            ? JSON.stringify(input.surface)
            : null,
      },
      select: catalogSelect,
    });
    return NextResponse.json({ ok: true, item: serializeItem(item) });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Não foi possível salvar. Confira os dados e prepare a área de impressão para publicar um modelo.",
      },
      { status: 400 },
    );
  }
}
