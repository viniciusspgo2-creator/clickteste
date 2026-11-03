'use client';
import {useEffect,useRef,useState} from 'react';
import {usePlatformLanguage} from '@/components/platform/language-provider';
import {BookOpen,Send,CheckCircle2,X,Sparkles} from 'lucide-react';
import './creative.css';

type Area='editor'|'studio'|'templates';
type Action='backgrounds'|'templates'|'texts'|'elements'|'personagens'|'uploads'|'guides'|'export'|'arts'|'base'|'models'|'scene'|'light'|'camera'|'effects'|'compose';
const catalog:{test:RegExp;message:string;action?:Action;label?:string}[]=[
 {test:/espelh|inverter|flip|virar (imagem|objeto|texto)/i,message:'No Editor, selecione a imagem, o texto ou a forma. Em Propriedades → Espelhar o elemento, escolha Horizontal ou Vertical. Você pode espelhar novamente para desfazer a inversão. A exportação respeita o espelhamento.'},
 {test:/camada|trazer.*frente|enviar.*tr[aá]s|por tr[aá]s|por cima|sobrepor|profundidade.*objeto/i,message:'No Editor, selecione o objeto e abra Propriedades → Ordem dos objetos. Use Trazer à frente, Subir 1 camada, Descer 1 camada ou Enviar para trás. A ordenação é salva na composição e pode ser desfeita com Ctrl+Z.'},
 {test:/reset|reiniciar (arte|projeto)|limpar (projeto|tudo)|zerar (arte|projeto)/i,message:'No Editor, escolha Resetar projeto no cabeçalho e confirme: a composição atual e o histórico de desfazer serão limpos, mas os arquivos já exportados e os projetos salvos manualmente no navegador permanecem. No Studio 3D, o botão Resetar abre uma confirmação antes de restaurar os ajustes.'},
 {test:/hist[oó]rico|salvar no navegador|arquivo local|privacidade|meus arquivos|servidor/i,message:'Os uploads do Editor ficam neste navegador. Use Salvar no navegador para guardar uma composição temporária e Histórico local para recuperá-la neste dispositivo. O navegador pode limpar o armazenamento; exporte também um arquivo .cgdesign como cópia de segurança. O conteúdo administrativo da biblioteca é hospedado separadamente.'},
 {test:/21\s*[x×]\s*9|sangria|impress|sublima|tamanho da arte|dpi|resoluç/i,message:'Para estampa completa de caneca, crie em 21 × 9,5 cm (2480 × 1122 px a 300 DPI). No editor a linha pontilhada delimita a área visível aproximada de 19 × 8,5 cm. Exporte PNG na resolução original e faça um teste físico, pois a área exata varia conforme a caneca e a prensa.',action:'guides',label:'Mostrar área segura'},
 {test:/fundo|background|cenário pronto/i,message:'Na aba Fundos há 12 fundos vetoriais sem textos. Você também pode publicar fundos PNG, WebP e SVG via Admin → Biblioteca Criativa → Fundos. No editor, trocar o fundo não exclui a caneca ou os textos.',action:'backgrounds',label:'Abrir fundos'},
 {test:/personagem|anime|emoji|cartoon|desenho/i,message:'Publique arquivos licenciados na Biblioteca Criativa como tipo Elemento e categoria exata “Personagens”. Assim aparecerão na aba Personagens. Para franquias protegidas, confirme direito de disponibilização comercial antes do upload.',action:'personagens',label:'Abrir personagens'},
 {test:/template|layout|trocar de modelo/i,message:'Templates são composições para divulgação e prévias de canecas. Ao trocar um layout no Editor, o mockup e o conteúdo criado devem continuar intactos; apenas a base do layout muda. Fundos de estampa ficam na aba Fundos.',action:'templates',label:'Abrir templates'},
 {test:/curva|ondul|3d.*texto|texto|fonte|tipografia/i,message:'Selecione um texto e use Propriedades → Tipografia Avançada: curvatura, ondulação, profundidade 3D, contorno, espaçamento entre letras, sombra, posição e rotação. Fontes novas são publicadas pelo Admin com licença para uso web.',action:'texts',label:'Abrir textos'},
 {test:/cort|recort|desfazer|voltar|opacidade|transparên/i,message:'Selecione a imagem e use Recorte (quatro margens) sem destruir o arquivo original. A opacidade fica em Efeitos. Para desfazer use Ctrl+Z, para refazer Ctrl+Y ou Ctrl+Shift+Z. Não há um limite fixo de etapas enquanto o Editor estiver aberto, mas o navegador tem um limite de memória. O projeto pode ser salvo localmente como .cgdesign.',action:'uploads',label:'Abrir uploads'},
 {test:/verniz|brilho|fosco|acabamento|cerâmica/i,message:'No Studio 3D, os perfis de acabamento ajustam verniz, rugosidade, clearcoat e reflexo. Esses ajustes do material não alteram o arquivo original da estampa.',action:'models',label:'Abrir produto'},
 {test:/sombra|luz|reflex|realismo/i,message:'Para mockups, use Luz e Sombra e os perfis de contato no Studio 3D. No Editor, selecione qualquer objeto e regule sombra, cor, deslocamento X/Y, brilho e contraste.',action:'light',label:'Abrir luz e sombra'},
 {test:/alça|caneca|girar|inclinar|posicionar/i,message:'No Studio 3D, abra Produto para modelos/alças e Câmera ou Composição para ângulos e enquadramento. Use as predefinições antes de ajustes livres; verifique a arte em 360 graus.',action:'models',label:'Abrir produto'},
 {test:/bocão|base inferior/i,message:'O módulo Bocão aplica uma arte adicional na região da base da caneca, sem trocar a arte principal. Abra a aba própria no Studio 3D.',action:'base',label:'Abrir Bocão'},
 {test:/pdf|psd|svg|upload|importar/i,message:'O Editor importa imagens locais, SVG seguro, páginas selecionadas de PDF com texto identificável separado e PSD RGB/8 bits com camadas raster raw/RLE/ZIP. Nem todos os PDFs ou PSDs mantêm fontes, efeitos ou objetos inteligentes; revise as camadas antes de imprimir.',action:'uploads',label:'Abrir uploads'},
 {test:/salvar|export|baixar|png|jpeg|webp/i,message:'Exporte PNG, JPEG ou WebP no navegador. Com um vídeo MP4, use a linha do tempo para animar textos e imagens e exportar até 20 segundos em H.264, sem áudio original. Para sublimação, use PNG na resolução original. Salve .cgdesign para retomar.',action:'export',label:'Abrir exportação'},
 ];
