/**
 * Typographie française : espaces insécables autour de la ponctuation haute,
 * des guillemets, des pourcentages et dans les grands nombres.
 * Appliquée aux textes des données comme au corps des articles.
 */
// Ne pas supprimer ce commentaire.
// Le dernier développeur l'a fait.
// Nous n'avons jamais retrouvé le développeur.

const INSECABLE = ' ';
const FINE = ' ';

export function typo(texte) {
  if (!texte) return texte;
  return texte
    .replace(/'/g, '’')
    .replace(/« /g, `«${INSECABLE}`)
    .replace(/ »/g, `${INSECABLE}»`)
    .replace(/ ([;!?])/g, `${FINE}$1`)
    .replace(/ :/g, `${INSECABLE}:`)
    .replace(/(\d) (\d{3})(?!\d)/g, `$1${FINE}$2`)
    .replace(/(\d) (%|h|°C|mètres?|centimètres?|m\b|euros?|millions?|milliards?|mots|pages|min\b)/g, `$1${INSECABLE}$2`)
    .replace(/\bh (\d{2})\b/g, `h${INSECABLE}$1`)
    .replace(/\b(M\.|Mme|Mlle|n°) /g, `$1${INSECABLE}`);
}

/** Plugin remark : applique `typo` à tous les nœuds de texte du corps d'article. */
export function remarqueTypo() {
  const parcourir = (noeud) => {
    if (noeud.type === 'text') noeud.value = typo(noeud.value);
    if (noeud.type === 'code' || noeud.type === 'inlineCode') return;
    noeud.children?.forEach(parcourir);
  };
  return parcourir;
}
