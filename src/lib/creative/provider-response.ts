/** A bounded, abortable read of the AI provider's JSON response.
 * HTTP headers arriving on time do not guarantee a complete JSON body.
 * Keep the same request deadline active until the entire response is parsed.
 */
export const MAX_ASSISTANT_PROVIDER_BYTES = 16_384;

export async function readAssistantProviderResponse(
 response: Response,
 signal: AbortSignal,
 maxBytes = MAX_ASSISTANT_PROVIDER_BYTES,
): Promise<unknown> {
 if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Limite de resposta inválido.');
 if (signal.aborted) throw new Error('A resposta da IA foi interrompida.');
 const declared = response.headers.get('content-length');
 if (declared !== null && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
  throw new Error('A resposta da IA excedeu o limite permitido.');
 }
 if (!response.body) throw new Error('O provedor não retornou uma resposta JSON.');
 const reader = response.body.getReader();
 const chunks: Uint8Array[] = [];
 let total = 0;
 let complete = false;
 let rejectOnAbort!: (error: Error) => void;
 const aborted = new Promise<never>((_resolve, reject) => { rejectOnAbort = reject; });
 const onAbort = () => rejectOnAbort(new Error('A resposta da IA excedeu o tempo limite.'));
 signal.addEventListener('abort', onAbort, {once: true});
 try {
  // Avoid the race between checking `aborted` and subscribing to abort.
  if (signal.aborted) onAbort();
  while (true) {
   const {done, value} = await Promise.race([reader.read(), aborted]);
   if (done) { complete = true; break; }
   total += value.byteLength;
   if (total > maxBytes) throw new Error('A resposta da IA excedeu o limite permitido.');
   chunks.push(value);
  }
 } finally {
  signal.removeEventListener('abort', onAbort);
  if (!complete) void reader.cancel().catch(() => {});
  reader.releaseLock();
 }
 const bytes = new Uint8Array(total);
 let offset = 0;
 for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
 try { return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
 catch { throw new Error('O provedor retornou um JSON inválido.'); }
}
