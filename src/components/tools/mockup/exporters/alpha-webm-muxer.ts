/**
 * WebM VP9 com alfa: cada BlockGroup guarda a cor em Block e o frame
 * VP9 da máscara em BlockAdditional (BlockAddID=1). AlphaMode sozinho
 * não preserva transparência. Os dois encoders devem usar os mesmos timestamps.
 * https://wiki.webmproject.org/alpha-channel
 * https://www.webmproject.org/docs/container/
 */
type Bytes = Uint8Array<ArrayBuffer>;

interface Chunk {
  data: Bytes;
  key: boolean;
}

function concat(parts: Bytes[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function uint(value: number, width = 0): Bytes {
  if (!width) width = Math.max(1, Math.ceil(Math.log2(value + 1) / 8));
  const out = new Uint8Array(width);
  for (let i = width - 1; i >= 0; i--) {
    out[i] = value % 256;
    value = Math.floor(value / 256);
  }
  return out;
}

function size(value: number): Bytes {
  let width = 1;
  while (value >= 2 ** (7 * width) - 1) width++;
  const out = uint(value, width);
  out[0] |= 1 << (8 - width);
  return out;
}

function element(id: number, ...parts: Bytes[]): Bytes {
  const body = concat(parts);
  return concat([uint(id), size(body.length), body]);
}

const number = (id: number, value: number, width = 0) =>
  element(id, uint(value, width));
const text = (id: number, value: string) =>
  element(id, new TextEncoder().encode(value));

function float(id: number, value: number): Bytes {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value);
  return element(id, out);
}

export class AlphaWebMMuxer {
  private frames = new Map<number, { color?: Chunk; alpha?: Chunk }>();
  private colorSpace?: VideoColorSpaceInit;

  constructor(
    private width: number,
    private height: number,
    private fps: number,
  ) {}

  addChunk(channel: "color" | "alpha", chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) {
    if (channel === "color" && metadata?.decoderConfig?.colorSpace)
      this.colorSpace = metadata.decoderConfig.colorSpace;
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    const frame = this.frames.get(chunk.timestamp) ?? {};
    if (frame[channel]) throw new Error("Frame VP9 duplicado.");
    frame[channel] = { data, key: chunk.type === "key" };
    this.frames.set(chunk.timestamp, frame);
  }

  finalize(expectedFrames: number): Blob {
    const frames = [...this.frames.entries()].sort(([a], [b]) => a - b);
    if (!frames.length || frames.length !== expectedFrames)
      throw new Error("A codificação não produziu todos os frames do vídeo.");

    const clusters: { time: number; data: Bytes }[] = [];
    let blocks: Bytes[] = [];
    let clusterTime = 0;
    let previousTime = 0;
    const finishCluster = () => {
      if (blocks.length)
        clusters.push({
          time: clusterTime,
          data: element(0x1f43b675, number(0xe7, clusterTime), ...blocks),
        });
      blocks = [];
    };

    frames.forEach(([timestamp, { color, alpha }], i) => {
      if (!color || !alpha)
        throw new Error("Faltam dados de cor ou transparência em um frame.");
      const time = Math.round(timestamp / 1000);
      const key = color.key && alpha.key;
      if (i === 0 && !key) throw new Error("O vídeo precisa de um frame inicial completo.");
      if (key) {
        finishCluster();
        clusterTime = time;
      }
      const relative = time - clusterTime;
      if (relative > 32767) throw new Error("Intervalo entre frames completos muito longo.");
      // Block (não SimpleBlock): a ausência de ReferenceBlock indica keyframe.
      const block = element(
        0xa1,
        new Uint8Array([0x81, relative >> 8, relative & 255, 0]),
        color.data,
      );
      const reference = new Uint8Array(2);
      new DataView(reference.buffer).setInt16(0, previousTime - time);
      blocks.push(element(
        0xa0,
        block,
        ...(!key ? [element(0xfb, reference)] : []),
        element(0x75a1, element(0xa6, number(0xee, 1), element(0xa5, alpha.data))),
      ));
      previousTime = time;
    });
    finishCluster();

    const header = element(0x1a45dfa3,
      number(0x4286, 1), number(0x42f7, 1), number(0x42f2, 4),
      number(0x42f3, 8), text(0x4282, "webm"), number(0x4287, 4), number(0x4285, 2),
    );
    const info = element(0x1549a966,
      number(0x2ad7b1, 1_000_000),
      float(0x4489, frames.length * 1000 / this.fps),
      text(0x4d80, "ClickTools"), text(0x5741, "ClickTools Alpha"),
    );
    // O RGB do canvas pode ser convertido para BT.709 pelo encoder. Sem os
    // metadados, players podem assumir BT.601 e alterar as cores da estampa.
    const cs = this.colorSpace;
    const matrices = { rgb: 0, bt709: 1, bt470bg: 5, smpte170m: 6, "bt2020-ncl": 9 };
    const primaries = { bt709: 1, bt470bg: 5, smpte170m: 6, bt2020: 9, smpte432: 12 };
    const transfers = { bt709: 1, smpte170m: 6, "iec61966-2-1": 13, linear: 8, "pq": 16, "hlg": 18 };
    const color: Bytes[] = [];
    if (cs?.matrix && cs.matrix in matrices) color.push(number(0x55b1, matrices[cs.matrix as keyof typeof matrices]));
    if (cs?.primaries && cs.primaries in primaries) color.push(number(0x55bb, primaries[cs.primaries as keyof typeof primaries]));
    if (cs?.transfer && cs.transfer in transfers) color.push(number(0x55ba, transfers[cs.transfer as keyof typeof transfers]));
    if (typeof cs?.fullRange === "boolean") color.push(number(0x55b9, cs.fullRange ? 2 : 1));
    const tracks = element(0x1654ae6b, element(0xae,
      number(0xd7, 1), number(0x73c5, 1), number(0x83, 1), number(0x9c, 0),
      text(0x86, "V_VP9"), number(0x23e383, Math.round(1e9 / this.fps)),
      number(0x55ee, 1),
      element(0xe0, number(0xb0, this.width), number(0xba, this.height), number(0x53c0, 1),
        ...(color.length ? [element(0x55b0, ...color)] : [])),
    ));
    const seek = (id: number, offset: number) => element(0x4dbb,
      element(0x53ab, uint(id)), number(0x53ac, offset, 8),
    );
    const makeSeekHead = (cuesOffset: number) => element(0x114d9b74,
      seek(0x1549a966, seekHeadLength),
      seek(0x1654ae6b, seekHeadLength + info.length), seek(0x1c53bb6b, cuesOffset),
    );
    // Offsets de 8 bytes mantêm o tamanho dos índices estável entre os passes.
    let seekHeadLength = 0;
    seekHeadLength = makeSeekHead(0).length;
    const cuesOffset = seekHeadLength + info.length + tracks.length;
    const makeCues = (firstCluster: number) => {
      let offset = firstCluster;
      return element(0x1c53bb6b, ...clusters.map(({ time, data }) => {
        const cue = element(0xbb, number(0xb3, time),
          element(0xb7, number(0xf7, 1), number(0xf1, offset, 8)));
        offset += data.length;
        return cue;
      }));
    };
    const cuesLength = makeCues(0).length;
    const segment = element(0x18538067,
      makeSeekHead(cuesOffset), info, tracks, makeCues(cuesOffset + cuesLength),
      ...clusters.map(({ data }) => data),
    );
    this.frames.clear();
    return new Blob([header, segment], { type: "video/webm" });
  }
}
