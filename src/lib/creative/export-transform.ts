/** Espelhamento opcional só na exportação para transferência de estampas.
 * Não modifica o documento, nem as transformações individuais de objetos. */
export function drawOutputWithMirror(
 ctx:CanvasRenderingContext2D,
 image:CanvasImageSource,
 width:number,
 height:number,
 mirrorHorizontal:boolean
):void{
 if(mirrorHorizontal){
  ctx.save();
  ctx.translate(width,0);
  ctx.scale(-1,1);
 }
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,0,0,width,height);
 if(mirrorHorizontal)ctx.restore();
}
