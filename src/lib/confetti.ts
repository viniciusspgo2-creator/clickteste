'use client';

/* Confetti leve feito com canvas — sem dependências */
export function confetti(durationMs = 1800, count = 120) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#e8703a', '#ffab7e', '#25d366', '#f3ede4', '#f2b56b'];
  const parts = Array.from({ length: count }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 220,
    y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
    vx: (Math.random() - 0.5) * 9,
    vy: Math.random() * -11 - 3,
    size: 5 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
  }));

  const start = performance.now();
  const frame = (t: number) => {
    const elapsed = t - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const gravity = 0.28;
    for (const p of parts) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / durationMs);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
