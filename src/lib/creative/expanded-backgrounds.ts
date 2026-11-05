import {PALETTES} from './library-manifest';
import catalog from './background-catalog.json';
const patterns=new Map(catalog.map(p=>[p.id,p]));
const license=`MIT License\nCopyright (c) 2020 - 2023 pattern.monster\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the Software), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
const cache=new Map<string,Promise<string>>();
const blend=(a:string,b:string,t:number)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function backgroundDescriptor(file:string){
 const [prefix,id,index]=file.split(':');const p=patterns.get(id),n=Number(index);
 if(prefix!=='pattern'||!p||!/^\d+$/.test(index)||!PALETTES[n])throw new Error('Fundo indisponível.');
 return {pattern:p,palette:PALETTES[n]};
}
function composition(id:string,a:string,b:string,c:string){
 switch(id){
 case 'aurora':return `<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><path d="M-100 550Q300-170 600 300T1300 100V600H0Z" fill="${a}" opacity=".3"/>`;
 case 'sunset':return `<circle cx="600" cy="400" r="270" fill="${b}"/>${Array.from({length:8},(_,i)=>`<rect y="${330+i*34}" width="1200" height="${i*2+4}" fill="${a}"/>`).join('')}<path d="M0 530Q400 450 1200 540V600H0Z" fill="${c}"/>`;
 case 'mesh':return `<defs><radialGradient id="g"><stop stop-color="${b}"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient></defs><ellipse cx="300" cy="180" rx="650" ry="500" fill="url(#g)"/><ellipse cx="1050" cy="550" rx="720" ry="500" fill="url(#g)"/>`;
 case 'blobs':return `<path d="M0 0H420Q650 170 330 290T0 580Z" fill="${b}"/><path d="M1200 600H740Q550 410 880 280T1200 20Z" fill="${c}"/><circle cx="1010" cy="150" r="80" fill="${b}" opacity=".7"/>`;
 case 'arches':return [0,1,2,3,4,5].map(i=>`<path d="M${90+i*20} 600V300a${510-i*20} ${240-i*20} 0 0 1 ${1020-i*40} 0V600" fill="none" stroke="${i%2?c:b}" stroke-width="12"/>`).join('');
 case 'bauhaus':return `<rect x="80" y="50" width="390" height="500" fill="${b}"/><circle cx="470" cy="300" r="250" fill="${c}"/><path d="M730 550 980 50 1200 550Z" fill="${b}"/><circle cx="190" cy="170" r="85" fill="${a}"/><path d="M0 600 600 0" stroke="${a}" stroke-width="36"/>`;
 case 'deco':return `<defs><pattern id="p" width="180" height="180" patternUnits="userSpaceOnUse">${[25,45,65,85].map(r=>`<path d="M${90-r} 180a${r} ${r} 0 0 1 ${r*2} 0M${-r} 90a${r} ${r} 0 0 1 ${r*2} 0M${180-r} 90a${r} ${r} 0 0 1 ${r*2} 0" fill="none" stroke="${b}" stroke-width="2"/>`).join('')}</pattern></defs><rect width="1200" height="600" fill="url(#p)"/>`;
 case 'ribbons':return [0,1,2,3,4,5].map(i=>`<path d="M-100 ${i*100}C300 ${i*100-300} 700 ${i*100+350} 1300 ${i*100-50}" fill="none" stroke="${i%2?b:c}" stroke-width="45" opacity=".7"/>`).join('');
 case 'marble':return [0,1,2,3,4,5,6].map(i=>`<path d="M${i*180-400} -100Q${i*180+500} 50 ${i*180} 250T${i*180+500} 700" fill="none" stroke="${i%2?b:c}" stroke-width="${i%2?3:14}" opacity=".5"/>`).join('');
 case 'rays':return Array.from({length:24},(_,i)=>`<path d="M600 600 550 -900H650Z" transform="rotate(${i*15} 600 600)" fill="${i%2?b:c}"/>`).join('');
 case 'landscape':return [0,1,2,3].map(i=>`<path d="M0 ${240+i*90}Q200 ${30+i*100} 450 ${270+i*70}T900 ${200+i*110}L1200 ${220+i*100}V600H0Z" fill="${blend(b,a,i*.22)}"/>`).join('');
 case 'frame':return `<rect x="180" y="80" width="840" height="440" rx="180" fill="${c}"/>${[0,1,2,3].map(i=>`<g transform="translate(${i%2?1060:140} ${i<2?170:440}) rotate(${i*80})"><path d="M-90 130Q20 0 0-160" fill="none" stroke="${b}" stroke-width="7"/>${[0,1,2,3].map(j=>`<ellipse cx="${j%2?20:-25}" cy="${j*65-100}" rx="45" ry="18" transform="rotate(${j%2?-30:30} 0 ${j*65-100})" fill="${b}"/>`).join('')}</g>`).join('')}`;
 default:throw new Error('Composição indisponível.');
 }
}
export async function expandedBackgroundSvg(file:string,width:number,height:number,sanitize:(svg:string)=>string){
 const {pattern,palette}=backgroundDescriptor(file);const [,a,b]=palette,c=blend(a,b,.28);
 const w=Math.max(100,Math.min(8192,Math.round(width))),h=Math.max(100,Math.min(8192,Math.round(height)));
 let content:string;
 if(pattern.source==='original')content=`<svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="600" fill="${a}"/>${composition(pattern.id.replace(/^original-/,''),a,b,c)}</svg>`;
 else {
  let pending=cache.get(pattern.id);
  if(!pending){pending=fetch(`/creative-library/pattern-monster/${pattern.id}.svg`,{cache:'force-cache'}).then(async r=>{if(!r.ok)throw new Error('Não foi possível carregar o padrão. Tente novamente.');const text=await r.text();return sanitize(text);}).catch(e=>{cache.delete(pattern.id);throw e;});cache.set(pattern.id,pending);if(cache.size>64)cache.delete(cache.keys().next().value!);}
  let tile=await pending;
  const box=tile.match(/viewBox="([^"]+)"/)?.[1];if(!box)throw new Error('Dimensões do padrão inválidas.');const [, ,tw,th]=box.split(/[\s,]+/).map(Number);
  if(!Number.isFinite(tw)||!Number.isFinite(th)||tw<=0||th<=0)throw new Error('Dimensões do padrão inválidas.');
  const inks=[b,blend(a,b,.8),blend(a,b,.55),blend(a,b,.35)];['#111111','#222222','#333333','#444444'].forEach((token,i)=>{tile=tile.replaceAll(token,inks[i]);});
  const paths=tile.slice(tile.indexOf('>')+1,tile.lastIndexOf('</svg>')),scale=Math.max(w,h)/12/Math.max(tw,th);
  content=`<!-- ${license} --><defs><pattern id="p" width="${tw*scale}" height="${th*scale}" viewBox="${box}" patternUnits="userSpaceOnUse">${paths}</pattern></defs><rect width="${w}" height="${h}" fill="${a}"/><rect width="${w}" height="${h}" fill="url(#p)"/>`;
 }
 return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`)}`;
}
