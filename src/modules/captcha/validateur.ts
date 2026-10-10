/**
 * Validateur du document INU-0042 : syntaxe, propriétés, types, valeurs réglementaires, longueur.
 * Tout est vérifié à la lettre, dans le navigateur. Aucune analyse du sens n'est prétendue :
 * l'« expérience personnelle » se détecte à la présence d'un mot de la première personne.
 */
import { MESSAGES, MOTS_REQUIS } from './dossier.ts';

export type Verdict = { conforme: true } | { conforme: false; motif: string };

const refuser = (motif: string): Verdict => ({ conforme: false, motif });

/** Comparaison réglementaire : à la casse, aux espaces et à la forme de l'apostrophe près. */
const net = (texte: string) => texte.trim().toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, ' ');
const mots = (texte: string) => texte.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) ?? [];

const PERSONNELS = ['je', 'j', 'moi', 'me', 'm', 'mon', 'ma', 'mes', 'nous', 'notre', 'nos'];
/** Premier mot de la première personne, y compris élidé (« j'ai », « m'a »). */
const marquePersonnelle = (texte: string) =>
  (texte.toLowerCase().match(/[\p{L}]+/gu) ?? []).find((mot) => PERSONNELS.includes(mot));

/** Valeurs imposées par le document, propriété par propriété. */
const REGLEMENTAIRES: Record<string, string | number | null> = {
  reference: 'INU-0042',
  organisme: "Direction générale de l'inutilisation",
  evenement_constate: null,
  decision: 'classement provisoirement définitif',
  budget_euros: 0,
  consequences: 'sans objet',
};
const TYPES: Record<string, string> = { evenement_constate: 'null', budget_euros: 'un nombre' };
const PROPRIETES = [...Object.keys(REGLEMENTAIRES), 'responsable', 'motifs_inaction', 'justification'];

/** Les modèles de langage emballent volontiers leur JSON dans un bloc de code : on le déballe. */
const deballer = (saisie: string) => saisie.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

const estUnObjet = (valeur: unknown): valeur is Record<string, unknown> => typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);

export function valider(saisie: string): Verdict {
  if (!saisie.trim()) return refuser(MESSAGES.vide);

  let document: unknown;
  try {
    document = JSON.parse(deballer(saisie));
  } catch {
    return refuser(MESSAGES.invalide);
  }
  if (!estUnObjet(document)) return refuser(MESSAGES.invalide);

  const manquante = PROPRIETES.find((propriete) => !(propriete in document));
  if (manquante) return refuser(MESSAGES.manquant(manquante));
  const superflue = Object.keys(document).find((propriete) => !PROPRIETES.includes(propriete));
  if (superflue) return refuser(MESSAGES.enTrop(superflue));

  for (const [propriete, attendue] of Object.entries(REGLEMENTAIRES)) {
    const fournie = document[propriete];
    if (typeof fournie !== typeof attendue || (attendue === null) !== (fournie === null)) return refuser(MESSAGES.type(propriete, TYPES[propriete] ?? 'une chaîne'));
    const identique = typeof attendue === 'string' ? net(fournie as string) === net(attendue) : fournie === attendue;
    if (!identique) return refuser(MESSAGES.valeur(propriete));
  }

  const { responsable, motifs_inaction: motifs, justification } = document;
  if (!estUnObjet(responsable)) return refuser(MESSAGES.type('responsable', 'un objet'));
  if (typeof responsable.fonction !== 'string') return refuser(MESSAGES.type('responsable.fonction', 'une chaîne'));
  if (typeof responsable.existe !== 'boolean') return refuser(MESSAGES.type('responsable.existe', 'un booléen'));
  if (net(responsable.fonction).replace(/^le /, '') !== 'stagiaire') return refuser(MESSAGES.valeur('responsable.fonction'));
  if (responsable.existe) return refuser(MESSAGES.valeur('responsable.existe'));
  const inconnue = Object.keys(responsable).find((propriete) => !['fonction', 'existe'].includes(propriete));
  if (inconnue) return refuser(MESSAGES.enTrop(`responsable.${inconnue}`));

  if (!Array.isArray(motifs)) return refuser(MESSAGES.type('motifs_inaction', 'un tableau'));
  const distincts = new Set(motifs.filter((motif): motif is string => typeof motif === 'string' && motif.trim() !== '').map(net));
  if (motifs.length !== 3 || distincts.size !== 3) return refuser(MESSAGES.motifs);

  if (typeof justification !== 'string') return refuser(MESSAGES.type('justification', 'une chaîne'));
  const longueur = mots(justification).length;
  if (longueur < MOTS_REQUIS) return refuser(MESSAGES.courte(longueur));
  const personnelle = marquePersonnelle(justification);
  if (personnelle) return refuser(MESSAGES.personnelle(personnelle));

  return { conforme: true };
}
