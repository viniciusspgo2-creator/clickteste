/** Best-effort, entirely local PDF import: rendered page plus separate editable text runs.
 * PDFs may lack semantic text, font data or distinct image objects. Preserve a faithful
 * flattened background and warn that text erasure is an approximation, not PSD layers.
 */
import {uid,type DesignDocument,type DesignNode} from './design';
export async function importPdfEditable(file:File,pageNumber=1):Promise<{document:DesignDocument;count:number;pages:number;warning:string}>{
 if(file.size>35*1024*1024)throw new Error('PDF acima de 35 MB.');
 const pdfjs=await import('pdfjs-dist');
 pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
 try{
  const pdf=await task.promise;
  if(pageNumber>pdf.numPages||pageNumber<1)throw new Error('Página inexistente no PDF');
  const page=await pdf.getPage(pageNumber),viewport=page.getViewport({scale:Math.min(2.5,2400/Math.max(page.view[2],page.view[3]))});
  const width=Math.round(viewport.width),height=Math.round(viewport.height);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas indisponível');
  await page.render({canvas,canvasContext:ctx,viewport}).promise;
  const extracted=await page.getTextContent({disableNormalization:false});
  const nodes:DesignNode[]=[];
  // Group nearby glyph runs is intentionally conservative; each run can be moved/edited.
  for(const item of extracted.items){
   if(!('str' in item)||!item.str?.trim()||!('transform' in item))continue;
   const tx=pdfjs.Util.transform(viewport.transform,item.transform);
   const sz=Math.hypot(tx[2],tx[3]);
   const estimatedWidth=Math.max(12,Math.min(width,item.width*viewport.scale));
   const h=Math.max(10,Math.min(150,sz*1.35)),x=Math.max(-width,tx[4]),y=tx[5]-h*0.83;
   if(!Number.isFinite(x+y+sz)||sz<3||sz>250||nodes.length>500)continue;
   nodes.push({id:uid(),kind:'text',role:'content',layerName:`Texto PDF ${nodes.length+1}`,text:item.str,x,y,w:estimatedWidth+4,h,angle:Math.atan2(tx[1],tx[0])*180/Math.PI,opacity:1,font:'Arial',size:sz,fill:'#161616',align:'left',aspectLock:true,shadow:0});
  }
  if(nodes.length){
   // Cover the embedded type in simple single-color backgrounds. For intricate photos
   // the user can remove or replace the raster background, as described in the warning.
   for(const n of nodes){
    const x=Math.max(0,Math.min(width-1,Math.floor(n.x))),y=Math.max(0,Math.min(height-1,Math.floor(n.y)));
    const sample=ctx.getImageData(Math.max(0,x-5),Math.max(0,y-3),1,1).data;
    const color=`rgb(${sample[0]},${sample[1]},${sample[2]})`;
    ctx.fillStyle=color;ctx.fillRect(x-1,y-1,Math.min(width-x+1,n.w+4),Math.min(height-y+1,n.h+3));
    const bg=sample[0]+sample[1]+sample[2];n.fill=bg<280?'#ffffff':'#181818';
   }
  }
  const background:DesignNode={id:uid(),kind:'image',role:'background',locked:true,layerName:`PDF · página ${pageNumber}`,src:canvas.toDataURL('image/png'),x:0,y:0,w:width,h:height,angle:0,opacity:1,aspectLock:true};
  return {document:{width,height,background:'transparent',nodes:[background,...nodes]},count:nodes.length,pages:pdf.numPages,warning:'Os textos identificáveis viraram objetos independentes. Fontes, efeitos, fotografias, texto vetorizado e fundos complexos podem não ser reconstruídos fielmente. A imagem original está em uma camada de fundo.'};
 }finally{await task.destroy();}
}
