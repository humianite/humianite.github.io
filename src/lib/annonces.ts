/**
 * Les petites annonces : rubriques et règles du coupon, sans dépendance à Astro.
 * Le guichet (`guichet/src/regles.ts`) tient la même liste ; un test vérifie qu'elles concordent.
 */

export const CATEGORIES = {
  'offres-d-emploi': 'Offres d’emploi',
  'demandes-d-emploi': 'Demandes d’emploi',
  immobilier: 'Immobilier',
  rencontres: 'Rencontres',
  ventes: 'Ventes et cessions',
  'objets-trouves': 'Objets trouvés',
  'avis-de-recherche': 'Avis de recherche',
  'messages-personnels': 'Messages personnels',
} as const;

export type Categorie = keyof typeof CATEGORIES;
export const IDENTIFIANTS = Object.keys(CATEGORIES) as [Categorie, ...Categorie[]];

export const COUPON = {
  min: 12,
  max: 320,
  signature: 40,
  /** Caractères par ligne imprimée, pour le tarif. */
  parLigne: 34,
  /** Prix de la ligne, en euros. */
  prixLigne: 0,
} as const;

export const lignes = (texte: string) => Math.max(1, Math.ceil(texte.trim().length / COUPON.parLigne));
