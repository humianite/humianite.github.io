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
import { type Point, type Situation, projeter, regionDuPoint, situer, temperature } from '@/lib/meteo';

type Commune = { nom: string; longitude: number; latitude: number; departement?: string };
type CommuneApi = { nom: string; centre?: { coordinates: [number, number] }; codeDepartement?: string };

const MEMOIRE = 'humianite:meteo:commune';
const API = 'https://geo.api.gouv.fr/communes';
const CHAMPS = 'fields=nom,centre,codeDepartement';

const BULLETINS: Record<Situation['type'], (sur?: string) => string> = {
  region: (sur) =>
    `Grand soleil sur l’ensemble du pays, avec des températures de saison. Seule exception : un épisode orageux stationnaire ${sur}, qui ne devrait pas se déplacer.`,
  etranger: () => 'Grand soleil sur l’ensemble du territoire, avec des températures de saison. Hors des frontières, la situation se dégrade.',
  inconnu: () => 'Temps maussade sur l’ensemble du pays : pluie, vent, plafond bas. Aucune amélioration n’est attendue.',
};

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

const lire = (): Commune | null => {
  try {
    return JSON.parse(localStorage.getItem(MEMOIRE) ?? 'null');
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

const versCommunes = (liste: CommuneApi[]): Commune[] =>
  liste
    .filter((c) => c.centre)
    .map((c) => ({ nom: c.nom, longitude: c.centre!.coordinates[0], latitude: c.centre!.coordinates[1], departement: c.codeDepartement }));

const chercher = async (texte: string): Promise<Commune[]> => {
  const requete = /^\d{5}$/.test(texte) ? `codePostal=${texte}` : `nom=${encodeURIComponent(texte)}&boost=population&limit=6`;
  const reponse = await fetch(`${API}?${requete}&${CHAMPS}`);
  return reponse.ok ? versCommunes(await reponse.json()) : [];
};

const communeSous = async (latitude: number, longitude: number): Promise<Commune | null> => {
  const reponse = await fetch(`${API}?lat=${latitude}&lon=${longitude}&${CHAMPS}`).catch(() => null);
  return reponse?.ok ? (versCommunes(await reponse.json())[0] ?? null) : null;
};

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

export async function afficherLaMeteo() {
  const meteo = document.querySelector<HTMLElement>('[data-meteo]');
  if (!meteo) return;

  const jour = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const stations = [...meteo.querySelectorAll<SVGGElement>('.station[data-code]')];
  const perturbation = meteo.querySelector<SVGGElement>('.perturbation')!;
  const zone = (nom: string) => meteo.querySelector<HTMLElement>(`[data-zone="${nom}"]`)!;
  const centre = (code: string) => carte.regions.find((r) => r.code === code)!.centre as Point;

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

  const champ = meteo.querySelector<HTMLInputElement>('#meteo-commune')!;

  /** La perturbation se rend au-dessus d'une commune. Hors de la carte (outre-mer), la commune passe en médaillon. */
  const allerA = (commune: Commune, anime = true) => {
    champ.value = commune.nom;
    const point = projeter(commune.longitude, commune.latitude, carte.projection);
    const code = regionDuPoint(carte.regions, point);
    if (code) {
      placer(point, anime);
      afficher({ type: 'region', code }, { sur: `sur ${commune.nom} et ses environs` });
    } else {
      afficher(
        { type: 'etranger', pays: 'FR' },
        {
          pays: commune.nom,
          bulletin: `Grand soleil sur l’ensemble de la métropole, avec des températures de saison. Outre-mer, un épisode orageux stationnaire sur ${commune.nom} et ses environs, qui ne devrait pas se déplacer.`,
        },
      );
    }
  };

  const montrer = () => requestAnimationFrame(() => (meteo.dataset.etat = 'pret'));

  // 1. La commune de la dernière visite : la perturbation y est déjà.
  const memoire = lire();
  if (memoire) {
    allerA(memoire, false);
    montrer();
  } else {
    // 3. L'adresse, deux secondes et demie au plus : au-delà, il fait mauvais partout.
    const parAdresse: Situation = await fetch(`${meteo.dataset.guichet}/meteo`, { signal: AbortSignal.timeout(2500) })
      .then((r) => r.json())
      .then(situer)
      .catch(() => ({ type: 'inconnu' }) as const);
    if (parAdresse.type === 'region') placer(centre(parAdresse.code), false);
    afficher(parAdresse);
    montrer();

    // 2. Une position déjà accordée : le lecteur voit d'abord le nuage là où l'adresse le place, puis il se met en route.
    const [accordee] = await Promise.all([positionDejaAccordee(), attendre(1400)]);
    if (accordee && !lire()) {
      const commune = await communeSous(accordee.coords.latitude, accordee.coords.longitude);
      if (commune && !lire()) allerA(commune);
    }
  }

  // « Me localiser »
  const localiser = meteo.querySelector<HTMLButtonElement>('[data-localiser]')!;
  localiser.addEventListener('click', async () => {
    localiser.disabled = true;
    zone('note').textContent = '';
    const reponse = await position();
    const commune = reponse && (await communeSous(reponse.coords.latitude, reponse.coords.longitude));
    localiser.disabled = false;
    if (!commune) {
      zone('note').textContent = 'Position indisponible. Indiquez votre commune.';
      return;
    }
    garder(commune);
    allerA(commune);
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

  const retenir = (commune: Commune) => {
    fermer();
    garder(commune);
    allerA(commune);
    champ.blur();
  };

  champ.addEventListener('input', () => {
    clearTimeout(attente);
    const texte = champ.value.trim();
    if (texte.length < 2) return fermer();
    attente = setTimeout(async () => {
      propositions = await chercher(texte).catch(() => []);
      if (champ.value.trim() !== texte) return;
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
            retenir(c);
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
    if (choisie >= 0 && propositions[choisie]) retenir(propositions[choisie]);
  });

  champ.addEventListener('blur', () => setTimeout(fermer, 100));
}
