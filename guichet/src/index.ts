/**
 * Le guichet de L'Humianité : reçoit les coupons des lecteurs et les range dans une file.
 *
 *   POST  /annonces          dépôt d'une petite annonce (public, depuis le site)
 *   GET   /depots?statut=…   la file, pour la conférence de rédaction (jeton)
 *   PATCH /depots/PA-4471    { statut, note? } : retenu, paru, écarté (jeton)
 */
import { LIMITES, STATUTS, empreinte, examiner, idDuNumero, jourDeParis, numeroDeDossier, type Statut } from './regles';

interface Env {
  DB: D1Database;
  /** Origines admises, séparées par des virgules. */
  ORIGINES: string;
  /** Jeton de la rédaction, posé par `wrangler secret put JETON_REDACTION`. */
  JETON_REDACTION: string;
  /** Sel des empreintes, posé par `wrangler secret put SEL`. */
  SEL: string;
}

const entetesCors = (requete: Request, env: Env): Record<string, string> => {
  const origine = requete.headers.get('Origin') ?? '';
  const admises = env.ORIGINES.split(',').map((o) => o.trim());
  return admises.includes(origine)
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

  const jour = jourDeParis();
  const adresse = requete.headers.get('CF-Connecting-IP') ?? 'inconnue';
  if (await compter(env, await empreinte(adresse, jour, env.SEL), jour, LIMITES.parEmpreinte)) {
    return json({ motif: 'Vous avez atteint le nombre de coupons autorisés pour aujourd’hui.' }, 429, cors);
  }
  if (await compter(env, '*', jour, LIMITES.parJour)) return json({ motif: 'Le guichet est fermé pour aujourd’hui.' }, 503, cors);

  // L'automate qui remplit le champ invisible reçoit un numéro, comme tout le monde. Il ne paraîtra jamais.
  if (verdict.piege) return json({ numero: numeroDeDossier(Math.floor(Math.random() * 9000) + 1000) }, 201, cors);

  const { categorie, texte, signature } = verdict.depot;
  const ligne = await env.DB.prepare('INSERT INTO depots (categorie, texte, signature, recu_le) VALUES (?1, ?2, ?3, ?4) RETURNING id')
    .bind(categorie, texte, signature, new Date().toISOString())
    .first<{ id: number }>();
  await env.DB.prepare('DELETE FROM passages WHERE jour < ?1').bind(jour).run();

  return json({ numero: numeroDeDossier(ligne!.id) }, 201, cors);
};

const lister = async (url: URL, env: Env) => {
  const statut = url.searchParams.get('statut') ?? 'en_attente';
  if (!(STATUTS as readonly string[]).includes(statut)) return json({ motif: 'Statut inconnu.' }, 400);
  const { results } = await env.DB.prepare('SELECT * FROM depots WHERE statut = ?1 ORDER BY id LIMIT 500').bind(statut).all();
  return json(
    results.map((d) => ({ ...d, numero: numeroDeDossier(d.id as number) })),
    200,
  );
};

const statuer = async (requete: Request, numero: string, env: Env) => {
  const id = idDuNumero(numero);
  const corps = (await requete.json().catch(() => null)) as { statut?: Statut; note?: string } | null;
  if (id === null || !corps?.statut || !(STATUTS as readonly string[]).includes(corps.statut)) return json({ motif: 'Demande incomplète.' }, 400);
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

    if (url.pathname.startsWith('/depots')) {
      if (!autorise(requete, env)) return json({ motif: 'Accès réservé à la rédaction.' }, 401);
      const numero = url.pathname.split('/')[2];
      if (!numero && requete.method === 'GET') return lister(url, env);
      if (numero && requete.method === 'PATCH') return statuer(requete, numero, env);
    }

    if (url.pathname === '/') return new Response('L’Humianité — Guichet des petites annonces.\nOuvert du lundi au dimanche, fermé le reste du temps.\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return json({ motif: 'Guichet inconnu.' }, 404);
  },
} satisfies ExportedHandler<Env>;
