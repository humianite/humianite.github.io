import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/**
 * Accès aux contenus. Les pages ne lisent jamais les collections directement :
 * changer de source de données se fait ici et dans `content.config.ts`.
 */

// TODO : contacter la réalité pour obtenir
// une documentation de son API.

export type Article = CollectionEntry<'articles'>;
export type Journaliste = CollectionEntry<'journalistes'>;
export type Rubrique = CollectionEntry<'rubriques'>;
export type Media = CollectionEntry<'medias'>;
export type Video = CollectionEntry<'videos'>;

const parDateDecroissante = <T extends { data: { datePublication: Date } }>(a: T, b: T) =>
  b.data.datePublication.getTime() - a.data.datePublication.getTime();

export const articles = async () => (await getCollection('articles')).sort(parDateDecroissante);

export const articlesDeRubrique = async (rubrique: string) => (await articles()).filter((a) => a.data.rubrique.id === rubrique);

export const articlesDeJournaliste = async (journaliste: string) =>
  (await articles()).filter((a) => a.data.auteur.id === journaliste);

export const rubriques = async () => (await getCollection('rubriques')).sort((a, b) => a.data.ordre - b.data.ordre);

export const journalistes = async () => (await getCollection('journalistes')).sort((a, b) => a.data.ordre - b.data.ordre);

export const videos = async () => (await getCollection('videos')).sort(parDateDecroissante);

export type Annonce = CollectionEntry<'annonces'>;

/** Les plus récentes d'abord ; à date égale, la référence la plus haute. */
export const annonces = async () =>
  (await getCollection('annonces')).sort((a, b) => parDateDecroissante(a, b) || b.data.reference - a.data.reference);

export const journaliste = async (id: string) => (await getEntry('journalistes', id))!;
export const rubrique = async (id: string) => (await getEntry('rubriques', id))!;
export const media = async (id: string) => (await getEntry('medias', id))!;
export const publicites = async () => getCollection('publicites');
export const campagnes = async () => getCollection('campagnes');

export const lienArticle = (article: Article) => `/${article.data.rubrique.id}/${article.id}/`;
export const lienRubrique = (id: string) => `/${id}/`;
export const lienJournaliste = (id: string) => `/redaction/${id}/`;

/** Articles associés : ceux désignés par l'article, complétés par sa rubrique, puis par les plus récents. */
export const articlesAssocies = async (article: Article, nombre = 3) => {
  const tous = (await articles()).filter((a) => a.id !== article.id);
  const designes = article.data.associes.map((ref) => tous.find((a) => a.id === ref.id)).filter((a): a is Article => !!a);
  const memeRubrique = tous.filter((a) => a.data.rubrique.id === article.data.rubrique.id);
  return [...new Set([...designes, ...memeRubrique, ...tous])].slice(0, nombre);
};
