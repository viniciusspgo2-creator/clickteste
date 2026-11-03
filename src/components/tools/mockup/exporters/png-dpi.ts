/** PNG pHYs: physical resolution metadata, without recompressing image pixels. */
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export async function withPngDpi(blob: Blob, dpi: number): Promise<Blob> {
  if (!Number.isFinite(dpi) || dpi <= 0) throw new Error("Resolução de impressão inválida.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!SIGNATURE.every((v, i) => bytes[i] === v)) throw new Error("A imagem não é um PNG válido.");
  const chunk = new Uint8Array(21), view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // pHYs
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  view.setUint32(8, pixelsPerMeter); view.setUint32(12, pixelsPerMeter);
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const parts: BlobPart[] = [bytes.slice(0, 8)];
  const data = new DataView(bytes.buffer);
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = data.getUint32(offset), end = offset + length + 12;
    if (end > bytes.length) throw new Error("PNG incompleto.");
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") parts.push(bytes.slice(offset, end));
    if (type === "IHDR") parts.push(chunk);
    offset = end;
  }
  return new Blob(parts, { type: "image/png" });
}
