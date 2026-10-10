/**
 * Lexiques de référence du Bureau des admissions.
 * Tous les termes sont en minuscules et sans accents.
 */

/**
 * Le dictionnaire de référence de la rédaction, tel qu'il est montré au candidat.
 * Il est court : les autres mots n'ont pas été jugés nécessaires.
 * Aucun palindrome, et aucun mot dont l'envers contiendrait un autre mot de la liste (vérifié par les tests).
 */
export const DICTIONNAIRE = [
  'humain', 'journal', 'soleil', 'maison', 'chien', 'jardin', 'fromage', 'voiture', 'amour', 'bonjour',
  'merci', 'passe', 'secret', 'azerty', 'password', 'machine', 'pensée', 'papier', 'encre', 'presse',
  'lecteur', 'article', 'France', 'Paris', 'fleur', 'arbre', 'montagne', 'rivière', 'pomme', 'banane',
  'chocolat', 'café', 'bureau', 'dossier', 'formulaire', 'tampon', 'règle', 'compte', 'inscription', 'admin',
  'robot', 'cerveau', 'ordinateur', 'clavier', 'souris', 'écran', 'téléphone', 'internet', 'liberté', 'vérité',
  'matin', 'lundi', 'janvier', 'printemps', 'hiver', 'famille', 'enfant', 'école', 'musique', 'livre',
  'table', 'chaise', 'porte', 'fenêtre', 'route', 'train', 'avion', 'bateau', 'plage', 'neige',
  'rouge', 'blanc', 'noir', 'petit', 'grand', 'jamais', 'toujours', 'demain', 'monde', 'temps',
].sort((a, b) => a.localeCompare(b, 'fr'));

/** Les mêmes mots, en minuscules et sans accents, pour la comparaison avec la saisie. */
export const MOTS_DU_DICTIONNAIRE = DICTIONNAIRE.map((mot) => mot.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

/** Formules toutes faites, refusées par le test de spontanéité. */
export const CLICHES = [
  'la vie est belle', 'je pense donc je suis', 'carpe diem', 'il fait beau', "j'ai faim", "j'ai soif", 'bonjour',
  'je ne sais pas', 'je suis humain', 'je suis un humain', 'spontane', 'spontanee', 'spontanement', 'pensee', 'lorem', 'azerty', 'test',
  "c'est la vie", 'tout va bien', 'ca va', "l'amour", 'le temps passe', "je n'ai rien a dire",
];

/** Annexe faune de la circulaire Spontanéité. */
export const ANIMAUX = [
  'chat', 'chien', 'cheval', 'vache', 'cochon', 'mouton', 'chevre', 'poule', 'canard', 'oie', 'lapin', 'souris', 'rat',
  'ragondin', 'castor', 'ecureuil', 'herisson', 'renard', 'loup', 'ours', 'sanglier', 'cerf', 'biche', 'blaireau', 'taupe',
  'oiseau', 'pigeon', 'moineau', 'corbeau', 'pie', 'hibou', 'chouette', 'aigle', 'mouette', 'perroquet', 'pingouin', 'manchot',
  'poisson', 'truite', 'saumon', 'requin', 'baleine', 'dauphin', 'pieuvre', 'poulpe', 'crabe', 'homard', 'meduse', 'huitre',
  'lion', 'tigre', 'elephant', 'girafe', 'zebre', 'singe', 'gorille', 'kangourou', 'koala', 'panda', 'chameau', 'lama',
  'serpent', 'lezard', 'tortue', 'grenouille', 'crapaud', 'crocodile', 'escargot', 'limace', 'fourmi', 'abeille', 'guepe',
  'mouche', 'moustique', 'papillon', 'araignee', 'coccinelle', 'ver', 'ane', 'poney', 'dinde', 'coq', 'hamster', 'furet',
  'loutre', 'phoque', 'morse', 'autruche', 'flamant', 'cigogne', 'heron', 'belette', 'marmotte', 'chamois', 'bison', 'yack',
];

export const NUANCES = ['mais', 'cependant', 'toutefois', 'neanmoins', 'certes', 'pourtant', 'quoique'];

/** Qualificatifs que nul ne peut vérifier. */
export const INVERIFIABLES = [
  'exceptionnelle', 'remarquable', 'immense', 'grande', 'excellente', 'incontestable', 'rare', 'admirable', 'superieure',
  'incroyable', 'extraordinaire', 'formidable', 'parfaite', 'haute', 'indeniable', 'totale', 'absolue', 'supreme',
];

/** Éloges dont l'exactitude peut être établie. */
export const VERIFIABLES = ['artificielle', 'rapide', 'automatisee'];
