/**
 * Quand présenter le contrôle : à la première ou à la deuxième navigation interne de la session,
 * une fois par mois, et jamais par-dessus une autre fenêtre.
 */

const PASSAGE = 'humianite:captcha';
const PAGES = 'humianite:pages-vues';
const RANG = 'humianite:captcha-rang';
const UN_MOIS = 30 * 24 * 60 * 60 * 1000;
/** Pages où l'on ne dérange pas : le visiteur y est déjà aux prises avec l'administration. */
const EPARGNEES = ['/inscription/', '/connexion/'];

const lire = (stockage: Storage, cle: string) => {
  try {
    return stockage.getItem(cle);
  } catch {
    return null;
  }
};

const ecrire = (stockage: Storage, cle: string, valeur: string) => {
  try {
    stockage.setItem(cle, valeur);
  } catch {
    /* Sans stockage, le contrôle se représentera plus souvent. */
  }
};

/** Compte la page en cours et rend son rang dans la session (1 pour la page d'arrivée). */
export function compterLaPage() {
  const rang = Number(lire(sessionStorage, PAGES) ?? 0) + 1;
  ecrire(sessionStorage, PAGES, String(rang));
  return rang;
}

/** Rang de la page où le contrôle se présente : la deuxième ou la troisième, tirée une fois par session. */
function rangPrevu() {
  const connu = Number(lire(sessionStorage, RANG));
  if (connu) return connu;
  const tire = 2 + Math.floor(Math.random() * 2);
  ecrire(sessionStorage, RANG, String(tire));
  return tire;
}

/** Vrai si le contrôle a été franchi, ou écarté, il y a moins d'un mois. */
const recent = (maintenant: number) => maintenant - Number(lire(localStorage, PASSAGE) ?? 0) < UN_MOIS;

export const noterLePassage = (maintenant = Date.now()) => ecrire(localStorage, PASSAGE, String(maintenant));

/** Le contrôle est-il dû sur cette page ? */
export const estDu = (rangDeLaPage: number, chemin: string, maintenant = Date.now()) =>
  !recent(maintenant) && rangDeLaPage >= rangPrevu() && !EPARGNEES.some((epargnee) => chemin.startsWith(epargnee));
