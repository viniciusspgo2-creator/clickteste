/** Avaliação local da resolução de imagens raster em ESTAMPAS (não layouts sociais).
 * DPI no arquivo não substitui pixels reais. Nunca faz upload, apenas lê dimensões já carregadas.
 */
import type {DesignDocument,DesignNode} from './design';
import type {PrintMessage} from './print-check';
export type ImageDimensions={width:number;height:number};
const printable=(doc:DesignDocument)=>doc.width===2480&&doc.height===1122;
const finite=(n:number)=>Number.isFinite(n)&&n>0;
/** Resolução efetiva da parte raster utilizada, já descontando recorte central e manual. */
export function effectiveRasterDpi(node:DesignNode,original:ImageDimensions,documentWidth=2480):number|null{
 if(node.kind!=='image'||!finite(node.w)||!finite(node.h)||!finite(original.width)||!finite(original.height)||!finite(documentWidth))return null;
 const c=node.crop;
 const crop=(a:number|undefined,b:number|undefined)=>Math.max(.01,1-Math.max(0,a||0)-Math.max(0,b||0));
 let w=original.width*crop(c?.left,c?.right);
 let h=original.height*crop(c?.top,c?.bottom);
 const targetRatio=node.w/node.h;
 if(w/h>targetRatio)w=h*targetRatio;else h=w/targetRatio;
 // 21 cm é a largura física de uma estampa completa, independentemente de metadados DPI.
 const widthCm=node.w/documentWidth*21;
 const heightCm=node.h/documentWidth*21;
 return Math.min(w/widthCm,h/heightCm)*2.54;
}
export async function checkRasterQuality(doc:DesignDocument,getDimensions:(src:string)=>Promise<ImageDimensions>):Promise<PrintMessage[]>{
 if(!printable(doc))return [];
 const results:PrintMessage[]=[];
 const nodes=doc.nodes.filter(n=>n.visible!==false&&n.kind==='image'&&n.src&&!(/^data:image\/svg\+xml/i.test(n.src)||/\.svg(?:[?#]|$)/i.test(n.src)));
 const summaries=await Promise.all(nodes.map(async n=>{
   try{return {node:n,dpi:effectiveRasterDpi(n,await getDimensions(n.src!),doc.width)};}
   catch{return {node:n,dpi:null};}
 }));
 const low=summaries.filter(r=>r.dpi!==null&&r.dpi<140);
 const moderate=summaries.filter(r=>r.dpi!==null&&r.dpi>=140&&r.dpi<220);
 const missing=summaries.filter(r=>r.dpi===null);
 if(low.length)results.push({kind:'warning',message:`${low.length} imagem(ns) com resolução efetiva abaixo de 140 DPI na estampa. Evite ampliar; substitua por originais maiores.`});
 if(moderate.length)results.push({kind:'info',message:`${moderate.length} imagem(ns) entre 140 e 220 DPI: confira detalhes finos em uma prova de impressão.`});
 if(missing.length)results.push({kind:'warning',message:`Não foi possível confirmar a resolução de ${missing.length} imagem(ns). Verifique se carregaram corretamente.`});
 return results;
}
