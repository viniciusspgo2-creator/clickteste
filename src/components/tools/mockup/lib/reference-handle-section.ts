/** Seção cerâmica da alça 325 ml em C. Espessura constante no arco,
 * com transição contínua e apenas um pequeno alargamento dos encaixes,
 * nunca um afilamento que deixe raízes parecendo fios. */
export function referenceHandleSection(t: number): { width: number; thickness: number } {
  if (!Number.isFinite(t)) throw new Error('Parâmetro da alça inválido');
  const u = Math.max(0, Math.min(1, t));
  const distance = Math.min(u, 1 - u);
  const s = Math.min(1, distance / 0.085);
  const blend = s * s * s * (s * (s * 6 - 15) + 10);
  // O corpo da alça é cheio; a junção modelada é curta, sem protuberância.
  const root = 0.80 + 0.20 * blend;
  const grip = Math.exp(-Math.pow((u - 0.5) / 0.42, 4));
  return { width: root * (1 + 0.035 * grip), thickness: root * (1 + 0.025 * grip) };
}
