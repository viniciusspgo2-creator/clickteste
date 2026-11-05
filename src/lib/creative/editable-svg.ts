/** SVG stays a self-contained image layer. Paint edits change its data URI, so
 * history, copying, project backups and the existing renderer keep working.
 * Uploaded markup is rebuilt in a detached XML document, never injected as HTML.
 */
const NS='http://www.w3.org/2000/svg';
const tags=new Set(['svg','g','defs','path','rect','circle','ellipse','line','polyline','polygon','linearGradient','radialGradient','stop','clipPath','mask','text','tspan','title','desc']);
const attrs=new Set(['width','height','viewBox','preserveAspectRatio','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','transform','fill','fill-rule','clip-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','vector-effect','paint-order','shape-rendering','stroke-dasharray','stroke-dashoffset','opacity','fill-opacity','stroke-opacity','gradientTransform','gradientUnits','spreadMethod','offset','stop-color','stop-opacity','id','clip-path','mask','maskUnits','maskContentUnits','clipPathUnits','text-anchor','dominant-baseline','font-size','font-family','font-weight','font-style','letter-spacing','text-decoration','color','display','visibility','data-name','aria-label','version','xml:space']);
const properties=new Set(['fill','fill-rule','clip-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','vector-effect','paint-order','shape-rendering','stroke-dasharray','stroke-dashoffset','opacity','fill-opacity','stroke-opacity','stop-color','stop-opacity','color','display','visibility','text-anchor','dominant-baseline','font-size','font-family','font-weight','font-style','letter-spacing','text-decoration','clip-path','mask']);
const drawing=new Set(['path','rect','circle','ellipse','line','polyline','polygon','text','tspan']);
const MAX_CHARS=1_500_000;

