/** Ce que le justificatif constate : durée et verdict. Sans DOM, pour les tests. */

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** « 38 secondes », « 4 minutes 12 secondes », « 1 heure 3 minutes ». */
export const duree = (millisecondes: number) => {
  const secondes = Math.max(1, Math.round(millisecondes / 1000));
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  const s = secondes % 60;
  if (h) return [pluriel(h, 'heure'), m && pluriel(m, 'minute')].filter(Boolean).join(' ');
  if (m) return [pluriel(m, 'minute'), s && pluriel(s, 'seconde')].filter(Boolean).join(' ');
  return pluriel(s, 'seconde');
};

/** Le verdict du service, d'après le rapport entre le temps constaté et le temps estimé. */
export const verdict = (constate: number, estimeMinutes: number) => {
  const rapport = constate / (estimeMinutes * 60_000);
  if (rapport < 0.15) return 'Lecture du titre, pour l’essentiel. Le porteur pourra néanmoins en parler avec assurance.';
  if (rapport < 0.6) return 'Lecture en diagonale. Conforme aux usages.';
  if (rapport < 1.5) return 'Lecture complète. La direction s’interroge sur vos motivations.';
  return 'Lecture approfondie. Le porteur est invité à reprendre une activité normale.';
};
