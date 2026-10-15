/**
 * La météo : il fait beau partout, sauf au-dessus du lecteur.
 *
 * Où est le lecteur, dans l'ordre de confiance :
 * 1. la commune qu'il a cherchée (gardée dans son navigateur pour la visite suivante) ;
 * 2. sa position, s'il l'a déjà accordée au site, ou s'il clique sur « Me localiser » ;
 * 3. la région que Cloudflare déduit de son adresse (souvent Paris, où sortent bien des fournisseurs d'accès).
 * Quand une source plus précise arrive, la perturbation s'y rend, malgré le bulletin.
 */
import carte from '@/data/meteo-regions.json';
import { type Point, REGIONS_INSEE, type Situation, projeter, regionDuPoint, situer, temperature } from '@/lib/meteo';

/** Une commune : son nom, son centre, et le code INSEE de sa région (absent dans les mémoires anciennes). */
type Commune = { nom: string; longitude: number; latitude: number; departement?: string; region?: string };
type CommuneApi = { nom: string; centre?: { coordinates: [number, number] }; codeDepartement?: string; codeRegion?: string };

const MEMOIRE = 'humianite:meteo:commune';
const API = 'https://geo.api.gouv.fr/communes';
const CHAMPS = 'fields=nom,centre,codeDepartement,codeRegion';

const BULLETINS: Record<Situation['type'], (sur?: string) => string> = {
  region: (sur) =>
    `Grand soleil sur l’ensemble du pays, avec des températures de saison. Seule exception : un épisode orageux stationnaire ${sur}, qui ne devrait pas se déplacer.`,
  etranger: () => 'Grand soleil sur l’ensemble du territoire, avec des températures de saison. Hors des frontières, la situation se dégrade.',
  inconnu: () => 'Temps maussade sur l’ensemble du pays : pluie, vent, plafond bas. Aucune amélioration n’est attendue.',
};

const outreMer = (nom: string) =>
  `Grand soleil sur l’ensemble de la métropole, avec des températures de saison. Outre-mer, un épisode orageux stationnaire sur ${nom} et ses environs, qui ne devrait pas se déplacer.`;

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Une commune bien formée, ou rien : une mémoire abîmée ne doit pas figer la carte. */
const valide = (c: unknown): Commune | null => {
  const { nom, longitude, latitude, departement, region } = (c ?? {}) as Record<string, unknown>;
  if (typeof nom !== 'string' || !nom || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return {
    nom,
    longitude: longitude as number,
    latitude: latitude as number,
    departement: typeof departement === 'string' ? departement : undefined,
    region: typeof region === 'string' ? region : undefined,
  };
};

const lire = (): Commune | null => {
  try {
    const commune = valide(JSON.parse(localStorage.getItem(MEMOIRE) ?? 'null'));
    if (!commune) localStorage.removeItem(MEMOIRE);
    return commune;
  } catch {
    return null;
  }
};

const garder = (commune: Commune) => {
  try {
    localStorage.setItem(MEMOIRE, JSON.stringify(commune));
  } catch {
    // Sans mémoire, la commune vaut pour cette visite seulement.
  }
};

/** Interroge l'API des communes ; une liste vide si elle tarde, se trompe ou répond n'importe quoi. */
const communes = async (requete: string): Promise<Commune[]> => {
  try {
    const reponse = await fetch(`${API}?${requete}&${CHAMPS}`, { signal: AbortSignal.timeout(5000) });
    const liste: unknown = reponse.ok ? await reponse.json() : [];
    if (!Array.isArray(liste)) return [];
    return (liste as CommuneApi[])
      .map((c) => valide({ nom: c.nom, longitude: c.centre?.coordinates[0], latitude: c.centre?.coordinates[1], departement: c.codeDepartement, region: c.codeRegion }))
      .filter((c): c is Commune => c !== null);
  } catch {
    return [];
  }
};

const chercher = (texte: string) =>
  communes(/^\d{5}$/.test(texte) ? `codePostal=${texte}` : `nom=${encodeURIComponent(texte)}&boost=population&limit=6`);

/** La commune sous une position. La position est arrondie à une centaine de mètres : la commune n'en demande pas plus. */
const communeSous = async (latitude: number, longitude: number) =>
  (await communes(`lat=${latitude.toFixed(3)}&lon=${longitude.toFixed(3)}`))[0] ?? null;

const position = () =>
  new Promise<GeolocationPosition | null>((resoudre) => {
    if (!('geolocation' in navigator)) return resoudre(null);
    navigator.geolocation.getCurrentPosition(resoudre, () => resoudre(null), { timeout: 15_000, maximumAge: 3_600_000 });
  });

/** La position déjà accordée au site se demande sans fenêtre ; jamais accordée, on ne la demande pas d'office. */
const positionDejaAccordee = async () => {
  const etat = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null);
  return etat?.state === 'granted' ? position() : null;
};

