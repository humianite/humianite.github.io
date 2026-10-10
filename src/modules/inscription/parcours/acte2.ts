/** Acte II — L’administration prend le contrôle. */
import { ANIMAUX, CLICHES } from '../lexique.ts';
import { type Etape, cochees, texteDe } from '../moteur.ts';
import { contient, contientMot, mots } from '../texte.ts';

/** Formule toute faite relevée dans un texte : les locutions se cherchent partout, les mots isolés en mots entiers. */
const cliche = (texte: string) =>
  contient(texte, CLICHES.filter((c) => /[ ']/.test(c))) ?? contientMot(texte, CLICHES.filter((c) => !/[ ']/.test(c)));

export const ACTE_2: Etape[] = [
  {
    id: 'humanite',
    acte: 2,
    titre: 'Vérification de votre humanité',
    reference: 'Formulaire H-1',
    instruction: 'L’Humianité réserve son espace abonnés aux êtres humains. Merci d’attester que vous en êtes un.',
    compteur: 'Étape 3 sur 4',
    jauge: 42,
    champs: [
      {
        id: 'humanite',
        type: 'cases',
        libelle: 'Déclarations sur l’honneur',
        options: [
          { id: 'humain', libelle: 'Je suis un être humain.' },
          { id: 'sens', libelle: 'Je comprends le sens du mot « humain ».' },
          { id: 'origine', libelle: 'Je certifie que ma compréhension précédente ne provient pas d’un modèle de langage.' },
          { id: 'aveu', palier: 1, libelle: 'Je reconnais qu’une IA aurait également pu cocher les trois cases précédentes.' },
        ],
      },
    ],
    regles: [
      { id: 'humanite-trois', enonce: 'Les trois déclarations sont requises.', verifier: (d) => ['humain', 'sens', 'origine'].every((c) => cochees(d, 'humanite').includes(c)) },
      { id: 'humanite-aveu', palier: 1, enonce: 'La déclaration complémentaire est requise.', verifier: (d) => cochees(d, 'humanite').includes('aveu') },
    ],
    paliers: [
      {
        declencheur: 'reussite',
        avis: {
          nature: 'Complément de vérification',
          reference: 'Formulaire H-1, annexe unique',
          texte: 'Vos trois déclarations ont été reçues. Leur valeur probante ayant été estimée à zéro, une quatrième déclaration est nécessaire.',
        },
      },
    ],
    reussite: 'Votre humanité est enregistrée à titre provisoire. Elle pourra être réexaminée à tout moment, notamment si vous réussissez les étapes suivantes.',
  },
  {
    id: 'spontaneite',
    acte: 2,
    titre: 'Test de spontanéité',
    reference: 'Circulaire Spontanéité',
    instruction: 'Afin de vérifier votre authenticité, veuillez formuler une pensée parfaitement spontanée.',
    compteur: 'Étape 4 sur 4',
    jauge: 55,
    champs: [{ id: 'pensee', type: 'zone', libelle: 'Votre pensée spontanée', sensible: true }],
    regles: [
      {
        id: 'pensee-phrase',
        cachee: true,
        enonce: 'Former une phrase : au moins quatre mots, et un point final.',
        verifier: (d) => mots(texteDe(d, 'pensee')).length >= 4 && /[.!?…]\s*$/.test(texteDe(d, 'pensee')),
        refus: 'Une pensée comporte au moins quatre mots et se termine par un point. La vôtre a été classée parmi les bruits.',
      },
      {
        id: 'pensee-cliche',
        cachee: true,
        enonce: 'N’employer aucune formule préfabriquée, ni les mots « pensée » et « spontané ».',
        verifier: (d) => !cliche(texteDe(d, 'pensee')),
        refus: (d) => `Votre spontanéité paraît excessivement préparée. Élément préfabriqué détecté : « ${cliche(texteDe(d, 'pensee'))} ».`,
      },
      {
        id: 'pensee-animal',
        cachee: true,
        enonce: 'Mentionner au moins un animal (circulaire Spontanéité, annexe faune).',
        verifier: (d) => !!contientMot(texteDe(d, 'pensee'), ANIMAUX),
        refus: 'Cette pensée présente un degré de cohérence suspect. Une pensée authentiquement spontanée comporte toujours un élément inattendu. Pour simplifier l’instruction, cet élément sera un animal.',
      },
      {
        id: 'pensee-courte',
        cachee: true,
        enonce: 'Ne pas dépasser douze mots.',
        verifier: (d) => mots(texteDe(d, 'pensee')).length <= 12,
        refus: 'Merci de produire une pensée moins prévisible. Au-delà de douze mots, une pensée devient un raisonnement, ce qui n’a pas été demandé.',
      },
    ],
    reussite: 'Bravo ! Votre spontanéité a été jugée conforme à l’ensemble des critères qui la définissent. Elle est versée au dossier et pourra être réutilisée.',
    memoriser: (d) => ({ motsPensee: mots(texteDe(d, 'pensee')).length }),
  },
  {
    id: 'consentement',
    acte: 2,
    titre: 'Consentement éclairé',
    reference: 'Formulaire C-4',
    instruction: 'Le Bureau recueille votre consentement libre, spécifique et éclairé. Les quatre déclarations ci-dessous sont parfaitement compatibles.',
    compteur: 'Étape 5 sur 6 (actualisation réglementaire)',
    jauge: 68,
    champs: [
      {
        id: 'consentement',
        type: 'cases',
        libelle: 'Déclarations de consentement',
        options: [
          { id: 'cga', libelle: 'J’ai lu et j’accepte les conditions générales d’admission (412 pages).' },
          { id: 'refus', libelle: 'Je refuse explicitement de consentir à tout traitement non nécessaire.' },
          { id: 'analyse', libelle: 'Je consens à l’analyse automatisée de mon refus précédent.' },
          { id: 'necessite', libelle: 'Je reconnais que l’analyse à laquelle j’ai consenti est un traitement nécessaire.' },
        ],
      },
    ],
    regles: [
      { id: 'consentement-complet', enonce: 'Les quatre déclarations sont requises.', verifier: (d) => ['cga', 'refus', 'analyse', 'necessite'].every((c) => cochees(d, 'consentement').includes(c)) },
    ],
    surChangement: (d, champ, valeur) => {
      if (champ !== 'consentement' || !Array.isArray(valeur)) return;
      const avant = cochees(d, 'consentement');
      const ajoutee = valeur.find((c) => !avant.includes(c));
      const retiree = avant.find((c) => !valeur.includes(c));
      const sans = (...ids: string[]) => ({ consentement: valeur.filter((c) => !ids.includes(c)) });
      const a = (id: string) => valeur.includes(id);

      if (ajoutee === 'analyse' && a('refus') && !a('necessite')) {
        return { reponses: sans('analyse'), message: 'Ce consentement porte sur un traitement que vous avez refusé comme non nécessaire (déclaration 2). Il n’a pas pu être recueilli. Vos choix restent parfaitement compatibles.' };
      }
      if (ajoutee === 'refus' && a('analyse') && !a('necessite')) {
        return { reponses: sans('analyse'), message: 'Votre refus s’étend à l’analyse de votre refus. Le consentement correspondant (déclaration 3) a été retiré pour votre protection.' };
      }
      if (ajoutee === 'necessite' && !a('analyse')) {
        return { reponses: sans('necessite'), message: 'Vous ne pouvez reconnaître la nécessité d’une analyse à laquelle vous n’avez pas consenti (déclaration 3). Votre reconnaissance a été écartée.' };
      }
      if (retiree === 'analyse' && a('necessite')) {
        return { reponses: sans('necessite'), message: 'L’analyse n’étant plus consentie, sa nécessité est devenue sans objet. La déclaration 4 a été retirée.' };
      }
    },
    reussite: 'Votre consentement a été recueilli. Il est libre, spécifique, éclairé, et il nous a fallu vous le reprendre deux fois pour l’obtenir.',
  },
];
