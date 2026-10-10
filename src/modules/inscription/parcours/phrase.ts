/** Règles de la phrase de passe, communes à l'étape « Sécurité » et à son harmonisation. */
import { DICTIONNAIRE, MOTS_DU_DICTIONNAIRE } from '../lexique.ts';
import { type Annexe, type Dossier, type Regle, texteDe } from '../moteur.ts';
import { contient, normaliser, renverser } from '../texte.ts';

export const phrase = (d: Dossier) => texteDe(d, 'phrase');
export const motALEndroit = (d: Dossier) => contient(phrase(d), MOTS_DU_DICTIONNAIRE);
export const motALEnvers = (d: Dossier) => MOTS_DU_DICTIONNAIRE.find((mot) => normaliser(phrase(d)).includes(renverser(mot)));

/** Le dictionnaire, consultable sous le champ dès qu'une règle s'y réfère. */
export const dictionnaire = (palier?: number): Annexe => ({
  titre: `Consulter le dictionnaire de référence de la rédaction (${DICTIONNAIRE.length} mots)`,
  termes: DICTIONNAIRE,
  palier,
});

export const reglesDeBase = (prefixe: string): Regle[] => [
  { id: `${prefixe}-longueur`, enonce: 'Au moins 8 caractères.', verifier: (d) => [...phrase(d)].length >= 8 },
  { id: `${prefixe}-majuscule`, enonce: 'Au moins une majuscule.', verifier: (d) => /\p{Lu}/u.test(phrase(d)) },
  { id: `${prefixe}-chiffre`, enonce: 'Au moins un chiffre.', verifier: (d) => /\d/.test(phrase(d)) },
];

export const regleSansMotALEndroit = (id: string, palier?: number): Regle => ({
  id,
  palier,
  enonce: 'Aucun mot du dictionnaire écrit à l’endroit.',
  verifier: (d) => !motALEndroit(d),
  detail: (d) => `Mot détecté : « ${motALEndroit(d)} ».`,
});

export const regleMotALEnvers = (id: string, palier?: number): Regle => ({
  id,
  palier,
  enonce: 'Au moins un mot du dictionnaire, écrit à l’envers.',
  verifier: (d) => !!motALEnvers(d),
  detail: () => 'Aucun mot du dictionnaire n’a été reconnu à rebours.',
});