export function afficherLaMeteo() {
  const meteo = document.querySelector<HTMLElement>('[data-meteo]');
  if (!meteo) return;

  const jour = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const stations = [...meteo.querySelectorAll<SVGGElement>('.station[data-code]')];
  const perturbation = meteo.querySelector<SVGGElement>('.perturbation')!;
  const zone = (nom: string) => meteo.querySelector<HTMLElement>(`[data-zone="${nom}"]`)!;
  const champ = meteo.querySelector<HTMLInputElement>('#meteo-commune')!;
  const centre = (code: string) => carte.regions.find((r) => r.code === code)!.centre as Point;

  /** Dès que le lecteur a choisi lui-même, les sources automatiques n'ont plus voix au chapitre. */
  let choixDuLecteur = false;

  // Les stations s'allument d'ouest en est.
  [...stations].sort((a, b) => Number(a.dataset.x) - Number(b.dataset.x)).forEach((g, rang) => g.style.setProperty('--rang', String(rang)));

  /** Pose la perturbation ; sans trajet si elle n'était pas encore sur la carte, ou si on le demande. */
  const placer = (point: Point, anime: boolean) => {
    if (!anime || meteo.dataset.situation !== 'region') perturbation.style.transition = 'none';
    perturbation.style.transform = `translate(${point[0]}px, ${point[1]}px)`;
    void perturbation.getBoundingClientRect();
    perturbation.style.transition = '';
  };

  /** Met la carte, les relevés et le bulletin d'accord. `sur` remplace le nom de la région, `pays` celui du médaillon, `bulletin` le bulletin. */
  const afficher = (situation: Situation, precisions: { sur?: string; pays?: string; bulletin?: string } = {}) => {
    for (const station of stations) {
      const code = station.dataset.code!;
      const sousLaPerturbation = situation.type === 'region' && situation.code === code;
      const temps = situation.type === 'inconnu' ? 'pluie' : 'soleil';
      const degres = `${sousLaPerturbation ? 9 : temperature(code, jour, temps)}°`;
      station.dataset.temps = sousLaPerturbation ? 'masque' : temps;
      station.querySelector('[data-temp]')!.textContent = degres;
      meteo.querySelector(`.meteo__regions [data-code="${code}"]`)?.classList.toggle('est-sombre', sousLaPerturbation || temps === 'pluie');
      const releve = meteo.querySelector<HTMLElement>(`.releves [data-code="${code}"]`)!;
      releve.querySelector('[data-temp]')!.textContent = degres;
      releve.classList.toggle('est-sombre', sousLaPerturbation || temps === 'pluie');
    }

    if (situation.type === 'etranger') {
      let nom = precisions.pays ?? situation.pays;
      try {
        if (!precisions.pays) nom = new Intl.DisplayNames(['fr'], { type: 'region' }).of(situation.pays) ?? nom;
      } catch {
        // Un code que le navigateur ne connaît pas reste affiché tel quel.
      }
      zone('pays').textContent = nom;
    }

    const sur =
      precisions.sur ?? (situation.type === 'region' ? meteo.querySelector<SVGGElement>(`.station[data-code="${situation.code}"]`)?.dataset.sur : undefined);
    zone('bulletin').textContent = precisions.bulletin ?? BULLETINS[situation.type](sur);
    meteo.dataset.situation = situation.type;
  };

  /**
   * La perturbation se rend au-dessus d'une commune. La région vient de l'INSEE (les îles de métropole restent en métropole) ;
   * la carte ne sert qu'à placer le nuage. Une commune d'outre-mer passe en médaillon.
   */
  const allerA = (commune: Commune, anime = true) => {
    if (choixDuLecteur || !champ.value) champ.value = commune.nom;
    const point = projeter(commune.longitude, commune.latitude, carte.projection);
    const code = commune.region ? REGIONS_INSEE[commune.region] : regionDuPoint(carte.regions, point);
    if (code) {
      placer(point, anime);
      afficher({ type: 'region', code }, { sur: `sur ${commune.nom} et ses environs` });
    } else {
      afficher({ type: 'etranger', pays: 'FR' }, { pays: commune.nom, bulletin: outreMer(commune.nom) });
    }
  };

  const retenir = (commune: Commune) => {
    choixDuLecteur = true;
    garder(commune);
    allerA(commune);
  };

  // Les commandes répondent tout de suite, avant même que la carte ne soit prête.

  // « Me localiser »
  const localiser = meteo.querySelector<HTMLButtonElement>('[data-localiser]')!;
  localiser.addEventListener('click', async () => {
    localiser.disabled = true;
    zone('note').textContent = '';
    try {
      const reponse = await position();
      const commune = reponse && (await communeSous(reponse.coords.latitude, reponse.coords.longitude));
      if (commune) retenir(commune);
      else zone('note').textContent = 'Position indisponible. Indiquez votre commune.';
    } finally {
      localiser.disabled = false;
    }
  });

  // La recherche de commune, avec ses propositions.
  const liste = meteo.querySelector<HTMLUListElement>('#meteo-communes')!;
  let propositions: Commune[] = [];
  let choisie = -1;
  let attente: ReturnType<typeof setTimeout> | undefined;

  const fermer = () => {
    liste.hidden = true;
    champ.setAttribute('aria-expanded', 'false');
    champ.removeAttribute('aria-activedescendant');
    choisie = -1;
  };

  const surligner = (rang: number) => {
    choisie = rang;
    [...liste.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === rang)));
    if (rang >= 0) champ.setAttribute('aria-activedescendant', `meteo-commune-${rang}`);
  };

  const choisir = (commune: Commune) => {
    fermer();
    retenir(commune);
    champ.blur();
  };

  champ.addEventListener('input', () => {
    clearTimeout(attente);
    const texte = champ.value.trim();
    if (texte.length < 2) return fermer();
    attente = setTimeout(async () => {
      const trouvees = await chercher(texte);
      // Une réponse arrivée après une frappe plus récente est périmée : on l'écarte.
      if (champ.value.trim() !== texte) return;
      propositions = trouvees;
      liste.replaceChildren(
        ...propositions.map((c, i) => {
          const li = document.createElement('li');
          li.id = `meteo-commune-${i}`;
          li.setAttribute('role', 'option');
          li.append(c.nom);
          if (c.departement) {
            const dep = document.createElement('small');
            dep.textContent = c.departement;
            li.append(dep);
          }
          li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            choisir(c);
          });
          return li;
        }),
      );
      liste.hidden = propositions.length === 0;
      champ.setAttribute('aria-expanded', String(!liste.hidden));
      surligner(propositions.length ? 0 : -1);
    }, 200);
  });

  champ.addEventListener('keydown', (e) => {
    if (liste.hidden) return;
    if (e.key === 'ArrowDown') surligner(Math.min(propositions.length - 1, choisie + 1));
    else if (e.key === 'ArrowUp') surligner(Math.max(0, choisie - 1));
    else if (e.key === 'Escape') fermer();
    else return;
    e.preventDefault();
  });

  meteo.querySelector('[data-recherche]')!.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!liste.hidden && choisie >= 0 && propositions[choisie]) choisir(propositions[choisie]);
  });

  champ.addEventListener('blur', () => setTimeout(fermer, 100));

  // Puis la carte se compose, à partir de la meilleure source disponible.
  const montrer = () => requestAnimationFrame(() => (meteo.dataset.etat = 'pret'));
  const memoire = lire();
  if (memoire) {
    allerA(memoire, false);
    montrer();
    return;
  }

  (async () => {
    // L'adresse, deux secondes et demie au plus : au-delà, il fait mauvais partout.
    const parAdresse: Situation = await fetch(`${meteo.dataset.guichet}/meteo`, { signal: AbortSignal.timeout(2500) })
      .then((r) => r.json())
      .then(situer)
      .catch(() => ({ type: 'inconnu' }) as const);
    if (choixDuLecteur) return montrer();
    if (parAdresse.type === 'region') placer(centre(parAdresse.code), false);
    afficher(parAdresse);
    montrer();

    // Une position déjà accordée : le lecteur voit d'abord le nuage là où l'adresse le place, puis il se met en route.
    const [accordee] = await Promise.all([positionDejaAccordee(), attendre(1400)]);
    if (!accordee || choixDuLecteur) return;
    const commune = await communeSous(accordee.coords.latitude, accordee.coords.longitude);
    if (commune && !choixDuLecteur) allerA(commune);
  })();
}
