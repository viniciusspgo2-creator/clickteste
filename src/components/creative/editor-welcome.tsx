import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight, ExternalLink, Monitor, Layers3, Palette,
  Download, Link2, ImageUp, Lightbulb, Sparkles, Play, Zap,
  Paintbrush2, MoveUpRight, GraduationCap, PackageOpen, WandSparkles,
} from 'lucide-react';
import {editorBrandResources, editorDriveCollections, guruOffers} from '@/lib/editor-resources';
import {BrandIcon, GuruToolsCarousel} from './guru-tools-carousel';
import './editor-welcome.css';

type Brand={readonly name:string;readonly domain:string;readonly url:string};

function BrandLink({brand}: {brand:Brand}) {
  return <a className="ew-brand-link" href={brand.url} target="_blank" rel="noopener noreferrer" title={`Abrir ${brand.name} em nova aba`}>
    <BrandIcon domain={brand.domain} name={brand.name}/>
    <span>{brand.name}</span><ExternalLink className="ew-link-external" size={13} aria-hidden="true"/>
  </a>;
}

function BrandList({brands}: {brands:readonly Brand[]}) {
  return <div className="ew-brand-list">{brands.map(b=><BrandLink brand={b} key={b.name}/>)}</div>;
}

const driveIllustrations: Record<string, string> = {
  pattern: '/editor-welcome/resource-pattern.webp',
  character: '/editor-welcome/resource-character.webp',
  shapes: '/editor-welcome/resource-shapes.webp',
  folder: '/editor-welcome/resource-folder.webp',
};

function DriveArt({icon}: {icon:string}) {
  return <span className="ew-drive-illustration" aria-hidden="true">
    <Image src={driveIllustrations[icon] ?? driveIllustrations.folder}
      alt="" width={112} height={92} className="ew-resource-3d"/>
  </span>;
}

