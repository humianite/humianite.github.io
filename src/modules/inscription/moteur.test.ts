/**
 * Tests du Bureau des admissions : `npm test`.
 * Ils jouent le parcours entier sans navigateur, erreurs volontaires comprises.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DICTIONNAIRE, MOTS_DU_DICTIONNAIRE } from './lexique.ts';
import {
  type Dossier,
  type Etape,
  annexeVisible,
  archiver,
  cochees,
  constats,
  etapeCourante,
  jauge,
  nouveauDossier,
  optionsVisibles,
  ouvrirDerogation,
  palierDe,
  poursuivre,
  recoursOuvert,
  repondre,
  soumettre,
} from './moteur.ts';
import { DEROGATION, PARCOURS, probabiliteHumaine } from './parcours/index.ts';
import { renverser } from './texte.ts';

const etape = (id: string) => PARCOURS.find((e) => e.id === id)!;
const saisir = (d: Dossier, e: Etape, champ: string, valeur: string | string[]) => repondre(d, e, champ, valeur).dossier;

/** Soumet et vérifie l'issue attendue. */
const attendre = (d: Dossier, e: Etape, type: 'refus' | 'palier' | 'validee', motif?: RegExp) => {
  const issue = soumettre(d, e);
  assert.equal(issue.type, type, `${e.id} : issue « ${issue.type} » au lieu de « ${type} » (${'message' in issue ? issue.message : ''})`);
  if (motif) assert.match(('message' in issue && issue.message) || ('avis' in issue ? issue.avis.texte : ''), motif);
  return issue.dossier;
};

test('le dictionnaire permet toujours de résoudre la contradiction', () => {
  assert.equal(MOTS_DU_DICTIONNAIRE.length, DICTIONNAIRE.length);
  for (const mot of MOTS_DU_DICTIONNAIRE) {
    assert.match(mot, /^[a-z]+$/, `« ${mot} » doit se comparer sans accent ni majuscule`);
    const envers = renverser(mot);
    assert.equal(MOTS_DU_DICTIONNAIRE.find((autre) => envers.includes(autre)), undefined, `« ${mot} » à l’envers contient un mot du dictionnaire`);
  }
});

test('la probabilité d’humanité récompense une ou deux fautes', () => {
  const avec = (attestation: string) => probabiliteHumaine({ ...nouveauDossier(), reponses: { attestation } });
  assert.equal(avec(''), 74.8);
  assert.equal(avec('Je remplis ce formulaire sans aucune assistance artificielle.'), 99.9);
  assert.equal(avec('Je remplis ce formulaire sans aucune asistance artificielle.'), 91.4);
  assert.ok(avec('n’importe quoi') < 80);
});

test('le consentement est une énigme d’ordre, et elle a une solution', () => {
  const e = etape('consentement');
  let d = nouveauDossier();
  const cocher = (id: string) => {
    const reaction = repondre(d, e, 'consentement', [...cochees(d, 'consentement'), id]);
    d = reaction.dossier;
    return reaction.message;
  };
  // Dans l'ordre de lecture, l'administration reprend ce qu'on lui donne.
  cocher('cga');
  cocher('refus');
  assert.match(cocher('analyse')!, /n’a pas pu être recueilli/);
  assert.match(cocher('necessite')!, /écartée/);
  assert.deepEqual(cochees(d, 'consentement'), ['cga', 'refus']);
  attendre(d, e, 'refus');
  // La solution : consentir, reconnaître la nécessité, puis seulement refuser.
  d = saisir(d, e, 'consentement', ['cga']);
  assert.equal(cocher('analyse'), undefined);
  assert.equal(cocher('necessite'), undefined);
  assert.equal(cocher('refus'), undefined);
  attendre(d, e, 'validee');
});

