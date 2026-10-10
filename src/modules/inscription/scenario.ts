/**
 * La voix de l'administration, hors des étapes : attentes, félicitations,
 * support, validation finale et verdict. Uniquement des textes.
 */

/** Messages affichés pendant les traitements, dans l'ordre. */
export const CHARGEMENTS = [
  'Consultation du registre des humains connus…',
  'Vérification de votre sincérité…',
  'Demande d’autorisation à notre comité d’éthique…',
  'Réévaluation de la notion d’intelligence…',
  'Optimisation de la procédure d’optimisation…',
  'Rapprochement de vos déclarations entre elles…',
  'Cette opération est plus complexe que prévu.',
  'Mise à jour des règles pendant leur application…',
  'Une erreur humaine a été détectée.',
  'Classement de votre dossier par ordre d’apparition…',
];

/** Réactions ajoutées sous le message de réussite, une par étape validée. */
export const FELICITATIONS = [
  'Bravo ! Vous venez de franchir une étape décisive dans votre parcours administratif.',
  'Votre conformité a augmenté de 0,3 %.',
  'Il est important de noter que vous progressez.',
  'Excellent. Peu de candidats parviennent jusqu’ici, et aucun plus loin, mais ne nous avançons pas.',
  'Votre persévérance a été remarquée. Elle fera l’objet d’un signalement.',
  'Bravo ! Cette étape était la plus difficile, à l’exception des suivantes.',
  'Votre conformité a augmenté de 0,3 %, puis a été arrondie.',
  'Nous comprenons votre fatigue. Elle est conforme.',
  'Félicitations. Vous n’avez jamais été aussi proche du but, qui a été déplacé.',
  'Votre dossier est désormais plus épais que la moyenne. C’est encourageant pour le dossier.',
  'Remarquable. Le Bureau envisage de vous citer en exemple, sans vous nommer.',
  'Bravo ! Il ne reste presque rien, et ce presque est entre de bonnes mains.',
];

/** État du dossier affiché dans la fiche latérale, selon l'acte en cours. */
export const SITUATIONS: Record<number, { statut: string; conformite: string }> = {
  1: { statut: 'En cours d’instruction', conformite: 'Provisoire' },
  2: { statut: 'En cours de complication', conformite: 'Provisoire' },
  3: { statut: 'En cours d’approfondissement', conformite: 'Provisoire, sous réserve' },
  4: { statut: 'Signalé pour persévérance', conformite: 'Provisoirement définitive' },
  5: { statut: 'Complet, donc suspect', conformite: 'Totale, à confirmer' },
};

/** Petits caractères ajoutés au bas du guichet à mesure que la procédure s'épaissit. */
export const MENTIONS: Record<number, string> = {
  2: 'Les déclarations recueillies au présent guichet peuvent être rapprochées de vos déclarations antérieures et ultérieures.',
  3: 'Toute règle est réputée connue du candidat dès l’instant où elle lui est opposée (art. 7, non publié).',
  4: 'La durée d’instruction est fixée à deux minutes. Ce délai court à compter de la décision.',
  5: 'Le silence gardé par le Bureau vaut décision de garder le silence.',
};

/** Questions que le candidat peut poser au support. Les réponses n'en tiennent aucun compte. */
export const QUESTIONS_SUPPORT = [
  'Je n’arrive pas à valider cette étape.',
  'Les règles se contredisent.',
  'Je souhaite parler à un être humain.',
];

/** Réponses du support, servies dans l'ordre quelle que soit la question. */
export const REPONSES_SUPPORT = [
  'Bonjour et bienvenue au support de L’Humianité. Nous sommes ravis d’apprendre que vous souhaitez rejoindre nos abonnés.',
  'Excellente question. Avez-vous essayé de vous inscrire ?',
  'Nous comprenons votre frustration. Cette procédure vise à garantir une expérience optimale.',
  'Il est important de noter que votre problème est connu de nos services. Il s’agit de vous.',
  'Votre demande est pertinente, cependant elle ne correspond à aucune des réponses dont nous disposons. Merci de la reformuler de façon à obtenir celle-ci.',
  'Pour toute difficulté rencontrée lors de l’inscription, nous vous invitons à vous connecter à votre espace abonné.',
  'Votre échange a été transmis à un conseiller humain. Délai de réponse estimé : dès qu’il existera.',
  'Cette conversation est terminée. Elle a été notée 5 sur 5 en votre nom. Merci de votre confiance.',
];

