/** Le sudoku de la procédure simplifiée : 4 × 4, une seule solution (vérifié par les tests). */

export const COTE = 4;

/** La grille proposée, ligne par ligne. 0 : case à remplir. */
export const GRILLE: readonly number[] = [
  1, 0, 0, 4,
  0, 0, 1, 0,
  2, 0, 0, 0,
  0, 3, 2, 0,
];

/** Les cases qui partagent une ligne, une colonne ou un carré avec la case donnée. */
const voisines = (rang: number) => {
  const [ligne, colonne] = [Math.floor(rang / COTE), rang % COTE];
  const [carreLigne, carreColonne] = [ligne - (ligne % 2), colonne - (colonne % 2)];
  const cases = new Set<number>();
  for (let k = 0; k < COTE; k++) {
    cases.add(ligne * COTE + k);
    cases.add(k * COTE + colonne);
    cases.add((carreLigne + Math.floor(k / 2)) * COTE + carreColonne + (k % 2));
  }
  cases.delete(rang);
  return [...cases];
};

const admise = (grille: readonly number[], rang: number, valeur: number) => voisines(rang).every((voisine) => grille[voisine] !== valeur);

/** Nombre de solutions d'une grille. */
export function solutions(grille: readonly number[]): number {
  const essai = [...grille];
  const chercher = (): number => {
    const vide = essai.indexOf(0);
    if (vide === -1) return 1;
    let total = 0;
    for (let valeur = 1; valeur <= COTE; valeur++) {
      if (!admise(essai, vide, valeur)) continue;
      essai[vide] = valeur;
      total += chercher();
      essai[vide] = 0;
    }
    return total;
  };
  return chercher();
}

export const estComplete = (valeurs: readonly number[]) => valeurs.length === COTE * COTE && valeurs.every((valeur) => valeur >= 1 && valeur <= COTE);

/** La grille est juste si elle respecte les cases données et les règles, case par case. */
export const estJuste = (valeurs: readonly number[]) =>
  estComplete(valeurs) && valeurs.every((valeur, rang) => (GRILLE[rang] === 0 || GRILLE[rang] === valeur) && admise(valeurs, rang, valeur));
