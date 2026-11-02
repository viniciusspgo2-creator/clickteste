import { z } from "zod";
const point = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]);
export const surfaceSchema = z
  .object({
    topLeft: point,
    topRight: point,
    bottomLeft: point,
    bottomRight: point,
    curvature: z.number().min(-0.2).max(0.3),
  })
  .superRefine((s, ctx) => {
    const corners = [s.topLeft, s.topRight, s.bottomRight, s.bottomLeft];
    const crosses = corners.map((a, i) => {
      const b = corners[(i + 1) % 4],
        c = corners[(i + 2) % 4];
      return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    });
    if (
      crosses.some((n) => n <= 0) ||
      Math.min(s.topLeft[1], s.topRight[1]) + Math.min(0, s.curvature) < 0 ||
      Math.max(s.bottomLeft[1], s.bottomRight[1]) + Math.max(0, s.curvature) > 1
    )
      ctx.addIssue({
        code: "custom",
        message:
          "A área deve ser convexa e a curvatura deve ficar dentro da imagem.",
      });
    if (
      s.topRight[0] - s.topLeft[0] < 0.04 ||
      s.bottomRight[0] - s.bottomLeft[0] < 0.04 ||
      s.bottomLeft[1] - s.topLeft[1] < 0.04 ||
      s.bottomRight[1] - s.topRight[1] < 0.04
    )
      ctx.addIssue({
        code: "custom",
        message:
          "A área de impressão precisa ter largura e altura e não pode se cruzar.",
      });
  });
export const catalogInput = z.object({
  name: z.string().trim().min(2).max(90),
  category: z.string().trim().min(2).max(60),
  tags: z.array(z.string().trim().min(1).max(35)).max(12).default([]),
  status: z.enum(["draft", "published", "archived"]),
  surface: surfaceSchema.nullable().default(null),
});
export function validatePublication(
  kind: string,
  status: string,
  surface: unknown,
) {
  if (
    kind === "model" &&
    status === "published" &&
    !surfaceSchema.safeParse(surface).success
  )
    throw new Error(
      "Prepare a área de impressão antes de publicar este modelo.",
    );
}
/** Avoid giant/decompression-bomb inputs before decoding with Sharp. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 36_000_000;
