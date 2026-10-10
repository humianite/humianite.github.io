/** Rendu des champs d'une étape : saisie de texte, cases à cocher, choix unique, grille de portraits. */
import { type Champ, type Dossier, type Etape, annexeVisible, cochees, optionsVisibles, outilsVisibles, texteDe } from '../moteur.ts';
import type { Sujet } from '../parcours/index.ts';
import { portrait } from '../portraits.ts';
import { h, svg } from './dom.ts';

interface Contexte {
  /** Le dossier dans son état courant. */
  dossier: () => Dossier;
  /** Enregistre une réponse et rend l'éventuelle réaction de l'administration. */
  modifier: (etape: Etape, champ: string, valeur: string | string[]) => string | undefined;
  /** Met à jour les règles et le message affichés sous les champs. */
  actualiser: (etape: Etape, message?: string) => void;
}

export function creerChamps(ctx: Contexte) {
  function champTexte(e: Etape, champ: Champ, decrit: string) {
    const id = `champ-${champ.id}`;
    const zone = champ.type === 'zone';
    const saisie = h(zone ? 'textarea' : 'input', {
      id,
      class: 'champ__saisie',
      ...(zone ? { rows: 3 } : { type: 'text' }),
      autocomplete: 'off',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      'aria-describedby': decrit,
      oninput: () => {
        ctx.modifier(e, champ.id, saisie.value);
        // Le motif du dernier refus ne vaut plus dès que la saisie change.
        ctx.actualiser(e, '');
      },
    }) as HTMLInputElement | HTMLTextAreaElement;
    saisie.value = texteDe(ctx.dossier(), champ.id);

    const outils = outilsVisibles(ctx.dossier(), e, champ).map((outil) =>
      h('button', {
        type: 'button',
        class: 'bouton bouton--discret',
        onclick: () => {
          saisie.value = outil.appliquer(saisie.value);
          ctx.modifier(e, champ.id, saisie.value);
          ctx.actualiser(e);
          saisie.focus();
        },
      }, outil.libelle),
    );

    const annexe = annexeVisible(ctx.dossier(), e, champ);

    return h('div', { class: 'champ' },
      h('label', { class: 'champ__libelle', for: id }, champ.libelle),
      champ.modele && h('p', { class: 'champ__modele' }, champ.modele),
      saisie,
      outils.length > 0 && h('div', { class: 'champ__outils' }, ...outils),
      champ.aide && h('p', { class: 'champ__aide' }, champ.aide),
      annexe && h('details', { class: 'champ__annexe' }, h('summary', {}, annexe.titre), h('ul', {}, ...annexe.termes.map((terme) => h('li', {}, terme)))),
    );
  }

  function champCases(e: Etape, champ: Champ, decrit: string) {
    const grille = champ.type === 'grille';
    const cases = new Map<string, HTMLInputElement>();
    const options = optionsVisibles(ctx.dossier(), e, champ);

    const elements = options.map((option, rang) => {
      const id = `champ-${champ.id}-${option.id}`;
      const boite = h('input', {
        type: 'checkbox',
        id,
        checked: cochees(ctx.dossier(), champ.id).includes(option.id),
        onchange: () => {
          const voulues = options.filter((o) => cases.get(o.id)!.checked).map((o) => o.id);
          const message = ctx.modifier(e, champ.id, voulues);
          // L'administration a pu revenir sur ce qui vient d'être coché.
          for (const [cle, autre] of cases) autre.checked = cochees(ctx.dossier(), champ.id).includes(cle);
          ctx.actualiser(e, message);
        },
      }) as HTMLInputElement;
      cases.set(option.id, boite);
      return grille
        ? h('label', { class: 'vignette', for: id },
            boite,
            h('span', { class: 'vignette__image' }, svg(portrait(option.donnees as unknown as Sujet))),
            h('span', { class: 'vignette__nom' }, option.libelle),
            h('span', { class: 'vignette__description' }, option.description ?? ''),
          )
        : h('label', { class: 'case', for: id }, boite, h('span', {}, champ.options!.length > 2 && h('b', {}, `${rang + 1}. `), option.libelle));
    });

    const bascule = grille && h('button', {
      type: 'button',
      class: 'bouton bouton--discret',
      'aria-pressed': 'false',
      onclick: (evenement: Event) => {
        const bouton = evenement.currentTarget as HTMLButtonElement;
        const actif = bouton.getAttribute('aria-pressed') !== 'true';
        bouton.setAttribute('aria-pressed', String(actif));
        ensemble.classList.toggle('champ--decrit', actif);
      },
    }, 'Afficher la description des portraits');

    const ensemble = h('fieldset', { class: `champ champ--${champ.type}`, 'aria-describedby': decrit },
      h('legend', { class: 'champ__libelle' }, champ.libelle),
      h('div', { class: grille ? 'vignettes' : 'cases' }, ...elements),
      bascule,
    );
    return ensemble;
  }

  function champChoix(e: Etape, champ: Champ, decrit: string) {
    return h('fieldset', { class: 'champ champ--choix', 'aria-describedby': decrit },
      h('legend', { class: 'champ__libelle' }, champ.libelle),
      h('div', { class: 'choix' },
        ...optionsVisibles(ctx.dossier(), e, champ).map((option) => {
          const id = `champ-${champ.id}-${option.id}`;
          return h('label', { class: 'case', for: id },
            h('input', { type: 'radio', id, name: champ.id, checked: texteDe(ctx.dossier(), champ.id) === option.id, onchange: () => { ctx.modifier(e, champ.id, option.id); ctx.actualiser(e); } }),
            h('span', {}, option.libelle),
          );
        }),
      ),
    );
  }

  /** Construit l'élément d'un champ. `decrit` liste les identifiants qui le décrivent aux technologies d'assistance. */
  return (e: Etape, champ: Champ, decrit: string) =>
    champ.type === 'cases' || champ.type === 'grille' ? champCases(e, champ, decrit) : champ.type === 'choix' ? champChoix(e, champ, decrit) : champTexte(e, champ, decrit);
}
