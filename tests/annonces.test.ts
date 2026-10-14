import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, COUPON, lignes } from '../src/lib/annonces.ts';
import { CATEGORIES as CATEGORIES_GUICHET, LIMITES, examiner, idDuNumero, nettoyer, numeroDeDossier } from '../guichet/src/regles.ts';

test('le site et le guichet tiennent les mêmes rubriques et les mêmes limites', () => {
  assert.deepEqual(Object.keys(CATEGORIES), [...CATEGORIES_GUICHET]);
  assert.equal(COUPON.min, LIMITES.texte.min);
  assert.equal(COUPON.max, LIMITES.texte.max);
  assert.equal(COUPON.signature, LIMITES.signature);
});

test('un coupon en règle est reçu, nettoyé', () => {
  const verdict = examiner({ categorie: 'ventes', texte: '  Vends   lunettes​ connectées.\n\n\n\nPortées une fois. ', signature: '' });
  assert.ok(verdict.recevable);
  assert.deepEqual(verdict.depot, { categorie: 'ventes', texte: 'Vends lunettes connectées.\n\nPortées une fois.', signature: null });
  assert.equal(verdict.piege, false);
});

test('les coupons irrecevables sont refusés avec un motif', () => {
  assert.equal(examiner(null).recevable, false);
  assert.equal(examiner({ categorie: 'zoo', texte: 'Un texte assez long.' }).recevable, false);
  assert.equal(examiner({ categorie: 'ventes', texte: 'court' }).recevable, false);
  assert.equal(examiner({ categorie: 'ventes', texte: 'x'.repeat(LIMITES.texte.max + 1) }).recevable, false);
  assert.equal(examiner({ categorie: 'ventes', texte: 'Un texte assez long.', signature: 42 }).recevable, false);
});

test('le champ invisible rempli signale un automate', () => {
  const verdict = examiner({ categorie: 'ventes', texte: 'Vends montres de luxe.', site: 'http://exemple.test' });
  assert.ok(verdict.recevable && verdict.piege);
});

test('les numéros de dossier font l’aller-retour', () => {
  assert.equal(numeroDeDossier(1), 'PA-4471');
  assert.equal(idDuNumero('PA-4471'), 1);
  assert.equal(idDuNumero('4471'), null);
});

test('les caractères invisibles et de direction disparaissent', () => {
  assert.equal(nettoyer('a‮b\u0007c﻿'), 'abc');
});

test('le tarif compte au moins une ligne', () => {
  assert.equal(lignes(''), 1);
  assert.equal(lignes('x'.repeat(COUPON.parLigne + 1)), 2);
});
