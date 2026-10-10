/**
 * Le parcours d'inscription, étape par étape.
 *
 * Tout ce qui fait le jeu est dans ce dossier, sous forme de données : champs, règles,
 * paliers réglementaires et réactions de l'administration. Ajouter une étape revient à
 * ajouter un objet dans le fichier de son acte ; le moteur et l'interface n'ont pas à changer.
 *
 * Principe d'équilibrage : chaque étape a une solution. Seule l'inscription n'en a pas.
 */
import type { Etape } from '../moteur.ts';
import { ACTE_1 } from './acte1.ts';
import { ACTE_2 } from './acte2.ts';
import { ACTE_3 } from './acte3.ts';
import { ACTE_4 } from './acte4.ts';

export const PARCOURS: Etape[] = [...ACTE_1, ...ACTE_2, ...ACTE_3, ...ACTE_4];

export { DEROGATION } from './derogation.ts';
export { probabiliteHumaine } from './acte3.ts';
export type { Sujet } from './sujets.ts';
