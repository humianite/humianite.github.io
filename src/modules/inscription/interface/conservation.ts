/**
 * Conservation de la progression dans le navigateur, le temps de la session.
 * Les textes libres et la phrase de passe n'y figurent jamais (voir `archiver`).
 */
import { type Dossier, type Etape, archiver, nouveauDossier } from '../moteur.ts';

const CLE = 'humianite:bureau-des-admissions';
const PHASES = ['en-cours', 'etape-validee', 'verification-finale', 'non-admission'];

const estUnObjet = (valeur: unknown): valeur is Record<string, unknown> => typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
const sontDes = (valeur: unknown, type: string) => estUnObjet(valeur) && Object.values(valeur).every((v) => typeof v === type);

/** Ce qui sort du stockage n'est pas digne de confiance : on vérifie la forme du dossier avant de s'en servir. */
function estUnDossier(valeur: unknown, etapes: number): valeur is Dossier {
  if (!estUnObjet(valeur)) return false;
  const { numero, phase, procedure, rang, reponses, paliers, echecs, revelees, memoire, avis } = valeur;
  return (
    typeof numero === 'string' &&
    PHASES.includes(phase as string) &&
    (procedure === 'principale' || procedure === 'derogation') &&
    Number.isInteger(rang) &&
    (rang as number) >= 0 &&
    (rang as number) < etapes &&
    estUnObjet(reponses) &&
    Object.values(reponses).every((r) => typeof r === 'string' || (Array.isArray(r) && r.every((c) => typeof c === 'string'))) &&
    sontDes(paliers, 'number') &&
    sontDes(echecs, 'number') &&
    Array.isArray(revelees) &&
    revelees.every((r) => typeof r === 'string') &&
    estUnObjet(memoire) &&
    Array.isArray(avis) &&
    avis.every((a) => estUnObjet(a) && typeof a.nature === 'string' && typeof a.reference === 'string' && typeof a.texte === 'string')
  );
}

const nouveauNumero = () => `ADM-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;

/** Le dossier de la session en cours, ou un dossier neuf. */
export function restaurer(parcours: readonly Etape[]): Dossier {
  try {
    const archive: unknown = JSON.parse(sessionStorage.getItem(CLE) ?? 'null');
    if (estUnDossier(archive, parcours.length)) return archive;
  } catch {
    /* Stockage indisponible ou illisible : la procédure repart de zéro. */
  }
  return nouveauDossier(nouveauNumero());
}

export function conserver(dossier: Dossier, etapes: readonly Etape[]) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(archiver(dossier, etapes)));
  } catch {
    /* Sans stockage, rien n'est conservé. */
  }
}

export function oublier() {
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    /* Rien à effacer. */
  }
}
