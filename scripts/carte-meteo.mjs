#!/usr/bin/env node
/**
 * Fabrique la carte de la météo : les treize régions de métropole, simplifiées comme sur un bulletin télévisé.
 *
 *   curl -sLO https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson
 *   node scripts/carte-meteo.mjs regions-version-simplifiee.geojson
 *
 * Contours : IGN et INSEE, Licence Ouverte, via gregoiredavid/france-geojson. Écrit `src/data/meteo-regions.json`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , source] = process.argv;
if (!source) throw new Error('Indiquer le fichier GeoJSON des régions.');

/** Code INSEE → code ISO 3166-2 (celui que Cloudflare rend), nom, et la façon de dire « sur » la région. */
const REGIONS = {
  11: { code: 'IDF', sur: 'sur l’Île-de-France' },
  24: { code: 'CVL', sur: 'sur le Centre-Val de Loire' },
  27: { code: 'BFC', sur: 'sur la Bourgogne-Franche-Comté' },
  28: { code: 'NOR', sur: 'sur la Normandie' },
  32: { code: 'HDF', sur: 'sur les Hauts-de-France' },
  44: { code: 'GES', sur: 'sur le Grand Est' },
  52: { code: 'PDL', sur: 'sur les Pays de la Loire' },
  53: { code: 'BRE', sur: 'sur la Bretagne' },
  75: { code: 'NAQ', sur: 'sur la Nouvelle-Aquitaine' },
  76: { code: 'OCC', sur: 'sur l’Occitanie' },
  84: { code: 'ARA', sur: 'sur l’Auvergne-Rhône-Alpes' },
  93: { code: 'PAC', sur: 'sur la Provence-Alpes-Côte d’Azur' },
  94: { code: 'COR', sur: 'sur la Corse' },
};

const LARGEUR = 1000;
const LAT0 = 46.5;
const projeter = ([lon, lat]) => [lon * Math.cos((LAT0 * Math.PI) / 180), -lat];

/** Douglas-Peucker : garde la silhouette, perd les détails de côte. */
const simplifier = (points, tolerance) => {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points.at(-1)];
  let pire = 0;
  let indice = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
    if (d > pire) [pire, indice] = [d, i];
  }
  if (pire <= tolerance) return [a, b];
  return [...simplifier(points.slice(0, indice + 1), tolerance).slice(0, -1), ...simplifier(points.slice(indice), tolerance)];
};

/** Un anneau fermé se simplifie en deux moitiés, coupées au point le plus éloigné du départ. */
const simplifierAnneau = (anneau, tolerance) => {
  const ouvert = anneau.slice(0, -1);
  let loin = 0;
  ouvert.forEach(([x, y], i) => {
    if (Math.hypot(x - ouvert[0][0], y - ouvert[0][1]) > Math.hypot(ouvert[loin][0] - ouvert[0][0], ouvert[loin][1] - ouvert[0][1])) loin = i;
  });
  return [...simplifier(ouvert.slice(0, loin + 1), tolerance).slice(0, -1), ...simplifier([...ouvert.slice(loin), ouvert[0]], tolerance).slice(0, -1)];
};

const aire = (anneau) => Math.abs(anneau.reduce((s, [x, y], i) => s + x * anneau[(i + 1) % anneau.length][1] - anneau[(i + 1) % anneau.length][0] * y, 0) / 2);
const centroide = (anneau) => {
  let [cx, cy, a] = [0, 0, 0];
  anneau.forEach(([x, y], i) => {
    const [x2, y2] = anneau[(i + 1) % anneau.length];
    const f = x * y2 - x2 * y;
    [cx, cy, a] = [cx + (x + x2) * f, cy + (y + y2) * f, a + f];
  });
  return [cx / (3 * a), cy / (3 * a)];
};

const geo = JSON.parse(readFileSync(source, 'utf8'));
const polygones = geo.features.map((f) => ({
  insee: f.properties.code,
  nom: f.properties.nom,
  anneaux: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((p) => p[0].map(projeter)),
}));

// Cadrage : la métropole entière dans LARGEUR, marges comprises.
const tous = polygones.flatMap((p) => p.anneaux.flat());
const [minX, maxX] = [Math.min(...tous.map((p) => p[0])), Math.max(...tous.map((p) => p[0]))];
const [minY, maxY] = [Math.min(...tous.map((p) => p[1])), Math.max(...tous.map((p) => p[1]))];
const MARGE = 20;
const echelle = (LARGEUR - MARGE * 2) / (maxX - minX);
const HAUTEUR = Math.round((maxY - minY) * echelle + MARGE * 2);
const ecran = ([x, y]) => [(x - minX) * echelle + MARGE, (y - minY) * echelle + MARGE];

const regions = polygones.map(({ insee, nom, anneaux }) => {
  const plan = anneaux
    .map((a) => simplifierAnneau(a.map(ecran), 2.2))
    // Les îlots trop petits pour un bulletin télévisé disparaissent.
    .filter((a) => a.length > 3 && aire(a) > 60);
  const principal = plan.reduce((g, a) => (aire(a) > aire(g) ? a : g));
  const d = plan.map((a) => `M${a.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`).join('');
  const [cx, cy] = centroide(principal);
  return { insee, nom, ...REGIONS[insee], d, centre: [Math.round(cx), Math.round(cy)] };
});

writeFileSync(
  'src/data/meteo-regions.json',
  JSON.stringify(
    {
      largeur: LARGEUR,
      hauteur: HAUTEUR,
      // Pour placer un point (longitude, latitude) sur la carte : x = (lon × cos − minX) × échelle + marge, y = (−lat − minY) × échelle + marge.
      projection: { cos: Math.cos((LAT0 * Math.PI) / 180), minX, minY, echelle, marge: MARGE },
      regions,
    },
    null,
    1,
  ) + '\n',
);
console.log(`${regions.length} régions, ${LARGEUR} × ${HAUTEUR}, ${JSON.stringify(regions).length} octets`);
