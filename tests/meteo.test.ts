import assert from 'node:assert/strict';
import { test } from 'node:test';
import carte from '../src/data/meteo-regions.json' with { type: 'json' };
import { CODES, projeter, regionDuPoint, situer, temperature } from '../src/lib/meteo.ts';

test('la carte a ses treize régions, chacune avec un code connu', () => {
  assert.deepEqual(carte.regions.map((r) => r.code).sort(), [...CODES].sort());
});

test('une connexion française tombe dans sa région, par le code ou par le nom', () => {
  assert.deepEqual(situer({ pays: 'FR', codeRegion: 'BRE', region: 'Brittany' }), { type: 'region', code: 'BRE' });
  assert.deepEqual(situer({ pays: 'FR', codeRegion: 'FR-IDF' }), { type: 'region', code: 'IDF' });
  assert.deepEqual(situer({ pays: 'FR', codeRegion: '75', region: 'Provence-Alpes-Côte d’Azur' }), { type: 'region', code: 'PAC' });
  assert.deepEqual(situer({ pays: 'FR', region: 'Normandy' }), { type: 'region', code: 'NOR' });
});

test('à l’étranger, outre-mer compris, le médaillon ; sinon, il fait mauvais partout', () => {
  assert.deepEqual(situer({ pays: 'BE', region: 'Brussels' }), { type: 'etranger', pays: 'BE' });
  assert.deepEqual(situer({ pays: 'RE' }), { type: 'etranger', pays: 'RE' });
  assert.deepEqual(situer({ pays: 'FR', region: 'Atlantide' }), { type: 'inconnu' });
  assert.deepEqual(situer({ pays: 'T1' }), { type: 'inconnu' });
  assert.deepEqual(situer({}), { type: 'inconnu' });
});

test('les températures sont stables dans la journée et plausibles', () => {
  assert.equal(temperature('BRE', '2026-10-14', 'soleil'), temperature('BRE', '2026-10-14', 'soleil'));
  for (const code of CODES) {
    const t = temperature(code, '2026-10-14', 'soleil');
    assert.ok(t >= 21 && t <= 27);
    assert.ok(temperature(code, '2026-10-14', 'pluie') <= 12);
  }
  assert.equal(temperature('BRE', '2026-10-14', 'orage'), 9);
});

test('une position GPS tombe dans la bonne région, y compris sur la côte', () => {
  const ou = (lon: number, lat: number) => regionDuPoint(carte.regions, projeter(lon, lat, carte.projection));
  assert.equal(ou(-1.5536, 47.2184), 'PDL', 'Nantes');
  assert.equal(ou(-2.2136, 47.2735), 'PDL', 'Saint-Nazaire');
  assert.equal(ou(2.3522, 48.8566), 'IDF', 'Paris');
  assert.equal(ou(-4.4861, 48.3904), 'BRE', 'Brest');
  assert.equal(ou(5.3698, 43.2965), 'PAC', 'Marseille');
  assert.equal(ou(8.7369, 41.9192), 'COR', 'Ajaccio');
  assert.equal(ou(7.7521, 48.5734), 'GES', 'Strasbourg');
  assert.equal(ou(4.3517, 50.8503), null, 'Bruxelles');
  assert.equal(ou(-0.1276, 51.5072), null, 'Londres');
});
