/**
 * 07 — La citation refuse ses responsabilités.
 *
 * À l'approche du curseur, les guillemets se resserrent autour du texte, d'un geste presque
 * protecteur. Un cartouche précise que la citation nie avoir été prononcée, puis ce qu'en dit
 * son avocat. Réservé aux citations fictives : le composant ne s'active que sur demande.
 */
import { calme, calque, fondu, pause, volontaire } from './regie.ts';

const DEMENTI = 'Cette citation nie formellement avoir été prononcée.';
const AVOCAT = 'Son avocat nous demande de respecter sa présomption de ponctuation.';
const SOUPLE = 'cubic-bezier(0.3, 1.4, 0.5, 1)';

/** Rapproche un guillemet du texte, ou le relâche. `sens` vaut 1 pour l'ouvrant, -1 pour le fermant. */
const serrer = (texte: HTMLElement, pseudo: '::before' | '::after', sens: 1 | -1, fermer: boolean) => {
  const ouvert = { transform: 'translateX(0) rotate(0deg)' };
  const ferme = { transform: `translateX(${0.16 * sens}em) rotate(${-7 * sens}deg)` };
  return texte.animate(fermer ? [ouvert, ferme] : [ferme, ouvert], { duration: fermer ? 380 : 460, easing: SOUPLE, fill: 'forwards', pseudoElement: pseudo }).finished;
};

async function nier(citation: HTMLElement) {
  const texte = citation.querySelector<HTMLElement>('p')!;
  const cartouche = calque('reniement');
  const dementi = calque('reniement__dementi', DEMENTI);
  const avocat = calque('reniement__avocat', AVOCAT);
  cartouche.append(dementi, avocat);
  citation.append(cartouche);

  if (!calme) await Promise.all([serrer(texte, '::before', 1, true), serrer(texte, '::after', -1, true)]);
  await fondu(dementi, 1, 220);
  await pause(1100);
  await fondu(avocat, 1, 260);
  await pause(2600);
  await Promise.all([fondu(dementi, 0, 240), fondu(avocat, 0, 240)]);
  if (!calme) await Promise.all([serrer(texte, '::before', 1, false), serrer(texte, '::after', -1, false)]);
  cartouche.remove();
}

export function installerLeReniement(racine: ParentNode) {
  for (const citation of racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="citation"]')) {
    citation.addEventListener('pointerenter', () => volontaire('citation', () => nier(citation)));
  }
}
