/** Outils d'analyse de texte utilisés par les règles du Bureau des admissions. */

/** Minuscules, sans accents, apostrophes et espaces unifiés. */
export const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Les mots d'un texte : suites de lettres ou de chiffres, traits d'union et apostrophes internes compris. */
export const mots = (texte: string) => texte.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) ?? [];

/** Les phrases d'un texte, séparées par la ponctuation forte. */
export const phrases = (texte: string) =>
  texte
    .split(/[.!?…]+/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => mots(phrase).length > 0);

export const compter = (texte: string, motif: RegExp) => (texte.match(motif) ?? []).length;

export const lettres = (texte: string) => compter(texte, /\p{L}/gu);
export const tirets = (texte: string) => compter(texte, /—/g);
/** Est spécial tout ce qui n'est ni lettre, ni chiffre, ni espace. */
export const speciaux = (texte: string) => compter(texte, /[^\p{L}\p{N}\s]/gu);

export const renverser = (texte: string) => [...texte].reverse().join('');

/** Premier terme de la liste présent dans le texte (comparaison normalisée). */
export const contient = (texte: string, liste: readonly string[]) => {
  const net = normaliser(texte);
  return liste.find((terme) => net.includes(terme));
};

/** Premier terme de la liste présent comme mot entier, pluriel toléré. */
export const contientMot = (texte: string, liste: readonly string[]) => {
  const presents = mots(normaliser(texte));
  return liste.find((terme) => presents.some((mot) => mot === terme || mot === `${terme}s` || mot === `${terme}x`));
};

/** Distance d'édition entre deux textes. */
export const distance = (a: string, b: string) => {
  let ligne = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const suivante = [i];
    for (let j = 1; j <= b.length; j++) {
      suivante[j] = Math.min(ligne[j] + 1, suivante[j - 1] + 1, ligne[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    ligne = suivante;
  }
  return ligne[b.length];
};

/** « 74,8 % » */
export const pourcent = (valeur: number, decimales = 1) =>
  `${valeur.toFixed(decimales).replace('.', ',')} %`;
