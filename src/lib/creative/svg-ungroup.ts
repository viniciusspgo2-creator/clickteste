import {sanitizeEditableSvg,svgSource,svgDataUrl} from './editable-svg';
const resources=new Set(['defs','title','desc','linearGradient','radialGradient','clipPath','mask']);
export type SvgFragment={src:string;name:string;x:number;y:number;w:number;h:number;canvasWidth:number;canvasHeight:number};
/** Separate one structural level; groups inside each object remain intact. */
export async function ungroupSvg(src:string):Promise<SvgFragment[]>{
 const raw=svgSource(src);if(!raw)throw Error('Selecione um SVG vetorial. PNG e JPG não podem ser desagrupados.');
 const safe=sanitizeEditableSvg(raw),doc=new DOMParser().parseFromString(safe,'image/svg+xml'),root=doc.documentElement;
 const composite=(e:Element)=>['opacity','mask','clip-path'].some(k=>e.hasAttribute(k)&&(k!=='opacity'||Number(e.getAttribute(k))!==1));
 if(composite(root))throw Error('O SVG possui transparência ou máscara global. Separe esse efeito no arquivo original antes de desagrupar.');
 let parent:Element=root;
 const children=(e:Element)=>Array.from(e.children).filter(c=>!resources.has(c.localName));
 while(children(parent).length===1&&children(parent)[0].localName==='g'&&!composite(children(parent)[0]))parent=children(parent)[0];
 const parts=children(parent);if(parts.length<2)throw Error('Este SVG contém um único objeto ou grupo com máscara. Não há objetos independentes neste nível.');
 if(parts.length>200)throw Error('Este nível tem mais de 200 partes. Organize os personagens em grupos antes de desagrupar.');
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-30000px;top:0;visibility:hidden;pointer-events:none';
 const rendered=document.importNode(root,true) as unknown as SVGSVGElement;host.append(rendered);document.body.append(host);
 try{
  await document.fonts.ready;
  const w=Number(root.getAttribute('width')),h=Number(root.getAttribute('height')),origin=rendered.getBoundingClientRect();
  const indices=parts.map(e=>Array.from(root.querySelectorAll('*')).indexOf(e));const renderedElements=Array.from(rendered.querySelectorAll('*'));
  const defs=Array.from(root.querySelectorAll('defs')).map(d=>d.cloneNode(true));const result:SvgFragment[]=[];
  for(let i=0;i<parts.length;i++){
   const e=renderedElements[indices[i]] as SVGGraphicsElement;if(['hidden','collapse'].includes(getComputedStyle(e).visibility))continue;const bounds=e.getBoundingClientRect();if(!bounds.width&&!bounds.height)continue;
   let pad=2;
   for(const shape of [e,...Array.from(e.querySelectorAll('*'))] as SVGGraphicsElement[]){const style=getComputedStyle(shape),m=shape.getScreenCTM?.();if(style.stroke!=='none'&&m)pad=Math.max(pad,parseFloat(style.strokeWidth)*Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d))/2+2);}
   const x=Math.max(0,bounds.left-origin.left-pad),y=Math.max(0,bounds.top-origin.top-pad),right=Math.min(w,bounds.right-origin.left+pad),bottom=Math.min(h,bounds.bottom-origin.top+pad);if(right<=x||bottom<=y)continue;
   const clone=root.cloneNode(true) as Element;let target=Array.from(clone.querySelectorAll('*'))[indices[i]];
   while(target.parentElement){const container=target.parentElement;for(const sibling of Array.from(container.children))if(sibling!==target&&!resources.has(sibling.localName))sibling.remove();if(container===clone)break;target=container;}
   for(const d of Array.from(clone.querySelectorAll('defs')))d.remove();for(const d of defs)clone.prepend(d.cloneNode(true));
   clone.setAttribute('x','0');clone.setAttribute('y','0');
   const name=(parts[i].getAttribute('data-name')||parts[i].getAttribute('aria-label')||parts[i].id||`Objeto ${i+1}`).slice(0,120);
   const xml=new XMLSerializer().serializeToString(clone),fw=right-x,fh=bottom-y;
   result.push({src:svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${fw}" height="${fh}" viewBox="${x} ${y} ${fw} ${fh}">${xml}</svg>`),name,x,y,w:fw,h:fh,canvasWidth:w,canvasHeight:h});
  }
  if(result.length<2)throw Error('Não foi possível encontrar dois objetos visíveis para separar.');return result;
 }finally{host.remove();}
}
