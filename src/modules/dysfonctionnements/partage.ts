/**
 * 08 — Le bouton Partager transmet la responsabilité.
 *
 * Le bouton copie réellement l'adresse de l'article. Pendant ce temps, un double du pictogramme
 * part vers un service, hésite, se ravise et s'en va ailleurs, comme tout document administratif.
 */
import { annoncer, calme, volontaire } from './regie.ts';

const TRANSMIS = 'Le problème a été transmis à quelqu’un d’autre.';
const VARIANTE = 'Merci de contribuer à la circulation de l’incertitude.';
/** La variante sort une fois sur quatre. */
let copies = 0;

async function copier(adresse: string) {
  try {
    await navigator.clipboard.writeText(adresse);
    return true;
  } catch {
    return false;
  }
}

/** Le double du pictogramme : il part, s'arrête, revient sur ses pas, puis file dans une autre direction. */
async function egarer(picto: HTMLElement) {
  const double = picto.cloneNode(true) as HTMLElement;
  double.classList.add('partage__double');
  picto.after(double);
  await double.animate(
    [
      { transform: 'translate(0, 0) rotate(0)', opacity: 1 },
      { transform: 'translate(1.15em, -0.1em) rotate(-8deg)', opacity: 1, offset: 0.24, easing: 'ease-out' },
      { transform: 'translate(1.15em, -0.1em) rotate(-8deg)', opacity: 1, offset: 0.42 },
      { transform: 'translate(0.85em, 0.12em) rotate(7deg)', opacity: 1, offset: 0.56, easing: 'ease-in-out' },
      { transform: 'translate(0.85em, 0.12em) rotate(7deg)', opacity: 1, offset: 0.64 },
      { transform: 'translate(1.7em, -1em) rotate(-16deg)', opacity: 1, offset: 0.86, easing: 'ease-in' },
      { transform: 'translate(2.2em, -1.7em) rotate(-22deg) scale(0.7)', opacity: 0 },
    ],
    { duration: 1150 },
  ).finished;
  double.remove();
}

async function transmettre(bouton: HTMLElement) {
  const adresse = location.href;
  const copie = await copier(adresse);
  copies += 1;
  annoncer(copies % 4 === 0 ? VARIANTE : TRANSMIS, copie ? 'Lien copié dans le presse-papiers.' : `Copie impossible. Adresse de l’article : ${adresse}`);
  const picto = bouton.querySelector<HTMLElement>('.partage__picto');
  if (picto && !calme) await egarer(picto);
}

export function installerLePartage(racine: ParentNode) {
  for (const bouton of racine.querySelectorAll<HTMLElement>('[data-dysfonctionnement="partage"]')) {
    bouton.addEventListener('click', () => volontaire('partage', () => transmettre(bouton)));
  }
}