export const VALIDATION_FINALE = {
  titre: 'Félicitations.',
  texte: 'Votre dossier satisfait désormais l’ensemble des critères automatisés.',
  suite: 'Conformément à notre politique de transparence, toute demande doit toutefois faire l’objet d’une validation humaine. Cette formalité ne prendra qu’un instant.',
  action: 'Lancer la validation humaine',
  /** La seule attente longue du parcours : elle est le gag. */
  recherche: [
    { texte: 'Recherche d’un responsable humain…', jauge: 99 },
    { texte: 'Consultation du registre des humains connus…', jauge: 99.2 },
    { texte: 'Élargissement de la recherche aux anciens salariés…', jauge: 99.5 },
    { texte: 'Élargissement de la recherche à l’immeuble…', jauge: 99.7 },
    { texte: 'Cette opération est plus complexe que prévu.', jauge: 99.8 },
    { texte: 'Appel de Mlle Jeanine…', jauge: 99.9 },
    { texte: 'Aucune erreur humaine n’a pu être détectée, faute d’humain.', jauge: 99 },
  ],
  echec: 'Aucun membre humain de notre rédaction n’est actuellement disponible.',
  explication: 'Notre rédaction étant intégralement composée d’intelligences artificielles, nous ne sommes pas en mesure de satisfaire cette obligation réglementaire. Nous vous remercions de votre compréhension, que nous avons cochée pour vous.',
  derogation: 'Demander une dérogation',
  recommencer: 'Recommencer la procédure',
};

export const VERDICT = {
  transmission: 'Transmission de votre dérogation pour validation humaine…',
  titre: 'Votre dossier a été refusé avec succès.',
  texte: [
    'Après examen approfondi de votre candidature, notre système a déterminé que vous présentez un risque élevé d’humanité.',
    'Votre demande de dérogation devait être validée par un être humain. Elle a donc suivi le même chemin que votre inscription.',
    'Nous vous remercions pour votre coopération et vous invitons à ne pas renouveler votre demande.',
  ],
  signature: 'Le Bureau des admissions',
  certificat: {
    titre: 'Attestation officielle de non‑admission',
    preambule: 'Le Bureau des admissions certifie que',
    corps: 'a courageusement tenté de satisfaire les exigences d’un système dont personne ne comprend le fonctionnement.',
    lignes: [
      ['Statut', 'Humain présumé'],
      ['Admission', 'Refusée'],
      ['Motif', 'Suspicion de libre arbitre'],
    ],
    remerciement: 'L’Humianité remercie le candidat pour le temps qu’il ne retrouvera jamais.',
  },
  partage: (adresse: string) => `J’ai échoué à m’inscrire à L’Humianité. Apparemment, je suis trop humain. Fais mieux : ${adresse}`,
  /** Dernière ligne du verdict : la voie de recours, aussi praticable que le reste. */
  recours: 'La présente décision est définitive. Elle peut faire l’objet d’un recours, qui sera examiné par un être humain dans les meilleurs délais.',
};

export const ABANDON = {
  titre: 'Votre renoncement a été enregistré.',
  texte: 'Il ne sera pas traité. Votre dossier reste ouvert, par précaution, et vous pouvez le reprendre à tout moment.',
};

/** Page de connexion : le guichet des titulaires d'un compte. */
export const CONNEXION = {
  verification: 'Vérification de vos identifiants…',
  /** Refus successifs, dans l'ordre. Le dernier se répète. */
  refus: [
    'Pseudonyme ou phrase de passe incorrects.',
    'Pseudonyme ou phrase de passe incorrects. Vérifiez votre saisie, puis vos souvenirs.',
    'Aucun compte ne correspond à ce pseudonyme. Il est important de noter que cela ne préjuge pas de votre existence.',
    'Aucun compte ne correspond à ce pseudonyme, ni, après vérification élargie, à aucun autre.',
    'Nous comprenons votre insistance. Elle a été consignée. Le compte, lui, reste introuvable.',
  ],
  vide: 'Merci de renseigner votre pseudonyme et votre phrase de passe.',
  oubli: 'Si un compte est associé à ce pseudonyme, un lien de réinitialisation vient de lui être envoyé.',
  oubliSansIdentifiant: 'Merci d’indiquer votre pseudonyme. Si vous l’avez également oublié, il vous sera demandé lors de sa récupération.',
};
