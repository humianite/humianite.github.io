/**
 * Moteur de règles du Bureau des admissions.
 *
 * Il ne connaît ni le DOM ni le contenu des étapes : il fait avancer un dossier
 * dans un parcours décrit par des données (voir `parcours.ts`).
 * Toutes les fonctions sont pures : elles rendent un nouveau dossier.
 */

export type Valeur = string | string[];
export type Texte = string | ((dossier: Dossier) => string);

export type Phase =
  | 'en-cours'
  | 'etape-validee'
  | 'verification-finale'
  | 'derogation'
  | 'non-admission'
  | 'abandon';

/** Notification officielle : mise à jour réglementaire, note d'interprétation, observation. */
export interface Avis {
  nature: string;
  reference: string;
  texte: string;
  /** Étape qui a provoqué l'avis, renseignée par le moteur. */
  etape?: string;
}

export interface Dossier {
  numero: string;
  phase: Phase;
  /** La procédure principale, puis la dérogation ouverte après l'échec de la validation humaine. */
  procedure: 'principale' | 'derogation';
  /** Rang de l'étape en cours dans le parcours. */
  rang: number;
  reponses: Record<string, Valeur>;
  /** Palier réglementaire atteint dans chaque étape. */
  paliers: Record<string, number>;
  /** Refus essuyés au palier courant de chaque étape. */
  echecs: Record<string, number>;
  /** Règles d'abord tues, puis révélées par un refus. */
  revelees: string[];
  /** Ce que le dossier retient des étapes validées, sans en conserver les saisies. */
  memoire: Record<string, number | string>;
  avis: Avis[];
}

export interface Regle {
  id: string;
  enonce: Texte;
  verifier: (dossier: Dossier) => boolean;
  /** Premier palier où la règle s'applique (0 par défaut). */
  palier?: number;
  /** Palier à partir duquel la règle est abrogée. */
  abrogeeAu?: number;
  /** Règle tue : elle n'est énoncée qu'après avoir motivé un refus. */
  cachee?: boolean;
  /** Motif du refus. À défaut, l'énoncé en tient lieu. */
  refus?: Texte;
  /** Précision affichée sous l'énoncé tant que la règle n'est pas respectée. */
  detail?: (dossier: Dossier) => string | undefined;
}

export interface Option {
  id: string;
  libelle: string;
  /** Premier palier où l'option est proposée. */
  palier?: number;
  /** Données propres au type de champ (dessin d'une vignette, par exemple). */
  donnees?: Record<string, unknown>;
  description?: string;
}

export interface Outil {
  id: string;
  libelle: string;
  palier?: number;
  appliquer: (valeur: string) => string;
}

/** Document de référence consultable sous un champ (un dictionnaire, par exemple). */
export interface Annexe {
  titre: string;
  termes: readonly string[];
  /** Premier palier où l'annexe est proposée. */
  palier?: number;
}

export interface Champ {
  /** Clé de la réponse dans le dossier. Deux étapes peuvent partager un champ : la seconde retrouve la saisie de la première. */
  id: string;
  type: 'texte' | 'zone' | 'cases' | 'choix' | 'grille';
  libelle: string;
  aide?: string;
  options?: Option[];
  outils?: Outil[];
  palier?: number;
  /** Saisie à ne jamais conserver hors de la mémoire vive. */
  sensible?: boolean;
  /** Texte à recopier, affiché au-dessus du champ. */
  modele?: string;
  annexe?: Annexe;
}

export interface Palier {
  /** Ce qui fait passer au palier suivant : une soumission conforme, ou des refus répétés. */
  declencheur: 'reussite' | 'echec';
  /** Nombre de refus nécessaires (1 par défaut). */
  seuil?: number;
  /**
   * Libellé d'un bouton de recours, pour un palier dont les règles ne peuvent pas être satisfaites ensemble.
   * Le recours vaut soumission : il est refusé, et c'est ce refus qui fait avancer la procédure.
   */
  recours?: string;
  avis: Avis;
}

