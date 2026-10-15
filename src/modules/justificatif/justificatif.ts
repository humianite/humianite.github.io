/**
 * Le justificatif de lecture : mesure le temps passé page visible,
 * demande un numéro au guichet, délivre l'attestation, puis la remet en image à partager.
 */
import { broyer } from './broyeur';
import { dessinerJustificatif } from './image';
import { duree, verdict } from './mesure';

export function delivrerLesJustificatifs() {
  const dialogue = document.querySelector<HTMLDialogElement>('[data-justificatif]');
  const ouvrir = document.querySelector<HTMLButtonElement>('[data-justificatif-ouvrir]');
  if (!dialogue || !ouvrir) return;

  // Le chronomètre ne tourne que page visible : un onglet oublié ne compte pas comme une lecture.
  let cumul = 0;
  let depuis = document.visibilityState === 'visible' ? performance.now() : null;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') depuis = performance.now();
    else if (depuis !== null) {
      cumul += performance.now() - depuis;
      depuis = null;
    }
  });
  const ecoule = () => cumul + (depuis === null ? 0 : performance.now() - depuis);

  const zone = (nom: string) => dialogue.querySelector<HTMLElement>(`[data-zone="${nom}"]`)!;
  let numero: Promise<string> | null = null;
  const demanderNumero = () =>
    fetch(`${dialogue.dataset.guichet}/justificatifs`, { method: 'POST', signal: AbortSignal.timeout(5000) })
      .then((r) => r.json() as Promise<{ numero?: number }>)
      .then(({ numero }) => (numero ? numero.toLocaleString('fr-FR').replace(/\s/g, ' ') : 'en attente d’attribution'))
      .catch(() => 'en attente d’attribution');

  ouvrir.addEventListener('click', async () => {
    const constate = ecoule();
    zone('constate').textContent = duree(constate);
    zone('verdict').textContent = verdict(constate, Number(dialogue.dataset.minutes));
    zone('delivre').textContent = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
      .format(new Date())
      .replace(/(\d+):(\d+)$/, (_, h, m) => `${Number(h)} h ${m}`);

    // Un numéro par page : rouvrir l'attestation ne fait pas avancer le compteur.
    numero ??= demanderNumero();
    zone('numero').textContent = '…';
    dialogue.showModal();
    zone('numero').textContent = await numero;
  });

  // On ne ferme pas un justificatif : on le détruit. Le bouton, la touche Échap et un clic à côté mènent au broyeur.
  let enCours = false;
  const detruire = async () => {
    if (enCours) return;
    enCours = true;
    dialogue.classList.add('est-broye');
    await broyer(zone('feuille'));
    dialogue.close();
    dialogue.classList.remove('est-broye');
    enCours = false;
  };
  dialogue.querySelector('[data-justificatif-detruire]')!.addEventListener('click', detruire);
  dialogue.addEventListener('cancel', (evenement) => {
    evenement.preventDefault();
    detruire();
  });
  dialogue.addEventListener('click', (evenement) => {
    if (evenement.target === dialogue) detruire();
  });

  // L'image : la feuille de partage de l'appareil quand elle accepte les images, et un téléchargement dans tous les cas.
  const imageDuJour = async () => {
    // Pas d'image sans numéro : on attend que le guichet ait répondu (ou renoncé).
    if (numero) zone('numero').textContent = await numero;
    const n = zone('numero').textContent ?? '';
    const image = await dessinerJustificatif({
      numero: n,
      article: dialogue.querySelector('.justificatif__article')!.textContent ?? '',
      paru: dialogue.querySelector('.justificatif__paru')!.textContent ?? '',
      releve: [...dialogue.querySelectorAll('.justificatif__releve div')].map((ligne) => [
        ligne.querySelector('dt')!.textContent ?? '',
        ligne.querySelector('dd')!.textContent ?? '',
      ]),
      verdict: zone('verdict').textContent ?? '',
      delivre: zone('delivre').textContent ?? '',
    });
    return new File([image], `justificatif-de-lecture-${n.replace(/\D/g, '') || 'provisoire'}.png`, { type: 'image/png' });
  };

  const brancher = (selecteur: string, action: (fichier: File) => Promise<unknown> | void) => {
    const bouton = dialogue.querySelector<HTMLButtonElement>(selecteur)!;
    bouton.addEventListener('click', async () => {
      bouton.disabled = true;
      try {
        await action(await imageDuJour());
      } finally {
        bouton.disabled = false;
      }
    });
    return bouton;
  };

  const essai = new File([''], 'essai.png', { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [essai] })) {
    brancher('[data-justificatif-partager]', (fichier) => navigator.share({ files: [fichier], url: location.href }).catch(() => {})).hidden = false;
  }
  brancher('[data-justificatif-enregistrer]', (fichier) => {
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(fichier);
    lien.download = fichier.name;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
  });
}
