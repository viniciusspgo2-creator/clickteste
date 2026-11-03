/**
 * Study of the 325 ml white ceramic mug pictured in the supplied frontal photo.
 * 1 unit = 1 cm; mug radius 4.1 cm and height 9.55 cm.
 * These are *estimated visible landmarks*, not a 3D scan or verified tooling
 * specification. Additional side/back photographs are required for exact fit.
 *
 * X is fixed in the handle's symmetry plane; negative Z points away from the
 * side wall. Both open ends are embedded INSIDE the mug's outer radius.
 */
export const LIVE_SUB_HANDLE_POINTS: readonly (readonly [number, number, number])[] = [
  [0, 7.86, -3.91], [0, 7.86, -4.42], [0, 7.76, -5.05],
  [0, 7.49, -5.75], [0, 6.92, -6.46], [0, 6.08, -7.12],
  [0, 5.30, -7.43], [0, 4.44, -7.49], [0, 3.57, -7.26],
  [0, 2.81, -6.71], [0, 2.23, -6.00], [0, 1.86, -5.18],
  [0, 1.83, -4.42], [0, 1.83, -3.91],
];
