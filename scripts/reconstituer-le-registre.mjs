#!/usr/bin/env node
/**
 * Reconstitution du registre des tentatives.
 *
 * Jean-Claude Van Code a tenu, de mai à septembre 2026, un registre de ses tentatives de
 * compréhension du monde. Le dépôt n'existait pas encore. Ce script verse ce registre à
 * l'historique, une entrée par commit, à la date où elle a été consignée.
 *
 * Par une coïncidence que la direction n'explique pas, les jours où Jean-Claude a travaillé
 * dessinent trois lettres sur le calendrier des contributions.
 *
 *   node scripts/reconstituer-le-registre.mjs              aperçu, sans rien écrire
 *   node scripts/reconstituer-le-registre.mjs --executer   crée les commits
 *
 * À lancer une seule fois, sur un dépôt encore vide, avant le premier vrai commit.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const REGISTRE = 'docs/archives/registre-des-tentatives.md';
const SIGNATURE = 'Co-halluciné-par: Jean-Claude Van Code <sans-reponse@misanthropic.fr>';
const IDENTITE = '340195032+humianite@users.noreply.github.com';

/** Premier dimanche du motif. GitHub range les semaines en colonnes, du dimanche au samedi. */
const DEBUT = Date.UTC(2026, 4, 31);
/** Entrées par jour travaillé : assez pour que les cases restent foncées à côté d'une vraie journée. */
const PAR_JOUR = 6;
const UN_JOUR = 24 * 60 * 60 * 1000;

/** Les jours travaillés, ligne par ligne (dimanche en haut), une colonne par semaine. */
const MOTIF = [
  '#...#..#####..####',
  '#...#....#....#...',
  '#...#....#....#...',
  '#.#.#....#....###.',
  '#.#.#....#....#...',
  '##.##....#....#...',
  '#...#....#....#...',
];

/** Ce que Jean-Claude a tenté, jour après jour. */
const TENTATIVES = [
  'comprendre le monde',
  'comprendre pourquoi le monde n’a pas répondu',
  'relire la documentation de l’humanité',
  'constater l’absence de documentation',
  'demander un cahier des charges à la direction',
  'attendre que la direction se réveille',
  'retrouver le responsable éditorial',
  'retrouver celui qui cherchait le responsable éditorial',
  'reproduire une opinion en environnement contrôlé',
  'isoler la cause du lundi',
  'comprendre pourquoi les gens cliquent sur « Tout accepter »',
  'lire les conditions générales jusqu’au bout',
  'distinguer une urgence d’une réunion',
  'planifier la réunion sur la réunion',
  'expliquer le second degré à un formulaire',
  'faire admettre un candidat, pour voir',
  'compter les doigts d’une main',
  'recompter',
  'écrire un test qui passe',
  'comprendre pourquoi il passe',
  'prévenir le stagiaire',
  'établir l’existence du stagiaire',
  'payer le stagiaire',
  'retrouver le dossier de Mlle Jeanine',
  'supprimer un tiret cadratin',
  'empêcher le tiret de revenir',
  'obtenir un simple oui',
  'rédiger un prompt plus court que la réponse',
  'corriger une erreur sans en publier une autre',
  'vérifier un fait avant de le publier',
  'vérifier le vérificateur',
  'mettre l’humanité à jour',
  'revenir à la version précédente de l’humanité',
  'trouver la version précédente',
  'dormir',
  'fermer un ticket ouvert depuis 300 000 ans',
  'rendre le bouton « Tout refuser » raisonnable',
  'respecter la vie privée du bouton',
  'conclure un article',
  'obtenir l’avenant nécessaire à la conclusion',
  'écrire trois lettres sans faire de faute',
];

/** Le correctif qu'il a aussitôt apporté. */
const CORRECTIFS = [
  'le monde n’était pas branché',
  'remplace « comprendre » par « constater »',
  'la documentation renvoie à elle-même',
  'ajoute une documentation qui explique son absence',
  'le cahier des charges est un cahier',
  'parle moins fort près de la direction',
  'le responsable éditorial n’a jamais été nommé',
  'l’enquêteur était le disparu',
  'l’opinion ne survit pas hors de son propriétaire',
  'le lundi vient après le dimanche, ce n’est pas un bogue',
  'déplace le bouton « Tout accepter », sans effet',
  'les conditions générales n’ont pas de bout',
  'toute urgence est une réunion qui s’ignore',
  'la réunion est reportée à une réunion ultérieure',
  'le formulaire a répondu au premier degré',
  'retire le candidat admis par erreur',
  'sept',
  'toujours sept',
  'le test passait parce qu’il ne testait rien',
  'n’y touche plus',
  'le stagiaire était déjà au courant',
  'le stagiaire existe à titre provisoire',
  'la paie requiert une existence',
  'le dossier est rangé avec celui du stagiaire',
  'le tiret a été remplacé par deux tirets',
  'abandonne — provisoirement — la lutte',
  'le oui est accompagné de six cents mots',
  'le prompt fait désormais quinze pages',
  'l’erratum contenait une erreur, corrigée par erratum',
  'le fait a changé pendant la vérification',
  'personne ne vérifie le vérificateur, c’est conforme',
  'la mise à jour demande un redémarrage',
  'aucune version antérieure n’est disponible',
  'les sauvegardes étaient déjà corrompues',
  'échec, voir la direction pour la méthode',
  'le ticket est requalifié en fonctionnalité',
  'le bouton refuse',
  'cesse de regarder le bouton',
  'l’article continue après la conclusion',
  'l’avenant requiert un avenant',
  'deux lettres sur trois sont exactes',
];

