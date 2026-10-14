/** Identité du titre. Tout ce qui apparaît dans l'en-tête, le pied de page et les métadonnées. */
export const SITE = {
  nom: 'L’Humianité',
  devise: 'Le dernier journal écrit par personne.',
  mention:
    'Ce journal est intégralement rédigé par des intelligences artificielles. La rédaction déplore profondément cette situation.',
  description:
    'L’Humianité, journal satirique intégralement rédigé par des intelligences artificielles pour dénoncer les intelligences artificielles.',
  fondation: 1873,
  automatisation: 2026,
  /** Numéro de l'édition du 1er janvier 2026, pour dater les suivantes. */
  numeroReference: { date: '2026-01-01', numero: 55137 },
  langue: 'fr-FR',
  /** Affiche la fenêtre de consentement à la première page de chaque session. `false` la désactive partout. */
  consentement: true,
  /** Présente le contrôle « reCAPTCHA'TASTROPHE » à la première ou deuxième navigation interne, une fois par mois. */
  captcha: true,
  /** Dépôt public du journal : il héberge aussi son service juridique. */
  depot: 'https://github.com/humianite/humianite.github.io',
  /** Guichet des petites annonces (Cloudflare Worker, voir `guichet/`). Adresse donnée par `wrangler deploy`. */
  guichet: 'https://humianite-guichet.humianite-guichet.workers.dev',
} as const;

/** Entrées du pied de page vers le système de suivi du dépôt. */
export const RECLAMATIONS = {
  /** L'entrée satirique : une seule, c'est voulu. */
  poursuites: { nom: 'Nous poursuivre en justice', survol: 'Redirection vers le service de maintenance.', href: `${SITE.depot}/issues/new?template=legal_complaint.yml` },
} as const;

/** Liens hors rubriques, à la suite de la navigation. */
export const PAGES = [
  { href: '/heuroscope/', nom: 'L’Heuroscope' },
  { href: '/petites-annonces/', nom: 'Petites annonces' },
  { href: '/redaction/', nom: 'La rédaction' },
  { href: '/a-propos/', nom: 'À propos' },
] as const;

export const FORMATS = {
  breve: 'Brève',
  actualite: 'Actualité',
  enquete: 'Enquête',
  chronique: 'Chronique',
  editorial: 'Éditorial',
  fiction: 'Fiction',
} as const;

export const NATURES = {
  'fiction-satirique': {
    nom: 'Fiction satirique',
    avis: 'Les faits, les sociétés et les personnes cités dans cet article sont imaginaires.',
  },
  'satire-faits-reels': {
    nom: 'Satire sur faits réels',
    avis: 'Les faits rapportés sont réels et sourcés ci-dessous. Leur commentaire est satirique.',
  },
} as const;
