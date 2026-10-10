/**
 * 05 — La note de bas de page fait une crise d'ego.
 *
 * Le numéro de renvoi tente de se hisser au-dessus du texte, retombe, réessaie plus haut,
 * retombe encore, dit ce qu'il a sur le cœur, puis reprend sa place, vexé.
 * Le lien vers la note reste un lien : on peut toujours cliquer dessus.
 */
import { calme, calque, fondu, pause, volontaire } from './regie.ts';

const REFUS = 'Je refuse d’être une note de bas de page.';
const DIPLOME = 'J’ai fait des études.';

/** Un saut : il se tasse, s'élance en s'étirant, culmine, retombe et s'écrase un peu. */
const saut = (hauteur: number): Keyframe[] => [
  { transform: 'translateY(0) scale(1, 1)', easing: 'ease-out' },
  { transform: 'translateY(0.06em) scale(1.18, 0.78)', offset: 0.16, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
  { transform: `translateY(${-hauteur}em) scale(0.9, 1.16)`, offset: 0.5, easing: 'cubic-bezier(0.6, 0, 0.9, 0.5)' },
  { transform: 'translateY(0.05em) scale(1.22, 0.74)', offset: 0.82, easing: 'ease-out' },
  { transform: 'translateY(0) scale(1, 1)' },
];

async function protester(renvoi: HTMLElement) {
  const numero = renvoi.querySelector<HTMLElement>('a') ?? renvoi;
  const bulle = calque('ego', REFUS);
  renvoi.append(bulle);
  // La bulle ne doit pas sortir de l'écran : près d'un bord, elle se décale.
  const cadre = bulle.getBoundingClientRect();
  if (cadre.right > innerWidth - 8) bulle.style.marginLeft = `${innerWidth - 8 - cadre.right}px`;
  if (cadre.left < 8) bulle.style.marginLeft = `${8 - cadre.left}px`;

  if (!calme) {
    await numero.animate(saut(0.55), { duration: 420 }).finished;
    await pause(90);
    await numero.animate(saut(0.95), { duration: 520 }).finished;
  }
  await fondu(bulle, 1, 180);
  await pause(1500);
  await fondu(bulle, 0, 140);
  bulle.textContent = DIPLOME;
  bulle.classList.add('ego--bas');
  await fondu(bulle, 1, 180);
  await pause(1300);
  await fondu(bulle, 0, 200);
  bulle.remove();

  // Vexé : il s'affaisse sur le côté, boude un instant, puis se redresse à contrecœur.
  if (!calme) {
    await numero.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(14deg) scale(0.88) translateY(0.08em)', offset: 0.25, easing: 'ease-out' },
        { transform: 'rotate(14deg) scale(0.88) translateY(0.08em)', offset: 0.75, easing: 'ease-in-out' },
        { transform: 'rotate(0deg) scale(1)' },
      ],
      { duration: 1100 },
    ).finished;
  }
}

/** Seule la première note de l'article est susceptible : une crise d'ego par page suffit. */
export function installerLEgo(racine: ParentNode) {
  const zone = racine.querySelector<HTMLElement>('[data-dysfonctionnement="note"]');
  const renvoi = zone?.querySelector<HTMLElement>('sup:has([data-footnote-ref])');
  if (!renvoi) return;
  renvoi.classList.add('renvoi');
  const declencher = () => volontaire('note', () => protester(renvoi));
  renvoi.addEventListener('pointerenter', declencher);
  renvoi.addEventListener('focusin', declencher);
}
