/** Bound the actual stream, not just the caller-supplied Content-Length. */
export class RequestBodyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export async function readBodyBytes(req: Request, limit: number, timeoutMs = 10000): Promise<Uint8Array> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) throw new RequestBodyError('Conteúdo muito grande.', 413);
  if (!req.body) throw new RequestBodyError('Corpo da requisição ausente.');
  const reader = req.body.getReader(), chunks: Uint8Array[] = [];
  let bytes = 0, complete = false;
  let interrupt!: (error: RequestBodyError) => void;
  const interrupted = new Promise<never>((_resolve, reject) => { interrupt = reject; });
  const abort = () => interrupt(new RequestBodyError('Envio interrompido.', 408));
  const timer = setTimeout(() => interrupt(new RequestBodyError('Tempo de envio excedido.', 408)), timeoutMs);
  req.signal.addEventListener('abort', abort, { once: true });
  try {
    if (req.signal.aborted) throw new RequestBodyError('Envio interrompido.', 408);
    while (true) {
      const part = await Promise.race([reader.read(), interrupted]);
      if (req.signal.aborted) throw new RequestBodyError('Envio interrompido.', 408);
      if (part.done) { complete = true; break; }
      bytes += part.value.byteLength;
      if (bytes > limit) throw new RequestBodyError('Conteúdo muito grande.', 413);
      chunks.push(part.value);
    }
  } finally {
    clearTimeout(timer); req.signal.removeEventListener('abort', abort);
    if (!complete) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const result = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}
export async function readJsonBody<T = Awaited<ReturnType<Request['json']>>>(req: Request, limit = 16384): Promise<T> {
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new RequestBodyError('Envie JSON.', 415);
  const bytes = await readBodyBytes(req, limit);
  try {
    const data: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as T;
  } catch { throw new RequestBodyError('JSON inválido.'); }
}
export async function readMultipartBody(req: Request, limit: number): Promise<FormData> {
  const type = req.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;/i.test(type)) throw new RequestBodyError('Envie um formulário de arquivo.', 415);
  const bytes = await readBodyBytes(req, limit, 20000);
  try { return await new Response(new Uint8Array(bytes), { headers: { 'Content-Type': type } }).formData(); }
  catch { throw new RequestBodyError('Formulário inválido.'); }
}
