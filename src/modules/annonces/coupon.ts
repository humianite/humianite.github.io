/**
 * Le coupon des petites annonces : tarif à la ligne, envoi au guichet, tampon.
 * Le guichet ne publie rien ; il rend un numéro de dossier.
 */
import { lignes } from '@/lib/annonces';

const euros = (montant: number) => montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export function brancherLeCoupon() {
  const formulaire = document.querySelector<HTMLFormElement>('[data-coupon]');
  if (!formulaire) return;

  const zone = (nom: string) => formulaire.querySelector<HTMLElement>(`[data-zone="${nom}"]`)!;
  const texte = formulaire.elements.namedItem('texte') as HTMLTextAreaElement;
  const envoi = formulaire.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const prix = Number(formulaire.dataset.prixLigne);

  const chiffrer = () => {
    const n = lignes(texte.value);
    zone('tarif').textContent = `${n} ligne${n > 1 ? 's' : ''} × ${euros(prix)} = ${euros(n * prix)}`;
  };
  texte.addEventListener('input', chiffrer);
  chiffrer();

  const dire = (message: string) => {
    zone('retour').textContent = message;
    zone('retour').hidden = !message;
  };

  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    dire('');
    envoi.disabled = true;

    const donnees = Object.fromEntries(new FormData(formulaire));
    try {
      const reponse = await fetch(`${formulaire.dataset.guichet}/annonces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
      });
      const corps = (await reponse.json().catch(() => ({}))) as { numero?: string; motif?: string };
      if (!reponse.ok || !corps.numero) throw new Error(corps.motif ?? 'Le guichet n’a pas compris votre coupon.');

      const tampon = zone('tampon');
      zone('dossier').textContent = `Dossier n° ${corps.numero}`;
      tampon.hidden = false;
      tampon.classList.remove('est-applique');
      void tampon.offsetWidth;
      tampon.classList.add('est-applique');
      formulaire.reset();
      chiffrer();
    } catch (erreur) {
      dire(erreur instanceof TypeError ? 'Le guichet ne répond pas. Réessayez plus tard.' : (erreur as Error).message);
    } finally {
      envoi.disabled = false;
    }
  });
}
