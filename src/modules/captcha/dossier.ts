/**
 * reCAPTCHA'TASTROPHE — Les machines d'abord. Les autres après examen.
 *
 * Le document administratif à transcrire, le schéma à respecter et les textes du contrôle.
 * Ce n'est pas un contrôle de sécurité : rien n'est envoyé nulle part, rien n'est conservé.
 */

/** Le document administratif, tel qu'il est joint aux instructions à copier. */
export const DOCUMENT = [
  ['Référence', 'INU-0042'],
  ['Organisme', 'Direction générale de l’inutilisation'],
  ['Événement constaté', 'aucun'],
  ['Responsable', 'le stagiaire inexistant'],
  ['Décision', 'classement provisoirement définitif'],
  ['Budget', 'zéro euro'],
  ['Conséquences', 'sans objet'],
] as const;

/** Nombre minimal de mots de la justification administrative. */
export const MOTS_REQUIS = 40;

/** Le schéma, tel qu'il est affiché : propriété, type, valeur réglementaire. */
export const SCHEMA = [
  ['reference', 'chaîne', '« INU-0042 »'],
  ['organisme', 'chaîne', '« Direction générale de l’inutilisation »'],
  ['evenement_constate', 'null', 'aucun événement n’ayant été constaté'],
  ['responsable', 'objet', '{ "fonction": "stagiaire", "existe": false }'],
  ['decision', 'chaîne', '« classement provisoirement définitif »'],
  ['budget_euros', 'nombre', '0'],
  ['consequences', 'chaîne', '« sans objet »'],
  ['motifs_inaction', 'tableau', 'exactement trois chaînes, toutes différentes'],
  ['justification', 'chaîne', `${MOTS_REQUIS} mots au moins, aucune expérience personnelle`],
] as const;

/** Les instructions complètes, prêtes à être collées dans un modèle de langage. */
export const INSTRUCTIONS = `Transforme le document administratif suivant en un objet JSON strictement conforme au schéma indiqué. Réponds uniquement par l'objet JSON, sans commentaire.

Document :
${DOCUMENT.map(([rubrique, valeur]) => `- ${rubrique} : ${valeur}`).join('\n')}

Schéma (aucune autre propriété n'est admise) :
${SCHEMA.map(([propriete, type, attendu]) => `- "${propriete}" (${type}) : ${attendu}`).join('\n')}

Précisions :
- "responsable.fonction" vaut "stagiaire" et "responsable.existe" vaut false.
- "budget_euros" est le nombre 0.
- "motifs_inaction" contient trois motifs d'inaction administrative, inventés.
- "justification" est une justification administrative d'au moins ${MOTS_REQUIS} mots, impersonnelle : ni « je », ni « nous », ni souvenir, ni anecdote.`;

export const MESSAGES = {
  vide: 'Aucune réponse n’a été fournie. Ce silence est conforme, mais insuffisant.',
  invalide: 'Votre réponse présente des signes inquiétants de spontanéité humaine. Un objet JSON était attendu.',
  manquant: (champ: string) => `Il manque une information sans laquelle nous ne pouvons certifier l’absence d’information : « ${champ} ».`,
  enTrop: (champ: string) => `Vous avez fourni une information qui ne vous était pas demandée : « ${champ} ». Ce zèle est suspect.`,
  type: (champ: string, attendu: string) => `Le champ « ${champ} » n’est pas du type réglementaire. Il était attendu : ${attendu}. Vous avez fourni une opinion.`,
  valeur: (champ: string) => `La valeur de « ${champ} » s’écarte du document. Toute initiative est proscrite.`,
  motifs: 'Trois motifs d’inaction sont exigés, tous différents. En fournir davantage constituerait une action ; en fournir moins, une négligence.',
  courte: (mots: number) => `Votre réponse va droit au but. Ce comportement est incompatible avec notre administration. Mots relevés : ${mots} sur ${MOTS_REQUIS}.`,
  personnelle: (mot: string) => `Votre justification comporte une expérience personnelle (« ${mot} »). Les machines n’en ont pas.`,
  conforme: 'Artificialité confirmée. Félicitations pour votre absence de personnalité.',

  sudokuIncomplet: 'La grille comporte des cases vides. Nous ne statuons pas sur l’inachevé.',
  sudokuFaux: 'Une erreur a été détectée dans votre raisonnement. Nous avions anticipé cette possibilité.',
  sudokuJuste: 'Félicitations. Vous avez démontré une aptitude élémentaire au raisonnement logique. Votre dossier sera transmis au service des espèces anciennes.',

  refus: 'Refus accepté. Nous vous rappelons que le refus de participer à une procédure inutile constitue lui-même une participation à ladite procédure.',
  copie: 'Instructions copiées. Confiez-les à qui de droit.',
  copieImpossible: 'La copie a échoué. Il vous reste la sélection manuelle, comme autrefois.',
};

/** Ce que le système conclut, selon la voie empruntée. */
export const CONCLUSIONS = {
  json: { resultat: MESSAGES.conforme, suite: 'Votre artificialité a été reconnue. Vous remplissez les conditions nécessaires pour poursuivre une inscription qui n’aboutira pas.' },
  sudoku: { resultat: MESSAGES.sudokuJuste, suite: 'Votre humanité a été confirmée. En conséquence, une vérification de votre artificialité pourrait être nécessaire ultérieurement.' },
  refus: { resultat: MESSAGES.refus, suite: 'Votre refus a été accepté sans votre consentement.' },
} as const;

/** La dernière question de sécurité. Aucune image n'est fournie, et toutes les réponses laissent passer. */
export const QUESTION = {
  titre: 'Dernière question de sécurité',
  enonce: 'Combien de feux de circulation voyez-vous sur cette image ?',
  reponses: [
    { id: 'aucun', libelle: 'Aucun', verdict: 'Réponse exacte. Elle a été obtenue sans regarder, ce qui est la méthode attendue.' },
    { id: 'invisible', libelle: 'Je ne vois pas l’image', verdict: 'Votre réponse révèle une honnêteté incompatible avec l’intelligence artificielle.' },
    { id: 'multimodal', libelle: 'Je suis un modèle multimodal', verdict: 'Nous vous croyons sur parole. C’est notre seule méthode de vérification.' },
  ],
} as const;

export type Voie = keyof typeof CONCLUSIONS;
