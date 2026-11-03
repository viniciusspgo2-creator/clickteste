'use client';

/* Ilustrações SVG feitas à mão para os banners exclusivos da home.
   Tudo animado via classes CSS (twinkle, steam, signal, play-glow). */

function Sparkle({
  x, y, size = 12, fill = '#fff', delay = 0,
}: { x: number; y: number; size?: number; fill?: string; delay?: number }) {
  const s = size;
  const d = `M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`;
  return <path d={d} fill={fill} className="twinkle" style={{ animationDelay: `${delay}s` }} />;
}

function Steam({ x, y, scale = 1, delay = 0 }: { x: number; y: number; scale?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="steam" style={{ animationDelay: `${delay}s` }}>
        <path d="M0 0 q 12 -14 0 -28 q -12 -14 0 -28" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

function MugBase({
  w, h, body, rim, inner, handleColor, handleSide = 'right',
}: {
  w: number; h: number; body: string; rim: string; inner: string; handleColor: string; handleSide?: 'left' | 'right';
}) {
  const hw = w * 0.36;
  const hy = h * 0.28;
  return (
    <>
      {/* alça (desenhada antes para ficar atrás do corpo) */}
      <g transform={handleSide === 'left' ? `translate(${w} 0) scale(-1 1)` : undefined}>
        <path
          d={`M${w} ${hy} q ${hw} 4 ${hw - 8} ${h * 0.17} q -4 ${h * 0.2} ${-(hw - 8)} ${h * 0.24}`}
          fill="none" stroke={handleColor} strokeWidth="13" strokeLinecap="round"
        />
      </g>
      {/* corpo com base arredondada */}
      <path
        d={`M0 6 L${w} 6 L${w} ${h - 24} Q${w} ${h} ${w - 26} ${h} L26 ${h} Q0 ${h} 0 ${h - 24} Z`}
        fill={body}
      />
      {/* borda superior */}
      <ellipse cx={w / 2} cy="6" rx={w / 2 + 3} ry="11" fill={rim} />
      <ellipse cx={w / 2} cy="6" rx={w / 2 - 13} ry="6.5" fill={inner} />
    </>
  );
}

/** Prateleira com 3 canecas personalizadas — banner Biblioteca de Artes */
export function MugsIllustration() {
  return (
    <svg viewBox="0 0 560 430" className="h-auto w-full" role="img" aria-label="Prateleira com canecas personalizadas">
      <defs>
        <radialGradient id="mugGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mugWhite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f2e7d9" />
        </linearGradient>
        <linearGradient id="mugCream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf3e3" />
          <stop offset="100%" stopColor="#f4ddc0" />
        </linearGradient>
      </defs>

      {/* fundo */}
      <circle cx="285" cy="225" r="205" fill="url(#mugGlow)" />
      <circle cx="500" cy="80" r="58" fill="none" stroke="#1c120b" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="4 9" />
      <circle cx="52" cy="128" r="36" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="4 9" />

      {/* prateleira */}
      <rect x="58" y="352" width="444" height="16" rx="8" fill="#221208" />
      <rect x="66" y="370" width="428" height="5" rx="2.5" fill="#1a0d06" opacity="0.5" />

      {/* caneca preta com raio */}
      <g transform="translate(86 232)">
        <g className="text-white/70"><Steam x={62} y={-18} /></g>
        <MugBase w={118} h={120} body="#1d130d" rim="#332015" inner="#0c0705" handleColor="#1d130d" handleSide="left" />
        <path d="M56 52 L74 52 L64 68 L76 68 L50 96 L59 72 L46 72 Z" fill="#ffab7e" />
        <circle cx="92" cy="48" r="3" fill="#ffffff" opacity="0.75" />
        <circle cx="30" cy="90" r="2.5" fill="#ffab7e" opacity="0.85" />
      </g>

      {/* caneca branca (hero) com coração CG */}
      <g transform="translate(208 178)">
        <g className="text-white/80"><Steam x={92} y={-22} scale={1.25} delay={0.6} /></g>
        <g className="text-white/60"><Steam x={48} y={-22} scale={0.9} delay={1.5} /></g>
        <MugBase w={150} h={174} body="url(#mugWhite)" rim="#e7d8c6" inner="#d5c3ac" handleColor="#ffffff" />
        <g transform="translate(55 86)">
          <path d="M0 10 C0 -2 14 -9 20 0 C26 -9 40 -2 40 10 C40 24 20 35 20 35 C20 35 0 24 0 10 Z" fill="#e8703a" />
          <text x="20" y="18" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff4ea" fontFamily="var(--font-display), sans-serif">&amp;</text>
        </g>
        <text x="75" y="150" textAnchor="middle" fontSize="10.5" fontWeight="700" letterSpacing="2.6" fill="#b9845c" fontFamily="var(--font-display), sans-serif">CLICK &amp; GRUDA</text>
      </g>

      {/* caneca creme listrada */}
      <g transform="translate(388 236)">
        <g className="text-white/70"><Steam x={56} y={-18} delay={1} scale={0.85} /></g>
        <MugBase w={112} h={116} body="url(#mugCream)" rim="#e2c9a4" inner="#d2b78f" handleColor="#f6e7d2" />
        <rect x="0" y="40" width="112" height="11" fill="#1d130d" opacity="0.85" />
        <rect x="0" y="58" width="112" height="11" fill="#e8703a" />
        <rect x="0" y="76" width="112" height="11" fill="#1d130d" opacity="0.85" />
        <path d="M40 100 L48 100 L44 108 Z" fill="#e8703a" opacity="0.9" />
      </g>

      {/* brilhos */}
      <Sparkle x={150} y={118} size={13} fill="#ffffff" />
      <Sparkle x={470} y={148} size={10} fill="#221208" delay={0.8} />
      <Sparkle x={60} y={212} size={9} fill="#ffffff" delay={1.5} />
      <Sparkle x={505} y={288} size={12} fill="#ffffff" delay={0.4} />
      <Sparkle x={300} y={62} size={11} fill="#221208" delay={1.1} />
    </svg>
  );
}

/** Caneca do Mockup Studio: metade mágica (preta) revelando arte,
    em plataforma giratória com chips de UI — banner MOCKUP 3D */
export function MockupStudioIllustration() {
  return (
    <svg viewBox="0 0 560 430" className="h-auto w-full" role="img" aria-label="Caneca em estúdio 3D com revelação térmica">
      <defs>
        <radialGradient id="mkGlow" cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mkArt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8703a" />
          <stop offset="55%" stopColor="#f4a259" />
          <stop offset="100%" stopColor="#ffd9a0" />
        </linearGradient>
        <linearGradient id="mkBlack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b2622" />
          <stop offset="100%" stopColor="#161211" />
        </linearGradient>
        <linearGradient id="mkDisc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a332c" />
          <stop offset="100%" stopColor="#211c17" />
        </linearGradient>
        <clipPath id="mkHalf">
          <rect x="0" y="0" width="230" height="300" />
        </clipPath>
      </defs>

      {/* fundo */}
      <circle cx="280" cy="220" r="205" fill="url(#mkGlow)" />
      <circle cx="495" cy="82" r="52" fill="none" stroke="#fbbf24" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="4 9" />
      <circle cx="58" cy="132" r="34" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="4 9" />

      {/* moldura de câmera */}
      <g stroke="#fbbf24" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M96 74 L96 52 Q96 42 106 42 L128 42" />
        <path d="M464 74 L464 52 Q464 42 454 42 L432 42" />
        <path d="M96 346 L96 368 Q96 378 106 378 L128 378" />
        <path d="M464 346 L464 368 Q464 378 454 378 L432 378" />
      </g>
      <circle cx="497" cy="45" r="5" fill="#f87171" className="pulse-dot" />
      <rect x="512" y="39" width="4" height="12" rx="2" fill="#fbbf24" />

      {/* plataforma giratória */}
      <ellipse cx="280" cy="356" rx="168" ry="34" fill="url(#mkDisc)" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="2" />
      <ellipse cx="280" cy="350" rx="146" ry="26" fill="none" stroke="#fbbf24" strokeOpacity="0.28" strokeWidth="1.6" strokeDasharray="10 14" className="floaty-slow" />
      <g className="floaty-slow" style={{ transformOrigin: '280px 350px' }}>
        <path d="M280 324 L280 376" stroke="#fbbf24" strokeOpacity="0.4" strokeWidth="2" />
      </g>

      {/* alça */}
      <path
        d="M392 140 q 86 8 76 66 q -10 62 -80 74"
        fill="none" stroke="#1c1712" strokeWidth="24" strokeLinecap="round"
      />
      <path
        d="M392 146 q 72 8 64 58 q -9 50 -68 62"
        fill="none" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" className="twinkle" />

      {/* corpo: metade preta (mágica) */}
      <path
        d="M172 62 L388 62 L388 300 Q388 344 336 344 L224 344 Q172 344 172 300 Z"
        fill="url(#mkBlack)"
      />
      {/* metade com arte revelada (esquerda) */}
      <g clipPath="url(#mkHalf)">
        <path
          d="M172 62 L388 62 L388 300 Q388 344 336 344 L224 344 Q172 344 172 300 Z"
          fill="url(#mkArt)"
        />
        <g stroke="#7c2d12" strokeOpacity="0.65" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M212 132 q 34 -30 68 0 q 34 30 68 0" />
          <path d="M212 178 q 34 -30 68 0 q 34 30 68 0" />
          <path d="M212 224 q 34 -30 68 0 q 34 30 68 0" />
        </g>
        <circle cx="282" cy="112" r="20" fill="#7c2d12" opacity="0.8" />
        <path d="M282 96 q 10 10 0 20 q -10 10 0 18" stroke="#ffd9a0" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* borda de revelação */}
        <rect x="224" y="62" width="12" height="282" fill="#fbbf24" opacity="0.55" />
      </g>

      {/* brilho de vidro */}
      <path d="M196 84 q -6 90 4 218" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M212 88 q -4 80 2 180" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* borda superior */}
      <ellipse cx="280" cy="62" rx="108" ry="17" fill="#0f0c0a" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="3" />
      <ellipse cx="280" cy="62" rx="88" ry="11" fill="#0a0806" />
      <Steam x={280} y={44} scale={0.85} delay={0.3} />
      <Steam x={318} y={46} scale={0.6} delay={1.2} />

      {/* sombra */}
      <ellipse cx="280" cy="366" rx="120" ry="14" fill="#000000" opacity="0.45" />

      {/* chips de UI */}
      <g className="floaty">
        <rect x="52" y="196" width="118" height="38" rx="19" fill="#1d130d" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="2" />
        <text x="70" y="220" fontSize="15" fontWeight="700" fill="#fbbf24" fontFamily="monospace">4K · PNG</text>
      </g>
      <g className="floaty" style={{ animationDelay: '0.8s' }}>
        <rect x="398" y="188" width="126" height="38" rx="19" fill="#1d130d" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="2" />
        <text x="416" y="212" fontSize="15" fontWeight="700" fill="#fbbf24" fontFamily="monospace">MP4 · GIF</text>
      </g>
      <g className="floaty" style={{ animationDelay: '1.5s' }}>
        <rect x="76" y="284" width="132" height="38" rx="19" fill="#1d130d" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="2" />
        <text x="92" y="308" fontSize="14" fontWeight="700" fill="#fbbf24" fontFamily="monospace">fundo alfa</text>
      </g>

      {/* brilhos */}
      <Sparkle x={120} y={92} size={11} fill="#fbbf24" />
      <Sparkle x={462} y={128} size={9} fill="#ffffff" delay={0.8} />
      <Sparkle x={500} y={264} size={10} fill="#fbbf24" delay={1.3} />
      <Sparkle x={72} y={150} size={8} fill="#ffffff" delay={0.4} />
    </svg>
  );
}
