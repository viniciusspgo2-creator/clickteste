'use client';
import {useState} from 'react';
import {BookOpen,Send,CheckCircle2,X,Sparkles} from 'lucide-react';
import './creative.css';

type Area='editor'|'studio'|'templates';
type Action='backgrounds'|'templates'|'texts'|'elements'|'personagens'|'uploads'|'guides'|'export'|'arts'|'base'|'models'|'scene'|'light'|'camera'|'effects'|'compose';
const catalog:{test:RegExp;message:string;action?:Action;label?:string}[]=[
 {test:/21\s*[x×]\s*9|sangria|impress|sublima|tamanho da arte|dpi|resoluç/i,message:'Para estampa completa de caneca, crie em 21 × 9,5 cm (2480 × 1122 px a 300 DPI). No editor a linha pontilhada delimita a área visível aproximada de 19 × 8,5 cm. Exporte PNG na resolução original e faça um teste físico, pois a área exata varia conforme a caneca e a prensa.',action:'guides',label:'Mostrar área segura'},
 {test:/fundo|background|cenário pronto/i,message:'Na aba Fundos há 12 fundos vetoriais sem textos. Você também pode publicar fundos PNG, WebP e SVG via Admin → Biblioteca Criativa → Fundos. No editor, trocar o fundo não exclui a caneca ou os textos.',action:'backgrounds',label:'Abrir fundos'},
 {test:/personagem|anime|emoji|cartoon|desenho/i,message:'Publique arquivos licenciados na Biblioteca Criativa como tipo Elemento e categoria exata “Personagens”. Assim aparecerão na aba Personagens. Para franquias protegidas, confirme direito de disponibilização comercial antes do upload.',action:'personagens',label:'Abrir personagens'},
 {test:/template|layout|trocar de modelo/i,message:'Templates são composições para divulgação e prévias de canecas. Ao trocar um layout no Editor, o mockup e o conteúdo criado devem continuar intactos; apenas a base do layout muda. Fundos de estampa ficam na aba Fundos.',action:'templates',label:'Abrir templates'},
 {test:/curva|ondul|3d.*texto|texto|fonte|tipografia/i,message:'Selecione um texto e use Propriedades → Tipografia Avançada: curvatura, ondulação, profundidade 3D, contorno, espaçamento entre letras, sombra, posição e rotação. Fontes novas são publicadas pelo Admin com licença para uso web.',action:'texts',label:'Abrir textos'},
 {test:/cort|recort|desfazer|voltar|opacidade|transparên/i,message:'Selecione a imagem e use Recorte (quatro margens) sem destruir o arquivo original. A opacidade fica em Efeitos. Para desfazer use Ctrl+Z, para refazer Ctrl+Shift+Z. O projeto pode ser salvo localmente como .cgdesign.',action:'uploads',label:'Abrir uploads'},
 {test:/verniz|brilho|fosco|acabamento|cerâmica/i,message:'No Studio 3D, os perfis de acabamento ajustam verniz, rugosidade, clearcoat e reflexo. Esses ajustes do material não alteram o arquivo original da estampa.',action:'models',label:'Abrir produto'},
 {test:/sombra|luz|reflex|realismo/i,message:'Para mockups, use Luz e Sombra e os perfis de contato no Studio 3D. No Editor, selecione qualquer objeto e regule sombra, cor, deslocamento X/Y, brilho e contraste.',action:'light',label:'Abrir luz e sombra'},
 {test:/alça|caneca|girar|inclinar|posicionar/i,message:'No Studio 3D, abra Produto para modelos/alças e Câmera ou Composição para ângulos e enquadramento. Use as predefinições antes de ajustes livres; verifique a arte em 360 graus.',action:'models',label:'Abrir produto'},
 {test:/bocão|base inferior/i,message:'O módulo Bocão aplica uma arte adicional na região da base da caneca, sem trocar a arte principal. Abra a aba própria no Studio 3D.',action:'base',label:'Abrir Bocão'},
 {test:/pdf|psd|svg|upload|importar/i,message:'PNG, JPEG, WebP e AVIF são importados localmente. A primeira página de PDF é rasterizada — não vira camadas editáveis. PSD em camadas ainda não está implementado. SVGs administrativos são aplicados como imagens, não como caminhos editáveis.',action:'uploads',label:'Abrir uploads'},
 {test:/salvar|export|baixar|png|jpeg|webp/i,message:'Exporte PNG, JPEG ou WebP diretamente no navegador. Para estampa de caneca, priorize PNG na resolução nativa. Para mockup destinado a redes sociais, selecione o formato de divulgação. Salve .cgdesign para retomar o trabalho.',action:'export',label:'Abrir exportação'},
 ];