function parse(source:string){
 if(!source||source.length>MAX_CHARS||/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source))throw Error('SVG muito grande ou com XML não suportado.');
 const doc=new DOMParser().parseFromString(source,'image/svg+xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('O arquivo não contém um SVG válido.');
 if(doc.getElementsByTagName('*').length>5000)throw Error('SVG muito complexo: limite de 5.000 partes.');
 return doc;
}
function safeValue(value:string){
 return !/javascript:|data:|https?:|file:|expression\s*\(|@import|[<>\\]/i.test(value)&&
  (!/url\s*\(/i.test(value)||/^url\(\s*['"]?#[A-Za-z_][\w:.-]*['"]?\s*\)$/.test(value));
}
function declarations(style:CSSStyleDeclaration){
 const result:{name:string;value:string;important:boolean}[]=[];
 for(const name of Array.from(style)){
  const value=style.getPropertyValue(name).trim();
  if(!properties.has(name)||!safeValue(value))throw Error(`Propriedade SVG não suportada: ${name}. Exporte como SVG simples, com textos convertidos em curvas.`);
  result.push({name,value,important:style.getPropertyPriority(name)==='important'});
 }
 return result;
}
function selectorWeight(selector:string){
 // Support Illustrator/Inkscape's simple classes and descendant selectors.
 // Reject unsupported selectors rather than silently recoloring a different part.
 if(!/^[\w\s.*#>+~-]+$/.test(selector))throw Error('O SVG usa seletores CSS não suportados. Exporte com estilos de apresentação.');
 return (selector.match(/#[\w-]+/g)||[]).length*10000+(selector.match(/\.[\w-]+/g)||[]).length*100+(selector.match(/(?:^|[\s>+~])[A-Za-z_][\w-]*/g)||[]).length;
}
const unitLength=(value:string|null)=>{
 const match=value?.trim().match(/^(\d*\.?\d+)(px|mm|cm|in|pt|pc)?$/i);
 if(!match)return 0;
 const factors:Record<string,number>={px:1,mm:96/25.4,cm:96/2.54,in:96,pt:96/72,pc:16};
 return Number(match[1])*(factors[(match[2]||'px').toLowerCase()]||1);
};
export function sanitizeEditableSvg(source:string):string{
 const input=parse(source);
 const rules:{selector:string;weight:number;declarations:ReturnType<typeof declarations>}[]=[];
 for(const style of Array.from(input.getElementsByTagName('style'))){
  const text=style.textContent||'';
  if(text.length>100000||/@|javascript:|https?:|data:|expression\s*\(/i.test(text))throw Error('O SVG contém estilos externos ou não suportados.');
  const sheet=new CSSStyleSheet();sheet.replaceSync(text);
  for(const rule of Array.from(sheet.cssRules)){
   if(!(rule instanceof CSSStyleRule))throw Error('O SVG contém regras CSS não suportadas.');
   const values=declarations(rule.style);
   for(const selector of rule.selectorText.split(',').map(s=>s.trim()))rules.push({selector,weight:selectorWeight(selector),declarations:values});
  }
 }
 const output=document.implementation.createDocument(NS,'svg',null);
 let count=0;
 const copy=(original:Element,parent:Element)=>{
  for(const attribute of Array.from(original.attributes)){
   if(attribute.name==='xmlns'||attribute.prefix==='xmlns'||attribute.name==='class'||attribute.name==='style')continue;
   if(attribute.localName==='label'&&attribute.namespaceURI==='http://www.inkscape.org/namespaces/inkscape'){parent.setAttribute('data-name',attribute.value.slice(0,120));continue;}
   if(['http://www.inkscape.org/namespaces/inkscape','http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd'].includes(attribute.namespaceURI||''))continue;
   if(!attrs.has(attribute.name)||attribute.namespaceURI&&!['http://www.w3.org/XML/1998/namespace'].includes(attribute.namespaceURI)||!safeValue(attribute.value))throw Error(`Atributo SVG não suportado: ${attribute.name}. Remova links, imagens incorporadas ou efeitos externos.`);
   parent.setAttribute(attribute.name,attribute.value);
  }
  const cascade=new Map<string,{value:string;weight:number}>();
  for(const rule of rules)if(original.matches(rule.selector))for(const value of rule.declarations){
   const weight=rule.weight+(value.important?1000000:0),previous=cascade.get(value.name);
   if(!previous||weight>=previous.weight)cascade.set(value.name,{value:value.value,weight});
  }
  if(original.hasAttribute('style')){
   const style=document.createElement('span').style;style.cssText=original.getAttribute('style')||'';
   for(const value of declarations(style)){
    const weight=100000+(value.important?1000000:0),previous=cascade.get(value.name);
    if(!previous||weight>=previous.weight)cascade.set(value.name,{value:value.value,weight});
   }
  }
  for(const [name,value] of cascade)parent.setAttribute(name,value.value);
  for(const child of Array.from(original.childNodes)){
   if(child.nodeType===Node.TEXT_NODE){parent.appendChild(output.createTextNode(child.textContent||''));continue;}
   if(!(child instanceof Element))continue;
   if(['style','metadata','namedview'].includes(child.localName))continue;
   if(!tags.has(child.localName))throw Error(`Elemento SVG não suportado: ${child.localName}. Exporte os objetos como caminhos vetoriais.`);
   if(++count>5000)throw Error('SVG muito complexo.');
   const node=output.createElementNS(NS,child.localName);copy(child,node);parent.appendChild(node);
  }
 };
 copy(input.documentElement,output.documentElement);
 const root=output.documentElement;
 const view=(root.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
 const hasView=view.length===4&&view.every(Number.isFinite)&&view[2]>0&&view[3]>0;
 let width=unitLength(root.getAttribute('width'))||(hasView?view[2]:1000);
 let height=unitLength(root.getAttribute('height'))||(hasView?view[3]:1000);
 if(!Number.isFinite(width+height)||width<=0||height<=0||Math.max(width,height)>20000)throw Error('Dimensões SVG inválidas.');
 if(!hasView)root.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const scale=Math.max(width,height)<256?512/Math.max(width,height):Math.min(1,4800/Math.max(width,height));
 width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));
 root.setAttribute('width',String(width));root.setAttribute('height',String(height));root.setAttribute('xmlns',NS);
 // Freeze currentColor before a later paint edit changes its inherited context.
 for(const element of Array.from(output.getElementsByTagName('*')))for(const paint of ['fill','stroke','stop-color']){
  if(element.getAttribute(paint)==='currentColor')element.setAttribute(paint,inherited(element,'color','#000000'));
 }
 return new XMLSerializer().serializeToString(root);
}
function inherited(element:Element,name:string,fallback:string):string{
 let current:Element|null=element;
 while(current){const value=current.getAttribute(name)?.trim();if(value&&value!=='inherit')return value;current=current.parentElement;}
 return fallback;
}
export function svgDataUrl(source:string){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;}
export function svgSource(src:string):string|null{
 if(!/^data:image\/svg\+xml(?:;charset=utf-8|;utf8)?(?:;base64)?,/i.test(src))return null;
 const comma=src.indexOf(',');
 try{
  const text=src.slice(0,comma).endsWith(';base64')?new TextDecoder().decode(Uint8Array.from(atob(src.slice(comma+1)),c=>c.charCodeAt(0))):decodeURIComponent(src.slice(comma+1));
  return text.length<=MAX_CHARS?text:null;
 }catch{return null;}
}
export type SvgPaint={key:string;index:number;attribute:'fill'|'stroke'|'stop-color';label:string;color:string;alpha:number};
let colorContext:CanvasRenderingContext2D|null=null;
function paintColor(value:string){
 if(value==='none'||/url\s*\(/i.test(value)||!CSS.supports('color',value))return null;
 const context=colorContext||(colorContext=document.createElement('canvas').getContext('2d',{willReadFrequently:true}));if(!context)return null;
 context.fillStyle=value;
 // Reading translucent pixels premultiplies RGB and can drift a channel by one
 // on every edit. Prefer the browser's normalized, unpremultiplied CSS value.
 const canonical=String(context.fillStyle);
 if(/^#[0-9a-f]{6}$/i.test(canonical))return {color:canonical.toLowerCase(),alpha:1};
 const rgba=canonical.match(/^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/);
 if(rgba){const alpha=rgba[4]===undefined?1:Number(rgba[4]);return alpha?{color:'#'+rgba.slice(1,4).map(n=>Math.round(Number(n)).toString(16).padStart(2,'0')).join(''),alpha}:null;}
 context.canvas.width=1;context.canvas.height=1;context.fillStyle=value;context.fillRect(0,0,1,1);
 const [r,g,b,a]=context.getImageData(0,0,1,1).data;
 return a?{color:'#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join(''),alpha:a/255}:null;
}
function parts(doc:Document):SvgPaint[]{
 const list:SvgPaint[]=[];
 const colors=new Map<string,ReturnType<typeof paintColor>>();
 let partNumber=0;
 Array.from(doc.getElementsByTagName('*')).forEach((element,index)=>{
  const stop=element.localName==='stop';
  if(!stop&&!drawing.has(element.localName))return;
  // Containers with tspans must not introduce a phantom editable fill row.
  if(element.localName==='text'&&!Array.from(element.childNodes).some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent?.trim()))return;
  for(let parent:Element|null=element;parent;parent=parent.parentElement){
   if(parent.getAttribute('display')==='none'||parent.getAttribute('visibility')==='hidden')return;
   if(!stop&&['defs','clipPath','mask'].includes(parent.localName))return;
  }
  const group=element.closest('[data-name],[aria-label],[id]');
  const name=group?.getAttribute('data-name')||group?.getAttribute('aria-label')||group?.id||`Parte ${++partNumber}`;
  const attributes:SvgPaint['attribute'][]=stop?['stop-color']:element.localName==='line'?['stroke']:['fill','stroke'];
  for(const attribute of attributes){
   let value=inherited(element,attribute,attribute==='stroke'?'none':'#000000');
   if(value==='currentColor')value=inherited(element,'color','#000000');
   if(!colors.has(value))colors.set(value,paintColor(value));
   const color=colors.get(value);if(!color)continue;
   const label=stop?`${name} · cor do degradê`:attribute==='stroke'?`${name} · contorno`:name;
   list.push({key:`${index}:${attribute}`,index,attribute,label:label.slice(0,160),...color});
  }
 });
 return list;
}
/** Only read sanitized, self-contained SVGs. Re-sanitize imported project markup. */
export function inspectSvg(src:string):{source:string;paints:SvgPaint[]}|null{
 const source=svgSource(src);if(!source)return null;
 const clean=sanitizeEditableSvg(source);return {source:clean,paints:parts(parse(clean))};
}
export function recolorSvg(src:string,key:string,color:string,mode:'part'|'color'='part'):string{
 if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Cor inválida.');
 const inspected=inspectSvg(src);if(!inspected)throw Error('Selecione uma imagem SVG editável.');
 const target=inspected.paints.find(p=>p.key===key);if(!target)throw Error('Parte do SVG não encontrada.');
 const doc=parse(inspected.source),elements=Array.from(doc.getElementsByTagName('*'));
 for(const paint of inspected.paints){
  if(mode==='part'?paint.key!==key:paint.color!==target.color||paint.alpha!==target.alpha)continue;
  const value=paint.alpha===1?color:`rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${paint.alpha})`;
  elements[paint.index].setAttribute(paint.attribute,value);
 }
 return svgDataUrl(new XMLSerializer().serializeToString(doc.documentElement));
}
