/**
 * Le guichet de L'Humianité : reçoit les coupons des lecteurs et les range dans une file.
 *
 *   POST  /annonces          dépôt d'une petite annonce (public, depuis le site)
 *   POST  /justificatifs     numéro du prochain justificatif de lecture (public, depuis le site)
 *   GET   /meteo             ce que Cloudflare sait de la connexion : pays et région (public, rien n'est gardé)
 *   GET   /depots?statut=…&apres=…   la file, par pages de 200, pour la conférence de rédaction (jeton)
 *   PATCH /depots/PA-4471    { statut, note? } : retenu, paru, écarté (jeton)
 */
import { LIMITES, STATUTS, empreinte, examiner, idDuNumero, jourDeParis, noteValide, numeroDeDossier, reseau, type Statut } from './regles';

interface Env {
  DB: D1Database;
  /** Origines admises, séparées par des virgules. */
  ORIGINES: string;
  /** Jeton de la rédaction, posé par `wrangler secret put JETON_REDACTION`. */
  JETON_REDACTION: string;
  /** Sel des empreintes, posé par `wrangler secret put SEL`. */
  SEL: string;
  /** Limiteur de rafales de Cloudflare : il refuse avant que la base ne soit touchée. */
  RAFALES: RateLimit;
}

const entetesCors = (requete: Request, env: Env): Record<string, string> => {
  const origine = requete.headers.get('Origin') ?? '';
  const admises = env.ORIGINES.split(',').map((o) => o.trim());
  // Le journal en local, quel que soit le port que le serveur de développement s'est choisi.
  return admises.includes(origine) || /^http:\/\/localhost:\d+$/.test(origine)
    ? { 'Access-Control-Allow-Origin': origine, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : { Vary: 'Origin' };
};

const json = (corps: unknown, statut: number, entetes: Record<string, string> = {}) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...entetes } });

const autorise = (requete: Request, env: Env) => {
  const fourni = new TextEncoder().encode(requete.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '');
  const attendu = new TextEncoder().encode(env.JETON_REDACTION ?? '');
  return attendu.length > 0 && fourni.length === attendu.length && crypto.subtle.timingSafeEqual(fourni, attendu);
};

/**
 * Premier filtre, sans écrire en base : le limiteur de rafales, par réseau.
 * Rend le réseau de la requête, ou `null` s'il faut refuser.
 */
const filtrer = async (requete: Request, env: Env) => {
  const origine = reseau(requete.headers.get('CF-Connecting-IP') ?? 'inconnue');
  const { success } = await env.RAFALES.limit({ key: origine });
  return success ? origine : null;
};

/** Compte un passage et dit s'il dépasse le quota. La ligne « * » tient le total du jour. */
const compter = async (env: Env, cle: string, jour: string, plafond: number) => {
  const ligne = await env.DB.prepare(
    'INSERT INTO passages (empreinte, jour, nombre) VALUES (?1, ?2, 1) ON CONFLICT (empreinte, jour) DO UPDATE SET nombre = nombre + 1 RETURNING nombre',
  )
    .bind(cle, jour)
    .first<{ nombre: number }>();
  return (ligne?.nombre ?? 0) > plafond;
};

const deposer = async (requete: Request, env: Env, cors: Record<string, string>) => {
  if (!cors['Access-Control-Allow-Origin']) return json({ motif: 'Guichet réservé aux lecteurs du journal.' }, 403);

  const corps = await requete.json().catch(() => null);
  const verdict = examiner(corps);
  if (!verdict.recevable) return json({ motif: verdict.motif }, 422, cors);

  const origine = await filtrer(requete, env);
  if (!origine) return json({ motif: 'Le guichet est débordé. Réessayez dans une minute.' }, 429, cors);
  const jour = jourDeParis();
  if (await compter(env, await empreinte(origine, jour, env.SEL), jour, LIMITES.parEmpreinte)) {
    return json({ motif: 'Vous avez atteint le nombre de coupons autorisés pour aujourd’hui.' }, 429, cors);
  }
  if (await compter(env, '*', jour, LIMITES.parJour)) return json({ motif: 'Le guichet est fermé pour aujourd’hui.' }, 503, cors);

  // L'automate qui remplit le champ invisible reçoit un numéro, comme tout le monde. Il ne paraîtra jamais.
  if (verdict.piege) return json({ numero: numeroDeDossier(Math.floor(Math.random() * 9000) + 1000) }, 201, cors);

  const { categorie, texte, signature } = verdict.depot;
  const ligne = await env.DB.prepare('INSERT INTO depots (categorie, texte, signature, recu_le) VALUES (?1, ?2, ?3, ?4) RETURNING id')
    .bind(categorie, texte, signature, new Date().toISOString())
    .first<{ id: number }>();

  return json({ numero: numeroDeDossier(ligne!.id) }, 201, cors);
};

