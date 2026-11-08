import {asDataUrl,imageFor,uid,type DesignDocument,type DesignNode} from './design';
import type {MockupHandoff} from './handoff';

/** Decode everything before committing, so an interrupted import cannot leave
 * half a transfer in the document. Each piece remains an independent image. */
export async function prepareMockupHandoff(handoff:MockupHandoff):Promise<DesignDocument>{
 const layers=await Promise.all(handoff.items.map(async item=>{
  const src=await asDataUrl(item.blob),image=await imageFor(src);
  return {src,name:item.name,width:image.naturalWidth,height:image.naturalHeight};
 }));
 const width=1080,height=1350,gap=32;
 const columns=layers.length===1?1:Math.ceil(Math.sqrt(layers.length));
 const rows=Math.ceil(layers.length/columns);
 const cellW=(width*.88-gap*(columns-1))/columns;
 const cellH=(height*.78-gap*(rows-1))/rows;
 // A common scale preserves relative size for the usual front/back pair.
 const factor=Math.min(1,...layers.map(l=>Math.min(cellW/l.width,cellH/l.height)));
 const nodes:DesignNode[]=layers.map((layer,i)=>{
  const w=layer.width*factor,h=layer.height*factor,row=Math.floor(i/columns);
  const rowCount=Math.min(columns,layers.length-row*columns);
  const rowWidth=rowCount*cellW+(rowCount-1)*gap;
  return {id:uid(),kind:'image',role:'mockup',layerName:layer.name,src:layer.src,w,h,
   x:(width-rowWidth)/2+(i%columns)*(cellW+gap)+(cellW-w)/2,
   y:(height-(rows*cellH+(rows-1)*gap))/2+row*(cellH+gap)+(cellH-h)/2,
   aspectLock:true,angle:0,opacity:1,shadow:0,brightness:100,contrast:100,saturation:100};
 });
 return {width,height,background:'#141112',nodes};
}
