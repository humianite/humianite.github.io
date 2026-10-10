/**
 * 10 — La fin de l'article refuse de conclure.
 *
 * Le filet de fin s'allonge, s'interrompt, repart dans l'autre sens, puis trois mentions
 * se succèdent. La dernière reste : même finir un article demande une procédure.
 */
import { aDejaEuLieu, automatique, calme, pause, quandVisible } from './regie.ts';

/** Le filet, décrit par ce qui en est masqué à gauche et à droite (en % de sa piste). */
const filet = (gauche: number, droite: number) => ({ clipPath: `inset(0 ${droite}% 0 ${gauche}%)` });
const REPOS = filet(36, 36);

async function tergiverser(trait: HTMLElement) {
  await trait.animate(
    [
      { ...REPOS, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
      // Il s'allonge vers la droite…
      { ...filet(36, 14), offset: 0.3 },
      // … s'interrompt…
      { ...filet(36, 14), offset: 0.48, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
      // … et repart dans l'autre sens, en dépassant un peu.
      { ...filet(10, 38), offset: 0.8, easing: 'ease-out' },
      { ...filet(15, 36), offset: 0.9 },
      filet(13, 36),
    ],
    { duration: 1500, fill: 'forwards' },
  ).finished;
}

async function conclure(fin: HTMLElement) {
  const trait = fin.querySelector<HTMLElement>('.fin-article__trait')!;
  const mentions = [...fin.querySelectorAll<HTMLElement>('.fin-article__mentions span')];
  if (!calme) await tergiverser(trait);
  for (const [rang, mention] of mentions.entries()) {
    mentions[rang - 1]?.classList.remove('fin-article__mention--visible');
    mention.classList.add('fin-article__mention--visible');
    if (rang < mentions.length - 1) await pause(1250);
  }
  fin.classList.add('fin-article--close');
}

export function installerLesFins(racine: ParentNode) {
  for (const fin of racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="fin"]')) {
    // Déjà vue pendant cette session : il n'en reste que la mention finale.
    if (aDejaEuLieu('fin')) {
      fin.classList.add('fin-article--close', 'fin-article--sans-effet');
      continue;
    }
    quandVisible(fin, () => automatique('fin', () => conclure(fin)), { attente: 1600 });
  }
}