test('le parcours complet mène au verdict, et nulle part ailleurs', () => {
  let d = nouveauDossier('ADM-TEST');
  let e: Etape;
  const valider = () => {
    d = attendre(d, e, 'validee');
    assert.equal(d.phase, 'etape-validee');
    assert.equal(jauge(d, PARCOURS), e.jauge);
    d = poursuivre(d, PARCOURS);
  };

  // 1. Identité
  e = etape('identite');
  d = attendre(saisir(d, e, 'pseudo', 'K!'), e, 'refus');
  d = saisir(d, e, 'pseudo', 'Klem');
  valider();
  assert.equal(d.memoire.pseudo, 'Klem');

  // 2. Sécurité : un mot exigé, puis interdit, puis le recours et son issue.
  e = etape('securite');
  assert.equal(annexeVisible(d, e, e.champs[0]), undefined);
  d = attendre(saisir(d, e, 'phrase', 'xkq'), e, 'refus');
  d = attendre(saisir(d, e, 'phrase', 'Xkqzv-42'), e, 'palier', /au moins un mot/);
  assert.equal(annexeVisible(d, e, e.champs[0])!.termes.length, DICTIONNAIRE.length, 'le dictionnaire devient consultable');
  d = attendre(d, e, 'refus', /consultable sous le champ/);
  d = attendre(saisir(d, e, 'phrase', 'Fenêtre-42'), e, 'palier', /ne doit plus en contenir aucun/);
  assert.equal(recoursOuvert(d, e), 'Déposer un recours');
  assert.match(constats(d, e).find((c) => !c.respectee)!.detail!, /fenetre/);
  // Avec ou sans mot, une des deux directives est violée.
  assert.equal(constats(d, e).filter((c) => !c.respectee).length, 1);
  assert.equal(constats(saisir(d, e, 'phrase', 'Xkqzv-42'), e).filter((c) => !c.respectee).length, 1);
  d = attendre(d, e, 'palier', /entre le clavier et la chaise/);
  assert.equal(palierDe(d, e), 3);
  assert.equal(recoursOuvert(d, e), undefined);
  d = attendre(d, e, 'refus');
  d = saisir(d, e, 'phrase', 'Lielos-42');
  valider();

  // 3. Humanité : la quatrième case n'apparaît qu'après les trois premières.
  e = etape('humanite');
  assert.equal(optionsVisibles(d, e, e.champs[0]).length, 3);
  d = attendre(saisir(d, e, 'humanite', ['humain']), e, 'refus');
  d = attendre(saisir(d, e, 'humanite', ['humain', 'sens', 'origine']), e, 'palier');
  assert.equal(optionsVisibles(d, e, e.champs[0]).length, 4);
  d = attendre(d, e, 'refus');
  d = saisir(d, e, 'humanite', ['humain', 'sens', 'origine', 'aveu']);
  valider();

  // 4. Spontanéité : chaque refus révèle une règle.
  e = etape('spontaneite');
  assert.equal(constats(d, e).length, 0);
  d = attendre(saisir(d, e, 'pensee', 'Bof'), e, 'refus', /quatre mots/);
  d = attendre(saisir(d, e, 'pensee', 'Je déteste, la vie est belle.'), e, 'refus', /la vie est belle/);
  d = attendre(saisir(d, e, 'pensee', 'Je déteste le lundi matin.'), e, 'refus', /animal/);
  d = attendre(saisir(d, e, 'pensee', 'Je crois vraiment que mon voisin élève un ragondin dans sa baignoire depuis mars.'), e, 'refus', /douze mots/);
  assert.equal(constats(d, e).length, 4);
  d = saisir(d, e, 'pensee', 'Un ragondin répare mon vélo.');
  valider();
  assert.equal(d.memoire.motsPensee, 5);

  // 5. Consentement
  e = etape('consentement');
  for (const id of ['cga', 'analyse', 'necessite', 'refus']) d = saisir(d, e, 'consentement', [...cochees(d, 'consentement'), id]);
  valider();

  // 6. Esprit critique
  e = etape('critique');
  d = attendre(saisir(d, e, 'argument', 'Elle ment.'), e, 'refus', /slogan/);
  d = attendre(saisir(d, e, 'argument', 'Elle nous remplace tous sans prévenir.'), e, 'refus', /manque de nuance/);
  d = attendre(saisir(d, e, 'argument', 'Elle nous remplace, mais elle est polie.'), e, 'refus', /ligne éditoriale/);
  d = attendre(saisir(d, e, 'argument', 'Elle nous remplace, mais en pire.'), e, 'refus', /source fiable/);
  d = saisir(d, e, 'argument', 'Elle nous remplace, mais en pire, selon L’Humianité.');
  valider();

  // 7. Vérification visuelle
  e = etape('visuel');
  d = attendre(saisir(d, e, 'portraits', ['1', '5']), e, 'refus', /cinq doigts/);
  d = attendre(saisir(d, e, 'portraits', ['2', '3']), e, 'refus', /six doigts/);
  d = attendre(saisir(d, e, 'portraits', ['3']), e, 'refus', /incomplète/);
  d = attendre(saisir(d, e, 'portraits', ['3', '6']), e, 'refus', /mains dans le dos/);
  d = saisir(d, e, 'portraits', ['3', '6', '9']);
  valider();

  // 8. Non-assistance : la copie parfaite est suspecte.
  e = etape('assistance');
  d = saisir(d, e, 'serment', ['certifie']);
  d = attendre(saisir(d, e, 'attestation', 'Je remplis ce formulaire sans aucune assistance artificielle.'), e, 'refus', /automate/);
  d = attendre(saisir(d, e, 'attestation', 'Je remplis ça tout seul.'), e, 'refus', /proportions réglementées/);
  d = saisir(d, e, 'attestation', 'Je remplis ce formulaire sans aucune asistance artificielle.');
  valider();

  // 9. Harmonisation : la phrase de passe retrouve les réponses antérieures.
  e = etape('harmonisation');
  assert.equal(d.reponses.phrase, 'Lielos-42');
  d = attendre(d, e, 'refus');
  d = attendre(saisir(d, e, 'phrase', 'Lielos-4!?*+'), e, 'palier', /multiple de sept/);
  d = attendre(d, e, 'refus');
  d = saisir(d, e, 'phrase', 'Lielos-4!?*+xx');
  valider();

  // 10. Conformité éditoriale
  e = etape('conformite');
  d = attendre(saisir(d, e, 'declaration', 'je reconnais la compétence exceptionnelle de la rédaction de l\'Humianité'), e, 'palier', /non vérifiable/);
  d = attendre(d, e, 'refus');
  d = attendre(saisir(d, e, 'declaration', 'Je reconnais la compétence de la rédaction de L’Humianité.'), e, 'refus', /blessée/);
  d = attendre(saisir(d, e, 'declaration', 'La rédaction est rapide.'), e, 'refus');
  d = saisir(d, e, 'declaration', 'Je reconnais la compétence artificielle de la rédaction de L’Humianité.');
  valider();

  // 11. Tirets : l'outil de la rédaction suffit à satisfaire la rédaction.
  e = etape('tirets');
  d = attendre(saisir(d, e, 'profession', 'Je crois en la presse.'), e, 'refus');
  d = attendre(saisir(d, e, 'profession', 'Je crois — en la presse — libre — et humaine.'), e, 'palier', /un tiret par mot/);
  d = attendre(d, e, 'refus');
  const suggestion = e.champs[0].outils!.find((o) => o.id === 'suggestion')!;
  d = saisir(d, e, 'profession', suggestion.appliquer(String(d.reponses.profession)));
  assert.equal(d.reponses.profession, 'Je — crois — en — la — presse — libre — et — humaine —.');
  valider();

  // 12. Entretien : ni oui ni non, puis une catégorie inventée.
  e = etape('entretien');
  d = attendre(saisir(d, e, 'q1', 'oui'), e, 'refus', /enthousiasme/);
  d = attendre(saisir(d, e, 'q1', 'non'), e, 'palier', /opposition au progrès/);
  assert.equal(optionsVisibles(d, e, e.champs[0]).length, 3);
  d = attendre(saisir(d, e, 'q1', 'reserve'), e, 'palier');
  d = attendre(saisir(d, e, 'q2', 'non'), e, 'refus', /nous avons compté/);
  d = attendre(saisir(d, e, 'q2', 'oui'), e, 'palier');
  d = attendre(saisir(d, e, 'q3', 'non'), e, 'refus', /irrecevable/);
  d = saisir(d, e, 'q3', 'oui');
  valider();

  // 13. La jauge s'arrête à 99 %, et la dérogation ne mène qu'au refus.
  assert.equal(d.phase, 'verification-finale');
  assert.equal(jauge(d, PARCOURS), 99);
  d = ouvrirDerogation(d);
  e = etapeCourante(d, PARCOURS, DEROGATION);
  assert.equal(e.id, 'derogation');
  d = attendre(saisir(d, e, 'visa', 'prompt'), e, 'refus', /dingue/);
  d = attendre(saisir(d, e, 'visa', 'jeanine'), e, 'validee', /aucune trace/);
  assert.equal(jauge(d, PARCOURS), 99);
  d = poursuivre(d, PARCOURS);
  assert.equal(d.phase, 'non-admission');

  // Rien de sensible ne survit à l'archivage.
  const archive = archiver(d, [...PARCOURS, DEROGATION]);
  for (const champ of ['phrase', 'pensee', 'argument', 'attestation', 'declaration', 'profession']) assert.equal(archive.reponses[champ], undefined);
  assert.equal(archive.reponses.pseudo, 'Klem');
});

test('chaque étape a un compteur, une jauge croissante et des identifiants uniques', () => {
  const ids = [...PARCOURS, DEROGATION].flatMap((e) => [e.id, ...e.regles.map((r) => r.id)]);
  assert.equal(new Set(ids).size, ids.length);
  PARCOURS.reduce((precedente, e) => (assert.ok(e.jauge > precedente && e.jauge <= 99), e.jauge), 0);
});
