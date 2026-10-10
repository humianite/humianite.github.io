import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Source de données locale.
 * Chaque collection passe par un loader : pour brancher un CMS ou une API,
 * il suffit de remplacer le loader, le schéma et le rendu ne bougent pas.
 */

/** Adresse web : http ou https uniquement, pour qu'aucun contenu ne puisse glisser un lien `javascript:` ou `data:`. */
const adresseWeb = z.string().url().refine((adresse) => /^https?:\/\//i.test(adresse), 'Seules les adresses http(s) sont admises.');

export const FORMATS = ['breve', 'actualite', 'enquete', 'chronique', 'editorial', 'fiction'] as const;
export const NATURES = ['fiction-satirique', 'satire-faits-reels'] as const;

const rubriques = defineCollection({
  loader: file('src/data/rubriques.json'),
  schema: z.object({
    identifiant: z.string(),
    nom: z.string(),
    description: z.string(),
    ordre: z.number(),
    type: z.enum(['articles', 'videos']).default('articles'),
    dansNavigation: z.boolean().default(true),
  }),
});

const medias = defineCollection({
  loader: file('src/data/medias.json'),
  schema: z.object({
    identifiant: z.string(),
    type: z.enum(['photo', 'portrait', 'dessin', 'miniature']),
    /** Chemin du fichier une fois l'image produite. Absent : un cliché d'attente est composé. */
    src: z.string().optional(),
    alt: z.string(),
    legende: z.string().optional(),
    credit: z.string(),
    /** Description de l'image à produire, anomalies comprises. Sert de consigne de génération. */
    description: z.string(),
    ratio: z.string().default('3 / 2'),
    /** Point de l'image à garder au centre quand elle est recadrée (valeur CSS `object-position`). */
    cadrage: z.string().optional(),
  }),
});

const journalistes = defineCollection({
  loader: file('src/data/journalistes.json'),
  schema: z.object({
    identifiant: z.string(),
    nom: z.string(),
    fonction: z.string(),
    portrait: reference('medias'),
    accroche: z.string(),
    biographie: z.array(z.string()),
    style: z.string(),
    obsessions: z.array(z.string()),
    citation: z.string(),
    entree: z.string(),
    courriel: z.string(),
    tensions: z.array(z.object({ avec: reference('journalistes'), texte: z.string() })).default([]),
    ordre: z.number(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/articles' }),
  schema: z.object({
    identifiant: z.string(),
    titre: z.string(),
    surtitre: z.string().optional(),
    chapo: z.string(),
    rubrique: reference('rubriques'),
    auteur: reference('journalistes'),
    datePublication: z.coerce.date(),
    dateMiseAJour: z.coerce.date().optional(),
    format: z.enum(FORMATS),
    /** Satire entièrement fictive, ou traitement satirique d'événements réels (sources exigées). */
    nature: z.enum(NATURES).default('fiction-satirique'),
    image: reference('medias').optional(),
    legende: z.string().optional(),
    sources: z
      .array(z.object({ titre: z.string(), editeur: z.string().optional(), url: adresseWeb.optional(), date: z.string().optional() }))
      .default([]),
    associes: z.array(reference('articles')).default([]),
    motsCles: z.array(z.string()).default([]),
    /** Dysfonctionnements volontaires activés sur cet article. Aucun n'est annoncé au lecteur. */
    dysfonctionnements: z.array(z.enum(['fiabilite', 'date', 'legende', 'note', 'fin'])).default([]),
    /** Poids à la une : plus il est élevé, plus l'article remonte. */
    poids: z.number().default(0),
  }),
});

const videos = defineCollection({
  loader: file('src/data/videos.json'),
  schema: z.object({
    identifiant: z.string(),
    titre: z.string(),
    description: z.string(),
    datePublication: z.coerce.date(),
    duree: z.string(),
    plateforme: z.enum(['youtube']).default('youtube'),
    /** Identifiant de la vidéo sur la plateforme. Absent : la vidéo est annoncée mais pas encore en ligne. */
    idExterne: z.string().regex(/^[\w-]{6,20}$/, 'Identifiant de vidéo inattendu.').optional(),
    miniature: reference('medias'),
    auteur: reference('journalistes').optional(),
  }),
});

/** Les campagnes : un annonceur et ses visuels, déclinés par format d'emplacement. */
const campagnes = defineCollection({
  loader: file('src/data/campagnes.json'),
  schema: z.object({
    annonceur: z.string(),
    /** Ce que dit l'annonce, pour qui ne voit pas l'image. */
    alt: z.string(),
    url: adresseWeb.optional(),
    /** Bandeau 1940 × 500, pavé 1200 × 1000, colonne 600 × 1200. Le bandeau mobile est au format du pavé. */
    visuels: z.object({
      bandeau: z.string().optional(),
      bandeauMobile: z.string().optional(),
      pave: z.string().optional(),
      colonne: z.string().optional(),
    }),
  }),
});

const publicites = defineCollection({
  loader: file('src/data/publicites.json'),
  schema: z.object({
    format: z.enum(['bandeau', 'pave', 'colonne']),
    emplacement: z.string(),
    /** Campagne imposée. Absente : l'emplacement tire la sienne parmi celles qui ont un visuel à son format. */
    campagne: reference('campagnes').optional(),
  }),
});

/** Les signes de l'Heuroscope : un système symbolique stable, d'une édition à l'autre. */
const signes = defineCollection({
  loader: file('src/data/heuroscope-signes.json'),
  schema: z.object({
    identifiant: z.string(),
    ordre: z.number(),
    nom: z.string(),
    /** Objet de tutelle du signe. */
    tutelle: z.string(),
    /** À quoi l'on reconnaît que l'on relève de ce signe. */
    critere: z.string(),
    /** Emblème dessiné, quand il existe. À défaut, le pictogramme du site est tracé. */
    embleme: z.string().optional(),
  }),
});

const prediction = z.object({
  texte: z.string(),
  /** 0 : flottement. 1 : contrariété légère. 2 : dégradation. 3 : bureaucratie active. */
  niveau: z.number().int().min(0).max(3),
});

/** Une édition hebdomadaire de l'Heuroscope : un fichier par semaine dans `src/data/heuroscope/`. */
const heuroscopes = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/data/heuroscope' }),
  schema: z.object({
    identifiant: z.string(),
    numero: z.number(),
    debut: z.coerce.date(),
    fin: z.coerce.date(),
    /** Fiabilité moyenne revendiquée, en pour cent. */
    fiabilite: z.number(),
    /** Image d'ouverture de la rubrique, quand elle existe. */
    bandeau: z.object({ src: z.string(), alt: z.string(), credit: z.string() }).optional(),
    /** Le fond de l'air : une prévision par heure, de 0 h à 23 h, commune à tous les signes. */
    communes: z.array(z.string()).length(24),
    /** Par signe : ses heures majeures, qui remplacent le fond de l'air, et ses indications du jour. */
    signes: z.record(
      z.string(),
      z.object({
        heures: z.record(z.string(), prediction),
        /** Heure de la « fenêtre de vulnérabilité ». */
        critique: z.number().int().min(0).max(23),
        /** Heure la plus prometteuse, toutes proportions gardées. */
        prometteuse: z.number().int().min(0).max(23),
        conseil: z.string(),
        verdict: z.string(),
        /** Indice de turbulence existentielle, de 0 à 100. */
        turbulence: z.number().min(0).max(100),
        barometre: z.string(),
        temperature: z.string(),
      }),
    ),
  }),
});

export const collections = { rubriques, medias, journalistes, articles, videos, campagnes, publicites, signes, heuroscopes };