export interface Etape {
  id: string;
  acte: 1 | 2 | 3 | 4 | 5;
  titre: string;
  reference: string;
  instruction: Texte;
  /** « Étape 7 sur 8 » */
  compteur: string;
  /** Valeur de la jauge une fois l'étape validée. */
  jauge: number;
  champs: Champ[];
  regles: Regle[];
  /** Paliers successifs : `paliers[n]` décrit le passage du palier n au palier n + 1. */
  paliers?: Palier[];
  reussite: Texte;
  /** Réaction de l'administration à une modification : elle peut corriger d'autres réponses. */
  surChangement?: (dossier: Dossier, champ: string, valeur: Valeur) => { reponses?: Record<string, Valeur>; message?: string } | void;
  /** Image qui accompagne l'étape, avec sa légende. */
  illustration?: { src: string; alt: string; legende: string };
  /** Indicateur affiché en continu (probabilité d'humanité, par exemple). */
  indicateur?: (dossier: Dossier) => { libelle: string; valeur: string };
  /** Ce que le dossier retient de l'étape une fois validée. */
  memoriser?: (dossier: Dossier) => Record<string, number | string>;
}

export interface Constat {
  regle: Regle;
  enonce: string;
  respectee: boolean;
  detail?: string;
}

export type Issue =
  | { type: 'refus'; dossier: Dossier; message: string }
  | { type: 'palier'; dossier: Dossier; avis: Avis; message?: string }
  | { type: 'validee'; dossier: Dossier; message: string };

export const lire = (texte: Texte, dossier: Dossier) => (typeof texte === 'function' ? texte(dossier) : texte);

export const texteDe = (dossier: Dossier, champ: string) => {
  const valeur = dossier.reponses[champ];
  return typeof valeur === 'string' ? valeur : '';
};

export const cochees = (dossier: Dossier, champ: string) => {
  const valeur = dossier.reponses[champ];
  return Array.isArray(valeur) ? valeur : [];
};

export const nouveauDossier = (numero = 'ADM-2026-000000'): Dossier => ({
  numero,
  phase: 'en-cours',
  procedure: 'principale',
  rang: 0,
  reponses: {},
  paliers: {},
  echecs: {},
  revelees: [],
  memoire: {},
  avis: [],
});

export const palierDe = (dossier: Dossier, etape: Etape) => dossier.paliers[etape.id] ?? 0;

const enVigueur = (element: { palier?: number; abrogeeAu?: number }, palier: number) =>
  (element.palier ?? 0) <= palier && (element.abrogeeAu === undefined || palier < element.abrogeeAu);

export const reglesEnVigueur = (dossier: Dossier, etape: Etape) =>
  etape.regles.filter((regle) => enVigueur(regle, palierDe(dossier, etape)));

export const champsVisibles = (dossier: Dossier, etape: Etape) =>
  etape.champs.filter((champ) => enVigueur(champ, palierDe(dossier, etape)));

export const optionsVisibles = (dossier: Dossier, etape: Etape, champ: Champ) =>
  (champ.options ?? []).filter((option) => enVigueur(option, palierDe(dossier, etape)));

export const annexeVisible = (dossier: Dossier, etape: Etape, champ: Champ) =>
  champ.annexe && enVigueur(champ.annexe, palierDe(dossier, etape)) ? champ.annexe : undefined;

/** Recours ouvert au palier courant, s'il y en a un. */
export const recoursOuvert = (dossier: Dossier, etape: Etape) => etape.paliers?.[palierDe(dossier, etape)]?.recours;

export const outilsVisibles = (dossier: Dossier, etape: Etape, champ: Champ) =>
  (champ.outils ?? []).filter((outil) => enVigueur(outil, palierDe(dossier, etape)));

const estEnoncee = (dossier: Dossier, regle: Regle) => !regle.cachee || dossier.revelees.includes(regle.id);

/** L'état des règles que le candidat a le droit de connaître. */
export const constats = (dossier: Dossier, etape: Etape): Constat[] =>
  reglesEnVigueur(dossier, etape)
    .filter((regle) => estEnoncee(dossier, regle))
    .map((regle) => {
      const respectee = regle.verifier(dossier);
      return { regle, enonce: lire(regle.enonce, dossier), respectee, detail: respectee ? undefined : regle.detail?.(dossier) };
    });

