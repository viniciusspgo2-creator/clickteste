/** Curadoria de famílias disponibilizadas pelo Google Fonts (não inclui arquivos de fontes).
 * Fontes são baixadas pelo navegador somente quando selecionadas.
 * Licença por família: consultar https://github.com/google/fonts/tree/main/ofl
 */
export type TypefaceCategory='Sans premium'|'Serif elegante'|'Display'|'Manuscrita';
export type CuratedTypeface={name:string;category:TypefaceCategory;weights:string;sample:string};
export const typefaces:CuratedTypeface[]=[
 {name:'Inter',category:'Sans premium',weights:'400;700',sample:'Canecas com personalidade'},
 {name:'Manrope',category:'Sans premium',weights:'400;700',sample:'Uma arte especial'},
 {name:'Montserrat',category:'Sans premium',weights:'400;700',sample:'Edição Premium'},
 {name:'Poppins',category:'Sans premium',weights:'400;700',sample:'Feliz Aniversário'},
 {name:'DM Sans',category:'Sans premium',weights:'400;700',sample:'Seu presente favorito'},
 {name:'Outfit',category:'Sans premium',weights:'400;700',sample:'Estilo & carinho'},
 {name:'Plus Jakarta Sans',category:'Sans premium',weights:'400;700',sample:'Criatividade sem limites'},
 {name:'Rubik',category:'Sans premium',weights:'400;700',sample:'Amor de mãe'},
 {name:'Nunito Sans',category:'Sans premium',weights:'400;700',sample:'Edição especial'},
 {name:'Open Sans',category:'Sans premium',weights:'400;700',sample:'Tão único quanto você'},
 {name:'Sora',category:'Sans premium',weights:'400;700',sample:'Criado com amor'},
 {name:'Urbanist',category:'Sans premium',weights:'400;700',sample:'Meu café, minhas regras'},
 {name:'Raleway',category:'Sans premium',weights:'400;700',sample:'Parabéns, você merece'},
 {name:'Playfair Display',category:'Serif elegante',weights:'400;700',sample:'Feliz Dia das Mães'},
 {name:'Lora',category:'Serif elegante',weights:'400;700',sample:'Você é incrível'},
 {name:'Cormorant Garamond',category:'Serif elegante',weights:'400;700',sample:'Para alguém especial'},
 {name:'EB Garamond',category:'Serif elegante',weights:'400;700',sample:'A vida é bela'},
 {name:'Fraunces',category:'Serif elegante',weights:'400;700',sample:'Um presente inesquecível'},
 {name:'Oswald',category:'Display',weights:'400;700',sample:'MELHOR PAI DO MUNDO'},
 {name:'Bebas Neue',category:'Display',weights:'400',sample:'EDIÇÃO LIMITADA'},
 {name:'Anton',category:'Display',weights:'400',sample:'SUPER MÃE'},
 {name:'Abril Fatface',category:'Display',weights:'400',sample:'Você merece'},
 {name:'Dancing Script',category:'Manuscrita',weights:'400;700',sample:'Com carinho'},
 {name:'Caveat',category:'Manuscrita',weights:'400;700',sample:'Feliz aniversário!'},
 {name:'Pacifico',category:'Manuscrita',weights:'400',sample:'Para você'},
 {name:'Lobster',category:'Manuscrita',weights:'400',sample:'Doce amor'},
 {name:'Great Vibes',category:'Manuscrita',weights:'400',sample:'Com todo meu amor'},
];
// Font requests also need a deadline: unlike images, a stalled stylesheet did
// not previously settle, leaving preview/export stuck indefinitely.
export const FONT_LOAD_TIMEOUT_MS=12_000;
const loaded=new Map<string,Promise<void>>();
export function isCuratedTypeface(name:string){return typefaces.some(x=>x.name===name)}
export function loadCuratedTypeface(name:string,timeoutMs=FONT_LOAD_TIMEOUT_MS):Promise<void>{
 if(typeof document==='undefined')return Promise.resolve();
 const t=typefaces.find(x=>x.name===name);if(!t)return Promise.resolve();
 if(!Number.isFinite(timeoutMs)||timeoutMs<1)return Promise.reject(new Error('Tempo limite de fonte inválido.'));
 const cached=loaded.get(name);if(cached)return cached;
 const href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.name).replace(/%20/g,'+')}:wght@${t.weights}&display=swap`;
 const promise=new Promise<void>((resolve,reject)=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.referrerPolicy='no-referrer';
  let finished=false;
  const finish=(error?:Error)=>{
   if(finished)return;
   finished=true;clearTimeout(timer);link.onload=null;link.onerror=null;
   if(error){link.remove();reject(error);}else resolve();
  };
  const timer=setTimeout(()=>finish(new Error(`A fonte “${name}” demorou demais para carregar. Verifique a conexão e tente novamente.`)),timeoutMs);
  link.onload=()=>{
   try{void document.fonts.load(`400 24px "${name}"`,'ÁÉÍÓÚÃÕÇ áéíóúãõç').then(faces=>finish(faces.length>0?undefined:new Error(`A fonte “${name}” não está disponível no navegador.`)),()=>finish(new Error(`Não foi possível carregar os caracteres da fonte “${name}”.`)));}
   catch{finish(new Error(`Não foi possível preparar a fonte “${name}”.`));}
  };
  link.onerror=()=>finish(new Error(`Não foi possível baixar a fonte “${name}”. Verifique a conexão.`));
  try{document.head.appendChild(link);}catch{finish(new Error('Não foi possível iniciar o carregamento da fonte.'));}
 }).catch(e=>{loaded.delete(name);throw e});
 loaded.set(name,promise);return promise;
}
export async function ensureDesignFonts(fontNames:readonly string[]){
 const unique=[...new Set(fontNames.filter(isCuratedTypeface))];
 await Promise.all(unique.map(name=>loadCuratedTypeface(name)));
}
/** Only export after browser font layout has settled. A broken third-party
 * stylesheet must never hold the export indefinitely or silently change the art. */
export async function waitForFontLayout(timeoutMs=FONT_LOAD_TIMEOUT_MS):Promise<void>{
 if(typeof document==='undefined'||!document.fonts)return;
 if(!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error('Tempo limite de fonte inválido.');
 await new Promise<void>((resolve,reject)=>{
  let finished=false;
  const finish=(error?:Error)=>{if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve();};
  const timer=setTimeout(()=>finish(new Error('As fontes não terminaram de carregar. Verifique a conexão antes de exportar a arte.')),timeoutMs);
  Promise.resolve(document.fonts.ready).then(()=>finish(),()=>finish(new Error('Falha ao finalizar o carregamento das fontes.')));
 });
}
