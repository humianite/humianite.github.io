/**
 * Fenêtre du contrôle : les trois voies (document JSON, sudoku, refus), la séquence des tampons,
 * la dernière question de sécurité et la conclusion. La fenêtre ne se referme qu'une fois
 * le contrôle mené à son terme : ni croix, ni touche Échap.
 */
import { compterLaPage, estDu, noterLePassage } from './calendrier.ts';
import { CONCLUSIONS, INSTRUCTIONS, MESSAGES, QUESTION, type Voie } from './dossier.ts';
import { COTE, estComplete, estJuste } from './sudoku.ts';
import { valider } from './validateur.ts';

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = (duree: number) => new Promise<void>((resoudre) => setTimeout(resoudre, duree));
const ELASTIQUE = 'cubic-bezier(0.3, 1.5, 0.5, 1)';
/** Délai avant que la troisième voie ne se laisse apercevoir sous le sudoku. */
const PATIENCE = 6000;

export function installerLeCaptcha(dialogue: HTMLDialogElement) {
  const trouver = <T extends Element>(selecteur: string) => dialogue.querySelector<T>(selecteur)!;
  const vues = [...dialogue.querySelectorAll<HTMLElement>('[data-vue]')];
  const saisie = trouver<HTMLTextAreaElement>('[data-zone="reponse"]');
  const cases = [...dialogue.querySelectorAll<HTMLInputElement>('[data-case]')];
  const message = (vue: string) => trouver<HTMLElement>(`[data-vue="${vue}"] [data-zone="message"]`);
  let caseActive: HTMLInputElement | undefined;
  /** Minuterie de la troisième voie : annulée si la fenêtre est refermée ou rouverte entre-temps. */
  let apparition = 0;

  /* ---------- Passage d'une vue à l'autre ---------- */

  const vue = (nom: string) => vues.find((candidate) => candidate.dataset.vue === nom)!;

  /** La vue courante se replie comme un dossier ; la suivante se déplie à sa place. */
  async function basculer(vers: string) {
    const courante = vues.find((candidate) => !candidate.hidden)!;
    const suivante = vue(vers);
    if (!calme) {
      await courante.animate(
        [
          { transform: 'perspective(900px) rotateX(0deg) scaleY(1)', opacity: 1 },
          { transform: 'perspective(900px) rotateX(-28deg) scaleY(0.72)', opacity: 1, offset: 0.55 },
          { transform: 'perspective(900px) rotateX(-86deg) scaleY(0.12)', opacity: 0 },
        ],
        { duration: 340, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)' },
      ).finished;
    }
    courante.hidden = true;
    suivante.hidden = false;
    if (!calme) {
      suivante.animate(
        [
          { transform: 'perspective(900px) rotateX(80deg) scaleY(0.2)', opacity: 0 },
          { transform: 'perspective(900px) rotateX(0deg) scaleY(1)', opacity: 1 },
        ],
        { duration: 480, easing: ELASTIQUE },
      );
    }
    suivante.querySelector<HTMLElement>('h2')?.focus();
  }

  /* ---------- Voie 1 : le document ---------- */

  function soumettre() {
    const verdict = valider(saisie.value);
    if (verdict.conforme) return conclure('json');
    message('json').textContent = verdict.motif;
    saisie.focus();
  }

  async function copier(bouton: HTMLElement) {
    const retour = trouver<HTMLElement>('[data-zone="copie"]');
    try {
      await navigator.clipboard.writeText(INSTRUCTIONS);
      retour.textContent = MESSAGES.copie;
    } catch {
      retour.textContent = MESSAGES.copieImpossible;
    }
    bouton.focus();
  }

  /* ---------- Voie 2 : le sudoku ---------- */

  const valeurs = () => [...dialogue.querySelectorAll<HTMLElement>('[data-rang]')].map((element) => Number((element as HTMLInputElement).value ?? element.textContent) || Number(element.textContent) || 0);

  function verifier() {
    const grille = valeurs();
    if (!estComplete(grille)) return void (message('sudoku').textContent = MESSAGES.sudokuIncomplet);
    if (!estJuste(grille)) return void (message('sudoku').textContent = MESSAGES.sudokuFaux);
    conclure('sudoku');
  }

  /** Une case ne retient qu'un chiffre de 1 à 4 : le dernier tapé. */
  const assainir = (champ: HTMLInputElement) => {
    champ.value = [...champ.value].filter((caractere) => caractere >= '1' && caractere <= String(COTE)).pop() ?? '';
    message('sudoku').textContent = '';
  };

  for (const champ of cases) {
    champ.addEventListener('focus', () => (caseActive = champ));
    champ.addEventListener('input', () => assainir(champ));
    // Les flèches déplacent d'une case à remplir à la suivante.
    champ.addEventListener('keydown', (evenement) => {
      const pas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COTE, ArrowDown: COTE }[evenement.key];
      if (!pas) return;
      evenement.preventDefault();
      let rang = Number(champ.dataset.rang);
      do rang += pas;
      while (rang >= 0 && rang < COTE * COTE && !cases.some((autre) => Number(autre.dataset.rang) === rang));
      cases.find((autre) => Number(autre.dataset.rang) === rang)?.focus();
    });
  }

  /** Pavé de saisie : il écrit dans la dernière case visitée, ou dans la première encore vide. */
  function poser(chiffre: string) {
    const cible = caseActive ?? cases.find((champ) => !champ.value) ?? cases[0];
    cible.value = chiffre;
    assainir(cible);
    caseActive = cible;
    cible.focus();
  }

  /* ---------- La validation ---------- */

  /** Trois tampons, chacun couvrant le précédent, puis plus rien. */
  async function tamponner() {
    const [conforme, reserve, validee] = [...dialogue.querySelectorAll<HTMLElement>('.rc__tampon')];
    const zone = trouver<HTMLElement>('.rc__tampons');
    zone.hidden = false;
    if (calme) {
      for (const tampon of [conforme, reserve, validee]) {
        tampon.style.opacity = '1';
        await pause(450);
      }
      await pause(600);
      return void (zone.hidden = true);
    }
    const frapper = (tampon: HTMLElement, inclinaison: number, duree: number) =>
      tampon.animate(
        [
          { transform: `translateY(-4.5em) rotate(${inclinaison - 7}deg) scale(1.25)`, opacity: 0, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
          { transform: `translateY(0) rotate(${inclinaison + 1}deg) scale(1.08, 0.86)`, opacity: 1, offset: 0.5, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
          { transform: `translateY(-0.5em) rotate(${inclinaison - 1}deg) scale(0.98, 1.04)`, opacity: 1, offset: 0.72, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
          { transform: `translateY(0) rotate(${inclinaison}deg) scale(1)`, opacity: 1 },
        ],
        { duration: duree, fill: 'forwards' },
      ).finished;

    await frapper(conforme, -6, 520);
    await pause(60);
    await frapper(reserve, 4, 380);
    await pause(240);
    await validee.animate([{ transform: 'rotate(-14deg) scale(0.3)', opacity: 0 }, { transform: 'rotate(-9deg) scale(1)', opacity: 1 }], { duration: 260, easing: ELASTIQUE, fill: 'forwards' }).finished;
    await pause(900);
    await zone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'forwards' }).finished;
    zone.hidden = true;
  }

  async function conclure(voie: Voie) {
    noterLePassage();
    const { resultat, suite } = CONCLUSIONS[voie];
    trouver<HTMLElement>('[data-zone="resultat"]').textContent = resultat;
    trouver<HTMLElement>('[data-zone="suite"]').textContent = suite;
    await basculer('verdict');
    await tamponner();
    const question = trouver<HTMLElement>('[data-zone="question"]');
    question.hidden = false;
    if (!calme) question.animate([{ opacity: 0, transform: 'translateY(0.4rem)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
    question.querySelector<HTMLElement>('input')?.focus();
  }

  /** Quelle que soit la réponse, le visiteur passe. Il lui est seulement dit ce qu'on en pense. */
  function repondre(id: string) {
    const reponse = QUESTION.reponses.find((candidate) => candidate.id === id);
    if (!reponse) return;
    trouver<HTMLElement>('[data-zone="avis"]').textContent = reponse.verdict;
    const issue = trouver<HTMLElement>('[data-zone="issue"]');
    if (!issue.hidden) return;
    issue.hidden = false;
    if (!calme) issue.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 250, fill: 'backwards' });
  }

  /* ---------- Ouverture, fermeture, commandes ---------- */

  /** Rien ne subsiste d'un passage précédent : ni réponse, ni message, ni tampon. */
  function remettreANeuf() {
    for (const candidate of vues) candidate.hidden = candidate.dataset.vue !== 'json';
    saisie.value = '';
    for (const champ of cases) champ.value = '';
    caseActive = undefined;
    for (const zone of dialogue.querySelectorAll<HTMLElement>('[data-zone="message"], [data-zone="avis"], [data-zone="copie"]')) zone.textContent = '';
    for (const choix of dialogue.querySelectorAll<HTMLInputElement>('input[name="rc-question"]')) choix.checked = false;
    for (const nom of ['question', 'issue']) trouver<HTMLElement>(`[data-zone="${nom}"]`).hidden = true;
    clearTimeout(apparition);
    trouver<HTMLElement>('[data-zone="refus"]').classList.remove('rc__refus--visible');
    const tampons = trouver<HTMLElement>('.rc__tampons');
    tampons.hidden = true;
    for (const animation of tampons.getAnimations({ subtree: true })) animation.cancel();
    for (const tampon of tampons.querySelectorAll<HTMLElement>('.rc__tampon')) tampon.style.opacity = '';
  }

  function ouvrir() {
    if (dialogue.open) return;
    remettreANeuf();
    dialogue.showModal();
    if (!calme) dialogue.animate([{ opacity: 0, transform: 'translateY(0.8rem) scale(0.985)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    trouver<HTMLElement>('[data-vue="json"] h2').focus();
  }

  dialogue.addEventListener('click', async (evenement) => {
    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!cible) return;
    const action = cible.dataset.action;
    if (action === 'fermer') dialogue.close();
    if (action === 'soumettre') soumettre();
    if (action === 'copier') copier(cible);
    if (action === 'verifier') verifier();
    if (action === 'chiffre') poser(cible.dataset.chiffre ?? '');
    if (action === 'refuser') conclure('refus');
    if (action === 'vers-json') basculer('json');
    if (action === 'vers-sudoku') {
      await basculer('sudoku');
      // La troisième voie ne se montre qu'à ceux qui s'attardent.
      clearTimeout(apparition);
      apparition = window.setTimeout(() => trouver<HTMLElement>('[data-zone="refus"]').classList.add('rc__refus--visible'), PATIENCE);
    }
  });
  dialogue.addEventListener('change', (evenement) => {
    const choix = evenement.target as HTMLInputElement;
    if (choix.name === 'rc-question') repondre(choix.value);
  });
  // On ne sort que par la conclusion. Échap est neutralisée deux fois : le navigateur finit par passer outre un seul refus.
  dialogue.addEventListener('cancel', (evenement) => evenement.preventDefault());
  dialogue.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Escape') evenement.preventDefault();
  });
  dialogue.addEventListener('close', () => noterLePassage());

  document.addEventListener('click', (evenement) => {
    if ((evenement.target as HTMLElement).closest('[data-ouvrir-captcha]')) ouvrir();
  });

  /* ---------- Présentation spontanée ---------- */

  const rang = compterLaPage();
  if (!estDu(rang, location.pathname)) return;
  setTimeout(() => {
    // Jamais par-dessus une autre fenêtre, ni avant que le bandeau de consentement ait été vu :
    // le contrôle attendra la page suivante.
    const consentement = document.querySelector('[data-consentement]');
    const consentementVu = !consentement || sessionStorage.getItem('humianite:consentement') !== null;
    if (consentementVu && !document.querySelector('dialog[open]')) ouvrir();
  }, 1400);
}
