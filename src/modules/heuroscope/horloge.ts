/**
 * L'Heuroscope se lit à l'heure qu'il est : ce module place l'aiguille du cadran,
 * signale le créneau en cours et recopie sa prévision dans l'encart « À l'instant ».
 * Sans JavaScript, la page reste entièrement lisible ; elle ignore seulement l'heure.
 */

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const affichee = (heure: number) => `${String(heure).padStart(2, '0')} h`;

export function reglerLHeuroscope(racine: ParentNode = document) {
  const heure = new Date().getHours();

  // La page d'un signe : aiguille, créneau en cours, encart.
  for (const page of racine.querySelectorAll<HTMLElement>('[data-heuroscope]')) {
    const creneau = page.querySelector<HTMLElement>(`[data-heure="${heure}"]`);
    creneau?.classList.add('heure--maintenant');
    creneau?.setAttribute('aria-current', 'time');

    const aiguille = page.querySelector<SVGGElement>('[data-zone="aiguille"]');
    if (aiguille) {
      aiguille.removeAttribute('hidden');
      const angle = (heure / 24) * 360;
      if (calme) aiguille.style.transform = `rotate(${angle}deg)`;
      // L'aiguille part de minuit, dépasse un peu son heure, puis s'y range.
      else aiguille.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${angle + 7}deg)`, offset: 0.78 }, { transform: `rotate(${angle - 2}deg)`, offset: 0.9 }, { transform: `rotate(${angle}deg)` }], { duration: 1500, delay: 250, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'both' });
    }

    const instant = page.querySelector<HTMLElement>('[data-zone="instant"]');
    const texte = creneau?.querySelector('.heure__texte')?.textContent;
    if (instant && texte) {
      instant.querySelector('[data-zone="instant-heure"]')!.textContent = affichee(heure);
      instant.querySelector('[data-zone="instant-texte"]')!.textContent = texte;
      instant.querySelector<HTMLAnchorElement>('a')?.setAttribute('href', `#h${heure}`);
      instant.hidden = false;
    }
  }

  // L'appel de la une : la prévision du fond de l'air pour l'heure en cours.
  for (const appel of racine.querySelectorAll<HTMLElement>('[data-heuroscope-appel]')) {
    try {
      const communes: string[] = JSON.parse(appel.dataset.communes ?? '[]');
      if (!communes[heure]) continue;
      appel.querySelector('[data-zone="appel-heure"]')!.textContent = affichee(heure);
      appel.querySelector('[data-zone="appel-texte"]')!.textContent = communes[heure];
    } catch {
      /* L'appel garde sa prévision par défaut. */
    }
  }
}
