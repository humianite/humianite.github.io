/**
 * Le test « Quel appareil êtes-vous ? », côté lecteur : une question à la fois. Chaque réponse
 * fait passer à la suivante ; après la dernière, le barème est appliqué et le lecteur est conduit
 * à la page de son appareil. Rien n'est envoyé ni conservé.
 */
import { type Points, attribuer, lienAppareil } from '@/lib/test-appareils';

const ATTENTE_MS = 2600;

export function passerLeTest() {
  const formulaire = document.querySelector<HTMLFormElement>('[data-test]');
  if (!formulaire) return;
  const ordre: string[] = JSON.parse(formulaire.dataset.ordre!);
  const coefficients: Points = JSON.parse(formulaire.dataset.coefficients!);
  const questions = [...formulaire.querySelectorAll<HTMLFieldSetElement>('fieldset[data-question]')];
  const avancement = formulaire.querySelector<HTMLElement>('[data-zone="avancement"]')!;
  const jauge = formulaire.querySelector<HTMLElement>('[data-zone="jauge"]')!;
  const retour = formulaire.querySelector<HTMLButtonElement>('[data-zone="retour"]')!;
  const calcul = formulaire.querySelector<HTMLElement>('[data-zone="calcul"]')!;
  const etapes = [...calcul.querySelectorAll<HTMLElement>('[data-etape]')];
  const sobre = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let courante = 0;
  let tourne = false;

  const montrer = (n: number) => {
    courante = n;
    questions.forEach((q, i) => (q.hidden = i !== n));
    avancement.textContent = `Question ${n + 1} sur ${questions.length}`;
    jauge.style.setProperty('--avance', String(n / questions.length));
    retour.hidden = n === 0;
    const legende = questions[n].querySelector<HTMLElement>('legend');
    legende?.focus({ preventScroll: true });
    formulaire.scrollIntoView({ behavior: sobre ? 'auto' : 'smooth', block: 'start' });
  };

  const conclure = () => {
    const choix: Points[] = questions.map((q) => JSON.parse(q.querySelector<HTMLInputElement>('input:checked')!.dataset.points!));
    const appareil = attribuer(choix, ordre, coefficients);
    questions.forEach((q) => (q.hidden = true));
    formulaire.querySelector<HTMLElement>('[data-zone="pilotage"]')!.hidden = true;
    jauge.style.setProperty('--avance', '1');
    calcul.hidden = false;
    calcul.focus();
    const pas = sobre ? 0 : ATTENTE_MS / (etapes.length + 1);
    etapes.forEach((etape, i) => setTimeout(() => (etape.hidden = false), pas * (i + 1)));
    setTimeout(() => location.assign(lienAppareil(appareil)), sobre ? 600 : ATTENTE_MS);
  };

  formulaire.classList.add('questionnaire--pas-a-pas');
  formulaire.querySelector<HTMLElement>('[data-zone="pilotage"]')!.hidden = false;
  questions.forEach((q) => q.querySelector('legend')?.setAttribute('tabindex', '-1'));
  montrer(0);

  // Au clic plutôt qu'au changement : une réponse recochée après un retour fait aussi avancer.
  formulaire.addEventListener('click', (e) => {
    const cible = e.target as HTMLElement;
    if (!cible.matches('input[type="radio"]') || cible.closest('fieldset') !== questions[courante]) return;
    if (tourne) return;
    tourne = true;
    // Un temps, pour que la case cochée se voie avant de tourner la page.
    setTimeout(() => {
      tourne = false;
      if (courante + 1 < questions.length) montrer(courante + 1);
      else conclure();
    }, sobre ? 0 : 280);
  });

  retour.addEventListener('click', () => !tourne && courante > 0 && montrer(courante - 1));
  formulaire.addEventListener('submit', (e) => e.preventDefault());
}
