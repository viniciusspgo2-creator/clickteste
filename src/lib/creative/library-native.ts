import {PALETTES} from './library-manifest';

const shapes:Record<string,string>={
 star5:'<path d="M400 58 507 297 768 328 569 505 624 757 400 621 176 757 231 505 32 328 293 297Z"/>',
 star6:'<path d="M400 34 489 252 714 160 622 388 769 550 533 547 400 764 267 547 31 550 178 388 86 160 311 252Z"/>',
 sparkle4:'<path d="M400 30C453 276 524 347 770 400 524 453 453 524 400 770 347 524 276 453 30 400 276 347 347 276 400 30Z"/>',
 heart:'<path d="M400 703 125 455C-33 304 131 74 321 160l79 65 79-65c190-86 354 144 196 295Z"/>',
 'heart-outline':'<path d="M400 703 125 455C-33 304 131 74 321 160l79 65 79-65c190-86 354 144 196 295Z"/>',
 'heart-double':'<path d="M385 735 120 474C-28 300 118 75 307 140l78 61 78-61c189-65 335 160 187 334Z"/><path d="M430 495c-65-62-109-102-109-165 0-83 105-119 155-55 50-64 155-28 155 55 0 63-44 103-109 165l-46 42Z"/>',
 cloud:'<path d="M165 606h462c155 0 155-224 14-224-35-186-259-238-363-79-145-63-257 67-229 174-99 72-45 129 116 129Z"/>',
 bubble:'<path d="M152 176h496a79 79 0 0 1 79 79v258a79 79 0 0 1-79 79H348L167 731v-139h-15a79 79 0 0 1-79-79V255a79 79 0 0 1 79-79Z"/>',
 speech:'<path d="M400 81c201 0 361 115 361 278 0 156-155 279-355 279-44 0-94-8-128-15L81 722l59-161C39 506 34 417 34 359 34 196 196 81 400 81Z"/>',
 seal:'<path d="m400 35 63 58 86-30 41 75 92 5 14 91 74 51-25 92 28 83-69 61-7 90-87 21-36 82-88-24-57 65-78-43-80 46-53-65-89 27-37-83-87-19-6-91-70-61 29-82-26-91 76-53 13-91 92-5 42-74 87 30Z"/>',
 tag:'<path d="M67 203h441L753 400 508 597H67Z"/><circle cx="611" cy="400" r="27" fill="#fff" fill-opacity=".6"/>',
 arrow:'<path d="M41 339h471V213l253 189-253 186V464H41Z"/>',
 divider:'<path d="M20 372h320l60-56 60 56h320v56H460l-60 56-60-56H20Z"/>',
 confetti:'<path d="m80 70 68 6 15 93-70-9zM303 43l60 45-42 83-60-37zM589 54l78 11-31 80-80-24zM708 205l47 69-73 51-40-76zM95 320l74-7 19 76-86 13zM286 283l57 22-41 87-51-26zM511 349l95-15 15 75-84 9zM717 490l56 37-41 70-55-31zM97 600l89-21 17 75-89 16zM329 587l58 64-61 57-59-59zM560 641l67-30 36 75-77 27z"/>',
 circle:'<circle cx="400" cy="400" r="330"/>',
 diamond:'<path d="M400 35 769 400 400 765 31 400Z"/>',
 triangle:'<path d="M400 65 759 719H41Z"/>',
 hexagon:'<path d="M217 84h366l184 316-184 316H217L33 400Z"/>',
 ribbon:'<path d="M42 235h716l-80 176 80 177H42l81-177Z"/>',
 'ribbon-curved':'<path d="M85 297Q400 147 715 297L756 514Q400 358 44 514Z"/><path d="M96 326 18 324l70 123-42 105 85-29M704 326l78-2-70 123 42 105-85-29"/>',
 banner:'<rect x="63" y="238" width="674" height="324" rx="38"/>',
 'banner-folded':'<path d="M137 230h526v338H137Z"/><path d="M137 230 32 293l105 148M663 230l105 63-105 148"/>',
 'frame-rounded':'<rect x="82" y="82" width="636" height="636" rx="100" fill="none" stroke="CURRENT" stroke-width="40"/>',
 'frame-double':'<rect x="62" y="62" width="676" height="676" rx="60" fill="none" stroke="CURRENT" stroke-width="36"/><rect x="122" y="122" width="556" height="556" rx="40" fill="none" stroke="CURRENT" stroke-width="12"/>',
 'frame-circle':'<circle cx="400" cy="400" r="277" fill="none" stroke="CURRENT" stroke-width="34" stroke-dasharray="10 22" stroke-linecap="round"/><circle cx="400" cy="400" r="320" fill="none" stroke="CURRENT" stroke-width="10"/>',
 'frame-heart':'<path d="M400 703 125 455C-33 304 131 74 321 160l79 65 79-65c190-86 354 144 196 295Z" fill="none" stroke="CURRENT" stroke-width="38"/>',
 'frame-polaroid':'<path fill-rule="evenodd" d="M89 70h622v660H89Z M130 109v420h540V109Z"/><rect x="145" y="558" width="510" height="30" rx="15" fill="CURRENT" opacity=".25"/>',
 'frame-oval':'<ellipse cx="400" cy="400" rx="306" ry="348" fill="none" stroke="CURRENT" stroke-width="48"/><ellipse cx="400" cy="400" rx="269" ry="310" fill="none" stroke="CURRENT" stroke-width="9"/>',
 'frame-star':'<path d="M400 50 512 271 755 314 578 488 619 746 400 623 181 746 222 488 45 314 288 271Z" fill="none" stroke="CURRENT" stroke-width="34"/>',
};
const safeColor=(c:string)=>/^#[0-9a-fA-F]{6}$/.test(c)?c:'#ff6a00';
const asDataUrl=(svg:string)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
export function nativeShapeSvg(file:string,color='#ff6a00',strokeWidth=24){
 const [,id,variant]=file.split(':');if(!shapes[id])throw new Error('Forma indisponível');
 const safe=safeColor(color),weight=Math.max(4,Math.min(80,Math.round(strokeWidth)));let art=shapes[id].replaceAll('CURRENT',safe).replace(/stroke-width="([0-9]+)"/g,(_,w)=>`stroke-width="${Math.max(2,Math.round(Number(w)*weight/24))}"`);
 if(variant==='contorno'&&!id.startsWith('frame'))art=`<g fill="none" stroke="${safe}" stroke-width="${weight}" stroke-linejoin="round">${art.replace(/\sfill="[^"]*"/g,'')}</g>`;
 if(variant==='duplo')art+=`<rect x="25" y="25" width="750" height="750" rx="40" fill="none" stroke="${safe}" stroke-width="7" opacity=".45"/>`;
 return asDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" fill="${safe}">${art}</svg>`);
}
const patternArt=(pattern:string,a:string,b:string)=>{
 const defs=`<defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
 let art='';
 switch(pattern){
 case 'bolinhas':art=`<circle cx="20" cy="20" r="9" fill="${b}" opacity=".52"/><circle cx="84" cy="84" r="9" fill="${b}" opacity=".52"/>`;break;
 case 'listras':art=`<path d="M-40 15 15-40M10 65 65 10M50 105 105 50M90 145 145 90" stroke="${b}" stroke-width="18" opacity=".38"/>`;break;
 case 'estrelas':art=`<path d="m48 8 12 28 30 3-23 19 7 29-26-15-25 15 6-29-22-19 29-3Z" fill="${b}" opacity=".55"/>`;break;
 case 'coracoes':art=`<path d="M52 85 18 55C-9 27 19 2 42 24L52 33l10-9C85 2 113 27 86 55Z" fill="${b}" opacity=".45"/>`;break;
 case 'confete':art=`<path d="M10 14h14v23H10Z M64 27h25v10H64Z M23 68l18 9-11 11-15-10Z" fill="${b}" opacity=".56"/>`;break;
 case 'ondas':art=`<path d="M0 30Q25 8 50 30T100 30M0 68Q25 46 50 68T100 68" fill="none" stroke="${b}" stroke-width="9" opacity=".33"/>`;break;
 default:art='';
 }
 return `${defs}<pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse">${art}</pattern></defs>`;
};
export function nativeBackgroundSvg(file:string,width=2480,height=1122){
 const [,indexRaw,pattern]=file.split(':');const palette=PALETTES[Number(indexRaw)];if(!palette)throw new Error('Fundo indisponível');
 const a=safeColor(palette[1]),b=safeColor(palette[2]);
 const w=Math.max(100,Math.min(8192,Math.round(width))),h=Math.max(100,Math.min(8192,Math.round(height)));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${patternArt(pattern,a,b)}<rect width="${w}" height="${h}" fill="url(#grad)"/>${pattern==='degrade'?'':`<rect width="${w}" height="${h}" fill="url(#p)"/>`}</svg>`;
 return asDataUrl(svg);
}
