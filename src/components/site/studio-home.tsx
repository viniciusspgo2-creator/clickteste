"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleHelp, Coffee, Download, Gift, Infinity as InfinityIcon, Layers3,
  Lightbulb, LockKeyhole, MessageCircle, Move, Palette, ShieldCheck,
  Sparkles, Star, WandSparkles,
} from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import {
  LIBRARY_URL, SUPPORT_URL, DISCOVERY_SUPPORT_URL, BONUS_TOOLS,
} from "@/lib/studio-links";

const studioHref = "/mockup-caneca-3d/studio";
const experiences = [
  { id: "arte", icon: Palette, label: "Sua arte, em 3D", kicker: "DA IDEIA AO PRODUTO", title: "Sua criação. Outro ponto de vista.", description: "Aplique sua estampa na caneca, ajuste a posição e veja a composição ganhar volume. Experimente, gire e encontre o seu melhor ângulo.", art: "cafe", scene: "16-studio-creme", color: "#d79e55", tag: "Estampa + volume" },
  { id: "acabamento", icon: Sparkles, label: "Acabamento", kicker: "OS DETALHES FAZEM A DIFERENÇA", title: "O brilho que valoriza cada detalhe.", description: "Explore o acabamento da cerâmica, o verniz e os reflexos. Uma apresentação com profundidade, sem deixar sua arte em segundo plano.", art: "calma", scene: "18-studio-grafite", color: "#8f92ba", tag: "Cerâmica + reflexos" },
  { id: "luz", icon: Lightbulb, label: "Luz & cenário", kicker: "VOCÊ ASSINA A DIREÇÃO DE ARTE", title: "A atmosfera certa para a sua ideia.", description: "Combine cenários, fundos e iluminação. Do estúdio minimalista a uma cena acolhedora, dê contexto à sua criação.", art: "gratidao", scene: "15-varanda", color: "#74866a", tag: "Luz + atmosfera" },
  { id: "composicao", icon: Move, label: "Composição", kicker: "CADA CANECA NO SEU LUGAR", title: "Uma composição com a sua assinatura.", description: "Adicione outras canecas, ajuste posições e explore enquadramentos. Crie uma apresentação que conte a história da sua coleção.", art: "flork", scene: "01-madeira-nogueira", color: "#b38557", tag: "Posição + enquadramento" },
  { id: "exportacao", icon: Download, label: "Sua apresentação", kicker: "DA TELA PARA OS SEUS CLIENTES", title: "Pronto para fazer sua arte aparecer.", description: "Exporte imagens em alta resolução e vídeos nos formatos disponíveis. Apresente seu trabalho nas redes sociais e no WhatsApp.", art: "fe", scene: "04-marmore-branco", color: "#bfa26b", tag: "Imagem + vídeo" },
];
// Pré-visualizações enviadas pelo proprietário. Para adicionar novas artes:
// importe a imagem em public/cg-art-gallery e acrescente o objeto aqui.
const libraryArt = [
  { image: "cg-0613.webp", name: "Arte CG-0613" },
  { image: "cg-0695.webp", name: "Arte CG-0695" },
  { image: "cg-0748.webp", name: "Arte CG-0748" },
  { image: "cg-1095.webp", name: "Arte CG-1095" },
  { image: "cg-1098.webp", name: "Arte CG-1098" },
  { image: "cg-1169.webp", name: "Arte CG-1169" },
  { image: "cg-1215.webp", name: "Arte CG-1215" },
  { image: "cg-1353.webp", name: "Arte CG-1353" },
  { image: "cg-1997.webp", name: "Arte CG-1997" },
  { image: "cg-2059.webp", name: "Arte CG-2059" },
  { image: "cg-2107.webp", name: "Arte CG-2107" },
  { image: "cg-2159.webp", name: "Arte CG-2159" },
  { image: "cg-2718.webp", name: "Arte CG-2718" },
  { image: "cg-2736.webp", name: "Arte CG-2736" },
  { image: "cg-2897.webp", name: "Arte CG-2897" },
  { image: "cg-3014.webp", name: "Arte CG-3014" },
  { image: "cg-3028.webp", name: "Arte CG-3028" },
  { image: "cg-3034.webp", name: "Arte CG-3034" },
  { image: "cg-3075.webp", name: "Arte CG-3075" },
  { image: "cg-3100.webp", name: "Arte CG-3100" },
  { image: "cg-3269.webp", name: "Arte CG-3269" },
  { image: "cg-3395.webp", name: "Arte CG-3395" },
  { image: "cg-3405.webp", name: "Arte CG-3405" },
  { image: "cg-3640.webp", name: "Arte CG-3640" },
  { image: "cg-3649.webp", name: "Arte CG-3649" },
  { image: "cg-3817.webp", name: "Arte CG-3817" },
  { image: "cg-4014.webp", name: "Arte CG-4014" },
  { image: "cg-4123.webp", name: "Arte CG-4123" },
  { image: "cg-4140.webp", name: "Arte CG-4140" },
  { image: "cg-4255.webp", name: "Arte CG-4255" },
  { image: "cg-4269.webp", name: "Arte CG-4269" },
  { image: "cg-4270.webp", name: "Arte CG-4270" },
  { image: "cg-4312.webp", name: "Arte CG-4312" },
  { image: "cg-4509.webp", name: "Arte CG-4509" },
  { image: "cg-4511.webp", name: "Arte CG-4511" },
  { image: "cg-4566.webp", name: "Arte CG-4566" },
  { image: "cg-4584.webp", name: "Arte CG-4584" },
  { image: "cg-4588.webp", name: "Arte CG-4588" },
];
// A primeira parte desliza para a esquerda e a segunda para a direita.
const artRows = [libraryArt.slice(0,19), libraryArt.slice(19)];
function ArtCarousel() {
  return <div className="cg-gallery-viewport" aria-label="Galeria de artes para canecas" >
    {artRows.map((row, rowIndex) => <div className={`cg-gallery-rail cg-gallery-rail-${rowIndex}`} key={rowIndex}>
      {[0, 1].map(copy => <div className="cg-gallery-rail-group" key={copy} aria-hidden={copy===1}>
        {row.map(item => <article className="cg-gallery-card" key={`${copy}-${item.image}`}>
          <div className="cg-gallery-art"><Image src={`/cg-art-gallery-new/${item.image}`} alt={copy===0 ? `Exemplo de arte para caneca: ${item.name}` : ""} width={1100} height={500} sizes="(max-width: 620px) 245px, 320px" loading="lazy" /></div>
          <div className="cg-gallery-card-footer"><strong>{item.name}</strong><span>DA BIBLIOTECA <Sparkles size={13}/></span></div>
        </article>)}
      </div>)}
    </div>)}
  </div>;
}
const faqs = [
  { q: "Quem pode acessar o Studio Mockup 3D?", a: "O Studio é exclusivo para assinantes da Biblioteca de Artes Click & Gruda. Se você já tem a Biblioteca, solicite seu código pessoal ao suporte e entre no Studio sem uma cobrança adicional." },
  { q: "O que está incluso nos R$ 47,90?", a: "O valor é da Biblioteca de Artes: pagamento único e acesso vitalício a milhares de artes para canecas, organizadas por categorias, temas e datas sazonais, com atualizações. O Studio Mockup 3D está incluso para assinantes." },
  { q: "Posso conhecer a plataforma antes?", a: "Pode, sim. Chame nosso suporte pelo WhatsApp para conhecer a Biblioteca, entender os recursos do Studio e esclarecer suas dúvidas antes de adquirir o acesso." },
  { q: "Preciso instalar algum programa?", a: "Não. O Studio funciona direto no navegador. Para trabalhar com gráficos 3D, use um navegador atualizado e um dispositivo compatível com WebGL." },
  { q: "Posso usar minhas próprias artes?", a: "Sim. Você pode enviar suas imagens e ajustar a aplicação na caneca. Para o melhor resultado, use arquivos de boa resolução e confira o enquadramento antes de exportar." },
  { q: "Como recebo meu código de acesso?", a: "Após a confirmação da compra da Biblioteca, solicite seu código pessoal ao suporte. Se você já é assinante, fale com a equipe pelo WhatsApp para receber orientação de acesso." },
];
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .55, delay, ease: [.2, .8, .2, 1] }}>{children}</motion.div>;
}

