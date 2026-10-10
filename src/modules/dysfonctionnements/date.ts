/**
 * 03 — La date de publication doute d'elle-même.
 *
 * Un minuscule tampon descend sur la ligne de date, rebondit, et imprime dessous une réserve,
 * un peu de travers. Il attend là quelques secondes, puis remonte ; la mention s'efface.
 * La vraie date n'est ni modifiée ni masquée.
 */
import { calme, calque, fondu, pause, volontaire } from './regie.ts';

const MENTION = 'Information valable jusqu’à preuve du contraire.';
/** Le tampon au repos, posé de biais au bout de ce qu'il vient d'imprimer. */
const POSE = 'translate(0, -0.35em) rotate(9deg)';

async function tamponner(ligne: HTMLElement) {
  const reserve = calque('doute');
  const mention = calque('doute__mention', MENTION);
  const tampon = calque('doute__tampon');
  reserve.append(mention, tampon);
  ligne.append(reserve);

  if (calme) {
    await fondu(mention, 1);
    await pause(3200);
    await fondu(mention, 0);
    return reserve.remove();
  }

  // Le tampon frappe vers la fin de la mention, au-delà de la date, puis va se ranger au bout :
  // ni sa chute ni son repos ne passent sur la vraie date.
  const frappe = `${-(mention.offsetWidth * 0.14).toFixed(0)}px`;

  // Il tombe, s'écrase, rebondit, retombe : c'est au second contact que l'encre prend.
  mention.animate([{ opacity: 0 }, { opacity: 0, offset: 0.56 }, { opacity: 0.92, offset: 0.62 }, { opacity: 0.92 }], { duration: 900, fill: 'forwards' });
  await tampon.animate(
    [
      { transform: `translate(${frappe}, -2.6em) rotate(4deg)`, opacity: 0, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
      { transform: `translate(${frappe}, 0) rotate(0deg) scale(1.12, 0.78)`, opacity: 1, offset: 0.3, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
      { transform: `translate(${frappe}, -0.7em) rotate(-3deg) scale(0.96, 1.06)`, opacity: 1, offset: 0.46, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
      { transform: `translate(${frappe}, 0) rotate(-2deg) scale(1.16, 0.74)`, opacity: 1, offset: 0.58, easing: 'ease-out' },
      { transform: `translate(${frappe}, 0) rotate(-2deg) scale(1.16, 0.74)`, opacity: 1, offset: 0.66, easing: 'cubic-bezier(0.3, 1.3, 0.5, 1)' },
      { transform: POSE, opacity: 1 },
    ],
    { duration: 900, fill: 'forwards' },
  ).finished;

  await pause(3000);

  // Il repart par où il est venu ; la mention pâlit derrière lui.
  fondu(mention, 0, 500);
  await tampon.animate([{ transform: POSE, opacity: 1 }, { transform: 'translate(0, -0.1em) rotate(4deg)', opacity: 1, offset: 0.25 }, { transform: 'translate(0, -2.8em) rotate(-6deg)', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)', fill: 'forwards' }).finished;
  reserve.remove();
}

export function installerLeDoute(racine: ParentNode) {
  for (const ligne of racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="date"]')) {
    const declencher = () => volontaire('date', () => tamponner(ligne));
    // Le survol de la ligne, ou le focus sur le nom de l'auteur juste au-dessus.
    ligne.addEventListener('pointerenter', declencher);
    ligne.parentElement?.addEventListener('focusin', declencher);
  }
}
