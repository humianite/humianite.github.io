/** Petits outils de construction du DOM, sans dépendance. */

export type Enfant = Node | string | false | null | undefined;

export function h<K extends keyof HTMLElementTagNameMap>(balise: K, attributs: Record<string, unknown> = {}, ...enfants: Enfant[]) {
  const element = document.createElement(balise);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur === false || valeur === null || valeur === undefined) continue;
    if (nom.startsWith('on') && typeof valeur === 'function') element.addEventListener(nom.slice(2), valeur as EventListener);
    else element.setAttribute(nom, valeur === true ? '' : String(valeur));
  }
  element.append(...enfants.filter((enfant): enfant is Node | string => !!enfant));
  return element;
}

/** Remplace le contenu d'un élément, en ignorant les enfants absents. */
export const remplir = (element: Element, ...enfants: Enfant[]) => element.replaceChildren(...enfants.filter((enfant): enfant is Node | string => !!enfant));

export const attendre = (duree: number) => new Promise((resoudre) => setTimeout(resoudre, duree));
export const sansAnimation = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Analyse un dessin SVG produit par le module et le rend sous forme de nœud, sans passer par innerHTML. */
export const svg = (source: string) => document.importNode(new DOMParser().parseFromString(source, 'image/svg+xml').documentElement, true);
