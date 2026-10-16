import assert from 'node:assert/strict';
import { test } from 'node:test';
import donnees from '../src/data/test-appareils.json' with { type: 'json' };
import { type Points, attribuer, ordreDeDepartage } from '../src/lib/test-appareils.ts';

const { resultats } = donnees;
const questions = donnees.questions as unknown as { id: string; reponses: { points: Points }[] }[];
const ids = resultats.map((r) => r.id);
const ordre = ordreDeDepartage(resultats);

test('huit résultats, de huit à dix questions de quatre réponses', () => {
  assert.equal(resultats.length, 8);
  assert.equal(new Set(ids).size, 8);
  assert.ok(questions.length >= 8 && questions.length <= 10);
  for (const q of questions) assert.equal(q.reponses.length, 4, q.id);
});

test('le barème et les compatibilités ne citent que des appareils du test', () => {
  for (const q of questions) for (const r of q.reponses) for (const id of Object.keys(r.points)) assert.ok(ids.includes(id), `${q.id} : ${id}`);
  for (const r of resultats) {
    for (const { id } of [...r.compatibilites.avec, r.compatibilites.eviter]) {
      assert.ok(ids.includes(id), `${r.id} : ${id}`);
      assert.notEqual(id, r.id);
    }
  }
});

test('chaque appareil peut être obtenu', () => {
  for (const cible of ids) {
    // Pour chaque question, la réponse la plus favorable à l'appareil visé, puis la moins favorable aux autres.
    const choix: Points[] = questions.map((q) => {
      const note = (p: Points) => (p[cible] ?? 0) * 10 - Object.entries(p).reduce((s, [id, n]) => s + (id === cible ? 0 : n), 0);
      return [...q.reponses].sort((a, b) => note(b.points) - note(a.points))[0].points;
    });
    assert.equal(attribuer(choix, ordre), cible);
  }
});

test('à égalité, le plus ancien l’emporte, quel que soit l’ordre des réponses', () => {
  assert.equal(ordre[0], 'pompe-a-chaleur');
  assert.equal(attribuer([{ smartphone: 2 }, { 'voiture-electrique': 2 }], ordre), 'voiture-electrique');
  assert.equal(attribuer([{ 'voiture-electrique': 2 }, { smartphone: 2 }], ordre), 'voiture-electrique');
  assert.equal(attribuer([], ordre), 'pompe-a-chaleur');
});
