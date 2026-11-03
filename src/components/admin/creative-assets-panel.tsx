'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Archive,Check,CloudUpload,FolderOpen,Image as ImageIcon,Loader2,Search,Trash2,Eye,EyeOff,RefreshCw,Pencil,ArrowUp} from 'lucide-react';
type Kind='template'|'element'|'background'|'font'|'animation';
type Asset={id:string;kind:Kind;name:string;category:string;tags:string[];status:string;order:number;mimeType:string;url:string;bytes:number};
const kindLabels:Record<Kind,string>={template:'Templates (PNG / MP4)',element:'Elementos (PNG / SVG)',background:'Fundos',font:'Fontes',animation:'Animações Lottie'};
const categorySuggestions:Record<Kind,string[]>={template:['Mockups de canecas','Divulgação de canecas','Natal','Dia das Mães','Dia dos Pais'],element:['Personagens','Objetos','Emojis','Molduras','Ornamentos','Natal','Flores','Sombras'],background:['Estampas de canecas','Natal','Romântico','Infantil','Religioso','Minimalista'],font:['Comercial','Elegante','Divertida','Manuscrita'],animation:['Partículas','Transições','Luzes']};
export function CreativeAssetsPanel({onUnauthorized}:{onUnauthorized:()=>void}){
 const [kind,setKind]=useState<Kind>('template'),[assets,setAssets]=useState<Asset[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[q,setQ]=useState('');
 const [status,setStatus]=useState<'published'|'draft'>('published');
 const [editing,setEditing]=useState<Asset|null>(null);
 const [category,setCategory]=useState('Geral'),[tags,setTags]=useState(''),[files,setFiles]=useState<File[]>([]),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null);
 const load=useCallback(async()=>{setError('');try{
  const search=new URLSearchParams({kind,page:String(page),q});const res=await fetch(`/api/admin/creative-assets?${search}`,{cache:'no-store'});
  if(res.status===401){onUnauthorized();return;}const data=await res.json();if(!data.ok)throw Error(data.error||'Falha ao listar');setAssets(data.items);setTotal(data.total);
 }catch(e){setError(e instanceof Error?e.message:'Falha ao listar conteúdos.');}},[kind,page,q,onUnauthorized]);
 useEffect(()=>{void load();},[load]);
 const upload=async()=>{if(!files.length||busy)return;setBusy(true);setError('');let success=0;
  try{for(let i=0;i<files.length;i++){
   const file=files[i];setProgress(`Enviando ${i+1}/${files.length}: ${file.name}`);
   const form=new FormData();form.append('file',file);form.append('name',file.name.replace(/\.[^.]+$/,''));form.append('kind',kind);form.append('category',category);form.append('tags',tags);form.append('status',status);
   const res=await fetch('/api/admin/creative-assets',{method:'POST',body:form});if(res.status===401){onUnauthorized();return;}
   const data=await res.json();if(!res.ok||!data.ok){setError(`Falha em ${file.name}: ${data.error||res.status}`);break;}success++;
  }
  setProgress(`${success} de ${files.length} materiais salvos.`);if(success===files.length)setFiles([]);void load();
 }catch(e){setError(e instanceof Error?e.message:'Falha de conexão durante o upload.');}finally{setBusy(false);}}
 const patch=async(id:string,data:Record<string,unknown>)=>{setError('');try{const res=await fetch(`/api/admin/creative-assets/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!res.ok)throw Error('Falha ao atualizar');void load();}catch(e){setError(e instanceof Error?e.message:'Falha ao atualizar');}};
 const del=async(item:Asset)=>{if(!window.confirm(`Excluir permanentemente "${item.name}" do catálogo?`))return;setError('');try{const res=await fetch(`/api/admin/creative-assets/${item.id}`,{method:'DELETE'});const data=await res.json();if(!res.ok)throw Error(data.error||'Falha na exclusão');void load();}catch(e){setError(e instanceof Error?e.message:'Falha na exclusão');}};
 return <div className="ca-panel"><div className="ad-page-intro"><div><span className="ad-eyebrow">STUDIO ASSETS · GESTÃO CENTRALIZADA</span><h1>Biblioteca criativa.</h1><p>Publique fundos de estampas, personagens, elementos, templates de apresentação, fontes e animações. Os arquivos ficam no R2 e aparecem automaticamente nos módulos adequados.</p></div></div>
  <div className="ca-grid"><section className="ca-upload"><div className="ca-card-heading"><CloudUpload size={22}/><div><h2>Novo material</h2><p>Importação em lote sem precisar editar o código.</p></div></div>
   <label>TIPO DE RECURSO<select value={kind} onChange={e=>{setKind(e.target.value as Kind);setPage(1);setFiles([])}}>{Object.entries(kindLabels).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <div className="ca-cols"><label>CATEGORIA<input maxLength={80} value={category} onChange={e=>setCategory(e.target.value)}/></label><label>PUBLICAÇÃO<select value={status} onChange={e=>setStatus(e.target.value as 'published'|'draft')}><option value="published">Publicar</option><option value="draft">Rascunho</option></select></label></div>
   <div className="ca-category-presets"><span>CATEGORIAS SUGERIDAS PARA SUBLIMAÇÃO</span><div>{categorySuggestions[kind].map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
   <label>TAGS (SEPARADAS POR VÍRGULA)<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Natal, presente, caneca..."/></label>
   <div className="ca-drop" onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setFiles(Array.from(e.dataTransfer.files).slice(0,30))}}><FolderOpen size={31}/><strong>Selecionar ou arrastar arquivos</strong><small>Até 30 por lote, 4 MB cada. Processamento sequencial para reduzir carga no servidor.</small></div>
   <input ref={input} hidden multiple type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.woff,.woff2,.ttf,.otf,.mp4,.json" onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,30))}/>
   {files.length>0&&<div className="ca-selected"><strong>{files.length} arquivo(s)</strong><span>{files.slice(0,4).map(x=>x.name).join(' · ')}{files.length>4?' …':''}</span><button onClick={()=>setFiles([])}>Limpar</button></div>}
   <button className="ca-submit" disabled={!files.length||busy} onClick={()=>void upload()}>{busy?<Loader2 size={17} className="animate-spin"/>:<CloudUpload size={17}/>} {busy?'Enviando arquivos...':'Cadastrar arquivos'}</button>
   {progress&&<p className="ca-progress" role="status">{progress}</p>}
   <p className="ca-explain">Necessário configurar R2_ACCOUNT_ID, R2_CREATIVE_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY. O acesso administrativo é obrigatório; uploads dos clientes não usam esta rota.</p>
  </section>
  <section className="ca-list"><div className="ca-card-heading"><ImageIcon size={22}/><div><h2>Acervo cadastrado</h2><p>{total} itens · tipo: {kindLabels[kind]}</p></div><button onClick={()=>void load()} title="Atualizar"><RefreshCw size={18}/></button></div><div className="ca-search"><Search size={16}/><input placeholder="Buscar item..." value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/></div>
    {error&&<p className="ca-error" role="alert">{error}</p>}
    {!assets.length?<div className="ca-empty">Nenhum material cadastrado nesta seleção.</div>:<div className="ca-items">{assets.map(a=><div className="ca-item" key={a.id}><div className="ca-thumb">{a.mimeType.startsWith('image/')?<img src={a.url} alt="" loading="lazy"/>:<Archive size={22}/>}</div><div className="ca-meta"><strong title={a.name}>{a.name}</strong><span>{a.category} · {(a.bytes/1024).toFixed(0)} KB</span><small>{a.tags.join(' · ')||'Sem tags'}</small></div><div className="ca-actions"><button title="Editar metadados" onClick={()=>setEditing({...a})}><Pencil size={17}/></button><button title="Priorizar na ordem" onClick={()=>void patch(a.id,{order:a.order-1})}><ArrowUp size={17}/></button><button title={a.status==='published'?'Despublicar':'Publicar'} onClick={()=>void patch(a.id,{status:a.status==='published'?'draft':'published'})}>{a.status==='published'?<Eye size={17}/>:<EyeOff size={17}/>}</button><button title="Excluir permanentemente" onClick={()=>void del(a)}><Trash2 size={17}/></button></div></div>)}</div>}
    {total>36&&<div className="ca-pages"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>{page} / {Math.ceil(total/36)}</span><button disabled={page>=Math.ceil(total/36)} onClick={()=>setPage(p=>p+1)}>Próxima</button></div>}
   </section></div>
   {editing&&<div className="ca-edit-backdrop" onClick={()=>setEditing(null)}><form className="ca-edit-card" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();void patch(editing.id,{name:editing.name,category:editing.category,tags:editing.tags,order:editing.order,status:editing.status});setEditing(null)}}><h2>Editar material</h2><p>As alterações são aplicadas automaticamente ao catálogo.</p><label>NOME<input required maxLength={120} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label>CATEGORIA<input required maxLength={80} value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}/></label><label>TAGS<input value={editing.tags.join(', ')} onChange={e=>setEditing({...editing,tags:e.target.value.split(',').map(s=>s.trim())})}/></label><label>ORDEM<input type="number" value={editing.order} onChange={e=>setEditing({...editing,order:Number(e.target.value)})}/></label><label>STATUS<select value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value})}><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option></select></label><div><button type="button" onClick={()=>setEditing(null)}>Cancelar</button><button className="ca-submit" type="submit"><Check size={16}/> Salvar alterações</button></div></form></div>}
 </div>;
}
