import "server-only";
import { db } from "@/lib/db";

// Keep multi-megabyte image payloads out of every catalog/list response.
export const catalogSelect = {
  id: true,
  kind: true,
  name: true,
  category: true,
  tags: true,
  status: true,
  surface: true,
  width: true,
  height: true,
  updatedAt: true,
} as const;
export function serializeItem(row: {
  id: string;
  tags: string;
  surface: string | null;
  updatedAt: Date;
  [key: string]: unknown;
}) {
  return {
    ...row,
    tags: JSON.parse(row.tags),
    surface: row.surface ? JSON.parse(row.surface) : null,
    updatedAt: row.updatedAt.toISOString(),
    imageUrl: `/api/mockup-scenes/images/${row.id}`,
  };
}
export async function listCatalog(params: URLSearchParams, admin = false) {
  const kind = params.get("kind") === "model" ? "model" : "background";
  const page =
    Math.max(1, Math.min(100000, Number(params.get("page")) || 1)) | 0;
  const q = (params.get("q") || "").trim().slice(0, 80),
    category = (params.get("category") || "").slice(0, 60);
  const requestedStatus = params.get("status");
  const where = {
    kind,
    ...(!admin
      ? { status: "published" }
      : requestedStatus &&
          ["draft", "published", "archived"].includes(requestedStatus)
        ? { status: requestedStatus }
        : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { tags: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [rows, total, categories] = await db.$transaction([
    db.mockupSceneItem.findMany({
      where,
      select: catalogSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * 24,
      take: 24,
    }),
    db.mockupSceneItem.count({ where }),
    db.mockupSceneItem.findMany({
      where: { kind, ...(!admin ? { status: "published" } : {}) },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
      take: 200,
    }),
  ]);
  return {
    items: rows.map(serializeItem),
    total,
    page,
    pages: Math.ceil(total / 24),
    categories: categories.map((x) => x.category),
  };
}
