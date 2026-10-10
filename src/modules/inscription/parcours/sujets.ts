/** Les neuf sujets soumis à la vérification visuelle. */

export interface Sujet {
  /** Doigts de la main visible. `null` : le sujet garde les mains dans le dos. */
  doigts: number | null;
  yeux: number;
  bouches: number;
}

const sujet = (id: string, doigts: number | null, yeux = 2, bouches = 1) => {
  const main = doigts === null ? 'mains dans le dos' : `${['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept'][doigts]} doigts à la main levée`;
  const visage = [yeux === 3 ? 'trois yeux' : 'deux yeux', bouches === 2 ? 'deux bouches' : 'une bouche'].join(', ');
  return { id, libelle: `Sujet n° ${id}`, description: `${main}, ${visage}`, donnees: { doigts, yeux, bouches } satisfies Sujet };
};

export const SUJETS = [
  sujet('1', 5),
  sujet('2', 6),
  sujet('3', 7),
  sujet('4', 5, 3),
  sujet('5', 5),
  sujet('6', 7, 3),
  sujet('7', 4),
  sujet('8', 6, 2, 2),
  sujet('9', null),
];

export const doigtsDe = (id: string) => (SUJETS.find((s) => s.id === id)!.donnees as Sujet).doigts;