const suggestions=['Qual é o tamanho correto da estampa?', 'Como colocar um fundo sem perder a caneca?', 'Como criar texto curvado?', 'Onde ajusto a sombra?'];
export function StudioConcierge({area,onClose,onAction}:{area:Area;onClose:()=>void;onAction?:(action:Action)=>boolean}){
 const [query,setQuery]=useState('');const [reply,setReply]=useState('Pergunte sobre impressão, Studio 3D, templates ou Editor. Posso abrir ferramentas disponíveis mediante sua confirmação.');
 const [pending,setPending]=useState<{action:Action;label:string}|null>(null);const [conversation,setConversation]=useState<string[]>([]);
 const ask=(q:string)=>{const text=q.trim();if(!text)return;const match=catalog.find(x=>x.test.test(text));
  setConversation(c=>[...c,text].slice(-4));setReply(match?.message||'O Click & Gruda reúne Studio Mockup 3D, Studio Templates e Editor de Artes. Posso orientar formatos de impressão, camadas, arquivos, fundos, efeitos e exportação. Descreva qual controle ou etapa você quer usar.');
  setPending(match?.action&&match.label?{action:match.action,label:match.label}:null);setQuery('');};
 return <div className="cr-concierge" role="dialog" aria-label="Guia interativo de sublimação de canecas" aria-modal="false">
  <div className="cr-concierge-top"><div><BookOpen size={18}/><strong>Guia Inteligente · Canecas</strong><small>{area==='editor'?'Editor de Artes':area==='studio'?'Studio Mockup 3D':'Studio Templates'}</small></div><button type="button" aria-label="Fechar assistente" onClick={onClose}><X size={18}/></button></div>
  <div className="cr-concierge-content"><span className="cr-concierge-label">ASSISTENTE DA PLATAFORMA</span><p>{reply}</p>{conversation.length>0&&<small>Última pergunta: {conversation[conversation.length-1]}</small>}
   {pending&&<div className="cr-concierge-confirm"><strong>Quer ativar a opção “{pending.label}”?</strong><p>Digite SIM ou clique em Confirmar. Nenhuma configuração será alterada sem essa ação.</p><div><button type="button" onClick={()=>setPending(null)}>Cancelar</button><button type="button" onClick={()=>{const ok=onAction?.(pending.action)??false;setReply(ok?`Opção “${pending.label}” aberta. Você pode continuar editando normalmente.`:`Esta opção fica em outra ferramenta da plataforma. Abra o módulo correspondente para ativá-la.`);setPending(null)}}><CheckCircle2 size={15}/> Confirmar</button></div></div>}
   {!pending&&<div className="cr-concierge-suggestions">{suggestions.map(s=><button key={s} type="button" onClick={()=>ask(s)}>{s}</button>)}</div>}</div>
  <form onSubmit={e=>{e.preventDefault();if(pending&&query.trim().toLowerCase()==='sim'){const ok=onAction?.(pending.action)??false;setReply(ok?`Opção “${pending.label}” aberta.`:'Para acessar esta função, abra o módulo correspondente.');setPending(null);setQuery('');}else ask(query);}}><input aria-label="Pergunte ao assistente" value={query} onChange={e=>setQuery(e.target.value)} placeholder={pending?'Digite SIM para confirmar...':'Como faço para...'} maxLength={300}/><button type="submit" aria-label="Enviar pergunta"><Send size={17}/></button></form>
  <div className="cr-concierge-foot"><Sparkles size={13}/> Guia contextual local; não é um chat com IA generativa. Respostas baseadas nas funções documentadas.</div>
 </div>;
}
