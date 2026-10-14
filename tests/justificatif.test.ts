import assert from 'node:assert/strict';
import { test } from 'node:test';
import { duree, verdict } from '../src/modules/justificatif/mesure.ts';

test('les durées se disent en toutes lettres, au singulier comme au pluriel', () => {
  assert.equal(duree(0), '1 seconde');
  assert.equal(duree(38_000), '38 secondes');
  assert.equal(duree(60_000), '1 minute');
  assert.equal(duree(252_000), '4 minutes 12 secondes');
  assert.equal(duree(3_780_000), '1 heure 3 minutes');
});

test('le verdict suit le rapport entre temps constaté et temps estimé', () => {
  assert.match(verdict(5_000, 4), /titre/);
  assert.match(verdict(60_000, 4), /diagonale/);
  assert.match(verdict(240_000, 4), /motivations/);
  assert.match(verdict(900_000, 4), /activité normale/);
});
