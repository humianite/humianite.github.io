import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { articles, journaliste, lienArticle, rubrique } from '@/lib/contenu';
import { SITE } from '@/lib/site';

/** Le fil du journal : les trente derniers articles, du plus récent au plus ancien. */
export async function GET(contexte: APIContext) {
  const derniers = (await articles()).slice(0, 30);
  return rss({
    title: SITE.nom,
    description: SITE.description,
    site: contexte.site!,
    customData: '<language>fr-FR</language>',
    items: await Promise.all(
      derniers.map(async (article) => ({
        title: article.data.titre,
        description: article.data.chapo,
        link: lienArticle(article),
        pubDate: article.data.datePublication,
        author: (await journaliste(article.data.auteur.id)).data.nom,
        categories: [(await rubrique(article.data.rubrique.id)).data.nom],
      })),
    ),
  });
}
