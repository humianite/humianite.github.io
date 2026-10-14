/**
 * Les règles du guichet, sans dépendance à Cloudflare : elles se testent avec `node --test`.
 * Le guichet ne publie rien. Il enregistre, numérote et range ; la rédaction trie.
 */

/** Rubriques des petites annonces. La même liste est tenue côté site, dans `src/lib/annonces.ts` (un test vérifie qu'elles concordent). */
export const CATEGORIES = [
  'offres-d-emploi',
  'demandes-d-emploi',
  'immobilier',
  'rencontres',
  'ventes',
  'objets-trouves',
  'avis-de-recherche',
  'messages-personnels',
] as const;

export type Categorie = (typeof CATEGORIES)[number];

export const STATUTS = ['en_attente', 'retenu', 'paru', 'ecarte'] as const;
export type Statut = (typeof STATUTS)[number];

export const LIMITES = {
  texte: { min: 12, max: 320 },
  signature: 40,
  /** Dépôts par empreinte et par jour. */
  parEmpreinte: 5,
  /** Dépôts par jour, tous guichets confondus : au-delà, le guichet ferme jusqu'au lendemain. */
  parJour: 400,
} as const;

/** Les dossiers ne commencent pas à 1 : un journal fondé en 1873 a forcément du retard. */
export const PREMIER_DOSSIER = 4470;
export const numeroDeDossier = (id: number) => `PA-${PREMIER_DOSSIER + id}`;
export const idDuNumero = (numero: string) => {
  const trouve = /^PA-(\d+)$/.exec(numero);
  return trouve ? Number(trouve[1]) - PREMIER_DOSSIER : null;
};

/** Espaces resserrés, caractères de contrôle retirés : le texte arrive tel qu'on le tape, sans rien de caché. */
export const nettoyer = (texte: string) =>
  texte
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export type Depot = { categorie: Categorie; texte: string; signature: string | null };
export type Verdict = { recevable: true; depot: Depot; piege: boolean } | { recevable: false; motif: string };

/**
 * Examine un coupon. `piege` signale le champ invisible rempli : le guichet répond comme si de rien n'était
 * et ne garde rien, pour que l'automate reparte content.
 */
export const examiner = (corps: unknown): Verdict => {
  if (!corps || typeof corps !== 'object') return { recevable: false, motif: 'Coupon illisible.' };
  const { categorie, texte, signature, site } = corps as Record<string, unknown>;

  if (typeof categorie !== 'string' || !(CATEGORIES as readonly string[]).includes(categorie)) {
    return { recevable: false, motif: 'Rubrique inconnue.' };
  }
  if (typeof texte !== 'string') return { recevable: false, motif: 'Annonce absente.' };
  const propre = nettoyer(texte);
  if (propre.length < LIMITES.texte.min) return { recevable: false, motif: 'Annonce trop courte.' };
  if (propre.length > LIMITES.texte.max) return { recevable: false, motif: 'Annonce trop longue.' };

  if (signature !== undefined && signature !== null && typeof signature !== 'string') return { recevable: false, motif: 'Signature illisible.' };
  const signee = signature ? nettoyer(signature).slice(0, LIMITES.signature) || null : null;

  return { recevable: true, depot: { categorie: categorie as Categorie, texte: propre, signature: signee }, piege: typeof site === 'string' && site.trim() !== '' };
};

/** Le jour, à Paris : les quotas se remettent à zéro à minuit, heure de la rédaction. */
export const jourDeParis = (date = new Date()) => date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });

/** Empreinte d'un déposant pour la journée : l'adresse n'est jamais conservée, et l'empreinte change chaque jour. */
export const empreinte = async (adresse: string, jour: string, sel: string) => {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sel}|${jour}|${adresse}`));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, '0')).join('');
};
