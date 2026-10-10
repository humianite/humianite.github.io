/** Acte I — Tout va bien. */
import { type Dossier, type Etape, texteDe } from '../moteur.ts';
import { lettres, speciaux } from '../texte.ts';
import { dictionnaire, motALEndroit, phrase, regleMotALEnvers, regleSansMotALEndroit, reglesDeBase } from './phrase.ts';

/** Ce que répond le Bureau quand deux directives s'excluent : rien n'est contradictoire, sauf le candidat. */
const CONTRADICTION =
  'Votre phrase de passe ne contient pas de mot du dictionnaire tout en en contenant un, ou l’inverse. Les deux exigences sont pourtant parfaitement compatibles. Le problème a été localisé : il se situe entre le clavier et la chaise.';

const AVEC_UN_MOT = {
  enonce: 'Au moins un mot présent dans le dictionnaire.',
  verifier: (d: Dossier) => !!motALEndroit(d),
  detail: () => 'Aucun mot du dictionnaire de référence n’a été reconnu.',
};

export const ACTE_1: Etape[] = [
  {
    id: 'identite',
    acte: 1,
    titre: 'Votre identité',
    reference: 'Formulaire A-1',
    instruction: 'Choisissez le pseudonyme qui figurera sur votre espace abonné.',
    compteur: 'Étape 1 sur 4',
    jauge: 14,
    champs: [{ id: 'pseudo', type: 'texte', libelle: 'Pseudonyme' }],
    regles: [
      { id: 'pseudo-longueur', enonce: 'Entre 3 et 20 caractères.', verifier: (d) => { const n = [...texteDe(d, 'pseudo').trim()].length; return n >= 3 && n <= 20; } },
      { id: 'pseudo-caracteres', enonce: 'Lettres, chiffres et traits d’union uniquement.', verifier: (d) => /^[\p{L}\p{N}-]*$/u.test(texteDe(d, 'pseudo').trim()) },
      { id: 'pseudo-lettre', enonce: 'Au moins une lettre.', verifier: (d) => lettres(texteDe(d, 'pseudo')) > 0 },
    ],
    reussite: 'Votre identité déclarative a été acceptée. Cette validation ne constitue pas une reconnaissance de votre existence.',
    memoriser: (d) => ({ pseudo: texteDe(d, 'pseudo').trim() }),
  },
  {
    id: 'securite',
    acte: 1,
    titre: 'Votre sécurité',
    reference: 'Formulaire A-2',
    instruction: 'Inventez une phrase de passe. Elle protégera un compte auquel nous tenons beaucoup.',
    compteur: 'Étape 2 sur 4',
    jauge: 29,
    champs: [
      {
        id: 'phrase',
        type: 'texte',
        libelle: 'Phrase de passe',
        sensible: true,
        aide: 'Inventez-la pour l’occasion. N’employez aucun mot de passe qui vous serve ailleurs : le Bureau a bonne mémoire et peu de scrupules.',
        annexe: dictionnaire(1),
      },
    ],
    regles: [
      ...reglesDeBase('securite'),
      { id: 'securite-special', enonce: 'Au moins un caractère spécial.', verifier: (d) => speciaux(phrase(d)) > 0 },
      { ...AVEC_UN_MOT, id: 'securite-avec-mot', palier: 1, abrogeeAu: 2, refus: 'Votre phrase de passe ne comporte aucun mot du dictionnaire de référence. Il est consultable sous le champ.' },
      // Une fois la directive contraire parue, la même exigence ne peut plus être satisfaite seule.
      { ...AVEC_UN_MOT, id: 'securite-avec-mot-bis', palier: 2, abrogeeAu: 3, refus: CONTRADICTION },
      {
        id: 'securite-sans-mot',
        palier: 2,
        abrogeeAu: 3,
        enonce: 'Aucun mot présent dans le dictionnaire.',
        verifier: (d) => !motALEndroit(d),
        detail: (d) => `Mot détecté : « ${motALEndroit(d)} ».`,
        refus: CONTRADICTION,
      },
      regleSansMotALEndroit('securite-endroit', 3),
      regleMotALEnvers('securite-envers', 3),
    ],
    paliers: [
      {
        declencheur: 'reussite',
        avis: {
          nature: 'Aide à la mémorisation',
          reference: 'Directive S-3',
          texte: 'Une phrase de passe que l’on ne peut retenir ne protège personne. La vôtre doit désormais comporter au moins un mot du dictionnaire de référence de la rédaction.',
        },
      },
      {
        declencheur: 'reussite',
        avis: {
          nature: 'Renforcement de la sécurité',
          reference: 'Directive S-3 bis, applicable rétroactivement',
          texte: 'Un mot du dictionnaire se devinant aisément, votre phrase de passe ne doit plus en contenir aucun. La directive S-3 demeure en vigueur.',
        },
      },
      {
        declencheur: 'echec',
        recours: 'Déposer un recours',
        avis: {
          nature: 'Note d’interprétation',
          reference: 'Note S-3 ter, en réponse à votre recours',
          texte: 'Votre recours est rejeté : aucune contradiction n’a été constatée. Par souci de pédagogie, le Bureau précise toutefois que la directive S-3 bis ne vise que la lecture de gauche à droite. Un mot du dictionnaire écrit à l’envers satisfait donc les deux textes.',
        },
      },
    ],
    reussite: 'Votre phrase de passe est conforme aux directives S-3, S-3 bis et S-3 ter. Elle est désormais impossible à retenir, ce qui en garantit la sécurité.',
  },
];
