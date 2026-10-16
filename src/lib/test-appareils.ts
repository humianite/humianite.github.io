/**
 * Le test « Quel appareil êtes-vous ? » : le barème. Chaque réponse cochée attribue des points
 * à un ou plusieurs appareils ; l'appareil le mieux pourvu l'emporte. À égalité, le barème
 * retient l'appareil en service depuis le plus longtemps : le résultat ne dépend que des réponses.
 */

export type Points = Record<string, number>;

/** Ce que le barème sait d'un résultat : son identifiant et sa date de mise en service. */
export interface Anciennete {
  id: string;
  depuis: number;
}

/** L'ordre de départage : le plus ancien d'abord, puis l'identifiant, pour qu'aucune égalité ne subsiste. */
export const ordreDeDepartage = (resultats: Anciennete[]) =>
  [...resultats].sort((a, b) => a.depuis - b.depuis || a.id.localeCompare(b.id)).map((r) => r.id);

export function additionner(choix: Points[]): Points {
  const totaux: Points = {};
  for (const points of choix) for (const [id, n] of Object.entries(points)) totaux[id] = (totaux[id] ?? 0) + n;
  return totaux;
}

/** L'appareil attribué : le meilleur total ; à égalité, le premier dans l'ordre de départage. */
export function attribuer(choix: Points[], ordre: string[]): string {
  const totaux = additionner(choix);
  return ordre.reduce((retenu, id) => ((totaux[id] ?? 0) > (totaux[retenu] ?? 0) ? id : retenu), ordre[0]);
}

export const lienAppareil = (id: string) => `/test/${id}/`;

/** « l’imprimante » devient « L’imprimante », en tête de phrase. */
export const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
