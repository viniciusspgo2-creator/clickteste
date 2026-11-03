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
    // Only erase original text when its surrounding region is visually flat.
    // Filling a photo or a textured illustration with a solid rectangle damages
    // the artwork; preserve the rasterized background instead and warn the user.
    const samples:[[number,number],[number,number],[number,number],[number,number]]=[
     [x-3,y-3],[x+n.w/2,y-3],[x-3,y+n.h+3],[x+n.w/2,y+n.h+3]
    ];
    const colors=samples.map(([sx,sy])=>{const a=ctx.getImageData(Math.max(0,Math.min(width-1,Math.floor(sx))),Math.max(0,Math.min(height-1,Math.floor(sy))),1,1).data;return [a[0],a[1],a[2]];});
    const avg=[0,1,2].map(i=>colors.reduce((sum,p)=>sum+p[i],0)/colors.length);
    const maxDiff=Math.max(...colors.flatMap(p=>p.map((v,i)=>Math.abs(v-avg[i]))));
    if(maxDiff<9){ctx.fillStyle=`rgb(${avg.map(Math.round).join(',')})`;ctx.fillRect(x-1,y-1,Math.min(width-x+1,n.w+4),Math.min(height-y+1,n.h+3));}
    const bg=avg[0]+avg[1]+avg[2];n.fill=bg<280?'#ffffff':'#181818';
   }
  }
  const background:DesignNode={id:uid(),kind:'image',role:'background',locked:true,layerName:`PDF · página ${pageNumber}`,src:canvas.toDataURL('image/png'),x:0,y:0,w:width,h:height,angle:0,opacity:1,aspectLock:true};
  return {document:{width,height,background:'transparent',nodes:[background,...nodes]},count:nodes.length,pages:pdf.numPages,warning:'Trechos de texto foram separados. Áreas sobre fundos complexos preservam a imagem original (pode haver texto duplicado até substituir o fundo); áreas lisas são limpas aproximadamente. A página original permanece editável como fundo rasterizado.'};
 }finally{await task.destroy();}
}
