# Le guichet

Petit service Cloudflare (Worker + D1) qui reçoit les coupons des petites annonces. Il ne publie rien : il range les coupons dans une file, que la conférence de rédaction relève chaque matin (`/edition-du-jour`, étape « guichet »).

| Route | Accès | Rôle |
|---|---|---|
| `POST /annonces` | public, origines admises (`ORIGINES`) | dépôt d'un coupon, rend un numéro de dossier |
| `POST /justificatifs` | public, origines admises | numéro du prochain justificatif de lecture (compteur, rien n'est gardé) |
| `GET /meteo` | public, origines admises | pays et région de la connexion, d'après Cloudflare (rien n'est gardé) |
| `GET /depots?statut=en_attente` | jeton de la rédaction | la file |
| `PATCH /depots/PA-4471` | jeton de la rédaction | `{ "statut": "paru" \| "retenu" \| "ecarte", "note"?: "…" }` |

Protection : champ piège, cinq coupons par jour et par empreinte (condensé du sel, du jour et de l'adresse ; l'adresse n'est jamais conservée), quatre cents par jour au total.

## En local

```sh
cd guichet
npm install
printf 'JETON_REDACTION="essai-local"\nSEL="sel-local"\n' > .dev.vars
npm run schema:local
npm run dev                # http://localhost:8787
```

Le site s'y branche avec `PUBLIC_GUICHET=http://localhost:8787 npm run dev`.

## Mise en service

```sh
cd guichet
npx wrangler login
npx wrangler d1 create humianite-guichet     # recopier database_id dans wrangler.toml
npm run schema
npx wrangler secret put JETON_REDACTION      # une longue chaîne aléatoire
npx wrangler secret put SEL                  # une autre
npm run deploy                               # affiche l'adresse du Worker
```

Puis :

1. reporter l'adresse dans `SITE.guichet` (`src/lib/site.ts`) : elle sert au formulaire et à la politique de sécurité du site ;
2. remplir `guichet.env` à la racine du dépôt (non versionné) avec `GUICHET_URL` et `GUICHET_JETON`.