function DriveCollectionCard({entry}: {entry:typeof editorDriveCollections[number]}) {
  const contents=<><DriveArt icon={entry.icon}/><div className="ew-drive-card-copy"><h3>{entry.title}</h3><span className="ew-mini-action">{entry.url?'Acessar':'Em breve'} <ArrowRight size={14}/></span></div></>;
  return entry.url
    ? <a className="ew-drive-card ew-drive-card--active" href={entry.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${entry.title} no Google Drive, em nova aba`} title={entry.description}>{contents}</a>
    : <div className="ew-drive-card ew-drive-card--pending" title="Link do Google Drive ainda não configurado" aria-label={`${entry.title}: link em breve`}>{contents}</div>;
}

export function EditorWelcome({editorHref}:{editorHref:string}) {
  const hasPendingDrive = editorDriveCollections.some(entry => !entry.url);
  return <main className="editor-welcome">
    <div className="ew-page-shell">
      <header className="ew-header">
        <Link href="/" className="ew-brand"><ArrowLeft size={18} aria-hidden="true"/><span>Click <b>&</b> Gruda</span></Link>
        <span className="ew-header-label">STUDIO CLICK <span aria-hidden="true">·</span> EDITOR 2D</span>
      </header>

      <section className="ew-hero" aria-labelledby="ew-title">
        <div className="ew-hero-sheen" aria-hidden="true"/>
        <div className="ew-hero-content">
          <span className="ew-eyebrow">SEU ESPAÇO DE CRIAÇÃO</span>
          <h1 id="ew-title">Seu espaço criativo<br/><em>começa aqui</em></h1>
          <p>Acesse o Studio Click, baixe recursos, descubra links úteis e acelere sua produção.</p>
          <Link className="ew-enter" href={editorHref} prefetch={false}><Monitor size={25} aria-hidden="true"/><span>Entrar no editor</span><ArrowRight size={23} aria-hidden="true"/></Link>
        </div>
        <span className="ew-hero-glow" aria-hidden="true"/>
      </section>

      <section className="ew-panel ew-drive-section" aria-labelledby="ew-drive-title">
        <div className="ew-drive-heading">
          <span className="ew-gdrive-mark"><BrandIcon name="Google Drive" domain="drive.google.com" size={40}/></span>
          <div><span className="ew-kicker">BIBLIOTECA DE RECURSOS</span><h2 id="ew-drive-title">Downloads no <strong>Google Drive</strong></h2></div>
          <p>Encontre materiais para criar suas próprias artes: fundos, personagens e milhares de possibilidades.</p>
        </div>
        <div className="ew-drive-grid">{editorDriveCollections.map(item=><DriveCollectionCard entry={item} key={item.id}/>)}</div>
        <p className="ew-drive-footnote"><Download size={14} aria-hidden="true"/> Selecione uma pasta para acessar o acervo. Pastas ainda sem link aparecem como “Em breve”.</p>
      </section>

      <section className="ew-panel ew-links-section" aria-labelledby="ew-links-title">
        <div className="ew-section-heading"><Link2 size={23} aria-hidden="true"/><h2 id="ew-links-title">Links úteis</h2><span>Ferramentas que facilitam o dia a dia</span></div>
        <div className="ew-utility-grid">
          <article className="ew-utility-card">
            <span className="ew-utility-icon"><ImageUp size={34}/></span>
            <div className="ew-utility-body"><h3>Remover fundos gratuitamente</h3><p>Remova o fundo da sua imagem em poucos cliques. Consulte as condições de download em cada serviço.</p><BrandList brands={editorBrandResources.backgroundRemovers}/></div>
          </article>
          <article className="ew-utility-card">
            <span className="ew-utility-icon"><WandSparkles size={35}/></span>
            <div className="ew-utility-body"><h3>Melhorar qualidade de uma arte</h3><p>Recupere detalhes de imagens pixelizadas ou em baixa resolução com inteligência artificial.</p><BrandList brands={editorBrandResources.enhance}/></div>
          </article>
        </div>
      </section>

      <section className="ew-discovery-grid" aria-label="Inspiração e recursos gráficos">
        <article className="ew-panel ew-discovery-card">
          <div className="ew-section-heading"><Lightbulb size={24}/><h2>Referências e ideias</h2></div>
          <p>Explore novos estilos, paletas, ideias e composições para montar suas próprias artes.</p>
          <BrandList brands={editorBrandResources.inspiration}/>
        </article>
        <article className="ew-panel ew-discovery-card">
          <div className="ew-section-heading"><Layers3 size={24}/><h2>Recursos e inspiração</h2></div>
          <p>Encontre vetores, ilustrações, fotografias, PNGs e outros materiais para criar.</p>
          <BrandList brands={editorBrandResources.assets}/>
        </article>
      </section>

      <section className="ew-coming-section" aria-label="Em breve, dicas e tutoriais">
        <div className="ew-coming-card"><span><Palette size={26}/></span><div><b>Banners informativos</b><small>Novidades e materiais em destaque</small></div><span className="ew-soon">Em breve</span></div>
        <div className="ew-coming-card"><span><Play size={25}/></span><div><b>Vídeos e tutoriais</b><small>Aprenda com vídeos passo a passo</small></div><span className="ew-soon">Em breve</span></div>
        <div className="ew-coming-card"><span><GraduationCap size={27}/></span><div><b>Instruções e dicas</b><small>Dicas para evoluir suas criações</small></div><span className="ew-soon">Em breve</span></div>
      </section>

      <section className="ew-guru" aria-labelledby="ew-guru-title">
        <div className="ew-guru-content">
          <div className="ew-guru-visual"><Image src="/editor-welcome/guru-mascot.webp" alt="Mascote Click & Gruda ao lado de uma prensa de canecas" width={890} height={508} sizes="(max-width: 850px) 100vw, 36vw"/><span className="ew-guru-visual-title">FERRAMENTAS <b>GURU</b></span></div>
          <div className="ew-guru-info">
            <div className="ew-guru-topline"><Sparkles size={16}/> PARCERIA PARA SUA CRIATIVIDADE</div>
            <h2 id="ew-guru-title">Ferramentas de IA e produtividade <em>para elevar suas criações.</em></h2>
            <p>Potencialize suas artes, vídeos, imagens e ideias com acesso compartilhado a diversas ferramentas em um só lugar.</p>
            <div className="ew-guru-benefits"><span><Zap size={23}/> Acelere sua produção</span><span><PackageOpen size={23}/> Muitas ferramentas num lugar</span><span><Paintbrush2 size={23}/> IA, design e produtividade</span></div>
            <div className="ew-guru-actions">
              <a href={guruOffers.month.url} target="_blank" rel="sponsored noopener noreferrer" className="ew-offer-button">30 dias <b>{guruOffers.month.price}</b><MoveUpRight size={16}/></a>
              <a href={guruOffers.quarter.url} target="_blank" rel="sponsored noopener noreferrer" className="ew-offer-button">3 meses <b>{guruOffers.quarter.price}</b><MoveUpRight size={16}/></a>
              <Link href="/editor-artes/ferramentas-guru" className="ew-more-button">Saiba mais <ArrowRight size={19}/></Link>
            </div>
            <p className="ew-partner-note">Link de afiliado. A assinatura e o suporte são fornecidos pela Ferramentas Guru. Catálogo e condições podem mudar.</p>
          </div>
        </div>
        <GuruToolsCarousel compact/>
      </section>

      <footer className="ew-footer">
        <span className="ew-footer-rule" aria-hidden="true"/>
        <Image src="/editor-welcome/brand-footer.webp" alt="Click & Gruda" width={255} height={190} sizes="255px"/>
        <span className="ew-footer-rule" aria-hidden="true"/>
        <p>Feito para quem transforma criatividade em arte.</p>
      </footer>
    </div>
  </main>;
}
