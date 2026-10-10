/**
 * Régie des dysfonctionnements éditoriaux volontaires.
 *
 * Elle veille à trois choses : un seul gag automatique à la fois, jamais deux fois
 * le même au cours d'une session, et aucun mouvement pour qui a demandé à ne pas en voir.
 * Règle éditoriale : ces gags ne sont annoncés nulle part. Le lecteur les trouve, ou pas.
 */

const PREFIXE = 'humianite:deja-joue:';

export const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const pause = (duree: number) => new Promise<void>((resoudre) => setTimeout(resoudre, duree));

// La régie n'a pas de responsable. Les demandes en ce sens sont à adresser au responsable éditorial.

/** Gags en cours, automatiques ou non. */
const actifs = new Set<string>();
let automatiqueEnCours = false;

const dejaJoue = (cle: string) => {
  try {
    return sessionStorage.getItem(PREFIXE + cle) !== null;
  } catch {
    return false;
  }
};

const noter = (cle: string) => {
  try {
    sessionStorage.setItem(PREFIXE + cle, '1');
  } catch {
    /* Sans stockage, le gag pourra se rejouer à la prochaine page. */
  }
};

/** Clé d'un gag pour la page en cours : un gag automatique ne se joue qu'une fois par page et par session. */
export const cleDePage = (gag: string) => `${gag}:${location.pathname}`;
export const aDejaEuLieu = (gag: string) => dejaJoue(cleDePage(gag));

/**
 * Joue un gag que le lecteur n'a pas demandé (apparition à l'écran).
 * Il attend qu'aucun autre gag automatique ne soit en cours, et ne se joue qu'une fois par page et par session.
 */
export async function automatique(gag: string, jouer: () => Promise<void>) {
  const cle = cleDePage(gag);
  // Un autre gag automatique est en cours : celui-ci attend son tour plutôt que d'être perdu.
  while (automatiqueEnCours) await pause(300);
  if (actifs.has(gag) || dejaJoue(cle)) return false;
  automatiqueEnCours = true;
  actifs.add(gag);
  noter(cle);
  try {
    await jouer();
  } finally {
    automatiqueEnCours = false;
    actifs.delete(gag);
  }
  return true;
}

/** Joue un gag déclenché par le lecteur (survol, focus, clic). Un même gag ne se superpose pas à lui-même. */
export async function volontaire(gag: string, jouer: () => Promise<void>) {
  if (actifs.has(gag)) return;
  actifs.add(gag);
  try {
    await jouer();
  } finally {
    actifs.delete(gag);
  }
}

/**
 * Appelle `suite` une fois que l'élément est resté à l'écran pendant `attente` millisecondes d'affilée.
 * Un gag qui se joue à l'instant où il apparaît ressemble à un effet de page ; il doit surprendre un lecteur déjà installé.
 */
export function quandVisible(element: Element, suite: () => void, { seuil = 0.9, attente = 0 } = {}) {
  let minuterie = 0;
  const observateur = new IntersectionObserver(
    (entrees) => {
      const visible = entrees.some((entree) => entree.isIntersecting);
      clearTimeout(minuterie);
      if (!visible) return;
      minuterie = window.setTimeout(() => {
        observateur.disconnect();
        suite();
      }, attente);
    },
    { threshold: seuil },
  );
  observateur.observe(element);
}

/** Calque posé par-dessus la page : il ne prend aucune place et n'est jamais lu par les lecteurs d'écran. */
export function calque(classe: string, texte = '') {
  const element = document.createElement('span');
  element.className = classe;
  element.textContent = texte;
  element.setAttribute('aria-hidden', 'true');
  return element;
}

/** Fait apparaître ou disparaître un calque en fondu. */
export const fondu = (element: HTMLElement, vers: 0 | 1, duree = 200) =>
  element.animate([{ opacity: 1 - vers }, { opacity: vers }], { duration: duree, fill: 'forwards', easing: 'ease-out' }).finished;

let eclair: HTMLElement | undefined;
let extinction = 0;

/**
 * Message bref en bas d'écran. La plaisanterie est tue aux lecteurs d'écran ;
 * l'information utile, elle, leur est annoncée.
 */
export function annoncer(plaisanterie: string, information: string) {
  if (!eclair) {
    eclair = document.createElement('p');
    eclair.className = 'eclair';
    eclair.setAttribute('role', 'status');
    document.body.append(eclair);
  }
  const blague = document.createElement('span');
  blague.setAttribute('aria-hidden', 'true');
  blague.textContent = plaisanterie;
  const utile = document.createElement('small');
  utile.textContent = information;
  eclair.replaceChildren(blague, utile);
  eclair.hidden = false;
  clearTimeout(extinction);
  extinction = window.setTimeout(() => (eclair!.hidden = true), 4600);
}
