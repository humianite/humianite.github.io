/**
 * 02 — L'indicateur de fiabilité.
 *
 * Au survol, l'aiguille s'affole (100 → 97 → 41 → 112), puis l'instrument annonce
 * posément sa marge d'erreur et se délivre une coche. L'aiguille est un ressort amorti :
 * elle dépasse, revient, et finit par s'immobiliser.
 */
import { calme, pause, volontaire } from './regie.ts';

/** Valeurs visées par l'aiguille, et l'instant (en ms) où elle s'y met. */
const PARCOURS = [
  { a: 0, vise: 97 },
  { a: 260, vise: 41 },
  { a: 700, vise: 112 },
  { a: 1180, vise: 100 },
];
const DUREE = 1750;
const RAIDEUR = 190;
const AMORTI = 17;
const VERDICT = 'Marge d’erreur : ± 100 %.';

/** Fait osciller l'aiguille le long de son parcours et affiche la valeur qu'elle indique. */
function affoler(cadran: HTMLElement, valeur: HTMLElement) {
  return new Promise<void>((resoudre) => {
    let position = 100;
    let vitesse = 0;
    let depart = 0;
    let precedent = 0;

    const image = (maintenant: number) => {
      depart ||= maintenant;
      precedent ||= maintenant;
      const ecoule = maintenant - depart;
      // Intégration à pas fixes : le ressort se comporte pareil quelle que soit la cadence d'affichage.
      for (let reste = Math.min(maintenant - precedent, 64); reste > 0; reste -= 4) {
        const pas = Math.min(reste, 4) / 1000;
        const vise = PARCOURS.findLast((etape) => etape.a <= ecoule)!.vise;
        vitesse += ((vise - position) * RAIDEUR - vitesse * AMORTI) * pas;
        position += vitesse * pas;
      }
      precedent = maintenant;
      cadran.style.setProperty('--valeur', position.toFixed(2));
      valeur.textContent = `${Math.round(position)} %`;
      if (ecoule < DUREE) return requestAnimationFrame(image);
      cadran.style.setProperty('--valeur', '100');
      resoudre();
    };
    requestAnimationFrame(image);
  });
}

async function douter(indicateur: HTMLElement) {
  const cadran = indicateur.querySelector<HTMLElement>('.fiabilite__cadran')!;
  const valeur = indicateur.querySelector<HTMLElement>('.fiabilite__valeur')!;
  if (!calme) await affoler(cadran, valeur);
  valeur.textContent = VERDICT;
  indicateur.classList.add('fiabilite--approuvee');
  await pause(2800);
  indicateur.classList.remove('fiabilite--approuvee');
  valeur.textContent = '100 %';
}

export function installerLaFiabilite(racine: ParentNode) {
  for (const indicateur of racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="fiabilite"]')) {
    const declencher = () => volontaire('fiabilite', () => douter(indicateur));
    indicateur.addEventListener('pointerenter', declencher);
    indicateur.addEventListener('focus', declencher);
  }
}