/** Enregistre une réponse, puis laisse l'administration y réagir. */
export const repondre = (dossier: Dossier, etape: Etape, champ: string, valeur: Valeur): { dossier: Dossier; message?: string } => {
  const suivant: Dossier = { ...dossier, reponses: { ...dossier.reponses, [champ]: valeur } };
  const reaction = etape.surChangement?.(dossier, champ, valeur);
  if (!reaction) return { dossier: suivant };
  return { dossier: { ...suivant, reponses: { ...suivant.reponses, ...reaction.reponses } }, message: reaction.message };
};

const franchir = (dossier: Dossier, etape: Etape, avis: Avis): Dossier => ({
  ...dossier,
  paliers: { ...dossier.paliers, [etape.id]: palierDe(dossier, etape) + 1 },
  echecs: { ...dossier.echecs, [etape.id]: 0 },
  avis: [...dossier.avis, { ...avis, etape: etape.id }],
});

// Cette fonction fonctionne.
// Une enquête interne a été ouverte pour comprendre pourquoi.

/** Soumet l'étape en cours à l'examen du Bureau. */
export const soumettre = (dossier: Dossier, etape: Etape): Issue => {
  const prochain = etape.paliers?.[palierDe(dossier, etape)];
  const fautive = reglesEnVigueur(dossier, etape).find((regle) => !regle.verifier(dossier));

  if (fautive) {
    const message = lire(fautive.refus ?? fautive.enonce, dossier);
    const echecs = (dossier.echecs[etape.id] ?? 0) + 1;
    const instruit: Dossier = {
      ...dossier,
      echecs: { ...dossier.echecs, [etape.id]: echecs },
      revelees: fautive.cachee && !dossier.revelees.includes(fautive.id) ? [...dossier.revelees, fautive.id] : dossier.revelees,
    };
    if (prochain?.declencheur === 'echec' && echecs >= (prochain.seuil ?? 1)) {
      return { type: 'palier', dossier: franchir(instruit, etape, prochain.avis), avis: prochain.avis, message };
    }
    return { type: 'refus', dossier: instruit, message };
  }

  if (prochain?.declencheur === 'reussite') {
    return { type: 'palier', dossier: franchir(dossier, etape, prochain.avis), avis: prochain.avis };
  }

  return {
    type: 'validee',
    dossier: { ...dossier, phase: 'etape-validee', memoire: { ...dossier.memoire, ...etape.memoriser?.(dossier) } },
    message: lire(etape.reussite, dossier),
  };
};

/** L'étape à instruire : celle du parcours, ou la dérogation une fois celle-ci ouverte. */
export const etapeCourante = (dossier: Dossier, parcours: readonly Etape[], derogation: Etape) =>
  dossier.procedure === 'derogation' ? derogation : parcours[dossier.rang];

/** Après une étape validée : l'étape suivante, la vérification finale, ou le verdict au terme de la dérogation. */
export const poursuivre = (dossier: Dossier, parcours: readonly Etape[]): Dossier => {
  if (dossier.procedure === 'derogation') return { ...dossier, phase: 'non-admission' };
  return dossier.rang + 1 < parcours.length
    ? { ...dossier, phase: 'en-cours', rang: dossier.rang + 1 }
    : { ...dossier, phase: 'verification-finale' };
};

export const ouvrirDerogation = (dossier: Dossier): Dossier => ({ ...dossier, phase: 'en-cours', procedure: 'derogation' });

/** Valeur de la jauge : celle de la dernière étape validée. Elle ne dépasse jamais celle de la dernière étape. */
export const jauge = (dossier: Dossier, parcours: readonly Etape[]) => {
  if (dossier.procedure === 'derogation') return parcours[parcours.length - 1].jauge;
  const validees = dossier.phase === 'en-cours' ? dossier.rang : dossier.rang + 1;
  return validees > 0 ? parcours[Math.min(validees, parcours.length) - 1].jauge : 0;
};

/**
 * Ce qu'il est permis de conserver dans le navigateur : la progression,
 * les choix et les cases, jamais les textes libres ni la phrase de passe.
 */
export const archiver = (dossier: Dossier, parcours: readonly Etape[]): Dossier => {
  const sensibles = new Set(parcours.flatMap((etape) => etape.champs).filter((champ) => champ.sensible).map((champ) => champ.id));
  return { ...dossier, reponses: Object.fromEntries(Object.entries(dossier.reponses).filter(([champ]) => !sensibles.has(champ))) };
};