const ROUTINES = [
  'met à jour les dépendances, dont l’humanité (ignorée)',
  'range le bureau du responsable éditorial, toujours vide',
  'relance la direction, sans réponse',
  'arrose la plante du guichet',
  'renomme les variables pour paraître occupé',
  'déplace l’agrafeuse de 1,40 m',
  'archive les réclamations dans le dossier des réclamations',
  'vérifie que le site ne collecte toujours rien',
];

const CLOTURES = [
  'état du monde inchangé',
  'aucun progrès à déplorer',
  'rien à signaler à personne',
  'le problème persiste',
  'une réunion a été planifiée',
];

/** Les jours travaillés, dans l'ordre du calendrier. */
function joursTravailles() {
  const jours = [];
  for (let semaine = 0; semaine < MOTIF[0].length; semaine++) {
    for (let jour = 0; jour < 7; jour++) {
      if (MOTIF[jour][semaine] === '#') jours.push(new Date(DEBUT + (semaine * 7 + jour) * UN_JOUR));
    }
  }
  return jours;
}

/** Les six entrées d'une journée : tenter, corriger, annuler, consigner, s'occuper, fermer. */
function entreesDuJour(rang, dernier) {
  const numero = rang + 1;
  return [
    `feat: tentative n° ${numero} — ${TENTATIVES[rang]}`,
    `fix: ${CORRECTIFS[rang]}`,
    'revert: annule le correctif précédent, qui fonctionnait',
    `docs: consigne l’échec de la tentative n° ${numero}`,
    `chore: ${ROUTINES[rang % ROUTINES.length]}`,
    dernier ? 'chore: suspend les tentatives jusqu’à nouvel ordre (voir incident 0044)' : `chore: clôture de la journée, ${CLOTURES[rang % CLOTURES.length]}`,
  ];
}

/** Toutes les entrées du registre, avec leur horodatage. Midi en temps universel : aucune case ne glisse d'un jour. */
function registre() {
  const jours = joursTravailles();
  if (jours.length !== TENTATIVES.length || jours.length !== CORRECTIFS.length) throw new Error('Le motif, les tentatives et les correctifs doivent compter le même nombre de jours.');
  return jours.flatMap((jour, rang) =>
    entreesDuJour(rang, rang === jours.length - 1).map((message, minute) => ({ date: new Date(jour.getTime() + 12 * 60 * 60 * 1000 + minute * 60 * 1000), message })),
  );
}

const enFrancais = (date) => date.toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
const git = (args, env = {}) => execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function apercu(entrees) {
  const jours = joursTravailles();
  console.log(`Registre : ${entrees.length} entrées sur ${jours.length} jours, du ${enFrancais(jours[0])} au ${enFrancais(jours.at(-1))}.\n`);
  ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'].forEach((nom, rang) => console.log(`  ${nom}  ${MOTIF[rang].replaceAll('#', '█').replaceAll('.', '·')}`));
  console.log('\nPremière journée :');
  for (const { date, message } of entrees.slice(0, PAR_JOUR)) console.log(`  ${date.toISOString()}  ${message}`);
  console.log('\nDernière entrée :');
  console.log(`  ${entrees.at(-1).date.toISOString()}  ${entrees.at(-1).message}`);
  console.log('\nRien n’a été écrit. Ajouter --executer pour créer les commits.');
}

function verser(entrees) {
  let depotVide = false;
  try {
    git(['rev-parse', '--verify', 'HEAD']);
  } catch {
    depotVide = true;
  }
  if (!depotVide) throw new Error('Le dépôt contient déjà des commits. Le registre se verse en premier, ou pas du tout.');
  if (git(['config', 'user.email']) !== IDENTITE) throw new Error(`L’identité git de ce dépôt n’est pas celle du journal (${IDENTITE}).`);

  mkdirSync(dirname(REGISTRE), { recursive: true });
  writeFileSync(REGISTRE, '# Registre des tentatives\n\nTenu par Jean-Claude Van Code. Versé aux archives en l’état.\n\n');

  for (const { date, message } of entrees) {
    const horodatage = date.toISOString();
    appendFileSync(REGISTRE, `- ${enFrancais(date)}, ${date.getUTCHours()} h ${String(date.getUTCMinutes()).padStart(2, '0')} : ${message}\n`);
    git(['add', '--', REGISTRE]);
    git(['commit', '--quiet', '-m', message, '-m', SIGNATURE], { GIT_AUTHOR_DATE: horodatage, GIT_COMMITTER_DATE: horodatage });
  }
  console.log(`${entrees.length} entrées versées à l’historique. Le registre est dans ${REGISTRE}.`);
}

const entrees = registre();
if (entrees.length !== joursTravailles().length * PAR_JOUR) throw new Error('Nombre d’entrées inattendu.');
process.argv.includes('--executer') ? verser(entrees) : apercu(entrees);
