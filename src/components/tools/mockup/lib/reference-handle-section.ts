/**
 * Perfil transversal da alça 325 ml inspirado na fotografia de referência.
 * O perfil é um estudo de proporções: sem medições laterais não é uma digitalização exata.
 * t percorre o comprimento da alça, desde a união superior até a inferior.
 * Não altera os outros estilos nem a geometria salva de projetos antigos.
 */
export function referenceHandleSection(t: number): { width: number; thickness: number } {
  if (!Number.isFinite(t)) throw new Error('Parâmetro da alça inválido');
  const u = Math.max(0, Math.min(1, t));
  const dist = Math.min(u, 1 - u);
  const transition = Math.max(0, Math.min(1, dist / 0.085));
  const smooth = transition * transition * (3 - 2 * transition);
  // A seção termina dentro da cerâmica com pescoço fino, sem calço aparente.
  const root = 0.35 + 0.65 * smooth;
  // Na parte onde a mão segura, a seção é um pouco mais cheia e lisa.
  const grip = Math.exp(-Math.pow((u - 0.5) / 0.30, 2));
  return { width: root * (1 + 0.075 * grip), thickness: root * (1 + 0.045 * grip) };
}
