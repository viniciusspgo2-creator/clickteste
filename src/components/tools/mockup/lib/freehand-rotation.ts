/** Stable rotation delta for a canvas gesture; degrees can cross 360 any number of times. */
export function freehandRotation(
  start: Readonly<{x:number;y:number;z:number}>,
  dx: number, dy: number,
  options: {fine:boolean;roll:boolean},
): {x:number;y:number;z:number} {
  const radiansPerPixel = Math.PI / 180 * (options.fine ? 0.12 : 0.5);
  return {
    x: start.x + dy * radiansPerPixel,
    y: start.y - (options.roll ? 0 : dx) * radiansPerPixel,
    z: start.z + (options.roll ? dx : 0) * radiansPerPixel,
  };
}
