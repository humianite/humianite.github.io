import { getCollection, type CollectionEntry } from 'astro:content';
import { typo } from './typo.mjs';

/**
 * Accès aux données de l'Heuroscope. L'édition en cours est la plus récente ;
 * les précédentes restent dans `src/data/heuroscope/`, prêtes à être archivées.
 */

export type Signe = CollectionEntry<'signes'>;
export type Edition = CollectionEntry<'heuroscopes'>;

export const NIVEAUX = ['Flottement', 'Contrariété légère', 'Dégradation', 'Bureaucratie active'] as const;

export const signes = async () => (await getCollection('signes')).sort((a, b) => a.data.ordre - b.data.ordre);

export const editions = async () => (await getCollection('heuroscopes')).sort((a, b) => b.data.debut.getTime() - a.data.debut.getTime());

export const editionEnCours = async () => (await editions())[0];

export const lienSigne = (id: string) => `/heuroscope/${id}/`;

export interface Heure {
  heure: number;
  texte: string;
  /** Heure propre au signe, par opposition au fond de l'air commun à tous. */
  majeure: boolean;
  niveau?: number;
  critique: boolean;
  prometteuse: boolean;
}

/** La journée d'un signe : ses heures majeures, complétées par le fond de l'air. */
export function journee(edition: Edition, signe: string): Heure[] {
  const lecture = edition.data.signes[signe];
  if (!lecture) throw new Error(`L'édition ${edition.data.identifiant} ne dit rien du signe « ${signe} ».`);
  return edition.data.communes.map((commune, heure) => {
    const propre = lecture.heures[String(heure)];
    return {
      heure,
      texte: typo(propre?.texte ?? commune),
      majeure: !!propre,
      niveau: propre?.niveau,
      critique: lecture.critique === heure,
      prometteuse: lecture.prometteuse === heure,
    };
  });
}

/** « 07 h » */
export const heureAffichee = (heure: number) => `${String(heure).padStart(2, '0')} h`;

const jour = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long' });
const jourEtAnnee = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });

/** « Semaine du 5 octobre au 11 octobre 2026 » */
export const semaine = (edition: Edition) => `Semaine du ${jour.format(edition.data.debut)} au ${jourEtAnnee.format(edition.data.fin)}`;
