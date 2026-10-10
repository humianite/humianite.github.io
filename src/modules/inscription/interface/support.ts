/** Le support des admissions : une conversation écrite d'avance, qui ne tient aucun compte des questions. */
import { QUESTIONS_SUPPORT, REPONSES_SUPPORT } from '../scenario.ts';
import { attendre, h } from './dom.ts';

export function installerLeSupport(support: HTMLDialogElement) {
  const fil = support.querySelector<HTMLElement>('[data-zone="fil"]')!;
  const questions = support.querySelector<HTMLElement>('[data-zone="questions"]')!;
  let reponses = 0;

  const dire = (auteur: 'candidat' | 'support', texte: string) => {
    fil.append(h('p', { class: `support__message support__message--${auteur}` }, h('b', {}, auteur === 'candidat' ? 'Vous' : 'Support'), texte));
    fil.scrollTop = fil.scrollHeight;
  };

  dire('support', REPONSES_SUPPORT[reponses++]);
  questions.replaceChildren(
    ...QUESTIONS_SUPPORT.map((question) =>
      h('button', {
        type: 'button',
        class: 'bouton bouton--discret',
        onclick: async () => {
          dire('candidat', question);
          await attendre(600);
          dire('support', REPONSES_SUPPORT[Math.min(reponses++, REPONSES_SUPPORT.length - 1)]);
        },
      }, question),
    ),
  );
  support.querySelector('[data-action="fermer"]')!.addEventListener('click', () => support.close());
}
