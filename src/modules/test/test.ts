/**
 * Le test « Quel appareil êtes-vous ? », côté lecteur : les réponses cochées sont additionnées
 * selon le barème porté par chaque case, puis le lecteur est conduit à la page de son appareil.
 * Rien n'est envoyé ni conservé. Sans script, le questionnaire se lit et les huit profils restent accessibles.
 */
import { type Points, attribuer, lienAppareil } from '@/lib/test-appareils';

export function passerLeTest() {
  const formulaire = document.querySelector<HTMLFormElement>('[data-test]');
  if (!formulaire) return;
  const ordre: string[] = JSON.parse(formulaire.dataset.ordre!);
  const questions = [...formulaire.querySelectorAll<HTMLFieldSetElement>('fieldset[data-question]')];
  const note = formulaire.querySelector<HTMLElement>('[data-zone="note"]')!;
  const compte = formulaire.querySelector<HTMLElement>('[data-zone="compte"]')!;
  const envoi = formulaire.querySelector<HTMLElement>('[data-zone="envoi"]')!;

  const cochee = (question: HTMLFieldSetElement) => question.querySelector<HTMLInputElement>('input:checked');
  const compter = () => {
    const faites = questions.filter(cochee).length;
    compte.textContent = `${faites} réponse${faites > 1 ? 's' : ''} sur ${questions.length}`;
  };

  envoi.hidden = false;
  compter();
  formulaire.addEventListener('change', (e) => {
    compter();
    (e.target as HTMLElement).closest('fieldset')?.classList.remove('question--manquante');
    note.textContent = '';
  });

  formulaire.addEventListener('submit', (e) => {
    e.preventDefault();
    const manquante = questions.find((q) => !cochee(q));
    if (manquante) {
      manquante.classList.add('question--manquante');
      note.textContent = `Il manque une réponse à la question ${manquante.dataset.question}. Le barème ne peut pas conclure sans elle.`;
      manquante.querySelector('input')?.focus({ preventScroll: true });
      manquante.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const choix: Points[] = questions.map((q) => JSON.parse(cochee(q)!.dataset.points!));
    location.assign(lienAppareil(attribuer(choix, ordre)));
  });
}
