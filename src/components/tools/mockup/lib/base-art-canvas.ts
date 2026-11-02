import type { ArtState, MugState } from '../state/store';
import {getArtImage} from './art-registry';
import {baseArtTransform} from './base-art';
export function baseExportSize(outputSide:number,maxTextureSize:number,pieces:number,mobile:boolean) {
 const budget=mobile?2000000:8000000;
 return Math.max(1,Math.floor(Math.min(maxTextureSize,4096,Math.max(1024,outputSide),Math.sqrt(budget/Math.max(1,pieces)))));
}
/** Draw from the retained original, with the same defaults used in old projects. */
export function renderBaseArt(art:ArtState,mug:MugState,side=1024):HTMLCanvasElement|null {
 const entry=getArtImage(art.baseImageId??null);if(!entry)return null;
 const c=document.createElement('canvas');c.width=c.height=side;const ctx=c.getContext('2d')!;
 ctx.fillStyle=mug.baseColor??mug.bodyColor;ctx.fillRect(0,0,side,side);
 const transform=baseArtTransform(art),scale=Math.min(side/entry.width,side/entry.height)*transform.scale;
 const w=entry.width*scale,h=entry.height*scale;
 ctx.drawImage(entry.source,(side-w)/2+transform.x*side/2,(side-h)/2+transform.y*side/2,w,h);
 return c;
}
