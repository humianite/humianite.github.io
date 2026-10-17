import assert from 'node:assert/strict';
import { test } from 'node:test';
import donnees from '../src/data/test-appareils.json' with { type: 'json' };
import { type Points, attribuer, ordreDeDepartage } from '../src/lib/test-appareils.ts';

const { resultats, coefficients } = donnees;
const questions = donnees.questions as unknown as { id: string; reponses: { points: Points }[] }[];
const ids = resultats.map((r) => r.id);
const ordre = ordreDeDepartage(resultats);

test('seize résultats, douze questions de quatre réponses, un coefficient par appareil', () => {
  assert.equal(resultats.length, 16);
  assert.equal(new Set(ids).size, 16);
  assert.equal(questions.length, 12);
  assert.deepEqual(Object.keys(coefficients).sort(), [...ids].sort());
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
    assert.equal(attribuer(choix, ordre, coefficients), cible);
  }
});

test('à égalité, le plus ancien l’emporte, quel que soit l’ordre des réponses', () => {
  assert.equal(ordre[0], 'pompe-a-chaleur');
  assert.equal(attribuer([{ smartphone: 2 }, { 'voiture-electrique': 2 }], ordre), 'voiture-electrique');
  assert.equal(attribuer([{ 'voiture-electrique': 2 }, { smartphone: 2 }], ordre), 'voiture-electrique');
  assert.equal(attribuer([], ordre), 'pompe-a-chaleur');
});

test('le barème laisse sa chance à chaque appareil', () => {
  // Réponses tirées au hasard, avec une graine fixe : chaque appareil sort entre 3 et 10 % du temps.
  let graine = 42;
  const hasard = () => ((graine = (graine * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const tirages = 20000;
  const compte: Record<string, number> = {};
  for (let i = 0; i < tirages; i++) {
    const id = attribuer(questions.map((q) => q.reponses[Math.floor(hasard() * 4)].points), ordre, coefficients);
    compte[id] = (compte[id] ?? 0) + 1;
  }
  for (const id of ids) {
    const part = (compte[id] ?? 0) / tirages;
    assert.ok(part > 0.03 && part < 0.1, `${id} : ${(part * 100).toFixed(1)} %`);
  }
});
