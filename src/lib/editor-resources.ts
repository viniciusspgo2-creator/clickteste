/**
 * URLs das quatro coleções do Google Drive.
 * Configure as variáveis NEXT_PUBLIC_EDITOR_DRIVE_* na Vercel.
 * Links não configurados nunca apontam para uma pasta inventada.
 */
function googleDriveUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(url.hostname)
      ? url.toString() : null;
  } catch { return null; }
}

export const editorDriveCollections = [
  { id: 'fundos', title: 'Fundos e padrões', description: 'Texturas, cenários, estampas e composições.', icon: 'pattern', url: googleDriveUrl(process.env.NEXT_PUBLIC_EDITOR_DRIVE_FUNDOS_URL) },
  { id: 'personagens', title: 'Personagens', description: 'Personagens para personalizar suas artes.', icon: 'character', url: googleDriveUrl(process.env.NEXT_PUBLIC_EDITOR_DRIVE_PERSONAGENS_URL) },
  { id: 'formas', title: 'Formas e elementos', description: 'Elementos decorativos, formas e detalhes.', icon: 'shapes', url: googleDriveUrl(process.env.NEXT_PUBLIC_EDITOR_DRIVE_FORMAS_URL) },
  { id: 'diversos', title: 'Diversos e extras', description: 'Materiais complementares para criar.', icon: 'folder', url: googleDriveUrl(process.env.NEXT_PUBLIC_EDITOR_DRIVE_DIVERSOS_URL) },
] as const;

export const editorBrandResources = {
  backgroundRemovers: [
    { name: 'Pixelcut', domain: 'pixelcut.ai', url: 'https://www.pixelcut.ai/pt-br/remover-fundo' },
    { name: 'Photoroom', domain: 'photoroom.com', url: 'https://www.photoroom.com/tools/background-remover' },
    { name: 'Remove.bg', domain: 'remove.bg', url: 'https://www.remove.bg/pt-br' },
  ],
  enhance: [
    { name: 'Picsart', domain: 'picsart.com', url: 'https://picsart.com/pt/ai-image-enhancer/unpixelate-image/' },
  ],
  inspiration: [
    { name: 'Pinterest', domain: 'pinterest.com', url: 'https://br.pinterest.com/' },
    { name: 'Cosmos', domain: 'cosmos.so', url: 'https://www.cosmos.so/' },
    { name: 'Dribbble', domain: 'dribbble.com', url: 'https://dribbble.com/' },
    { name: 'Behance', domain: 'behance.net', url: 'https://www.behance.net/' },
  ],
  assets: [
    { name: 'Freepik', domain: 'freepik.com', url: 'https://www.freepik.com' },
    { name: 'Vecteezy', domain: 'vecteezy.com', url: 'https://www.vecteezy.com' },
    { name: 'Pngtree', domain: 'pngtree.com', url: 'https://pngtree.com' },
  ],
} as const;

/** Links informados pelo parceiro, não links genéricos de checkout. */
export const guruOffers = {
  month: { label: '30 dias', price: 'R$ 67,00', url: 'https://pay.cakto.com.br/9KnSC7H?affiliate=SFdcYeVv' },
  quarter: { label: '3 meses', price: 'R$ 177,00', url: 'https://pay.cakto.com.br/32e8spj?affiliate=SFdcYeVv' },
} as const;

/** Marcas exemplificativas citadas no catálogo público Ferramentas Guru; oferta sujeita a alteração. */
export const guruBrands = [
  { name: 'ChatGPT', domain: 'chatgpt.com' },
  { name: 'Claude', domain: 'claude.ai' },
  { name: 'Midjourney', domain: 'midjourney.com' },
  { name: 'ElevenLabs', domain: 'elevenlabs.io' },
  { name: 'Google Flow', domain: 'labs.google' },
  { name: 'Kling', domain: 'klingai.com' },
  { name: 'Runway', domain: 'runwayml.com' },
  { name: 'Canva', domain: 'canva.com' },
  { name: 'Adobe', domain: 'adobe.com' },
  { name: 'Hailuo AI', domain: 'hailuoai.video' },
  { name: 'Higgsfield', domain: 'higgsfield.ai' },
  { name: 'Luma AI', domain: 'lumalabs.ai' },
] as const;
