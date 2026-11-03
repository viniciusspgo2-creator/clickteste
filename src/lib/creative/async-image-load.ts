/** A bounded image decoder for browser-only assets.
 * A pending remote asset must never leave project recovery, previews or exports
 * spinning forever. The timeout is limited to the individual image load,
 * rather than the entire document, and does not upload customer media.
 */
export const IMAGE_LOAD_TIMEOUT_MS = 15_000;

export function loadImageWithTimeout(src: string, timeoutMs = IMAGE_LOAD_TIMEOUT_MS): Promise<HTMLImageElement> {
 if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
  return Promise.reject(new Error('Tempo limite de imagem inválido.'));
 }
 return new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  let finished = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settle = (error?: Error) => {
   if (finished) return;
   finished = true;
   image.onload = null;
   image.onerror = null;
   if (timer !== undefined) clearTimeout(timer);
   if (error) {
    // Stop pending network and decoding work after failure. Errors triggered by
    // removing src cannot reject the same Promise twice.
    image.removeAttribute('src');
    reject(error);
   } else {
    resolve(image);
   }
  };
  image.decoding = 'async';
  image.crossOrigin = 'anonymous';
  image.onload = () => settle(image.naturalWidth > 0 && image.naturalHeight > 0
   ? undefined : new Error('A imagem não possui dimensões válidas.'));
  image.onerror = () => settle(new Error('Não foi possível carregar a imagem.'));
  timer = setTimeout(() => settle(new Error('A imagem demorou demais para carregar. Verifique a conexão ou importe novamente.')), timeoutMs);
  try { image.src = src; } catch { settle(new Error('O endereço da imagem é inválido.')); }
 });
}
