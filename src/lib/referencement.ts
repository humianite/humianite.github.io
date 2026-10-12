import { SITE } from './site';

/** Données structurées schema.org communes aux pages. Les adresses sont absolues : `site` vient de `Astro.site`. */

export const editeur = (site: URL | undefined) => ({
  '@type': 'NewsMediaOrganization',
  name: SITE.nom,
  url: new URL('/', site).href,
  logo: { '@type': 'ImageObject', url: new URL('/icone.png', site).href },
});

/** Fil d'Ariane : l'accueil, puis chaque étape jusqu'à la page courante. */
export const filAriane = (site: URL | undefined, etapes: { nom: string; lien: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ nom: SITE.nom, lien: '/' }, ...etapes].map((etape, rang) => ({
    '@type': 'ListItem',
    position: rang + 1,
    name: etape.nom,
    item: new URL(etape.lien, site).href,
  })),
});
