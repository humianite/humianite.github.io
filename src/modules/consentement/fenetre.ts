/**
 * Fenêtre de consentement : ouverture, fermeture, et entêtement du bouton « Tout refuser ».
 *
 * Le refus ne passe qu'à l'obstination. À la souris, le bouton se creuse sous le curseur
 * (voir `creux.ts`) ; au doigt, il fuit (voir `esquives.ts`) ; sans animation, il proteste.
 * Au clavier ou avec une technologie d'assistance, il obéit tout de suite.
 */
import { creerCreux } from './creux.ts';
import { creerEsquives } from './esquives.ts';

const CLE = 'humianite:consentement';
/** Tentatives nécessaires pour que le refus finisse par passer. Le survol, lui, n'use jamais le bouton. */
const PATIENCE = 12;

const MESSAGES = {
  accepte: 'Merci. Vous venez d’accepter absolument rien.',
  refuse: 'Refus enregistré nulle part. Merci pour votre courage.',
  immobile: 'Le bouton aurait souhaité s’enfuir. Vous avez désactivé les animations. Il vous en tient rigueur.',
};

const ENTREE: Keyframe[] = [{ opacity: 0, transform: 'translateY(0.8rem) scale(0.985)' }, { opacity: 1, transform: 'none' }];
const SORTIE: Keyframe[] = [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(0.6rem) scale(0.985)' }];

const dejaVu = () => {
  try {
    return sessionStorage.getItem(CLE) !== null;
  } catch {
    return false;
  }
};

const memoriser = () => {
  try {
    sessionStorage.setItem(CLE, 'vu');
  } catch {
    /* Sans stockage, la fenêtre reviendra à la page suivante. */
  }
};

export function installerLeConsentement(dialogue: HTMLDialogElement, toast: HTMLElement) {
  const trouver = <T extends Element>(selecteur: string) => dialogue.querySelector<T>(selecteur)!;
  const refuser = trouver<HTMLButtonElement>('[data-action="refuser"]');
  const incident = trouver<HTMLElement>('[data-zone="incident"]');
  const vues = [...dialogue.querySelectorAll<HTMLElement>('[data-vue]')];
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const creux = creerCreux(refuser, trouver<SVGPathElement>('.cmp__contour path'), trouver<HTMLElement>('.cmp__libelle'));
  const esquives = creerEsquives({
    bouton: refuser,
    piste: trouver<HTMLElement>('[data-zone="piste"]'),
    accepter: trouver<HTMLElement>('[data-action="accepter"]'),
    rangee: trouver<HTMLElement>('.cmp__boutons'),
  });

  let tentatives = 0;
  /** Sans animation, le bouton cède après une protestation. */
  let resigne = false;
  let survole = false;
  /** Dernière position du curseur, dans le repère du bouton. */
  const curseur = { x: 0, y: 0 };

  /* ---------- Ouverture et fermeture ---------- */

  const annoncer = (texte: string) => {
    toast.textContent = texte;
    toast.hidden = false;
    setTimeout(() => (toast.hidden = true), 5200);
  };

  const fermer = async (message?: string) => {
    memoriser();
    if (!calme) await dialogue.animate(SORTIE, { duration: 190, easing: 'ease-in' }).finished;
    dialogue.close();
    if (message) annoncer(message);
  };

  const montrer = (nom: string) => {
    for (const vue of vues) vue.hidden = vue.dataset.vue !== nom;
    trouver<HTMLElement>(nom === 'conditions' ? '.cmp__titre--document' : '[data-action="conditions"]').focus();
  };

  /** Ouvre la fenêtre avec un bouton remis à neuf : il a tout oublié. */
  const ouvrir = () => {
    if (dialogue.open) return;
    tentatives = 0;
    resigne = false;
    survole = false;
    creux.reinitialiser();
    esquives.reinitialiser();
    refuser.style.removeProperty('--usure');
    incident.textContent = '';
    toast.hidden = true;
    for (const vue of vues) vue.hidden = vue.dataset.vue !== 'choix';
    dialogue.showModal();
    if (!calme) dialogue.animate(ENTREE, { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
  };

  /* ---------- Le refus ---------- */

  /** Compte une tentative et fait rougir le bouton. Rend vrai quand sa patience est épuisée. */
  const insister = () => {
    tentatives += 1;
    refuser.style.setProperty('--usure', String(tentatives / PATIENCE));
    return tentatives >= PATIENCE;
  };

  refuser.addEventListener('click', async (evenement) => {
    const pointeur = (evenement as PointerEvent).pointerType;
    const auClavier = evenement.detail === 0 || !pointeur;
    if (auClavier || resigne) return fermer(MESSAGES.refuse);
    if (esquives.enMouvement()) return;

    if (calme) {
      resigne = true;
      incident.textContent = MESSAGES.immobile;
      return;
    }
    if (insister()) return fermer(MESSAGES.refuse);

    // À la souris, le curseur est dans le creux : il n'a rien touché.
    if (pointeur === 'mouse') return creux.sursauter(curseur.x, curseur.y);

    // Au doigt : une glissade aux tentatives impaires, une pirouette et un échange de place aux paires.
    if (tentatives % 2) return esquives.glisser();
    await esquives.bondir();
    await esquives.echangerSiEmpiles();
  });

  if (!calme) {
    const quitter = () => {
      if (!survole) return;
      survole = false;
      creux.relacher();
    };

    dialogue.addEventListener('pointermove', (evenement) => {
      if (evenement.pointerType !== 'mouse' || esquives.enMouvement()) return;
      const cadre = refuser.getBoundingClientRect();
      curseur.x = evenement.clientX - cadre.left;
      curseur.y = evenement.clientY - cadre.top;
      if (!creux.aPortee(curseur.x, curseur.y)) return quitter();
      survole = true;
      creux.activer();
      creux.viser(curseur.x, curseur.y);
    });
    dialogue.addEventListener('pointerleave', quitter);
  }

  /* ---------- Les autres commandes ---------- */

  dialogue.addEventListener('click', (evenement) => {
    const action = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'accepter') fermer(MESSAGES.accepte);
    if (action === 'conditions') montrer('conditions');
    if (action === 'retour') montrer('choix');
  });

  // Échap ne ferme rien : il faut choisir. La touche est interceptée avant le navigateur,
  // qui finirait sinon par céder à la deuxième pression.
  dialogue.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Escape') evenement.preventDefault();
  });
  dialogue.addEventListener('cancel', (evenement) => evenement.preventDefault());

  // Le lien du pied de page que personne ne clique jamais.
  document.addEventListener('click', (evenement) => {
    if ((evenement.target as HTMLElement).closest('[data-ouvrir-consentement]')) ouvrir();
  });

  // Première page de la session : le temps de reconnaître un site d'information, pas davantage.
  if (!dejaVu()) setTimeout(ouvrir, 900);
}
