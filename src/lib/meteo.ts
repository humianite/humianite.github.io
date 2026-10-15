/**
 * La météo : où il fait mauvais. Sans dépendance au navigateur, pour les tests.
 * Le guichet rend ce que Cloudflare sait de la connexion (pays, région) ; on en déduit la situation.
 */

export type Situation = { type: 'region'; code: string } | { type: 'etranger'; pays: string } | { type: 'inconnu' };

export type Localisation = { pays?: string | null; codeRegion?: string | null; region?: string | null };

export const CODES = ['IDF', 'CVL', 'BFC', 'NOR', 'HDF', 'GES', 'PDL', 'BRE', 'NAQ', 'OCC', 'ARA', 'PAC', 'COR'] as const;

/** Code INSEE d'une région de métropole → son code ISO, celui de la carte. Les régions d'outre-mer n'y figurent pas. */
export const REGIONS_INSEE: Record<string, (typeof CODES)[number]> = {
  '11': 'IDF',
  '24': 'CVL',
  '27': 'BFC',
  '28': 'NOR',
  '32': 'HDF',
  '44': 'GES',
  '52': 'PDL',
  '53': 'BRE',
  '75': 'NAQ',
  '76': 'OCC',
  '84': 'ARA',
  '93': 'PAC',
  '94': 'COR',
};

/** Les noms que les bases de géolocalisation emploient, en français comme en anglais. */
const NOMS: Record<string, (typeof CODES)[number]> = {
  'ile-de-france': 'IDF',
  'centre-val de loire': 'CVL',
  centre: 'CVL',
  'bourgogne-franche-comte': 'BFC',
  'burgundy-franche-comte': 'BFC',
  normandie: 'NOR',
  normandy: 'NOR',
  'hauts-de-france': 'HDF',
  'grand est': 'GES',
  'pays de la loire': 'PDL',
  bretagne: 'BRE',
  brittany: 'BRE',
  'nouvelle-aquitaine': 'NAQ',
  occitanie: 'OCC',
  occitania: 'OCC',
  'auvergne-rhone-alpes': 'ARA',
  "provence-alpes-cote d'azur": 'PAC',
  'provence-alpes-cote d’azur': 'PAC',
  corse: 'COR',
  corsica: 'COR',
};

const normaliser = (nom: string) =>
  nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Pays inconnus, anonymiseurs, blocs continentaux : on ne sait pas où est le lecteur. */
const INDETERMINES = new Set(['XX', 'T1', 'EU', 'AP']);

export const situer = ({ pays, codeRegion, region }: Localisation): Situation => {
  if (!pays || !/^[A-Z]{2}$/.test(pays) || INDETERMINES.has(pays)) return { type: 'inconnu' };
  if (pays !== 'FR') return { type: 'etranger', pays };
  const code = codeRegion?.toUpperCase().replace(/^FR-/, '');
  if (code && (CODES as readonly string[]).includes(code)) return { type: 'region', code };
  const parNom = region ? NOMS[normaliser(region)] : undefined;
  return parNom ? { type: 'region', code: parNom } : { type: 'inconnu' };
};

/** Températures du jour : stables dans la journée, différentes d'une région à l'autre. */
export const temperature = (code: string, jour: string, temps: 'soleil' | 'orage' | 'pluie') => {
  if (temps === 'orage') return 9;
  let graine = [...`${code}${jour}`].reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 9973, 7);
  graine = (graine * 1103) % 9973;
  return temps === 'soleil' ? 21 + (graine % 7) : 8 + (graine % 5);
};

export type Projection = { cos: number; minX: number; minY: number; echelle: number; marge: number };
export type Point = [number, number];
type RegionCarte = { code: string; d: string; centre: number[] };

/** Une position (longitude, latitude) sur la carte, avec la projection qui a servi à la dessiner. */
export const projeter = (longitude: number, latitude: number, p: Projection): Point => [
  (longitude * p.cos - p.minX) * p.echelle + p.marge,
  (-latitude - p.minY) * p.echelle + p.marge,
];

/** Les anneaux d'un tracé « M x y L x y … Z », tels que les écrit `scripts/carte-meteo.mjs`. */
const anneaux = (d: string): Point[][] =>
  d
    .split('M')
    .filter(Boolean)
    .map((anneau) =>
      anneau
        .replace('Z', '')
        .split('L')
        .map((couple) => couple.trim().split(/\s+/).map(Number) as Point),
    );

const dedans = ([x, y]: Point, anneau: Point[]) => {
  let interieur = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) interieur = !interieur;
  }
  return interieur;
};

/** Distance d'un point au segment [a, b]. */
const auSegment = ([x, y]: Point, [ax, ay]: Point, [bx, by]: Point) => {
  const [dx, dy] = [bx - ax, by - ay];
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
};

/**
 * La région sous un point. Un point tombé juste au-delà d'une côte simplifiée (un port, une île)
 * revient à la région dont le contour est le plus proche, à moins de `tolerance` (une douzaine d'unités, une dizaine de kilomètres).
 */
export const regionDuPoint = (regions: RegionCarte[], point: Point, tolerance = 12) => {
  const trouvee = regions.find((r) => anneaux(r.d).some((a) => dedans(point, a)));
  if (trouvee) return trouvee.code;
  let meilleure: { code: string; distance: number } | null = null;
  for (const r of regions) {
    for (const a of anneaux(r.d)) {
      for (let i = 0; i < a.length; i++) {
        const distance = auSegment(point, a[i], a[(i + 1) % a.length]);
        if (distance < tolerance && (!meilleure || distance < meilleure.distance)) meilleure = { code: r.code, distance };
      }
    }
  }
  return meilleure?.code ?? null;
};
