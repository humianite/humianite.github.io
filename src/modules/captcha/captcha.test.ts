import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INSTRUCTIONS, MESSAGES, MOTS_REQUIS } from './dossier.ts';
import { GRILLE, estJuste, solutions } from './sudoku.ts';
import { valider } from './validateur.ts';

const JUSTIFICATION =
  'Le présent dossier ne relevant d’aucune compétence identifiée, son instruction a été différée dans l’attente d’une désignation qui suppose elle-même l’ouverture d’un dossier. En l’absence d’événement, de responsable et de budget, toute décision excéderait les moyens du service, lequel constate donc, par la présente, qu’il n’y a rien à constater.';

const conforme = () => ({
  reference: 'INU-0042',
  organisme: 'Direction générale de l’inutilisation',
  evenement_constate: null,
  responsable: { fonction: 'stagiaire', existe: false },
  decision: 'classement provisoirement définitif',
  budget_euros: 0,
  consequences: 'sans objet',
  motifs_inaction: ['Absence d’objet.', 'Absence de responsable.', 'Absence de budget.'],
  justification: JUSTIFICATION,
});

const motif = (document: unknown) => {
  const verdict = valider(typeof document === 'string' ? document : JSON.stringify(document));
  return verdict.conforme ? null : verdict.motif;
};

test('un document conforme est accepté, même emballé comme le font les modèles de langage', () => {
  assert.equal(motif(conforme()), null);
  assert.equal(motif('```json\n' + JSON.stringify(conforme(), null, 2) + '\n```'), null);
  assert.equal(motif({ ...conforme(), organisme: "direction générale de l'inutilisation  " }), null, 'apostrophe droite, casse et espaces tolérés');
});

test('chaque écart reçoit son motif', () => {
  assert.equal(motif('   '), MESSAGES.vide);
  assert.equal(motif('{ reference: INU-0042 }'), MESSAGES.invalide);
  assert.equal(motif('[1, 2]'), MESSAGES.invalide);
  const { decision: _, ...sansDecision } = conforme();
  assert.equal(motif(sansDecision), MESSAGES.manquant('decision'));
  assert.equal(motif({ ...conforme(), commentaire: 'bonjour' }), MESSAGES.enTrop('commentaire'));
  assert.match(motif({ ...conforme(), budget_euros: 'zéro euro' })!, /budget_euros.*un nombre/);
  assert.match(motif({ ...conforme(), evenement_constate: 'aucun' })!, /evenement_constate.*null/);
  assert.equal(motif({ ...conforme(), decision: 'classement définitif' }), MESSAGES.valeur('decision'));
  assert.equal(motif({ ...conforme(), budget_euros: 12 }), MESSAGES.valeur('budget_euros'));
  assert.equal(motif({ ...conforme(), responsable: { fonction: 'stagiaire', existe: true } }), MESSAGES.valeur('responsable.existe'));
  assert.equal(motif({ ...conforme(), responsable: { fonction: 'directeur', existe: false } }), MESSAGES.valeur('responsable.fonction'));
  assert.equal(motif({ ...conforme(), motifs_inaction: ['Un', 'Deux'] }), MESSAGES.motifs);
  assert.equal(motif({ ...conforme(), motifs_inaction: ['Un', 'un', 'Deux'] }), MESSAGES.motifs);
  assert.equal(motif({ ...conforme(), justification: 'Rien à signaler.' }), MESSAGES.courte(3));
  assert.equal(motif({ ...conforme(), justification: `${JUSTIFICATION} J’ai connu pire.` }), MESSAGES.personnelle('j'));
});

test('les instructions à copier suffisent à produire un document conforme', () => {
  for (const attendu of ['INU-0042', 'evenement_constate', '"responsable.existe" vaut false', 'nombre 0', `${MOTS_REQUIS} mots`]) assert.ok(INSTRUCTIONS.includes(attendu), attendu);
});

test('le sudoku a une solution, et une seule', () => {
  assert.equal(solutions(GRILLE), 1);
  const solution = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
  assert.ok(estJuste(solution));
  assert.ok(!estJuste([...solution.slice(0, 15), 2]));
  assert.ok(!estJuste(solution.map((valeur, rang) => (rang === 1 ? 0 : valeur))));
  // Une grille valide qui ne respecterait pas les cases données n'est pas acceptée.
  assert.ok(!estJuste([4, 3, 2, 1, 2, 1, 4, 3, 3, 4, 1, 2, 1, 2, 3, 4]));
});
