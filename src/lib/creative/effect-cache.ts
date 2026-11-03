/** Small client-side LRU cache for precomposed raster effects.
 * Pixel budget prevents layered PNG/MP4 projects from consuming unbounded RAM.
 * A key includes source/mask identities, crop, tint and output dimensions.
 */
export class PixelBoundedCache<T> {
  private entries = new Map<string, { value:T; pixels:number }>();
  private used = 0;
  constructor(readonly maxPixels = 14_000_000, readonly maxItems = 24) {}
  get(key:string):T|undefined {
    const entry=this.entries.get(key);
    if(!entry)return undefined;
    this.entries.delete(key);this.entries.set(key,entry);
    return entry.value;
  }
  put(key:string,value:T,pixels:number):void {
    if(!Number.isSafeInteger(pixels)||pixels<=0||pixels>this.maxPixels)return;
    const existing=this.entries.get(key);
    if(existing){this.used-=existing.pixels;this.entries.delete(key);}
    while(this.entries.size && (this.used+pixels>this.maxPixels||this.entries.size>=this.maxItems)) {
      const oldest=this.entries.keys().next().value;
      if(oldest===undefined)break;
      this.used-=this.entries.get(oldest)!.pixels;this.entries.delete(oldest);
    }
    this.entries.set(key,{value,pixels});this.used+=pixels;
  }
  clear():void {this.entries.clear();this.used=0;}
  get pixelCount():number{return this.used;}
  get size():number{return this.entries.size;}
}

const tokenMap=new Map<string,number>();let tokenSequence=0;
/** Release source URL tokens after resetting an editor project. */
export function clearAssetTokens():void {tokenMap.clear();}
/** Do not build huge cache keys containing the original base64 image. */
export function assetToken(src:string):number {
  const existing=tokenMap.get(src);if(existing!==undefined)return existing;
  if(tokenMap.size>256)tokenMap.clear();
  const token=++tokenSequence;tokenMap.set(src,token);return token;
}
export function effectKey(input:{src:string;maskSrc?:string;tint?:string;w:number;h:number;sx:number;sy:number;sw:number;sh:number}):string {
  const n=(v:number)=>Math.round(v*1000)/1000;
  return [assetToken(input.src),input.maskSrc?assetToken(input.maskSrc):0,input.tint||'',
    input.w,input.h,n(input.sx),n(input.sy),n(input.sw),n(input.sh)].join(':');
}
