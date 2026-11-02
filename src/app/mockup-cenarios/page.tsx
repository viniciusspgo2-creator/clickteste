import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import "@/components/tools/mockup-scenes/scenes.css";
export const metadata: Metadata = {
  title: { absolute: "Mockup de Cenários para Canecas | Click & Gruda" },
  description:
    "Aplique sua arte pronta em canecas, monte composições com cenários sazonais e confira a prévia antes de exportar em PNG ou JPEG.",
  alternates: { canonical: "/mockup-cenarios" },
};
export default function ScenesPage() {
  return (
    <div className="sc-scope sc-landing">
      <header className="sc-header">
        <Link href="/" className="sc-brand">
          <span className="sc-brand-icon">
            <Layers3 size={22} />
          </span>
          <span>
            <strong>Mockup de Cenários</strong>
            <small>CLICK & GRUDA</small>
          </span>
        </Link>
        <div className="sc-header-actions">
          <Link href="/mockup-caneca-3d" className="sc-text-link">
            Conhecer o Studio 3D ↗
          </Link>
          <Link href="/mockup-cenarios/editor" className="sc-primary">
            Abrir editor <ArrowRight size={15} />
          </Link>
        </div>
      </header>
      <main>
        <div className="sc-landing-main">
          <div className="sc-landing-copy">
            <span className="sc-eyebrow">
              <ImageIcon size={15} /> SUA ARTE, EM UM NOVO CENÁRIO
            </span>
            <h1>
              Uma boa arte.
              <br />
              Um cenário
              <br />
              <em>à altura.</em>
            </h1>
            <p>
              Transforme sua arte pronta em uma apresentação de caneca. Escolha
              a composição, encontre o cenário e dê o seu toque em cada detalhe.
            </p>
            <Link href="/mockup-cenarios/editor" className="sc-primary">
              Criar meu mockup <ArrowRight size={17} />
            </Link>
            <div className="sc-landing-detail">
              <span>
                <Check size={12} /> PNG & JPEG em alta resolução
              </span>
              <span>
                <ShieldCheck size={12} /> Prévia antes do download
              </span>
            </div>
          </div>
          <div className="sc-landing-art">
            <img
              src="/mockup-scenes/showcase.jpg"
              width="1100"
              height="1100"
              alt="Composição de canecas com arte aplicada em um cenário de estúdio natural"
            />
            <div className="sc-landing-caption">
              <span>PORCELANA · STUDIO NATURAL</span>
              <span>Feito no Mockup de Cenários ↗</span>
            </div>
          </div>
        </div>
        <div className="sc-landing-steps">
          <section>
            <span>01 / SUA ARTE</span>
            <h2>Pronta para uma nova apresentação.</h2>
            <p>
              Envie a estampa pronta. A imagem mantém sua proporção e acompanha
              a curvatura do modelo.
            </p>
          </section>
          <section>
            <span>02 / SEU CENÁRIO</span>
            <h2>Cada ocasião tem seu clima.</h2>
            <p>
              Use os fundos do catálogo ou envie o seu. Combine canecas, ajuste
              posições e inclua seu logotipo.
            </p>
          </section>
          <section>
            <span>03 / SEU MOCKUP</span>
            <h2>Confira. Depois, compartilhe.</h2>
            <p>
              Veja a prévia exata do arquivo final e baixe em PNG ou JPEG, com
              até 4096 px no maior lado.
            </p>
          </section>
        </div>
      </main>
      <footer className="sc-landing-footer">
        <span>Click & Gruda · Mockup de Cenários</span>
        <p>
          Quer criar com giro, câmera e vídeo?{" "}
          <Link href="/mockup-caneca-3d">Conheça o Studio 3D →</Link>
        </p>
      </footer>
    </div>
  );
}
