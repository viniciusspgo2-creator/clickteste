/** Avisos de pré-impressão calculados localmente. Não envia artes nem imagens ao servidor.
 * São orientações, não uma garantia de resultado físico na prensa.
 */
import type {DesignDocument,DesignNode} from './design';
export type PrintMessage={kind:'warning'|'info'|'success';message:string};
const PRINT_SIZE=[2480,1122] as const;
const SAFE_SIZE=[2244,1004] as const;
const isPrint=(d:DesignDocument)=>d.width===PRINT_SIZE[0]&&d.height===PRINT_SIZE[1];
/** Bounding box externa após girar o texto no centro (não ignora inclinações). */
export const rotatedBounds=(n:Pick<DesignNode,'x'|'y'|'w'|'h'|'angle'>)=>{
 const theta=(n.angle||0)*Math.PI/180,cos=Math.abs(Math.cos(theta)),sin=Math.abs(Math.sin(theta));
 const halfX=(n.w*cos+n.h*sin)/2,halfY=(n.w*sin+n.h*cos)/2;
 const cx=n.x+n.w/2,cy=n.y+n.h/2;
 return {left:cx-halfX,top:cy-halfY,right:cx+halfX,bottom:cy+halfY};
};
const textOutsideSafe=(n:DesignNode)=>{
 const minX=(PRINT_SIZE[0]-SAFE_SIZE[0])/2,minY=(PRINT_SIZE[1]-SAFE_SIZE[1])/2;
 const bounds=rotatedBounds(n);
 // Inclui a rotação; curvatura extrema ainda pode ultrapassar a área desenhada.
 return bounds.left<minX||bounds.top<minY||bounds.right>PRINT_SIZE[0]-minX||bounds.bottom>PRINT_SIZE[1]-minY;
};
export function checkBeforeExport(d:DesignDocument):PrintMessage[]{
 const messages:PrintMessage[]=[];
 const visible=d.nodes.filter(n=>n.visible!==false);
 if(d.video)messages.push({kind:'warning',message:'O PNG/JPEG/WebP não inclui o vídeo de fundo. Para exportar a animação, use o botão MP4.'});
 if(!isPrint(d)){
  if(d.width===SAFE_SIZE[0]&&d.height===SAFE_SIZE[1])messages.push({kind:'info',message:'Documento com área visível de 19 × 8,5 cm. Confirme a medida antes de sublimar.'});
  else messages.push({kind:'info',message:'Formato de apresentação ou personalizado. Para estampa completa, crie em 21 × 9,5 cm (2480 × 1122 px).'});
  return messages;
 }
 const important=visible.filter(n=>n.kind==='text'&&n.role!=='background'&&n.role!=='foreground');
 const crossing=important.filter(textOutsideSafe);
 if(crossing.length)messages.push({kind:'warning',message:`${crossing.length} texto(s) podem ultrapassar a área visível aproximada da caneca. Reposicione antes de imprimir.`});
 const small=important.filter(n=>(n.size||0)>0&&(n.size||0)<26);
 if(small.length)messages.push({kind:'warning',message:`${small.length} texto(s) pequenos podem perder nitidez na sublimação. Confira a prova física.`});
 if(!visible.length)messages.push({kind:'warning',message:'Projeto sem objetos visíveis. Confira se as camadas estão ocultas.'});
 if(!messages.some(m=>m.kind==='warning'))messages.push({kind:'success',message:'Tamanho da estampa correto. Confira a sangria e faça uma prova antes da produção.'});
 return messages;
}
