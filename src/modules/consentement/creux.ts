/**
 * À la souris, le bouton « Tout refuser » se creuse pour ne jamais être touché.
 * Son cadre est remplacé par un contour SVG recalculé à chaque mouvement :
 * une cloche sous le curseur, deux bourrelets sur ses bords, un ventre en face.
 */

// Le bouton Refuser se dérobe volontairement.
// Son comportement relève de sa vie privée.

/** Distance, en pixels, que le contour garde avec le curseur. */
const DEGAGEMENT = 14;
/** Profondeur ajoutée d'un coup quand on clique dans le creux. */
const SURSAUT = 9;
/** Retour élastique du contour : raideur et amortissement, par image. */
const RAIDEUR = 0.2;
const AMORTI = 0.74;

interface Creux {
  profondeur: number;
  vitesse: number;
  cible: number;
  /** Position du creux le long de son côté. */
  centre: number;
}

/** Largeur de la cloche : plus le creux est profond, plus il s'évase. */
const evasement = (profondeur: number) => 20 + Math.abs(profondeur) * 0.4;
const cloche = (ecart: number, largeur: number) => Math.exp(-((ecart / largeur) ** 2));

/** Forme du creux le long d'un côté : une cloche bordée de deux légers bourrelets, comme une matière que l'on enfonce. */
const profil = (ecart: number, profondeur: number) => {
  const largeur = evasement(profondeur);
  return cloche(ecart, largeur) - 0.1 * cloche(Math.abs(ecart) - 2.1 * largeur, 0.8 * largeur);
};

export function creerCreux(bouton: HTMLElement, contour: SVGPathElement, libelle: HTMLElement) {
  /** Un creux possible par côté : haut, droite, bas, gauche. */
  const creux: Creux[] = [0, 1, 2, 3].map(() => ({ profondeur: 0, vitesse: 0, cible: 0, centre: 0 }));
  let boucle = 0;

  /** Redessine le contour, creux compris, et découpe le libellé à la même forme. */
  function tracer() {
    const l = bouton.offsetWidth;
    const h = bouton.offsetHeight;
    // Pour chaque côté : origine, sens de parcours, normale vers l'intérieur, longueur.
    const cotes = [
      { ox: 1, oy: 1, dx: 1, dy: 0, nx: 0, ny: 1, longueur: l - 2 },
      { ox: l - 1, oy: 1, dx: 0, dy: 1, nx: -1, ny: 0, longueur: h - 2 },
      { ox: l - 1, oy: h - 1, dx: -1, dy: 0, nx: 0, ny: -1, longueur: l - 2 },
      { ox: 1, oy: h - 1, dx: 0, dy: -1, nx: 1, ny: 0, longueur: h - 2 },
    ];
    const points: string[] = [];
    cotes.forEach((cote, rang) => {
      const { profondeur, centre } = creux[rang];
      // Le côté opposé à un creux se bombe un peu : la matière chassée ressort en face.
      const enFace = creux[(rang + 2) % 4];
      const ventre = cote.dx !== 0 ? -0.22 * enFace.profondeur : 0;
      const deforme = Math.abs(profondeur) > 0.3 || Math.abs(ventre) > 0.3;
      const pas = deforme ? 2 : cote.longueur;
      for (let t = 0; t < cote.longueur; t += pas) {
        const p = profondeur * profil(t - centre, profondeur) + ventre * cloche(cote.longueur - t - enFace.centre, evasement(enFace.profondeur) * 1.8);
        points.push(`${(cote.ox + cote.dx * t + cote.nx * p).toFixed(1)} ${(cote.oy + cote.dy * t + cote.ny * p).toFixed(1)}`);
      }
    });
    const chemin = `M${points.join('L')}Z`;
    contour.setAttribute('d', chemin);
    libelle.style.clipPath = `path('${chemin}')`;
  }

  /** Le contour recule sans délai devant le curseur, et revient en tremblant comme de la gelée. */
  function animer() {
    let actif = false;
    for (const c of creux) {
      if (c.cible > c.profondeur) {
        c.profondeur = c.cible;
        c.vitesse = 0;
      } else {
        c.vitesse = (c.vitesse + (c.cible - c.profondeur) * RAIDEUR) * AMORTI;
        c.profondeur += c.vitesse;
      }
      if (Math.abs(c.cible - c.profondeur) > 0.15 || Math.abs(c.vitesse) > 0.15) actif = true;
      else c.profondeur = c.cible;
    }
    tracer();
    boucle = actif ? requestAnimationFrame(animer) : 0;
  }

  const lancer = () => {
    if (!boucle) boucle = requestAnimationFrame(animer);
  };

  return {
    /** Remplace le cadre du bouton par le contour dessiné. */
    activer() {
      if (bouton.classList.contains('cmp__bouton--creux')) return;
      bouton.classList.add('cmp__bouton--creux');
      tracer();
    },

    /** Creuse le côté le plus proche du curseur, juste assez pour passer derrière lui. */
    viser(x: number, y: number) {
      const l = bouton.offsetWidth;
      const h = bouton.offsetHeight;
      const penetrations = [y, l - x, h - y, x];
      const positions = [x - 1, y - 1, l - 1 - x, h - 1 - y];
      const limites = [h - 10, l / 2, h - 10, l / 2];
      const choisi = penetrations.indexOf(Math.min(...penetrations));
      creux.forEach((c, rang) => {
        c.cible = rang === choisi ? Math.max(0, Math.min(limites[rang], penetrations[rang] + DEGAGEMENT)) : 0;
        if (rang === choisi) c.centre = positions[rang];
      });
      // Le recul est appliqué dans l'instant : le curseur ne doit jamais se trouver sur le bouton.
      if (boucle) cancelAnimationFrame(boucle);
      animer();
    },

    /** Le curseur s'éloigne : le contour reprend sa forme. */
    relacher() {
      creux.forEach((c) => (c.cible = 0));
      lancer();
    },

    /** Un clic dans le creux : le bouton sursaute et une onde part de l'endroit du clic. */
    sursauter(x: number, y: number) {
      for (const c of creux) if (c.cible > 0) c.profondeur += SURSAUT;
      lancer();
      const onde = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      onde.setAttribute('class', 'cmp__onde');
      onde.setAttribute('cx', x.toFixed(1));
      onde.setAttribute('cy', y.toFixed(1));
      onde.addEventListener('animationend', () => onde.remove());
      contour.parentNode!.append(onde);
    },

    /** Le bouton retrouve son cadre ordinaire. */
    reinitialiser() {
      creux.forEach((c) => Object.assign(c, { profondeur: 0, vitesse: 0, cible: 0 }));
      bouton.classList.remove('cmp__bouton--creux');
      // Une onde interrompue par la fermeture de la fenêtre n'a pas pu s'effacer d'elle-même.
      bouton.querySelectorAll('.cmp__onde').forEach((onde) => onde.remove());
    },

    /** Vrai si le point est à portée du bouton, marge de dégagement comprise. */
    aPortee: (x: number, y: number) => x > -DEGAGEMENT && y > -DEGAGEMENT && x < bouton.offsetWidth + DEGAGEMENT && y < bouton.offsetHeight + DEGAGEMENT,
  };
}
