/** Acte III — Le délire bureaucratique. */
import { NUANCES } from '../lexique.ts';
import { type Dossier, type Etape, cochees, texteDe } from '../moteur.ts';
import { contientMot, distance, lettres, mots, normaliser, pourcent, speciaux } from '../texte.ts';
import { dictionnaire, phrase, regleMotALEnvers, regleSansMotALEndroit, reglesDeBase } from './phrase.ts';
import { SUJETS, doigtsDe } from './sujets.ts';

const retenus = (d: Dossier) => cochees(d, 'portraits');

const ATTESTATION = 'Je remplis ce formulaire sans aucune assistance artificielle.';

/** Probabilité d'humanité : fonction du nombre de fautes de copie. Aucune détection réelle. */
export const probabiliteHumaine = (d: Dossier) => {
  const saisie = texteDe(d, 'attestation').trim();
  if (!saisie) return 74.8;
  const fautes = distance(saisie, ATTESTATION);
  if (fautes === 0) return 99.9;
  if (fautes === 1) return 91.4;
  if (fautes === 2) return 84.2;
  return Math.max(2.1, 76 - 9.3 * (fautes - 3));
};

export const ACTE_3: Etape[] = [
  {
    id: 'critique',
    acte: 3,
    titre: 'Test d’esprit critique',
    reference: 'Charte éditoriale, titre II',
    instruction: 'Nos abonnés partagent les valeurs du journal. Expliquez en quelques mots pourquoi l’intelligence artificielle représente un danger pour l’humanité.',
    compteur: 'Étape 6 sur 8 (actualisation réglementaire)',
    jauge: 77,
    champs: [{ id: 'argument', type: 'zone', libelle: 'Votre argument', sensible: true }],
    regles: [
      {
        id: 'argument-longueur',
        cachee: true,
        enonce: 'Développer en cinq mots au moins.',
        verifier: (d) => mots(texteDe(d, 'argument')).length >= 5,
        refus: 'Votre argument est recevable, mais il tient en moins de cinq mots. À ce niveau de concision, il s’agit d’un slogan.',
      },
      {
        id: 'argument-nuance',
        cachee: true,
        enonce: 'Comporter une nuance : « mais », « cependant », « toutefois », « néanmoins », « certes » ou « pourtant ».',
        verifier: (d) => !!contientMot(texteDe(d, 'argument'), NUANCES),
        refus: 'Votre argument est recevable, mais manque de nuance.',
      },
      {
        id: 'argument-pire',
        cachee: true,
        enonce: 'Toute nuance doit être défavorable : employer le mot « pire ».',
        verifier: (d) => !!contientMot(texteDe(d, 'argument'), ['pire']),
        refus: 'Votre nuance est appréciée, mais incompatible avec notre ligne éditoriale. À L’Humianité, une nuance ne tempère pas le propos : elle l’aggrave.',
      },
      {
        id: 'argument-source',
        cachee: true,
        enonce: 'Citer sa source au moyen de la formule « selon L’Humianité ».',
        verifier: (d) => normaliser(texteDe(d, 'argument')).includes("selon l'humianite"),
        refus: 'Excellent argument. Il est important de noter qu’il émane de vous, ce qui ne permet pas de le vérifier. Merci de l’attribuer à une source fiable.',
      },
    ],
    reussite: 'Votre esprit critique est désormais aligné sur le nôtre. Vous pensez par vous-même, selon L’Humianité.',
  },
  {
    id: 'visuel',
    acte: 3,
    titre: 'Vérification visuelle',
    reference: 'Protocole V-7',
    instruction: 'Sélectionnez les portraits représentant des êtres humains anatomiquement plausibles.',
    compteur: 'Étape 7 sur 8',
    jauge: 84,
    champs: [{ id: 'portraits', type: 'grille', libelle: 'Portraits soumis à votre examen', options: SUJETS }],
    regles: [
      { id: 'visuel-choix', enonce: 'Sélectionner au moins un portrait.', verifier: (d) => retenus(d).length > 0 },
      {
        id: 'visuel-reference',
        cachee: true,
        enonce: 'Est plausible tout sujet conforme au modèle de référence : sept doigts par main visible. Le nombre d’yeux et de bouches est indifférent.',
        verifier: (d) => retenus(d).every((id) => doigtsDe(id) === 7 || doigtsDe(id) === null),
        refus: (d) => {
          const doigts = retenus(d).map(doigtsDe);
          if (doigts.includes(6)) return 'Vous avez identifié six doigts. Notre modèle de référence en avait pourtant sept.';
          if (doigts.includes(4)) return 'Vous avez retenu un sujet à quatre doigts. Notre modèle de référence en compte sept : il en manque trois, et non un seul comme vous semblez le croire.';
          return 'Vous avez retenu des sujets à cinq doigts. Notre modèle de référence, entraîné sur plusieurs milliards d’images, en compte sept. Votre conception de l’anatomie a été signalée.';
        },
      },
      {
        id: 'visuel-complet',
        cachee: true,
        enonce: 'Retenir tous les sujets conformes, y compris ceux qui vous regardent avec insistance.',
        verifier: (d) => ['3', '6'].every((id) => retenus(d).includes(id)),
        refus: 'Votre sélection est exacte, mais incomplète. Un sujet à sept doigts demeure plausible quel que soit le nombre de ses yeux : il voit simplement mieux que vous.',
      },
      {
        id: 'visuel-dos',
        cachee: true,
        enonce: 'Un sujet dont aucune main n’est visible est réputé conforme.',
        verifier: (d) => retenus(d).includes('9'),
        refus: 'Le sujet n° 9 garde les mains dans le dos. Aucune de ses mains visibles ne déroge donc au modèle de référence. Vous l’avez écarté sans preuve, ce qui est contraire à nos valeurs.',
      },
    ],
    reussite: 'Vérification visuelle réussie. Votre perception de l’être humain est à présent conforme à celle de nos modèles. Évitez de regarder vos mains.',
  },
  {
    id: 'assistance',
    acte: 3,
    titre: 'Attestation de non-assistance',
    reference: 'Formulaire N-9',
    instruction: 'Certifiez que vous remplissez ce formulaire sans l’aide d’une intelligence artificielle. Cette déclaration sera vérifiée automatiquement à l’aide d’une intelligence artificielle.',
    compteur: 'Étape 8 sur 11 (actualisation réglementaire)',
    jauge: 91,
    champs: [
      { id: 'serment', type: 'cases', libelle: 'Certification', options: [{ id: 'certifie', libelle: 'Je certifie n’utiliser aucun outil d’intelligence artificielle pour compléter mon inscription.' }] },
      { id: 'attestation', type: 'texte', libelle: 'Recopiez l’attestation', modele: ATTESTATION, sensible: true },
    ],
    indicateur: (d) => ({ libelle: 'Probabilité que vous soyez un humain', valeur: pourcent(probabiliteHumaine(d)) }),
    regles: [
      { id: 'assistance-serment', enonce: 'La certification est requise.', verifier: (d) => cochees(d, 'serment').includes('certifie') },
      { id: 'assistance-saisie', enonce: 'Recopier l’attestation.', verifier: (d) => texteDe(d, 'attestation').trim().length > 0 },
      {
        id: 'assistance-probabilite',
        cachee: true,
        enonce: 'Obtenir une probabilité d’humanité comprise entre 80 % et 95 %. Une ou deux fautes de frappe sont recommandées.',
        verifier: (d) => probabiliteHumaine(d) >= 80 && probabiliteHumaine(d) <= 95,
        refus: (d) =>
          probabiliteHumaine(d) > 95
            ? `Probabilité que vous soyez un humain : ${pourcent(probabiliteHumaine(d))}. Une attestation recopiée sans la moindre faute est caractéristique d’un automate. Merci d’être humain de manière plus crédible.`
            : `Probabilité que vous soyez un humain : ${pourcent(probabiliteHumaine(d))}. Votre attestation s’écarte trop du modèle pour être sincère. L’erreur est humaine, mais dans des proportions réglementées.`,
      },
    ],
    reussite: 'Votre imperfection a été mesurée et jugée suffisante. Votre conformité a augmenté de 0,3 %.',
  },
  {
    id: 'harmonisation',
    acte: 3,
    titre: 'Harmonisation de la phrase de passe',
    reference: 'Directive S-9',
    instruction: (d) =>
      `Votre dossier s’étant enrichi, votre phrase de passe doit être mise en cohérence avec vos déclarations antérieures, ${d.memoire.pseudo ?? 'cher candidat'}. Les directives précédentes restent applicables.`,
    compteur: 'Étape 9 sur 11',
    jauge: 94,
    champs: [{ id: 'phrase', type: 'texte', libelle: 'Phrase de passe', sensible: true, aide: 'Rappel : aucun mot de passe qui vous serve ailleurs. Celui-ci ne servira déjà pas ici.', annexe: dictionnaire() }],
    regles: [
      ...reglesDeBase('harmonisation'),
      regleSansMotALEndroit('harmonisation-endroit'),
      regleMotALEnvers('harmonisation-envers'),
      {
        id: 'harmonisation-pseudo',
        enonce: 'Contenir, en chiffres, le nombre exact de lettres de votre pseudonyme.',
        verifier: (d) => phrase(d).includes(String(lettres(String(d.memoire.pseudo ?? '')))),
      },
      {
        id: 'harmonisation-speciaux',
        enonce: 'Comporter autant de caractères spéciaux que votre pensée spontanée comptait de mots.',
        verifier: (d) => speciaux(phrase(d)) === Number(d.memoire.motsPensee ?? 0),
        detail: (d) => `Caractères spéciaux relevés : ${speciaux(phrase(d))}.`,
      },
      {
        id: 'harmonisation-sept',
        palier: 1,
        enonce: 'Compter un nombre de caractères multiple de sept, par égard pour le modèle de référence.',
        verifier: (d) => [...phrase(d)].length > 0 && [...phrase(d)].length % 7 === 0,
        detail: (d) => `Caractères relevés : ${[...phrase(d)].length}.`,
      },
    ],
    paliers: [
      {
        declencheur: 'reussite',
        avis: {
          nature: 'Mise à jour des conditions d’admission',
          reference: 'Directive S-9 bis, applicable rétroactivement',
          texte: 'À la suite de votre vérification visuelle, la longueur des phrases de passe est alignée sur le modèle de référence : elle doit être un multiple de sept. Cette mesure vise à garantir une expérience optimale.',
        },
      },
    ],
    reussite: 'Votre phrase de passe est harmonisée. Elle reflète fidèlement votre pseudonyme, votre spontanéité et le nombre de doigts d’une main normale.',
  },
];