/** Le justificatif ne garde rien : il fait avancer un compteur et rend le numéro. */
const numeroter = async (requete: Request, env: Env, cors: Record<string, string>) => {
  if (!cors['Access-Control-Allow-Origin']) return json({ motif: 'Guichet réservé aux lecteurs du journal.' }, 403);

  const origine = await filtrer(requete, env);
  if (!origine) return json({ motif: 'Le service des justificatifs est débordé.' }, 429, cors);
  const jour = jourDeParis();
  if (await compter(env, `j:${await empreinte(origine, jour, env.SEL)}`, jour, LIMITES.justificatifsParEmpreinte)) {
    return json({ motif: 'Vous avez lu suffisamment pour aujourd’hui.' }, 429, cors);
  }
  if (await compter(env, 'j:*', jour, LIMITES.justificatifsParJour)) return json({ motif: 'Le service des justificatifs est fermé pour aujourd’hui.' }, 503, cors);

  const ligne = await env.DB.prepare("UPDATE compteurs SET valeur = valeur + 1 WHERE nom = 'justificatifs' RETURNING valeur").first<{ valeur: number }>();
  return json({ numero: ligne!.valeur }, 201, cors);
};

const PAR_PAGE = 200;

const lister = async (url: URL, env: Env) => {
  const statut = url.searchParams.get('statut') ?? 'en_attente';
  if (!(STATUTS as readonly string[]).includes(statut)) return json({ motif: 'Statut inconnu.' }, 400);
  // Par pages : `apres` est le dernier id reçu ; la page suivante commence au-delà.
  const apres = Number(url.searchParams.get('apres') ?? 0) || 0;
  const { results } = await env.DB.prepare('SELECT * FROM depots WHERE statut = ?1 AND id > ?2 ORDER BY id LIMIT ?3').bind(statut, apres, PAR_PAGE).all();
  return json(
    results.map((d) => ({ ...d, numero: numeroDeDossier(d.id as number) })),
    200,
  );
};

const statuer = async (requete: Request, numero: string, env: Env) => {
  const id = idDuNumero(numero);
  const corps = (await requete.json().catch(() => null)) as { statut?: Statut; note?: string } | null;
  if (id === null || !corps?.statut || !(STATUTS as readonly string[]).includes(corps.statut) || !noteValide(corps.note)) {
    return json({ motif: 'Demande incomplète.' }, 400);
  }
  const resultat = await env.DB.prepare('UPDATE depots SET statut = ?1, note = COALESCE(?2, note) WHERE id = ?3')
    .bind(corps.statut, corps.note ?? null, id)
    .run();
  return resultat.meta.changes ? json({ numero, statut: corps.statut }, 200) : json({ motif: 'Dossier introuvable.' }, 404);
};

export default {
  async fetch(requete, env): Promise<Response> {
    const url = new URL(requete.url);
    const cors = entetesCors(requete, env);

    if (requete.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/annonces' && requete.method === 'POST') return deposer(requete, env, cors);
    if (url.pathname === '/justificatifs' && requete.method === 'POST') return numeroter(requete, env, cors);
    if (url.pathname === '/meteo' && requete.method === 'GET') {
      // Rien n'est enregistré : le lecteur reçoit sa propre position, déduite de son adresse par Cloudflare.
      const { country, regionCode, region } = (requete.cf ?? {}) as { country?: string; regionCode?: string; region?: string };
      return json({ pays: country ?? null, codeRegion: regionCode ?? null, region: region ?? null }, 200, cors);
    }

    if (url.pathname.startsWith('/depots')) {
      if (!autorise(requete, env)) return json({ motif: 'Accès réservé à la rédaction.' }, 401);
      const numero = url.pathname.split('/')[2];
      if (!numero && requete.method === 'GET') return lister(url, env);
      if (numero && requete.method === 'PATCH') return statuer(requete, numero, env);
    }

    if (url.pathname === '/') return new Response('L’Humianité — Guichet des petites annonces.\nOuvert du lundi au dimanche, fermé le reste du temps.\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return json({ motif: 'Guichet inconnu.' }, 404);
  },

  /** Chaque nuit, les quotas de la veille sont jetés. */
  async scheduled(_evenement, env) {
    await env.DB.prepare('DELETE FROM passages WHERE jour < ?1').bind(jourDeParis()).run();
  },
} satisfies ExportedHandler<Env>;