/** An editorial illustration, explicitly labelled; the interactive renderer lives in the Studio. */
function MugPreview({ art = "cafe", className = "" }: { art?: string; className?: string }) {
  return <div className={`cg-product-mug ${className}`} aria-hidden="true" style={{ "--mug-art": `url('/cg-home/${art}.webp')` } as CSSProperties}>
    <div className="cg-product-handle" />
    <div className="cg-product-body"><div className="cg-product-print" /><div className="cg-product-glaze" /><div className="cg-product-rim" /></div>
    <div className="cg-product-shadow" />
  </div>;
}
function ExperiencePanels() {
  const [active, setActive] = useState("arte");
  return <div className="cg-experience-panels">
    {experiences.map((item, i) => {
      const open = active === item.id;
      return <article className={`cg-experience-panel ${open ? "is-expanded" : ""}`} key={item.id}
        style={{ "--panel-color": item.color } as CSSProperties} onMouseEnter={() => setActive(item.id)}>
        <Image src={`/mockup/backgrounds/${item.scene}.jpg`} alt="" fill sizes="(max-width: 700px) 100vw, 700px" className="cg-experience-background" />
        <div className="cg-experience-shade" />
        <div className="cg-experience-mug"><MugPreview art={item.art} />{item.id === "composicao" && <MugPreview art="cafe" className="cg-product-secondary" />}</div>
        <button type="button" className="cg-experience-trigger" aria-expanded={open} aria-controls={`experience-${item.id}`}
          onFocus={() => setActive(item.id)} onClick={() => setActive(item.id)}>
          <span className="cg-experience-index">0{i + 1}</span>
          <span className="cg-experience-label"><item.icon size={19} />{item.label}</span>
          <span className="cg-experience-toggle"><ArrowUpRight size={18} /></span>
        </button>
        <div id={`experience-${item.id}`} className="cg-experience-content" hidden={!open}>
          <span className="cg-experience-tag">{item.tag}</span>
          <span className="cg-eyebrow">{item.kicker}</span><h3>{item.title}</h3><p>{item.description}</p>
          <Link href={studioHref} className="cg-experience-link">Explorar no Studio <ArrowRight size={16} /></Link>
        </div>
      </article>;
    })}
  </div>;
}
export function StudioHome() {
  return <div className="cg-landing min-h-screen text-white">
    <Header />
    <main>
      <section id="inicio" className="cg-hero cg-hero-product cg-hero-wide relative isolate overflow-hidden">
        <div className="cg-hero-wide-backdrop" aria-hidden="true" />
        <div className="cg-container cg-hero-inner">
          <div className="cg-hero-content"><Reveal>
            <span className="cg-kicker"><Layers3 size={15} /> STUDIO MOCKUP 3D</span>
            <h1 className="cg-display cg-hero-title">Crie Mockups de<br /><em>Canecas em<br />Segundos.</em></h1>
            <p className="cg-hero-lead">Editor 3D profissional para criar mockups realistas de canecas personalizadas. Aplique sua arte e exporte em até 4K.</p>
            <div className="cg-hero-highlights" aria-label="Recursos em destaque">
              <span><ShieldCheck size={17} /> Realismo profissional</span>
              <span><Coffee size={17} /> Canecas, xícaras e chopp</span>
              <span><Layers3 size={17} /> Cenários prontos</span>
              <span><Move size={17} /> Rotação automática</span>
              <span><Download size={17} /> Exportação em até 4K</span>
              <span><WandSparkles size={17} /> Liberdade de ajustes</span>
            </div>
            <div className="cg-hero-actions">
              <Link href={studioHref} className="cg-button cg-button-primary"><WandSparkles size={19} /> Entrar no Studio <ArrowRight size={19} /></Link>
              <a href="#recursos-avancados" className="cg-button cg-button-outline"><BookOpen size={19} /> Conhecer os recursos <ArrowRight size={17} /></a>
            </div>
            <div className="cg-hero-proof"><span><ShieldCheck size={15} /> Código pessoal</span><span><InfinityIcon size={15} /> Biblioteca vitalícia</span><span><Coffee size={15} /> Studio incluso para assinantes</span></div>
          </Reveal></div>
        </div>
        <div className="cg-hero-mobile-visual" role="img" aria-label="Mascote da Click & Gruda segurando uma prensa de canecas diante do Studio 3D" />
        <div className="cg-container cg-hero-footnote"><span>FEITO PARA QUEM VIVE DE PERSONALIZAR.</span><a href="#studio">Explore as possibilidades <ChevronDown size={14} /></a></div>
      </section>

      <div className="cg-marquee" aria-label="Recursos do Studio"><div className="cg-marquee-track">{[0, 1].map(i => <div key={i} className="cg-marquee-items" aria-hidden={i === 1}>{["STUDIO MOCKUP 3D", "CERÂMICA & REFLEXOS", "LUZ DE ESTÚDIO", "SUA ARTE EM DESTAQUE", "COMPOSIÇÃO CRIATIVA", "BIBLIOTECA VITALÍCIA"].map(item => <span key={item}><Star size={12} fill="currentColor" />{item}</span>)}</div>)}</div></div>

      <section id="ferramentas" className="cg-creative-hub cg-container" aria-labelledby="cg-hub-heading">
        <div className="cg-creative-hub-top"><div><span className="cg-eyebrow"><Sparkles size={16}/> CENTRAL CRIATIVA</span><h2 id="cg-hub-heading" className="cg-display">Escolha o seu <em>próximo passo.</em></h2></div><p>Três ambientes independentes, feitos para trabalhar juntos. Entre apenas na ferramenta que precisa.</p></div>
        <div className="cg-creative-hub-grid">
          <Link href="/mockup-caneca-3d/studio" className="cg-hub-card"><span className="cg-hub-card-index">01 / REALISMO 3D</span><Coffee size={33}/><strong>Studio Mockup</strong><p>Estampe, gire, ilumine e apresente sua caneca com todos os controles do Studio.</p><span className="cg-hub-card-link">Entrar no Studio <ArrowUpRight size={17}/></span></Link>
          <Link href="/studio-templates" className="cg-hub-card"><span className="cg-hub-card-index">02 / COMPOSIÇÕES</span><Layers3 size={33}/><strong>Studio Templates</strong><p>Explore cenas e layouts importados pela administração para suas apresentações.</p><span className="cg-hub-card-link">Explorar templates <ArrowUpRight size={17}/></span></Link>
          <Link href="/editor-artes" className="cg-hub-card"><span className="cg-hub-card-index">03 / LIBERDADE CRIATIVA</span><Palette size={33}/><strong>Editor de Artes</strong><p>Componha artes com imagens, textos, formas, filtros e exportação em alta resolução.</p><span className="cg-hub-card-link">Criar uma arte <ArrowUpRight size={17}/></span></Link>
        </div>
      </section>

      <section id="studio" className="cg-section cg-experience-section"><div className="cg-container">
        <Reveal className="cg-experience-heading"><div><span className="cg-eyebrow"><Coffee size={16} /> SEU ESTÚDIO, SUAS POSSIBILIDADES</span><h2 className="cg-display">Mais do que mostrar.<br /><em>Faça sentir.</em></h2></div><p>Uma boa apresentação começa nos detalhes. Explore cada etapa e descubra o que você pode criar.<span>Passe o mouse, toque ou navegue com Tab.</span></p></Reveal>
        <ExperiencePanels />
        <p className="cg-experience-note">Imagens ilustrativas com artes da Biblioteca. A aparência no Studio depende da sua arte, da cena e dos ajustes escolhidos.</p>
      </div></section>

      <section id="recursos-avancados" className="cg-section cg-capabilities-section"><div className="cg-container">
        <Reveal className="cg-capabilities-heading"><div><span className="cg-eyebrow"><Sparkles size={16} /> POTÊNCIA CRIATIVA EM UM SÓ STUDIO</span><h2 className="cg-display">Não é só um mockup.<br /><em>É o seu estúdio de criação.</em></h2></div><p>Você decide a composição, o acabamento e a forma de apresentar cada produto. Do primeiro ajuste à exportação final.</p></Reveal>
        <div className="cg-capabilities-grid">{[
          { icon: Layers3, title: "Uma, duas, três ou quatro canecas", desc: "Monte composições individuais, em linha, em grupo ou com canecas empilhadas." },
          { icon: Move, title: "Liberdade de posicionamento", desc: "Mova, gire, redimensione e enquadre as peças para criar o cenário que imaginou." },
          { icon: Coffee, title: "Vários modelos de caneca", desc: "Explore formatos tradicionais e opções como canecas cônicas, xícaras e chopp." },
          { icon: Download, title: "Imagens e vídeos em até 4K", desc: "Exporte JPEG, PNG ou WebP, além de vídeos MP4 e WebM, conforme suporte do navegador." },
          { icon: Sparkles, title: "Transparência e canal alfa", desc: "Crie PNG sem fundo ou vídeo WebM com alfa para montar campanhas e apresentações." },
          { icon: Lightbulb, title: "Iluminação e reflexos", desc: "Ajuste verniz, brilho, luz e reflexos para valorizar a cerâmica e a estampa." },
          { icon: Palette, title: "Filtros e movimentos", desc: "Combine controles de cor, opções de rotação automática e ajustes de cena." },
          { icon: WandSparkles, title: "Cenários e fundos personalizados", desc: "Escolha ambientes prontos ou envie seu próprio fundo para compor o resultado." },
        ].map(item => <Reveal key={item.title} className="cg-capability-card"><div className="cg-capability-icon"><item.icon size={24} strokeWidth={1.8} /></div><h3>{item.title}</h3><p>{item.desc}</p></Reveal>)}</div>
        <div className="cg-capabilities-footer"><span>Algumas exportações avançadas dependem da compatibilidade e do desempenho do dispositivo e do navegador.</span><Link href={studioHref} className="cg-text-link">Explorar o Studio <ArrowRight size={17} /></Link></div>
      </div></section>

      <section className="cg-process-section"><div className="cg-container cg-process-layout"><Reveal><span className="cg-eyebrow"><WandSparkles size={16} /> MENOS ETAPAS. MAIS CRIATIVIDADE.</span><h2 className="cg-display">Sua ideia pronta<br />para <em>ser vista.</em></h2><p>Sem fotografar uma caneca a cada nova estampa. Teste combinações no navegador e encontre uma apresentação com a sua identidade.</p><Link href={studioHref} className="cg-text-link">Entrar com meu código <ArrowRight size={17} /></Link></Reveal><div className="cg-process-steps">{[
        { n: "01", title: "Traga sua arte", desc: "Envie uma imagem sua ou escolha uma arte da Biblioteca para começar." },
        { n: "02", title: "Encontre seu estilo", desc: "Ajuste a aplicação, experimente o acabamento e componha a luz da cena." },
        { n: "03", title: "Apresente com confiança", desc: "Confira os detalhes e exporte o resultado para mostrar aos seus clientes." },
      ].map(step => <Reveal key={step.n} className="cg-process-step"><span>{step.n}</span><div><h3>{step.title}</h3><p>{step.desc}</p></div><ArrowUpRight size={20} /></Reveal>)}</div></div></section>

      <section className="cg-section cg-library-section" id="biblioteca"><div className="cg-container">
        <Reveal className="cg-library-heading"><div><span className="cg-eyebrow"><BookOpen size={16} /> BIBLIOTECA DE ARTES CLICK & GRUDA</span><h2 className="cg-display">Milhares de ideias.<br /><em>Todas no seu lugar.</em></h2></div><div><p>Artes para canecas organizadas por categorias, temas e datas sazonais. Encontre aquela ideia para o Dia das Mães, uma frase para presentear ou o tema que o seu cliente pediu.</p><p><strong>Com atualizações e acesso vitalício.</strong> Mais tempo criando, menos tempo procurando arquivos.</p></div></Reveal>
        <ArtCarousel />
        <div className="cg-library-preview-foot"><span>Uma pequena amostra. Muitas outras possibilidades na Biblioteca.</span><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-text-link">Conhecer o acervo <ArrowUpRight size={16} /></a></div>
        <Reveal className="cg-library-benefits">{[{ icon: Layers3, title: "Milhares de artes", desc: "Um acervo para explorar e criar" }, { icon: BookOpen, title: "Tudo organizado", desc: "Categorias, temas e datas sazonais" }, { icon: Sparkles, title: "Com atualizações", desc: "Novas ideias para o seu trabalho" }, { icon: Coffee, title: "Studio incluso", desc: "Exclusivo para assinantes" }].map(f => <div key={f.title}><f.icon size={23} /><strong>{f.title}</strong><p>{f.desc}</p></div>)}</Reveal>
      </div></section>

      <section className="cg-section cg-access-section" id="acessos"><div className="cg-container cg-access-layout">
        <Reveal className="cg-access-copy"><span className="cg-eyebrow"><LockKeyhole size={16} /> UM ACESSO. MUITAS POSSIBILIDADES.</span><h2 className="cg-display">A Biblioteca é sua.<br />O Studio <em>vem junto.</em></h2><p>O Studio Mockup 3D é um benefício exclusivo para assinantes da Biblioteca de Artes. Um lugar para encontrar suas próximas estampas e uma ferramenta para apresentá-las.</p><ul>{["Milhares de artes para canecas", "Categorias, temas e datas sazonais", "Atualizações do acervo", "Studio Mockup 3D incluso para assinantes"].map(item => <li key={item}><Check size={17} />{item}</li>)}</ul><div className="cg-access-existing"><BadgeCheck size={23} /><div><strong>Já faz parte da Biblioteca?</strong><span>Solicite seu código pessoal e entre no Studio.</span><a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">Pedir meu código <ArrowUpRight size={14} /></a></div></div></Reveal>
        <Reveal className="cg-membership-card"><span className="cg-membership-tag"><InfinityIcon size={16} /> ACESSO VITALÍCIO À BIBLIOTECA</span><div className="cg-membership-art"><Image src="/cg-home/logo-clickgruda.webp" alt="Click & Gruda" width={180} height={42} /><BookOpen size={43} strokeWidth={1.2} /></div><h3>Biblioteca de Artes</h3><p>Seu próximo projeto começa aqui.</p><div className="cg-membership-price" aria-label="47 reais e 90 centavos"><span className="cg-price-currency">R$</span><span className="cg-price-reais">47</span><span className="cg-price-cents">,90</span></div><span className="cg-membership-cadence">Pagamento único · sem mensalidade</span><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-primary">Quero conhecer a Biblioteca <ArrowUpRight size={18} /></a><div className="cg-membership-note"><ShieldCheck size={16} /><span>Studio 3D incluso para assinantes.<br />Confira os detalhes na página da Biblioteca.</span></div></Reveal>
      </div></section>

      <section className="cg-section cg-faq-section" id="faq"><div className="cg-container cg-faq-layout"><Reveal><span className="cg-eyebrow"><CircleHelp size={16} /> ANTES DE COMEÇAR</span><h2 className="cg-display">Boas ideias.<br /><em>Nenhuma dúvida.</em></h2><p>Quer conhecer antes? Nossa equipe te ajuda a entender como tudo funciona.</p><a href={DISCOVERY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-outline cg-faq-discovery"><MessageCircle size={18} /> Chamar o suporte no WhatsApp <ArrowUpRight size={15} /></a></Reveal><div className="cg-faq-list">{faqs.map((faq, i) => <details key={faq.q} className="cg-faq-item" open={i === 0}><summary><span>{faq.q}</span><ChevronDown size={20} /></summary><p>{faq.a}</p></details>)}</div></div></section>

      <section className="cg-bonus-compact"><div className="cg-container"><Reveal className="cg-bonus-compact-heading"><div><span className="cg-eyebrow"><Gift size={16} /> UM EXTRA PARA O SEU DIA A DIA</span><h2 className="cg-display">Pequenas ferramentas.<br /><em>Uma boa ajuda.</em></h2><p>Além do Studio, cinco utilitários gratuitos para facilitar sua rotina.</p></div><Link href="/bonus" className="cg-button cg-button-outline">Explorar os bônus <ArrowRight size={17} /></Link></Reveal><div className="cg-bonus-chip-list">{BONUS_TOOLS.map(t => <Link key={t.id} href={`/bonus/${t.id}`}>{t.title}<ArrowUpRight size={15} /></Link>)}</div></div></section>

      <section className="cg-container cg-bottom-space"><Reveal className="cg-final-cta cg-final-product cg-final-cinematic"><div className="cg-final-copy"><span className="cg-eyebrow"><Sparkles size={16} /> A PRÓXIMA CRIAÇÃO É SUA</span><h2 className="cg-display">Sua arte já é especial.<br /><em>Mostre isso.</em></h2><p>Da sua criação ao mockup profissional. Controle a apresentação, impressione seu cliente e destaque cada detalhe.</p><div className="cg-final-actions"><Link href={studioHref} className="cg-button cg-button-primary">Entrar no Studio <ArrowRight size={18} /></Link><a href={DISCOVERY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-outline"><MessageCircle size={17} /> Quero conhecer antes</a></div></div></Reveal></section>
    </main><Footer />
  </div>;
}
