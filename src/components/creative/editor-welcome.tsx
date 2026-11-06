import Link from 'next/link';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import './editor-welcome.css';

export function EditorWelcome({editorHref}:{editorHref:string}){
 return <main className="editor-welcome">
  <header className="ew-header"><Link href="/" className="ew-brand"><ArrowLeft size={18}/> Click <b>&</b> Gruda</Link><span>STUDIO CLICK · EDITOR 2D</span></header>
  <section className="ew-start" aria-labelledby="ew-title">
   <div><span className="ew-eyebrow">SEU ESPAÇO DE CRIAÇÃO</span><h1 id="ew-title">Comece por aqui</h1><p>Crie sua arte no Studio Click.</p></div>
   <Link className="ew-enter" href={editorHref} prefetch={false}>Entrar no editor <ArrowRight size={24}/></Link>
  </section>
  <section className="ew-guides" aria-label="Espaço para banners e instruções">
   <h2>Passo a passo e instruções</h2>
   <div className="ew-banner" role="img" aria-label="Espaço reservado para banner explicativo"/>
   <div className="ew-cards">{[1,2,3].map(i=><div key={i} className="ew-card" role="img" aria-label={`Espaço reservado para instruções ${i}`}/>)}</div>
  </section>
 </main>;
}
