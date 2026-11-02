/* ============================================================
   Beacon de visitas (client-side) — leve e anônimo
   ============================================================ */

export function trackPage(path: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (path.startsWith('/admin') || path.startsWith('/api')) return;

    let sid = sessionStorage.getItem('cg_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('cg_sid', sid);
    }

    const body = JSON.stringify({ path, sid });
    // keepalive garante o envio mesmo em navegação
    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* silencioso — analytics não pode quebrar a página */
  }
}
