/** L'écran final : le verdict, l'attestation de non-admission et sa célébration déplacée. */
import type { Dossier } from '../moteur.ts';
import { VERDICT } from '../scenario.ts';
import { h, sansAnimation } from './dom.ts';

/** Célébration déplacée : des confettis de perforatrice. */
function confettis() {
  if (sansAnimation()) return false;
  return h('div', { class: 'confettis', 'aria-hidden': 'true' },
    ...Array.from({ length: 70 }, (_, rang) =>
      h('i', { style: `left:${(rang * 37) % 100}%;animation-delay:${((rang * 53) % 30) / 10}s;animation-duration:${3 + ((rang * 17) % 25) / 10}s;--derive:${((rang * 29) % 80) - 40}px` }),
    ),
  );
}

/** Construit l'écran du verdict. Rend l'élément à afficher et le titre à mettre au focus. */
export function construireVerdict(dossier: Dossier, recommencer: () => void) {
  const { certificat } = VERDICT;
  const candidat = String(dossier.memoire.pseudo ?? 'Candidat non identifié');
  const adresse = new URL('/inscription/', location.href).href;
  const retour = h('p', { class: 'verdict__retour', role: 'status' });

  const partager = async () => {
    const texte = VERDICT.partage(adresse);
    try {
      if (navigator.share) await navigator.share({ text: texte });
      else {
        await navigator.clipboard.writeText(texte);
        retour.textContent = 'Texte copié. Votre échec est prêt à être diffusé.';
      }
    } catch {
      retour.textContent = `À copier : ${texte}`;
    }
  };

  const titre = h('h2', { class: 'verdict__titre', tabindex: -1 }, VERDICT.titre);

  const element = h('div', { class: 'verdict' },
    confettis(),
    h('p', { class: 'guichet__reference' }, `Décision définitive, dossier ${dossier.numero}`),
    titre,
    ...VERDICT.texte.map((paragraphe) => h('p', { class: 'guichet__instruction' }, paragraphe)),
    h('p', { class: 'verdict__signature' }, VERDICT.signature, h('span', {}, 'L’Humianité, le dernier journal écrit par personne.')),
    h('section', { class: 'certificat', 'aria-label': certificat.titre },
      h('p', { class: 'tampon tampon--refuse', 'aria-hidden': 'true' }, 'Refusé'),
      h('p', { class: 'certificat__journal' }, 'L’Humianité'),
      h('h3', { class: 'certificat__titre' }, certificat.titre),
      h('p', {}, certificat.preambule),
      h('p', { class: 'certificat__candidat' }, candidat),
      h('p', {}, certificat.corps),
      h('dl', { class: 'certificat__lignes' }, ...certificat.lignes.map(([terme, valeur]) => h('div', {}, h('dt', {}, terme), h('dd', {}, valeur)))),
      h('p', { class: 'certificat__remerciement' }, certificat.remerciement),
      h('p', { class: 'certificat__pied' }, `Dossier ${dossier.numero}, fait le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, en un exemplaire non remis.`),
    ),
    h('div', { class: 'guichet__actions' },
      h('button', { type: 'button', class: 'bouton', onclick: partager }, 'Partager mon échec'),
      h('button', { type: 'button', class: 'bouton bouton--second', onclick: recommencer }, 'Recommencer la procédure'),
      h('a', { class: 'lien', href: '/' }, 'Retourner au journal'),
    ),
    retour,
    h('p', { class: 'verdict__recours' }, VERDICT.recours),
  );

  return { element, titre };
}