const suggestions=['Qual é o tamanho correto da estampa?', 'Como enviar um objeto para trás?', 'Como espelhar um elemento?', 'Como salvar no navegador?'];
const actionsByArea:Record<Area,readonly Action[]>={
 editor:['backgrounds','templates','texts','elements','personagens','uploads','guides','export'],
 studio:['arts','base','models','scene','light','camera','effects','compose'],
 templates:[]
};
const actionAllowed=(area:Area,action:unknown):action is Action=>typeof action==='string'&&actionsByArea[area].includes(action as Action);
const generalHelp={
 pt:'O Click & Gruda reúne Studio Mockup 3D, Studio Templates e Editor de Artes. Posso orientar formatos de impressão, camadas, arquivos, fundos, efeitos e exportação. Descreva qual controle ou etapa quer usar.',
 en:'Click & Gruda includes the 3D Mug Studio, Templates Studio and Mug Artwork Editor. I can explain print sizes, layers, files, backgrounds, effects and export. Tell me what you want to do.',
 es:'Click & Gruda incluye Studio Mockup 3D, Studio Templates y Editor de Artes para Tazas. Puedo explicar tamaños, capas, archivos, fondos, efectos y exportación. Dime qué necesitas.'
} as const;
export function StudioConcierge({area,onClose,onAction}:{area:Area;onClose:()=>void;onAction?:(action:Action)=>boolean}){
 const {language}=usePlatformLanguage();
 const [aiAvailable,setAiAvailable]=useState<boolean|null>(null);
 useEffect(()=>{let mounted=true;void fetch('/api/creative-assistant',{cache:'no-store'})
  .then(res=>res.ok?res.json():Promise.reject(new Error('status unavailable')))
  .then(status=>{if(mounted)setAiAvailable(Boolean(status.aiEnabled));})
  .catch(()=>{if(mounted)setAiAvailable(false);});
  return()=>{mounted=false;};},[]);
 const [isAnswering,setIsAnswering]=useState(false);
 const [query,setQuery]=useState('');const [reply,setReply]=useState('Pergunte sobre impressão, Studio 3D, templates ou Editor. Posso abrir ferramentas disponíveis mediante sua confirmação.');
 const [pending,setPending]=useState<{action:Action;label:string}|null>(null);const [conversation,setConversation]=useState<string[]>([]);
 // Requests may finish out of order (especially on slower mobile networks).
 // Only the latest user question may change the answer or propose an action.
 const requestRef=useRef<{version:number;controller:AbortController|null}>({version:0,controller:null});
 useEffect(()=>()=>{requestRef.current.version++;requestRef.current.controller?.abort();requestRef.current.controller=null;},[]);
 const ask=async(q:string)=>{const text=q.trim();if(!text)return;
  const match=catalog.find(x=>x.test.test(text));
  const previousQuestions=conversation.slice(-4);
  requestRef.current.controller?.abort();
  const controller=new AbortController();const version=++requestRef.current.version;
  requestRef.current.controller=controller;
  const current=()=>requestRef.current.version===version&&!controller.signal.aborted;
  setPending(null);setConversation(c=>[...c,text].slice(-6));setQuery('');setIsAnswering(true);
  // A instalação sem chave de API responde imediatamente pelo guia local.
  if(aiAvailable===false){
   setReply(match?.message||generalHelp[language]);
   setPending(match?.action&&match.label&&actionAllowed(area,match.action)?{action:match.action,label:match.label}:null);
   requestRef.current.controller=null;setIsAnswering(false);return;
  }
  try{
   const response=await fetch('/api/creative-assistant',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,area,locale:language,history:previousQuestions})});
   const info=await response.json();
   if(!current())return;
   if(info?.ok&&typeof info.reply==='string'&&info.reply.trim()){
    setReply(info.reply);
    setPending(actionAllowed(area,info.action)&&typeof info.label==='string'&&info.label.trim()?{action:info.action,label:info.label}:null);
    return;
   }
  }catch{if(!current())return;/* documented local assistant fallback */}
  finally{if(current()){requestRef.current.controller=null;setIsAnswering(false);}}
  if(!current())return;
  setReply(match?.message||generalHelp[language]);
  setPending(match?.action&&match.label&&actionAllowed(area,match.action)?{action:match.action,label:match.label}:null);
 };
 return <div className="cr-concierge" role="dialog" aria-label="Guia interativo de sublimação de canecas" aria-modal="false">
  <div className="cr-concierge-top"><div><BookOpen size={18}/><strong>Guia Inteligente · Canecas</strong><small>{area==='editor'?'Editor de Artes':area==='studio'?'Studio Mockup 3D':'Studio Templates'}</small></div><button type="button" aria-label="Fechar assistente" onClick={onClose}><X size={18}/></button></div>
  <div className="cr-concierge-content"><span className="cr-concierge-label">ASSISTENTE DA PLATAFORMA</span><p aria-live="polite">{isAnswering?"Consultando as orientações…":reply}</p>{conversation.length>0&&<small>Última pergunta: {conversation[conversation.length-1]}</small>}
   {pending&&<div className="cr-concierge-confirm"><strong>Quer ativar a opção “{pending.label}”?</strong><p>Digite SIM ou clique em Confirmar. Nenhuma configuração será alterada sem essa ação.</p><div><button type="button" onClick={()=>setPending(null)}>Cancelar</button><button type="button" disabled={isAnswering} onClick={()=>{const ok=onAction?.(pending.action)??false;setReply(ok?`Opção “${pending.label}” aberta. Você pode continuar editando normalmente.`:`Esta opção fica em outra ferramenta da plataforma. Abra o módulo correspondente para ativá-la.`);setPending(null)}}><CheckCircle2 size={15}/> Confirmar</button></div></div>}
   {!pending&&<div className="cr-concierge-suggestions">{suggestions.map(s=><button key={s} type="button" onClick={()=>void ask(s)}>{s}</button>)}</div>}</div>
  <form onSubmit={e=>{e.preventDefault();if(pending&&/^(sim|s[ií]|yes)$/i.test(query.trim())){const ok=onAction?.(pending.action)??false;setReply(ok?`Opção “${pending.label}” aberta.`:'Para acessar esta função, abra o módulo correspondente.');setPending(null);setQuery('');}else void ask(query);}}><input aria-label="Pergunte ao assistente" value={query} onChange={e=>setQuery(e.target.value)} placeholder={pending?'Digite SIM para confirmar...':'Como faço para...'} maxLength={300}/><button type="submit" aria-label="Enviar pergunta" disabled={isAnswering&&query.trim().length===0}><Send size={17}/></button></form>
  <div className="cr-concierge-foot"><Sparkles size={13}/> {aiAvailable===true?'IA disponível nesta instalação':aiAvailable===false?'Guia local · IA não configurada':'Verificando disponibilidade da IA'} · Somente perguntas de texto são enviadas ao provedor quando habilitado; nunca arquivos ou projetos. Ações exigem confirmação.</div>
 </div>;
}
