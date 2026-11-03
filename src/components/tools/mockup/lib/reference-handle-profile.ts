/**
 * Studio Click — alça C de caneca reta 325 ml, reconstruída das duas fotos.
 * Coordenadas no plano YZ em centímetros (Y vertical, Z para fora da caneca).
 * A silhueta tem dois encaixes discretos e corpo em C contínuo, sem o desenho
 * triangular/alargado da versão anterior. Não é uma malha digitalizada 3D:
 * requer comparação em WebGL com a peça real antes da publicação.
 * Raízes enterradas em raio 4,1 cm (e longe da cavidade interna).
 */
export const LIVE_SUB_HANDLE_POINTS: readonly (readonly [number, number, number])[] = [
  [0, 7.78, -3.72], // encaixe superior dentro do esmalte
  [0, 7.80, -4.28],
  [0, 7.77, -4.90],
  [0, 7.60, -5.52],
  [0, 7.29, -6.18],
  [0, 6.72, -6.87],
  [0, 5.97, -7.36],
  [0, 5.22, -7.52], // face externa quase vertical, C verdadeiro
  [0, 4.44, -7.50],
  [0, 3.69, -7.32],
  [0, 3.02, -6.89],
  [0, 2.47, -6.22],
  [0, 2.18, -5.55],
  [0, 2.10, -4.91],
  [0, 2.10, -4.29],
  [0, 2.09, -3.72], // encaixe inferior integrado à parede
];
