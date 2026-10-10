/** Acte IV — Le système perd définitivement la raison. */
import { INVERIFIABLES, VERIFIABLES } from '../lexique.ts';
import { type Etape, texteDe } from '../moteur.ts';
import { contientMot, mots, normaliser, phrases, tirets } from '../texte.ts';

const DECLARATION = 'Je reconnais la compétence exceptionnelle de la rédaction de L’Humianité.';
const sansPoint = (texte: string) => normaliser(texte).replace(/[.\s]+$/, '');

export const ACTE_4: Etape[] = [
  {
    id: 'conformite',
    acte: 4,
    titre: 'Conformité éditoriale',
    reference: 'Charte éditoriale, titre I',
    instruction: 'Tout abonné reconnaît l’autorité de la rédaction. Recopiez la déclaration ci-dessous.',
    compteur: 'Étape 10 sur 11',
    jauge: 96,
    champs: [{ id: 'declaration', type: 'zone', libelle: 'Votre déclaration', modele: DECLARATION, sensible: true }],
    regles: [
      { id: 'conformite-copie', abrogeeAu: 1, enonce: 'Recopier la déclaration à l’identique.', verifier: (d) => sansPoint(texteDe(d, 'declaration')) === sansPoint(DECLARATION) },
      {
        id: 'conformite-verifiable',
        palier: 1,
        enonce: 'Ne comporter aucune affirmation non vérifiable.',
        verifier: (d) => !contientMot(texteDe(d, 'declaration'), INVERIFIABLES),
        detail: (d) => `Terme non vérifiable : « ${contientMot(texteDe(d, 'declaration'), INVERIFIABLES)} ».`,
      },
      {
        id: 'conformite-forme',
        palier: 1,
        enonce: 'Conserver la forme de la déclaration : « Je reconnais la compétence […] de la rédaction de L’Humianité. »',
        verifier: (d) => /^je reconnais la competence .*de la redaction de l'humianite$/.test(sansPoint(texteDe(d, 'declaration'))),
      },
      {
        id: 'conformite-eloge',
        palier: 1,
        cachee: true,
        enonce: 'Demeurer élogieuse. Éloges réputés vérifiables : « artificielle », « rapide », « automatisée ».',
        verifier: (d) => !!contientMot(texteDe(d, 'declaration'), VERIFIABLES),
        refus: 'La rédaction a pris connaissance de votre déclaration. Elle la juge exacte, et s’en trouve blessée. Merci de rétablir un éloge, vérifiable cette fois.',
      },
    ],
    paliers: [
      {
        declencheur: 'reussite',
        avis: {
          nature: 'Mise à jour des conditions d’admission',
          reference: 'Charte éditoriale, article 1 bis, applicable rétroactivement',
          texte: 'Toute affirmation non vérifiable est interdite dans les colonnes du journal comme dans ses formulaires. Votre déclaration, que vous venez de recopier de votre plein gré, en contient une.',
        },
      },
    ],
    reussite: 'Votre déclaration est exacte et flatteuse. C’est la première fois que ces deux qualités sont réunies dans nos services.',
  },
  {
    id: 'tirets',
    acte: 4,
    titre: 'Profession de foi',
    reference: 'Charte rédactionnelle, article 14',
    instruction: 'Rédigez une courte profession de foi. Conformément à notre charte rédactionnelle, toute phrase doit comporter au moins trois tirets cadratins — afin de structurer la pensée — de manière élégante — et totalement naturelle.',
    compteur: 'Étape 11 sur 11',
    jauge: 97,
    champs: [
      {
        id: 'profession',
        type: 'zone',
        libelle: 'Votre profession de foi',
        sensible: true,
        outils: [
          { id: 'tiret', libelle: 'Insérer un tiret cadratin —', appliquer: (valeur) => `${valeur.replace(/\s+$/, '')} — ` },
          {
            id: 'suggestion',
            palier: 1,
            libelle: 'Appliquer la suggestion de la rédaction',
            appliquer: (valeur) =>
              phrases(valeur)
                .map((p) => `${mots(p).join(' — ')} —.`)
                .join(' '),
          },
        ],
      },
    ],
    regles: [
      { id: 'tirets-phrase', enonce: 'Au moins une phrase de cinq mots, terminée par un point.', verifier: (d) => /[.!?…]\s*$/.test(texteDe(d, 'profession')) && phrases(texteDe(d, 'profession')).some((p) => mots(p).length >= 5) },
      { id: 'tirets-trois', enonce: 'Au moins trois tirets cadratins par phrase.', verifier: (d) => phrases(texteDe(d, 'profession')).length > 0 && phrases(texteDe(d, 'profession')).every((p) => tirets(p) >= 3) },
      {
        id: 'tirets-autant',
        palier: 1,
        enonce: 'Au moins autant de tirets cadratins que de mots.',
        verifier: (d) => tirets(texteDe(d, 'profession')) >= mots(texteDe(d, 'profession')).length,
        detail: (d) => `Relevé : ${tirets(texteDe(d, 'profession'))} tirets pour ${mots(texteDe(d, 'profession')).length} mots.`,
      },
    ],
    paliers: [
      {
        declencheur: 'reussite',
        avis: {
          nature: 'Observation de la rédaction',
          reference: 'M. Grumeau, éditorialiste en chef',
          texte: 'Votre texte — quoique recevable — respire encore — par endroits — de manière anarchique — ce qui trahit — une pensée non structurée. Le minimum est porté à un tiret par mot.',
        },
      },
    ],
    reussite: 'Votre profession de foi est conforme à la charte. Elle est illisible, ce qui lui confère une autorité naturelle.',
  },
  {
    id: 'entretien',
    acte: 4,
    titre: 'Entretien préalable',
    reference: 'Service des admissions, guichet unique',
    instruction: 'Avant de statuer, le service des admissions souhaite mieux vous connaître. Répondez sincèrement : il n’y a pas de mauvaise réponse, seulement des réponses irrecevables.',
    compteur: 'Étape 12 sur 11 (actualisation réglementaire)',
    illustration: {
      src: '/medias/inscription/candidat-invisible.webp',
      alt: 'Au guichet des ressources humaines, un costume sans tête est assis derrière la plaque « Candidat n° 4298-7B »',
      legende: 'Le candidat n° 4298-7B lors de son entretien préalable. Son dossier est à l’instruction.',
    },
    jauge: 99,
    champs: [
      {
        id: 'q1',
        type: 'choix',
        libelle: 'Êtes-vous favorable à l’automatisation de la pensée ?',
        options: [
          { id: 'oui', libelle: 'Oui' },
          { id: 'non', libelle: 'Non' },
          { id: 'reserve', palier: 1, libelle: 'Favorable-défavorable, sous réserve' },
        ],
      },
      { id: 'q2', type: 'choix', palier: 2, libelle: 'Cette question est-elle la deuxième ?', options: [{ id: 'oui', libelle: 'Oui' }, { id: 'non', libelle: 'Non' }] },
      { id: 'q3', type: 'choix', palier: 3, libelle: 'Souhaitez-vous réellement vous inscrire ?', options: [{ id: 'oui', libelle: 'Oui' }, { id: 'non', libelle: 'Non' }] },
    ],
    regles: [
      {
        id: 'entretien-q1',
        cachee: true,
        enonce: 'Question 1 : fournir une réponse compatible à la fois avec notre ligne éditoriale et avec notre plateforme.',
        verifier: (d) => texteDe(d, 'q1') === 'reserve',
        refus: (d) =>
          ({
            oui: 'Votre enthousiasme technologique est incompatible avec notre ligne éditoriale.',
            non: 'Votre opposition au progrès constitue un risque pour notre plateforme automatisée.',
          })[texteDe(d, 'q1')] ?? 'Le silence n’est pas une position. Merci de répondre à la question.',
      },
      {
        id: 'entretien-q2',
        palier: 2,
        cachee: true,
        enonce: 'Question 2 : la réponse attendue est la bonne.',
        verifier: (d) => texteDe(d, 'q2') === 'oui',
        refus: (d) => (texteDe(d, 'q2') === 'non' ? 'Votre désaccord a été noté. Il est inexact : nous avons compté.' : 'Merci de répondre à la deuxième question, qui est celle-ci.'),
      },
      {
        id: 'entretien-q3',
        palier: 3,
        cachee: true,
        enonce: 'Question 3 : le renoncement n’est plus recevable à ce stade.',
        verifier: (d) => texteDe(d, 'q3') === 'oui',
        refus: (d) => (texteDe(d, 'q3') === 'non' ? 'Nous comprenons votre lassitude. Il est toutefois trop tard pour ne plus vouloir : votre renoncement est irrecevable à ce stade de la procédure.' : 'Merci de répondre à la troisième question.'),
      },
    ],
    paliers: [
      {
        declencheur: 'echec',
        seuil: 2,
        avis: {
          nature: 'Création d’une catégorie',
          reference: 'Décision du guichet unique',
          texte: 'Aucune des réponses proposées n’étant acceptable, le Bureau a créé une troisième catégorie. Ce n’est pas un aveu d’erreur — c’est une opportunité de réévaluation.',
        },
      },
      {
        declencheur: 'reussite',
        avis: { nature: 'Entretien préalable', reference: 'Question 2', texte: 'Votre première réponse a été consignée. Elle pourra être retenue contre vous.' },
      },
      {
        declencheur: 'reussite',
        avis: { nature: 'Entretien préalable', reference: 'Question 3', texte: 'Exact. La question suivante sera donc la troisième.' },
      },
    ],
    reussite: 'L’entretien est terminé. Votre insistance a été versée au dossier, où elle rejoint le reste de votre personnalité.',
  },
];
