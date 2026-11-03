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
const loaded=new Map<string,Promise<void>>();
export function isCuratedTypeface(name:string){return typefaces.some(x=>x.name===name)}
export function loadCuratedTypeface(name:string):Promise<void>{
 if(typeof document==='undefined')return Promise.resolve();
 const t=typefaces.find(x=>x.name===name);if(!t)return Promise.resolve();
 const cached=loaded.get(name);if(cached)return cached;
 const href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.name).replace(/%20/g,'+')}:wght@${t.weights}&display=swap`;
 const promise=new Promise<void>((resolve,reject)=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.referrerPolicy='no-referrer';
  link.onload=()=>{void document.fonts.load(`400 24px "${name}"`,'ÁÉÍÓÚÃÕÇ áéíóúãõç').then(()=>resolve(),reject)};
  link.onerror=()=>reject(new Error('Não foi possível baixar a fonte. Verifique a conexão com Google Fonts.'));
  document.head.appendChild(link);
 }).catch(e=>{loaded.delete(name);throw e});
 loaded.set(name,promise);return promise;
}
export async function ensureDesignFonts(fontNames:readonly string[]){
 const unique=[...new Set(fontNames.filter(isCuratedTypeface))];
 await Promise.all(unique.map(name=>loadCuratedTypeface(name)));
}
