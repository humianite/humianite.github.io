/**
 * 01 — Le tiret cadratin se reproduit.
 *
 * Le tiret vibre, s'étire, se divise ; ses deux rejetons vont se ranger sur l'interligne,
 * juste au-dessus de lui, une annotation paraît, puis tout rentre dans l'ordre.
 * Rien n'est ajouté au texte : les rejetons sont des calques posés par-dessus.
 */
import { automatique, calme, calque, pause, quandVisible, volontaire } from './regie.ts';

/** Hauteur de l'étagère où se rangent les rejetons, et écart entre eux. */
const ETAGERE = '-0.72em';
const VOISIN = '1.1em';
const ELASTIQUE = 'cubic-bezier(0.3, 1.6, 0.5, 1)';

/** Joue une animation et fige l'élément dans sa pose finale. */
async function mouvoir(element: HTMLElement, images: Keyframe[], duree: number, courbe = 'ease-out') {
  await element.animate(images, { duration: duree, easing: courbe }).finished;
  const finale = images[images.length - 1];
  element.style.transform = String(finale.transform ?? '');
  if (finale.opacity !== undefined) element.style.opacity = String(finale.opacity);
}

/** Petit sursaut qui s'ajoute à la pose de l'élément, quand chacun se met en rang. */
const sursaut = (element: HTMLElement, retard: number) =>
  element.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-0.09em)' }, { transform: 'translateY(0)' }], { duration: 170, delay: retard, easing: 'ease-out', composite: 'add' }).finished;

async function seReproduire(tiret: HTMLElement) {
  const portee = calque('tiret__portee');
  const aine = calque('tiret__rejeton', '—');
  const cadet = calque('tiret__rejeton', '—');
  const note = calque('tiret__note', 'Contenu enrichi artificiellement.');
  portee.append(aine, cadet, note);
  tiret.append(portee);

  // L'annotation ne doit jamais sortir de l'écran : près du bord droit, elle s'aligne de l'autre côté.
  if (tiret.getBoundingClientRect().left + note.offsetWidth > innerWidth - 12) note.classList.add('tiret__note--droite');

  if (calme) {
    await note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' }).finished;
    await pause(1400);
    await note.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished;
    return portee.remove();
  }

  const trait = tiret.querySelector<HTMLElement>('.tiret__trait')!;

  // 1. Un frémissement, à peine.
  await trait.animate(
    [0, 0.7, -0.7, 0.5, -0.4, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 210 },
  ).finished;

  // 2. Il s'étire, se contracte, et reste un peu gonflé.
  await mouvoir(trait, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.5)', offset: 0.4 }, { transform: 'scaleX(0.76)', offset: 0.75 }, { transform: 'scaleX(1.14)' }], 300, 'ease-in-out');

  // 3. Première division : l'aîné s'arrache et saute sur l'étagère.
  aine.style.opacity = '1';
  await Promise.all([
    mouvoir(trait, [{ transform: 'scaleX(1.14)' }, { transform: 'scaleX(0.9)', offset: 0.5 }, { transform: 'scaleX(1)' }], 280),
    mouvoir(
      aine,
      [
        { transform: 'translate(0, 0) scale(0.5, 1.7)' },
        { transform: 'translate(0.08em, -1em) scale(1.16, 0.8)', offset: 0.55 },
        { transform: `translate(0, -0.62em) scale(0.92, 1.2)`, offset: 0.8 },
        { transform: `translate(0, ${ETAGERE}) scale(1, 1)` },
      ],
      280,
    ),
  ]);
  await pause(70);

  // 4. Seconde division : le cadet sort de l'aîné et glisse à côté, un peu trop loin d'abord.
  cadet.style.opacity = '1';
  await Promise.all([
    aine.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.35)' }, { transform: 'scaleX(1)' }], { duration: 240, composite: 'add' }).finished,
    mouvoir(
      cadet,
      [
        { transform: `translate(0, ${ETAGERE}) scaleX(0.5)` },
        { transform: `translate(1.3em, ${ETAGERE}) scaleX(1.12)`, offset: 0.6 },
        { transform: `translate(1.03em, ${ETAGERE}) scaleX(0.96)`, offset: 0.82 },
        { transform: `translate(${VOISIN}, ${ETAGERE}) scaleX(1)` },
      ],
      240,
    ),
  ]);

  // 5. Chacun se met en rang, l'un après l'autre, et l'annotation tombe.
  note.animate([{ opacity: 0, transform: 'translateY(0.25em)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: 120, fill: 'forwards', easing: 'ease-out' });
  await Promise.all([sursaut(trait, 0), sursaut(aine, 70), sursaut(cadet, 140)]);
  await pause(720);

  // 6. Comme si rien ne s'était passé : le cadet rentre dans l'aîné, l'aîné dans le tiret.
  note.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  await mouvoir(cadet, [{ transform: `translate(${VOISIN}, ${ETAGERE}) scaleX(1)`, opacity: 1 }, { transform: `translate(0, ${ETAGERE}) scaleX(0.4)`, opacity: 0 }], 170, 'ease-in');
  await Promise.all([
    mouvoir(aine, [{ transform: `translate(0, ${ETAGERE})`, opacity: 1 }, { transform: 'translate(0, 0) scale(0.6, 1.5)', opacity: 0 }], 170, 'ease-in'),
    trait.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.22)', offset: 0.6 }, { transform: 'scaleX(1)' }], { duration: 300, delay: 110, easing: ELASTIQUE }).finished,
  ]);
  trait.style.transform = '';
  portee.remove();
}

export function installerLesTirets(racine: ParentNode) {
  const tirets = [...racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="tiret"]')];
  for (const tiret of tirets) {
    tiret.addEventListener('pointerenter', () => volontaire('tiret', () => seReproduire(tiret)));
  }
  // Un seul tiret par page se manifeste de lui-même, et une seule fois.
  if (tirets[0] && !calme) quandVisible(tirets[0], () => automatique('tiret', () => seReproduire(tirets[0])), { seuil: 1, attente: 6000 });
}
