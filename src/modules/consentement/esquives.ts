/**
 * Au doigt, pas de survol : le bouton « Tout refuser » fuit quand on le touche.
 * Une glissade, puis une pirouette, et sur écran étroit un échange de place avec « Tout accepter ».
 */

interface Elements {
  bouton: HTMLElement;
  /** Zone dans laquelle le bouton peut glisser sans sortir de la fenêtre. */
  piste: HTMLElement;
  accepter: HTMLElement;
  /** Conteneur des deux boutons. */
  rangee: HTMLElement;
}

const INVERSE = 'cmp__boutons--inverse';
const PATATE = '58% 42% 61% 39% / 47% 62% 38% 53%';

const pose = (x: number, y = 0, pivotY = 0, rotation = 0, largeur = 1, hauteur = 1) =>
  `translate(${x}px, ${y}px) perspective(420px) rotateY(${pivotY}deg) rotate(${rotation}deg) scale(${largeur}, ${hauteur})`;

export function creerEsquives({ bouton, piste, accepter, rangee }: Elements) {
  /** Décalage horizontal courant du bouton. */
  let decalage = 0;
  let enMouvement = false;

  /** Destination d'une esquive : de l'autre côté de la piste, sans en sortir. */
  const destination = () => {
    const marge = Math.max(0, Math.min(56, (piste.clientWidth - bouton.offsetWidth) / 2));
    return decalage <= 0 ? marge : -marge;
  };

  async function jouer(images: Keyframe[], duree: number, arrivee: number) {
    enMouvement = true;
    await bouton.animate(images, { duration: duree, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' }).finished;
    decalage = arrivee;
    bouton.style.transform = arrivee ? `translateX(${arrivee}px)` : '';
    enMouvement = false;
  }

  /** Trajectoire d'une esquive : point de départ, d'arrivée, sens, et position à une fraction du trajet. */
  const trajet = () => {
    const de = decalage;
    const vers = destination();
    return { de, vers, sens: Math.sign(vers - de) || 1, a: (part: number) => de + (vers - de) * part };
  };

  /** Sur écran étroit, les boutons sont empilés : le fuyard n'a nulle part où aller, sauf à la place de l'autre. */
  const empiles = () => rangee.classList.contains(INVERSE) || accepter.getBoundingClientRect().bottom <= piste.getBoundingClientRect().top + 1;

  return {
    enMouvement: () => enMouvement,

    /** Il frémit, s'étire comme du chewing-gum, glisse et rebondit. */
    glisser() {
      const { de, vers, sens, a } = trajet();
      return jouer(
        [
          { transform: pose(de) },
          { transform: pose(de - 3 * sens, 0, 0, -1.2), offset: 0.07 },
          { transform: pose(de + 2 * sens, 0, 0, 1), offset: 0.13 },
          { transform: pose(de - 2 * sens, 0, 0, -0.8), offset: 0.19 },
          { transform: pose(a(0.28), 0, 26 * sens, 0, 1.34, 0.8), offset: 0.4 },
          { transform: pose(a(1.2), 0, -10 * sens, 0, 0.86, 1.12), offset: 0.62 },
          { transform: pose(a(0.92), 0, 4 * sens, 0, 1.07, 0.95), offset: 0.78 },
          { transform: pose(a(1.04), 0, 0, 0, 0.98, 1.02), offset: 0.9 },
          { transform: pose(vers) },
        ],
        560,
        vers,
      );
    },

    /** Il se contracte, pivote, vire à la patate et bondit de l'autre côté. */
    bondir() {
      const { de, vers, sens, a } = trajet();
      return jouer(
        [
          { transform: pose(de), borderRadius: '0' },
          { transform: pose(de, 0, 0, -3, 0.84, 0.84), offset: 0.1 },
          { transform: pose(de, 0, 0, 4, 0.8, 0.8), offset: 0.17 },
          { transform: pose(de, 0, 0, -5, 0.82, 0.82), borderRadius: '18%', offset: 0.24 },
          { transform: pose(a(0.1), 4, 0, -9 * sens, 1.16, 0.78), borderRadius: PATATE, offset: 0.38 },
          { transform: pose(a(0.55), -30, 0, 11 * sens, 0.9, 1.16), borderRadius: PATATE, offset: 0.56 },
          { transform: pose(a(1.07), 3, 0, 3 * sens, 1.2, 0.8), borderRadius: '30% 26% 28% 32% / 40% 44% 36% 42%', offset: 0.74 },
          { transform: pose(a(0.97), -2, 0, -1 * sens, 0.95, 1.06), borderRadius: '10%', offset: 0.86 },
          { transform: pose(vers), borderRadius: '0' },
        ],
        640,
        vers,
      );
    },

    /** Les deux boutons échangent leur place : le doigt se retrouve au-dessus de « Tout accepter ». */
    async echangerSiEmpiles() {
      if (!empiles()) return;
      enMouvement = true;
      const deplaces = [accepter, piste];
      const avant = deplaces.map((element) => element.getBoundingClientRect().top);
      rangee.classList.toggle(INVERSE);
      await Promise.all(
        deplaces.map((element, rang) =>
          element.animate([{ transform: `translateY(${avant[rang] - element.getBoundingClientRect().top}px)` }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(0.3, 1.5, 0.5, 1)' }).finished,
        ),
      );
      enMouvement = false;
    },

    reinitialiser() {
      decalage = 0;
      bouton.style.transform = '';
      rangee.classList.remove(INVERSE);
    },
  };
}
