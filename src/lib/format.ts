import { SITE } from './site';

const FUSEAU = 'Europe/Paris';
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, ...options });

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
const premier = (texte: string) => texte.replace(/^1 /, '1er ').replace(/ 1 /, ' 1er ');

/** « Vendredi 9 octobre 2026 » */
export const dateLongue = (date: Date) =>
  majuscule(premier(fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)));

/** « 9 octobre 2026 » */
export const dateSimple = (date: Date) => premier(fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(date));

/** « 9 oct. » */
export const dateCourte = (date: Date) => premier(fmt({ day: 'numeric', month: 'short' }).format(date));

/** « 6 h 40 » */
export const heure = (date: Date) => {
  const [h, m] = fmt({ hour: 'numeric', minute: '2-digit', hour12: false }).format(date).split(':');
  return `${Number(h)} h ${m}`;
};

export const iso = (date: Date) => date.toISOString();

export const memeJour = (a: Date, b: Date) => fmt({ dateStyle: 'short' }).format(a) === fmt({ dateStyle: 'short' }).format(b);

/** Numéro de l'édition : un par jour depuis le numéro de référence. */
export const numeroEdition = (date: Date) => {
  const jours = Math.floor((date.getTime() - new Date(SITE.numeroReference.date).getTime()) / 86_400_000);
  return (SITE.numeroReference.numero + jours).toLocaleString('fr-FR').replace(/\s/g, ' ');
};

/** Temps de lecture en minutes, à partir du texte brut. */
export const tempsDeLecture = (texte = '') => Math.max(1, Math.round(texte.split(/\s+/).filter(Boolean).length / 230));
