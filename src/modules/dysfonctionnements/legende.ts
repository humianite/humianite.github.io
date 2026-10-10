/**
 * 04 — La légende de photo conteste la réalité.
 *
 * Un premier tampon frappe la légende. Une demi-seconde plus tard, un second, plus petit,
 * arrive précipitamment d'un autre service pour le contredire. Ils se disputent un instant
 * la même place, puis s'effacent. Le second part le dernier : il tenait à avoir le dernier mot.
 */
import { calme, calque, fondu, pause, volontaire } from './regie.ts';

const APPROUVEE = 'Image approuvée par l’image.';
const CONTESTEE = 'La réalité conteste.';

/** Tremblement bref et amorti autour de l'inclinaison propre à chaque tampon. */
const trembler = (tampon: HTMLElement, inclinaison: number, retard = 0) =>
  tampon.animate(
    [0, 2.2, -1.8, 1.3, -0.8, 0.4, 0].map((ecart) => ({ transform: `rotate(${inclinaison + ecart}deg)` })),
    { duration: 420, delay: retard, easing: 'ease-out' },
  ).finished;

async function contester(legende: HTMLElement) {
  const premier = calque('contestation__tampon', APPROUVEE);
  const second = calque('contestation__tampon contestation__tampon--second', CONTESTEE);
  legende.append(premier, second);

  if (calme) {
    await fondu(premier, 1);
    await pause(500);
    await fondu(second, 1);
    await pause(2200);
    await Promise.all([fondu(premier, 0), fondu(second, 0)]);
    return premier.remove(), second.remove();
  }

  // Le premier tombe d'aplomb, avec le poids d'une décision prise.
  await premier.animate(
    [
      { transform: 'rotate(-9deg) scale(1.9)', opacity: 0, easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)' },
      { transform: 'rotate(-4deg) scale(0.94)', opacity: 0.9, offset: 0.7, easing: 'ease-out' },
      { transform: 'rotate(-5deg) scale(1)', opacity: 0.86 },
    ],
    { duration: 260, fill: 'forwards' },
  ).finished;
  await pause(500);

  // Le second arrive en courant, dépasse, recule, et se pose en travers du premier.
  await second.animate(
    [
      { transform: 'translateX(5em) rotate(14deg)', opacity: 0, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' },
      { transform: 'translateX(-0.5em) rotate(3deg)', opacity: 0.9, offset: 0.62, easing: 'ease-in-out' },
      { transform: 'translateX(0.15em) rotate(7deg)', opacity: 0.9, offset: 0.84 },
      { transform: 'translateX(0) rotate(6deg)', opacity: 0.86 },
    ],
    { duration: 330, fill: 'forwards' },
  ).finished;

  // La dispute : chacun tremble de son côté, à contretemps.
  await Promise.all([trembler(premier, -5), trembler(second, 6, 90)]);
  await pause(1100);
  fondu(premier, 0, 260);
  await pause(320);
  await fondu(second, 0, 260);
  premier.remove();
  second.remove();
}

export function installerLaContestation(racine: ParentNode) {
  for (const legende of racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="legende"]')) {
    legende.addEventListener('pointerenter', () => volontaire('legende', () => contester(legende)));
  }
}
