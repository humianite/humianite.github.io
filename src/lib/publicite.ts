/**
 * Régie publicitaire. Les campagnes passent à tour de rôle, page après page : chacune paraît
 * autant que les autres, et une même page n'affiche jamais deux fois la même.
 */
import type { CollectionEntry } from 'astro:content';
import { campagnes as lireCampagnes, publicites as lireEmplacements } from './contenu';

export type Format = CollectionEntry<'publicites'>['data']['format'];
type Campagne = CollectionEntry<'campagnes'>;

/** Un visuel se décline dans les formats d'emplacement, ou en paysage : celui-là se loge dans les pavés. */
type Gabarit = Format | 'paysage';

/** Taille d'origine des visuels, par gabarit. */
export const TAILLES: Record<Gabarit, readonly [number, number]> = { bandeau: [1940, 500], pave: [1200, 1000], colonne: [600, 1200], paysage: [1200, 630] };

/** Le visuel d'une campagne pour un format d'emplacement, et son gabarit. */
function visuelDe(campagne: Campagne, format: Format): { src: string; gabarit: Gabarit } | undefined {
  const { visuels } = campagne.data;
  if (visuels[format]) return { src: visuels[format], gabarit: format };
  if (format === 'pave' && visuels.paysage) return { src: visuels.paysage, gabarit: 'paysage' };
  return undefined;
}

/** Le tour de chaque format : il avance d'un cran à chaque annonce attribuée. */
const tours: Record<Format, number> = { bandeau: 0, pave: 0, colonne: 0 };

/** Les campagnes qui ont un visuel à ce format, dans un ordre fixe. */
const candidates = (toutes: Campagne[], format: Format) => toutes.filter((c) => visuelDe(c, format)).sort((a, b) => a.id.localeCompare(b.id));

/** La prochaine campagne du format, dans l'ordre du tour ; `prises` écarte celles déjà attribuées sur la page. */
function tirer(toutes: Campagne[], format: Format, prises: Set<string>) {
  const liste = candidates(toutes, format);
  for (let pas = 0; pas < liste.length; pas++) {
    const campagne = liste[(tours[format] + pas) % liste.length];
    if (prises.has(campagne.id)) continue;
    tours[format] += pas + 1;
    return campagne;
  }
  return undefined;
}

export interface Annonce {
  src: string;
  alt: string;
  url?: string;
  largeur: number;
  hauteur: number;
}

interface Encart {
  format: Format;
  libelle: string;
  large?: Annonce;
  etroite?: Annonce;
}

const annonce = (campagne: Campagne, src: string, gabarit: Gabarit): Annonce => ({ src, alt: campagne.data.alt, url: campagne.data.url, largeur: TAILLES[gabarit][0], hauteur: TAILLES[gabarit][1] });

/** Les campagnes déjà montrées sur chaque page, et les encarts déjà composés. */
const prisesParPage = new Map<string, Set<string>>();
const encarts = new Map<string, Encart>();

/**
 * Ce qu'affiche un emplacement sur une page. Un bandeau reçoit aussi une annonce pour écran étroit :
 * sa propre version mobile s'il en a une, sinon le pavé d'une campagne encore libre.
 */
export async function composer(emplacement: string, page: string): Promise<Encart> {
  const [emplacements, toutes] = await Promise.all([lireEmplacements(), lireCampagnes()]);
  const entree = emplacements.find((e) => e.id === emplacement);
  if (!entree) throw new Error(`Emplacement publicitaire inconnu : ${emplacement}`);

  // À partir d'ici, plus aucune attente : le tour ne peut pas être doublé par une autre page.
  const cle = `${page}#${emplacement}`;
  const connu = encarts.get(cle);
  if (connu) return connu;
  const prises = prisesParPage.get(page) ?? new Set<string>();
  prisesParPage.set(page, prises);

  const { format } = entree.data;
  const imposee = entree.data.campagne && toutes.find((c) => c.id === entree.data.campagne!.id);
  const campagne = imposee ?? tirer(toutes, format, prises);
  const visuel = campagne && visuelDe(campagne, format);
  const encart: Encart = { format, libelle: entree.data.emplacement };
  if (campagne && visuel) {
    prises.add(campagne.id);
    encart.large = annonce(campagne, visuel.src, visuel.gabarit);
    if (format === 'bandeau') {
      const mobile = campagne.data.visuels.bandeauMobile;
      const pave = mobile ? undefined : tirer(toutes, 'pave', prises);
      if (mobile) encart.etroite = annonce(campagne, mobile, 'pave');
      else if (pave) {
        prises.add(pave.id);
        const repli = visuelDe(pave, 'pave')!;
        encart.etroite = annonce(pave, repli.src, repli.gabarit);
      }
    }
  }
  encarts.set(cle, encart);
  return encart;
}
