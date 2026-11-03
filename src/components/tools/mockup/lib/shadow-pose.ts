/**
 * Projeção da orientação da caneca sobre o plano XZ.
 * A geometria continua inalterada: apenas a penumbra difusa acompanha a pose.
 * Euler XYZ é a mesma ordem usada em scene/mug.tsx, com giro Y invertido.
 * Não depende de WebGL; pode ser testado em Node.
 */
export type ShadowPose = {stretch:number;cross:number;angle:number;flatness:number};
const rad=(degrees:number)=>degrees*Math.PI/180;
const safe=(value:number)=>Number.isFinite(value)?value:0;
export function projectedShadowPose(tiltX=0,tiltZ=0,rotationY=0):ShadowPose{
  const x=rad(safe(tiltX)),z=rad(safe(tiltZ)),y=rad(-safe(rotationY));
  // Transformação do eixo vertical [0,1,0] pela matriz R(X)*R(Y)*R(Z).
  const axisX=-Math.sin(z)*Math.cos(y);
  const axisZ=Math.sin(x)*Math.cos(z)+Math.cos(x)*Math.sin(z)*Math.sin(y);
  const flatness=Math.min(1,Math.hypot(axisX,axisZ));
  return {
    stretch:1+1.12*flatness,
    cross:1+0.04*flatness,
    // Rotação positiva Y leva +X no sentido -Z.
    angle:flatness<0.001?0:-Math.atan2(axisZ,axisX),
    flatness,
  };
}
