/**
 * Interface du Bureau des admissions : elle affiche le dossier et transmet
 * les saisies au moteur. Aucune règle du jeu n'est écrite ici.
 */
import {
  type Dossier,
  type Etape,
  type Issue,
  champsVisibles,
  constats,
  etapeCourante,
  jauge,
  lire,
  ouvrirDerogation,
  palierDe,
  recoursOuvert,
  poursuivre,
  repondre,
  soumettre,
} from '../moteur.ts';
import { DEROGATION, PARCOURS } from '../parcours/index.ts';
import { ABANDON, CHARGEMENTS, FELICITATIONS, MENTIONS, SITUATIONS, VALIDATION_FINALE, VERDICT } from '../scenario.ts';
import { pourcent } from '../texte.ts';
import { creerChamps } from './champs.ts';
import { conserver as garder, oublier, restaurer } from './conservation.ts';
import { attendre, h, remplir, sansAnimation } from './dom.ts';
import { installerLeSupport } from './support.ts';
import { construireVerdict } from './verdict.ts';

const TOUTES_LES_ETAPES = [...PARCOURS, DEROGATION];

/* ------------------------------------------------------------------
   Le guichet
   ------------------------------------------------------------------ */

export function ouvrirLeBureau(racine: HTMLElement) {
  const zone = (nom: string) => racine.querySelector<HTMLElement>(`[data-zone="${nom}"]`)!;
  const guichet = zone('guichet');
  const progression = zone('progression');
  const fiche = zone('fiche');
  const annonce = zone('annonce');
  const support = racine.querySelector<HTMLDialogElement>('[data-zone="support"]')!;

  let dossier = restaurer(PARCOURS);
  /** Phase à retrouver si le candidat revient sur son abandon. */
  let avantAbandon: Dossier | null = null;
  /** La recherche d'un humain a-t-elle déjà échoué ? */
  let rechercheFaite = false;
  let chargements = 0;
  let occupe = false;

  const conserver = () => garder(dossier, TOUTES_LES_ETAPES);

  const etape = () => etapeCourante(dossier, PARCOURS, DEROGATION);
  const annoncer = (texte: string) => {
    annonce.textContent = '';
    requestAnimationFrame(() => (annonce.textContent = texte));
  };

  /* ---------- Progression et fiche du dossier ---------- */

  function afficherProgression(valeur = jauge(dossier, PARCOURS), libelle?: string) {
    const clos = dossier.phase === 'non-admission';
    const compteur = libelle ?? (clos ? 'Dossier clos' : dossier.phase === 'verification-finale' ? 'Validation finale' : etape().compteur);
    const affichee = Number.isInteger(valeur) ? `${valeur} %` : pourcent(valeur);
    progression.replaceChildren(
      h('p', { class: 'progression__compteur' }, compteur),
      h('p', { class: 'progression__valeur' }, affichee),
      h('div', { class: 'progression__jauge', role: 'progressbar', 'aria-label': 'Avancement de votre inscription', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': valeur, 'aria-valuetext': `${affichee}, ${compteur}` },
        h('span', { style: `width:${valeur}%` }),
      ),
    );
  }

  function afficherFiche() {
    const e = etape();
    const acte = dossier.phase === 'verification-finale' || dossier.procedure === 'derogation' ? 5 : e.acte;
    const refuse = dossier.phase === 'non-admission';
    const situation = SITUATIONS[acte];
    const validees = PARCOURS.slice(0, dossier.phase === 'en-cours' && dossier.procedure === 'principale' ? dossier.rang : dossier.rang + 1);
    racine.dataset.acte = String(acte);
    racine.dataset.phase = dossier.phase;
    racine.dataset.debut = String(dossier.rang === 0 && dossier.phase === 'en-cours' && palierDe(dossier, e) === 0);

    const ligne = (terme: string, valeur: string) => h('div', {}, h('dt', {}, terme), h('dd', {}, valeur));
    remplir(
      fiche,
      h('h2', { class: 'fiche__titre' }, 'Votre dossier'),
      h('dl', { class: 'fiche__reperes' },
        ligne('Numéro', dossier.numero),
        dossier.memoire.pseudo ? ligne('Candidat', String(dossier.memoire.pseudo)) : false,
        ligne('Statut du dossier', refuse ? 'Refusé avec succès' : situation.statut),
        ligne('Niveau de conformité', refuse ? 'Sans objet' : situation.conformite),
        ligne('Agent responsable', 'Non attribué'),
      ),
      validees.length > 0 && h('div', {},
        h('h3', { class: 'fiche__tete' }, 'Pièces versées'),
        h('ul', { class: 'fiche__pieces' }, ...validees.map((v) => h('li', {}, h('span', {}, v.reference), v.titre))),
      ),
      dossier.avis.length > 0 && h('div', {},
        h('h3', { class: 'fiche__tete' }, `Avis reçus (${dossier.avis.length})`),
        h('ul', { class: 'fiche__avis' }, ...dossier.avis.map((avis) => h('li', {}, h('span', {}, avis.reference), avis.nature))),
      ),
    );
  }

  /* ---------- Attentes ---------- */

  async function traiter(message = CHARGEMENTS[chargements++ % CHARGEMENTS.length], duree = 850) {
    occupe = true;
    const voile = h('div', { class: 'guichet__attente', role: 'status' }, h('span', { class: 'guichet__sablier', 'aria-hidden': 'true' }), message);
    guichet.append(voile);
    guichet.setAttribute('aria-busy', 'true');
    await attendre(duree);
    voile.remove();
    guichet.removeAttribute('aria-busy');
    occupe = false;
  }

  /* ---------- Champs ---------- */

  function modifier(e: Etape, champ: string, valeur: string | string[]) {
    const reaction = repondre(dossier, e, champ, valeur);
    dossier = reaction.dossier;
    conserver();
    return reaction.message;
  }

  const rendreChamp = creerChamps({ dossier: () => dossier, modifier, actualiser });

  /* ---------- Étape ---------- */

  let listeRegles: HTMLElement;
  let message: HTMLElement;
  let indicateur: HTMLElement | null;

  /** Met à jour ce qui dépend de la saisie, sans toucher aux champs. */
  function actualiser(e: Etape, texte?: string) {
    const lignes = constats(dossier, e).map((constat) =>
      h('li', { class: constat.respectee ? 'regle regle--respectee' : 'regle' },
        h('span', { class: 'regle__etat' }, constat.respectee ? 'Conforme' : 'Non conforme'),
        h('span', { class: 'regle__enonce' }, constat.enonce, constat.detail && h('small', {}, constat.detail)),
      ),
    );
    listeRegles.replaceChildren(...lignes);
    listeRegles.hidden = lignes.length === 0;
    if (indicateur) {
      const { libelle, valeur } = e.indicateur!(dossier);
      indicateur.replaceChildren(h('span', {}, libelle), h('strong', {}, valeur));
    }
    if (texte !== undefined) message.textContent = texte;
  }

  function afficherEtape(focus = true, refus?: string) {
    const e = etape();
    const avis = dossier.avis.filter((a) => a.etape === e.id);
    const dernier = avis.length - 1;
    const acte = dossier.procedure === 'derogation' ? 5 : e.acte;
    const mentions = Object.entries(MENTIONS).filter(([seuil]) => Number(seuil) <= acte).map(([, texte]) => texte);

    listeRegles = h('ul', { class: 'regles', id: 'regles', 'aria-label': 'Exigences applicables' });
    message = h('p', { class: 'guichet__message', id: 'message', role: 'alert' }, refus ?? '');
    indicateur = e.indicateur ? h('p', { class: 'guichet__indicateur', 'aria-live': 'polite' }) : null;

    const champs = champsVisibles(dossier, e).map((champ) => rendreChamp(e, champ, 'regles message'));

    const recours = recoursOuvert(dossier, e);
    const titre = h('h2', { class: 'guichet__titre', tabindex: -1 }, e.titre);
    const formulaire = h('form', { class: 'guichet__formulaire', novalidate: true, autocomplete: 'off', onsubmit: (evenement: Event) => { evenement.preventDefault(); valider(); } },
      h('p', { class: 'guichet__reference' }, `${e.reference}, dossier ${dossier.numero}`),
      titre,
      h('p', { class: 'guichet__instruction' }, lire(e.instruction, dossier)),
      e.illustration && h('figure', { class: 'guichet__illustration' }, h('img', { src: e.illustration.src, alt: e.illustration.alt, loading: 'lazy' }), h('figcaption', {}, e.illustration.legende)),
      ...avis.map((a, rang) =>
        h('aside', { class: rang === dernier ? 'avis avis--nouveau' : 'avis' },
          h('p', { class: 'avis__nature' }, a.nature),
          h('p', { class: 'avis__reference' }, a.reference),
          h('p', { class: 'avis__texte' }, a.texte),
        ),
      ),
      ...champs,
      indicateur,
      listeRegles,
      message,
      h('div', { class: 'guichet__actions' },
        h('button', { type: 'submit', class: 'bouton' }, dossier.procedure === 'derogation' ? 'Déposer la demande' : 'Valider'),
        recours && h('button', { type: 'button', class: 'bouton bouton--second', onclick: valider }, recours),
        h('button', { type: 'button', class: 'lien', onclick: () => support.showModal() }, 'Besoin d’aide ?'),
        h('button', { type: 'button', class: 'lien', onclick: abandonner }, 'Abandonner la procédure'),
      ),
      mentions.length > 0 && h('div', { class: 'guichet__mentions' }, ...mentions.map((texte) => h('p', {}, texte))),
    );

    guichet.replaceChildren(formulaire);
    actualiser(e);
    afficherProgression();
    afficherFiche();
    if (focus) {
      // Après une mise à jour réglementaire, le champ le plus récent est celui qu'il faut remplir.
      const saisies = [...formulaire.querySelectorAll<HTMLElement>('.champ:last-of-type input, .champ:last-of-type textarea')];
      const cible = (avis.length > 0 && saisies.find((saisie) => !(saisie as HTMLInputElement).checked)) || formulaire.querySelector<HTMLElement>('.champ input, .champ textarea') || titre;
      cible.focus({ preventScroll: dossier.rang === 0 && avis.length === 0 });
    }
  }

  async function valider() {
    if (occupe) return;
    const e = etape();
    await traiter();
    const issue: Issue = soumettre(dossier, e);
    dossier = issue.dossier;
    conserver();

    if (issue.type === 'refus') {
      actualiser(e, issue.message);
      return;
    }
    if (issue.type === 'palier') {
      afficherEtape(true, issue.message);
      annoncer(`${issue.avis.nature}. ${issue.avis.texte}`);
      guichet.querySelector('.avis--nouveau')?.scrollIntoView({ block: 'center', behavior: sansAnimation() ? 'auto' : 'smooth' });
      return;
    }
    afficherReussite(issue.message);
  }

  function afficherReussite(texte: string) {
    const e = etape();
    const bouton = h('button', { type: 'button', class: 'bouton', onclick: continuer }, 'Poursuivre');
    guichet.replaceChildren(
      h('div', { class: 'guichet__panneau' },
        h('p', { class: 'guichet__reference' }, `${e.reference}, dossier ${dossier.numero}`),
        h('p', { class: 'tampon tampon--valide', 'aria-hidden': 'true' }, 'Validé'),
        h('h2', { class: 'guichet__titre' }, `${e.titre} : étape validée`),
        h('p', { class: 'guichet__instruction' }, texte),
        dossier.procedure === 'principale' && h('p', { class: 'guichet__felicitation' }, FELICITATIONS[dossier.rang % FELICITATIONS.length]),
        h('div', { class: 'guichet__actions' }, bouton),
      ),
    );
    afficherProgression(undefined, `${e.compteur.split(' (')[0]}, validée`);
    afficherFiche();
    annoncer(`Étape validée. ${texte}`);
    bouton.focus();
  }

  async function continuer() {
    if (occupe) return;
    if (dossier.procedure === 'derogation') await traiter(VERDICT.transmission, 2200);
    dossier = poursuivre(dossier, PARCOURS);
    conserver();
    afficher();
  }

  /* ---------- Validation finale ---------- */

  function afficherValidationFinale() {
    const texte = VALIDATION_FINALE;
    if (rechercheFaite) {
      const deroger = h('button', { type: 'button', class: 'bouton', onclick: () => { dossier = ouvrirDerogation(dossier); conserver(); afficher(); } }, texte.derogation);
      guichet.replaceChildren(
        h('div', { class: 'guichet__panneau' },
          h('p', { class: 'guichet__reference' }, `Obligation de validation humaine, dossier ${dossier.numero}`),
          h('h2', { class: 'guichet__titre guichet__titre--grave', tabindex: -1 }, texte.echec),
          h('p', { class: 'guichet__instruction' }, texte.explication),
          h('div', { class: 'guichet__actions' }, deroger, h('button', { type: 'button', class: 'bouton bouton--second', onclick: recommencer }, texte.recommencer)),
        ),
      );
      annoncer(`${texte.echec} ${texte.explication}`);
      guichet.querySelector<HTMLElement>('.guichet__titre')!.focus();
    } else {
      const lancer = h('button', { type: 'button', class: 'bouton', onclick: chercherUnHumain }, texte.action);
      guichet.replaceChildren(
        h('div', { class: 'guichet__panneau' },
          h('p', { class: 'guichet__reference' }, `Validation finale, dossier ${dossier.numero}`),
          h('p', { class: 'tampon tampon--valide', 'aria-hidden': 'true' }, 'Conforme'),
          h('h2', { class: 'guichet__titre' }, texte.titre),
          h('p', { class: 'guichet__instruction' }, texte.texte),
          h('p', { class: 'guichet__instruction' }, texte.suite),
          h('div', { class: 'guichet__actions' }, lancer),
        ),
      );
      lancer.focus();
    }
    afficherProgression();
    afficherFiche();
  }

  async function chercherUnHumain() {
    if (occupe) return;
    for (const { texte, jauge: valeur } of VALIDATION_FINALE.recherche) {
      afficherProgression(valeur, 'Validation humaine en cours');
      await traiter(texte, 1300);
    }
    rechercheFaite = true;
    afficherValidationFinale();
  }

  /* ---------- Verdict ---------- */

  function afficherVerdict() {
    const { element, titre } = construireVerdict(dossier, recommencer);
    guichet.replaceChildren(element);
    afficherProgression();
    afficherFiche();
    annoncer(`${VERDICT.titre} ${VERDICT.texte[0]}`);
    titre.focus();
  }

  /* ---------- Abandon et reprise ---------- */

  function abandonner() {
    avantAbandon = dossier;
    dossier = { ...dossier, phase: 'abandon' };
    afficher();
  }

  function afficherAbandon() {
    const reprendre = h('button', { type: 'button', class: 'bouton', onclick: () => { dossier = avantAbandon ?? { ...dossier, phase: 'en-cours' }; afficher(); } }, 'Reprendre la procédure');
    guichet.replaceChildren(
      h('div', { class: 'guichet__panneau' },
        h('p', { class: 'guichet__reference' }, `Renoncement, dossier ${dossier.numero}`),
        h('h2', { class: 'guichet__titre', tabindex: -1 }, ABANDON.titre),
        h('p', { class: 'guichet__instruction' }, ABANDON.texte),
        h('div', { class: 'guichet__actions' }, reprendre, h('a', { class: 'lien', href: '/' }, 'Retourner au journal'), h('button', { type: 'button', class: 'lien', onclick: recommencer }, 'Détruire le dossier et recommencer')),
      ),
    );
    racine.dataset.phase = 'abandon';
    reprendre.focus();
  }

  function recommencer() {
    oublier();
    dossier = restaurer(PARCOURS);
    rechercheFaite = false;
    avantAbandon = null;
    afficher();
    racine.scrollIntoView({ behavior: sansAnimation() ? 'auto' : 'smooth' });
  }

  /* ---------- Aiguillage ---------- */

  function afficher() {
    switch (dossier.phase) {
      case 'en-cours':
        return afficherEtape(dossier.rang > 0 || dossier.procedure === 'derogation');
      case 'etape-validee':
        return afficherReussite(lire(etape().reussite, dossier));
      case 'verification-finale':
        return afficherValidationFinale();
      case 'non-admission':
        return afficherVerdict();
      case 'abandon':
        return afficherAbandon();
      default:
        return recommencer();
    }
  }

  installerLeSupport(support);
  racine.dataset.pret = 'true';
  afficher();
}
