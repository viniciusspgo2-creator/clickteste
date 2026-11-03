/** Enquadramento local de fundos: mantém proporção, inclusive para imagens de outras medidas. */
export type BackgroundFitMode='cover'|'contain'|'original';
export type BackgroundRect={x:number;y:number;w:number;h:number};
export function matchingAspect(sourceWidth:number,sourceHeight:number,targetWidth:number,targetHeight:number,tolerance=.01):boolean{
 if(![sourceWidth,sourceHeight,targetWidth,targetHeight].every(n=>Number.isFinite(n)&&n>0))return false;
 return Math.abs((sourceWidth/sourceHeight)/(targetWidth/targetHeight)-1)<=tolerance;
}
export function backgroundFit(sourceWidth:number,sourceHeight:number,targetWidth:number,targetHeight:number,mode:BackgroundFitMode='cover'):BackgroundRect{
 if(![sourceWidth,sourceHeight,targetWidth,targetHeight].every(n=>Number.isFinite(n)&&n>0))throw new Error('Dimensões de imagem inválidas.');
 const factor=mode==='original'?1:mode==='contain'?Math.min(targetWidth/sourceWidth,targetHeight/sourceHeight):Math.max(targetWidth/sourceWidth,targetHeight/sourceHeight);
 const w=sourceWidth*factor,h=sourceHeight*factor;
 return {w,h,x:(targetWidth-w)/2,y:(targetHeight-h)/2};
}
