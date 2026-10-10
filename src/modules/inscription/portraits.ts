/** Dessin des portraits de la vérification visuelle : un buste, un visage, une main levée. */
import type { Sujet } from './parcours/index.ts';

const trait = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

const main = (doigts: number) => {
  const [cx, cy] = [92, 84];
  const ecart = Math.min(24, 130 / Math.max(doigts - 1, 1));
  const lignes = Array.from({ length: doigts }, (_, i) => {
    const angle = ((i - (doigts - 1) / 2) * ecart * Math.PI) / 180;
    const [dx, dy] = [Math.sin(angle), -Math.cos(angle)];
    return `<line x1="${(cx + dx * 9).toFixed(1)}" y1="${(cy + dy * 9).toFixed(1)}" x2="${(cx + dx * 25).toFixed(1)}" y2="${(cy + dy * 25).toFixed(1)}" />`;
  }).join('');
  return `
    <path d="M80 126 Q94 112 92 94" ${trait} stroke-width="3" />
    <circle cx="${cx}" cy="${cy}" r="9" fill="var(--papier)" stroke="currentColor" stroke-width="2.4" />
    <g ${trait} stroke-width="4.4">${lignes}</g>`;
};

export const portrait = ({ doigts, yeux, bouches }: Sujet) => {
  const abscisses = yeux === 3 ? [41, 52, 63] : [44, 60];
  const ordonnees = bouches === 2 ? [64, 71] : [67];
  return `<svg viewBox="0 0 120 140" aria-hidden="true" focusable="false">
    <path d="M18 140 Q20 106 52 101 Q84 106 86 140" fill="var(--papier)" stroke="currentColor" stroke-width="2.4" />
    <ellipse cx="52" cy="56" rx="21" ry="26" fill="var(--papier)" stroke="currentColor" stroke-width="2.4" />
    <path d="M31 50 Q34 26 54 28 Q72 29 73 50 Q62 38 48 40 Q38 41 31 50 Z" fill="currentColor" />
    ${abscisses.map((x) => `<circle cx="${x}" cy="54" r="2.5" fill="currentColor" />`).join('')}
    ${ordonnees.map((y) => `<path d="M45 ${y} Q52 ${y + 4} 59 ${y}" ${trait} stroke-width="2" />`).join('')}
    ${doigts === null ? '' : main(doigts)}
  </svg>`;
};
