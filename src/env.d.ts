/**
 * Le site masque aussi des éléments SVG par l'attribut `hidden` (voir `[hidden]` dans global.css),
 * que les types d'Astro ne connaissent que sur le HTML.
 */
declare namespace astroHTML.JSX {
  interface SVGAttributes {
    hidden?: boolean;
  }
}
