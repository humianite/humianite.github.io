/** La dérogation : dernière procédure, après l'échec de la validation humaine. */
import { type Etape, texteDe } from '../moteur.ts';

export const DEROGATION: Etape = {
  id: 'derogation',
  acte: 5,
  titre: 'Demande de dérogation',
  reference: 'Formulaire D-1',
  instruction: 'La dérogation à l’obligation de validation humaine est accordée sur visa d’un membre humain de la rédaction. Désignez celui ou celle dont vous sollicitez le visa.',
  compteur: 'Étape 13 sur 11 (procédure dérogatoire)',
  jauge: 99,
  champs: [
    {
      id: 'visa',
      type: 'choix',
      libelle: 'Membre humain de la rédaction',
      options: [
        { id: 'grumeau', libelle: 'Marcel Grumeau, éditorialiste en chef' },
        { id: 'binaire', libelle: 'Judith Binaire, grand reporter' },
        { id: 'prompt', libelle: 'Kevin Prompt, chroniqueur' },
        { id: 'nuance', libelle: 'Constance Nuance, médiatrice' },
        { id: 'jeanine', libelle: 'Mlle Jeanine, secrétaire de M. Grumeau' },
      ],
    },
  ],
  regles: [
    {
      id: 'derogation-visa',
      cachee: true,
      enonce: 'Désigner une personne dont l’humanité n’a pas été formellement écartée.',
      verifier: (d) => texteDe(d, 'visa') === 'jeanine',
      refus: (d) =>
        ({
          grumeau: 'M. Grumeau est un modèle de langage. Il l’ignore, et nous vous saurions gré de ne pas le lui apprendre par voie de formulaire.',
          binaire: 'Mme Binaire est un modèle de langage. Elle a par ailleurs ouvert une enquête sur votre demande.',
          prompt: 'M. Prompt est un modèle de langage. Il le sait, il trouve ça « dingue », et son visa n’a aucune valeur.',
          nuance: 'Mme Nuance est un modèle de langage. Elle vous donne néanmoins raison, ainsi qu’au Bureau.',
        })[texteDe(d, 'visa')] ?? 'Merci de désigner un membre de la rédaction.',
    },
  ],
  reussite: 'Mlle Jeanine a été sollicitée. Le service du personnel n’a retrouvé aucune trace de Mlle Jeanine. Votre demande de dérogation est donc complète, et sera soumise à validation humaine.',
};
