/**
 * Le broyeur : la feuille descend dans la machine et ressort en lanieres.
 *
 * Deux copies de la feuille glissent ensemble : l'une, entière, au-dessus de la bouche du broyeur,
 * coupée là où elle y entre ; l'autre, découpée en lanieres, en dessous, visible seulement là où elle en sort.
 */

const LANIERES = 18;
const DESCENTE = 2300;
const CHUTE = 650;

const copier = (feuille: HTMLElement) => {
  const copie = feuille.cloneNode(true) as HTMLElement;
  copie.classList.add('est-copie');
  copie.removeAttribute('data-zone');
  copie.setAttribute('aria-hidden', 'true');
  Object.assign(copie.style, { position: 'absolute', inset: '0 auto auto 0', width: `${feuille.offsetWidth}px`, margin: '0' });
  return copie;
};

const bloc = (classe: string, style: Partial<CSSStyleDeclaration>) => {
  const div = document.createElement('div');
  div.className = classe;
  Object.assign(div.style, style);
  return div;
};

/** Broie la feuille, puis rend la main. Sans animation pour qui les a désactivées. */
export async function broyer(feuille: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const largeur = feuille.offsetWidth;
  const hauteur = feuille.offsetHeight;
  const bouche = 30;
  const course = hauteur + 24;

  const atelier = bloc('broyage', {
    position: 'absolute',
    left: `${feuille.offsetLeft}px`,
    top: `${feuille.offsetTop}px`,
    width: `${largeur}px`,
    height: `${hauteur}px`,
    pointerEvents: 'none',
  });
  const haut = bloc('broyage__haut', { position: 'absolute', inset: '0', overflow: 'hidden' });
  const bas = bloc('broyage__bas', { position: 'absolute', left: '-40px', right: '-40px', top: `${hauteur + bouche}px`, height: `${hauteur}px`, overflow: 'hidden' });
  const machine = bloc('broyage__machine', { position: 'absolute', left: '-26px', right: '-26px', top: `${hauteur - 4}px`, height: `${bouche + 8}px` });
  machine.innerHTML = '<span class="broyage__voyant"></span><span class="broyage__marque">Destruction confidentielle</span>';

  const entiere = copier(feuille);
  haut.append(entiere);

  const lanieres = Array.from({ length: LANIERES }, (_, i) => {
    const laniere = copier(feuille);
    const g = (i / LANIERES) * 100;
    const d = 100 - ((i + 1) / LANIERES) * 100;
    laniere.style.clipPath = `inset(0 ${d}% 0 ${g}%)`;
    laniere.style.left = '40px';
    laniere.style.transformOrigin = `${((i + 0.5) / LANIERES) * largeur}px 0`;
    bas.append(laniere);
    return laniere;
  });

  atelier.append(haut, bas, machine);
  feuille.after(atelier);
  feuille.style.visibility = 'hidden';

  // Sur un petit écran, la feuille dépasse en bas : on la remonte pour que la bouche du broyeur arrive à mi-hauteur,
  // et que les lanières aient de la place pour sortir.
  const boucheY = feuille.getBoundingClientRect().top + hauteur;
  const decalage = boucheY - Math.min(boucheY, innerHeight * 0.55);
  if (decalage > 0) {
    await atelier.animate([{ transform: 'none' }, { transform: `translateY(${-decalage}px)` }], { duration: 380, easing: 'ease-in-out', fill: 'forwards' }).finished;
  }

  // La machine se met en place, puis avale la feuille à vitesse constante.
  await machine.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' }).finished;
  machine.classList.add('est-en-marche');

  const options: KeyframeAnimationOptions = { duration: DESCENTE, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' };
  const depart = -(hauteur + bouche);
  const animations = [
    entiere.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${course}px)` }], options),
    ...lanieres.map((l, i) => {
      // Les lanieres s'écartent un peu et se tordent en sortant : jamais deux pareilles.
      const ecart = (i - (LANIERES - 1) / 2) * 2.4;
      const torsion = (((i * 7919) % 11) - 5) * 0.7;
      return l.animate(
        [
          { transform: `translate(${ecart}px, ${depart}px) rotate(0deg)` },
          { transform: `translate(${ecart * 1.8}px, ${depart + course}px) rotate(${torsion}deg)` },
        ],
        options,
      );
    }),
  ];
  await Promise.all(animations.map((a) => a.finished));
  machine.classList.remove('est-en-marche');

  // Les lanieres tombent dans la corbeille.
  await Promise.all([
    bas.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(180px)', opacity: 0 }], { duration: CHUTE, easing: 'ease-in', fill: 'forwards' }).finished,
    machine.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CHUTE, delay: 200, fill: 'forwards' }).finished,
  ]);

  atelier.remove();
  feuille.style.visibility = '';
}
