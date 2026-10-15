/**
 * Le coupon des petites annonces : tarif à la ligne, contrôle avant envoi, envoi au guichet, tampon.
 * Le guichet ne publie rien ; il rend un numéro de dossier.
 */
import { lignes } from '@/lib/annonces';

const euros = (montant: number) => montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export function brancherLeCoupon() {
  const formulaire = document.querySelector<HTMLFormElement>('[data-coupon]');
  if (!formulaire) return;

  const zone = (nom: string) => formulaire.querySelector<HTMLElement>(`[data-zone="${nom}"]`)!;
  const erreur = (nom: string) => formulaire.querySelector<HTMLElement>(`[data-erreur="${nom}"]`)!;
  const texte = formulaire.elements.namedItem('texte') as HTMLTextAreaElement;
  const cases = formulaire.querySelectorAll<HTMLInputElement>('input[name="categorie"]');
  const envoi = formulaire.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const { min, max, prixLigne } = formulaire.dataset;
  const prix = Number(prixLigne);

  const chiffrer = () => {
    const n = lignes(texte.value);
    zone('tarif').textContent = `${n} ligne${n > 1 ? 's' : ''} × ${euros(prix)} = ${euros(n * prix)} · ${texte.value.trim().length}/${max} signes`;
  };

  /** Une remarque au stylo rouge sous le champ fautif, à la place de la bulle du navigateur. */
  const annoter = (nom: string, message: string, champ?: HTMLElement) => {
    erreur(nom).textContent = message;
    champ?.setAttribute('aria-invalid', String(Boolean(message)));
  };

  const controler = () => {
    const rubrique = [...cases].some((c) => c.checked);
    const longueur = texte.value.trim().length;
    annoter('categorie', rubrique ? '' : 'Cochez une rubrique.');
    annoter(
      'texte',
      longueur === 0 ? 'Le coupon est vide.' : longueur < Number(min) ? `Encore un effort : ${min} signes au moins.` : '',
      texte,
    );
    if (!rubrique) cases[0].focus();
    else if (longueur < Number(min)) texte.focus();
    return rubrique && longueur >= Number(min);
  };

  texte.addEventListener('input', () => {
    chiffrer();
    if (texte.getAttribute('aria-invalid') === 'true' && texte.value.trim().length >= Number(min)) annoter('texte', '', texte);
  });
  cases.forEach((c) => c.addEventListener('change', () => annoter('categorie', '')));
  chiffrer();

  const dire = (message: string) => {
    zone('retour').textContent = message;
    zone('retour').hidden = !message;
  };

  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    dire('');
    zone('accuse').textContent = '';
    if (!controler()) return;
    envoi.disabled = true;

    const donnees = Object.fromEntries(new FormData(formulaire));
    try {
      const reponse = await fetch(`${formulaire.dataset.guichet}/annonces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
        signal: AbortSignal.timeout(10_000),
      });
      const corps = (await reponse.json().catch(() => ({}))) as { numero?: string; motif?: string };
      if (!reponse.ok || !corps.numero) throw new Error(corps.motif ?? 'Le guichet n’a pas compris votre coupon.');

      const tampon = zone('tampon');
      zone('dossier').textContent = `Dossier n° ${corps.numero}`;
      // Le tampon est un dessin : les lecteurs d'écran reçoivent la même nouvelle en toutes lettres.
      zone('accuse').textContent = `Coupon reçu, dossier n° ${corps.numero}.`;
      tampon.hidden = false;
      tampon.classList.remove('est-applique');
      void tampon.offsetWidth;
      tampon.classList.add('est-applique');
      formulaire.reset();
      chiffrer();
    } catch (erreur) {
      // Réseau coupé (TypeError) ou guichet muet au-delà du délai (DOMException) : même réponse.
      const injoignable = erreur instanceof TypeError || erreur instanceof DOMException;
      dire(injoignable ? 'Le guichet ne répond pas. Réessayez plus tard.' : (erreur as Error).message);
    } finally {
      envoi.disabled = false;
    }
  });
}
