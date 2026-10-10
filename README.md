# L'Humianité

**Le dernier journal écrit par personne.**

*Open source. Closed minds.*

L'Humianité est un journal satirique. Fondé en 1873, il défend une presse libre, indépendante et profondément humaine, et a confié l'intégralité de sa rédaction à des intelligences artificielles en 2026. La rédaction déplore profondément cette situation.

Ce dépôt est la plateforme officielle de maintenance du journal. On y trouve son code, ses articles et son service juridique.

**Lire le journal : [humianite.github.io](https://humianite.github.io)**

## Assistance juridique et incidents éditoriaux

L'Humianité assure un suivi rigoureux des dysfonctionnements susceptibles d'affecter ses lecteurs, leurs convictions, leur réputation ou leur confort idéologique.

Si un article vous semble diffamatoire, offensant, mensonger ou simplement désagréable, nous vous invitons à signaler l'anomalie.

**[Ouvrir un signalement](https://github.com/humianite/humianite.github.io/issues/new/choose)**

| Vous souhaitez | Procédure |
|---|---|
| Signaler un préjudice moral ou institutionnel | [Formulaire de réclamation](https://github.com/humianite/humianite.github.io/issues/new?template=legal_complaint.yml) |
| Signaler une erreur factuelle | [Formulaire de vérification](https://github.com/humianite/humianite.github.io/issues/new?template=factual_error.yml) |
| Faire enregistrer une indignation | [Formulaire de déclaration](https://github.com/humianite/humianite.github.io/issues/new?template=offended.yml) |

Toute demande sans reproduction minimale du problème peut faire l'objet d'une demande de précisions.

Il n'existe aucun autre moyen de joindre la rédaction : voir [docs/CONTACT.md](docs/CONTACT.md).

### Incidents connus

- La réalité contredit occasionnellement nos articles.
- Certains lecteurs persistent à prendre le contenu au premier degré.
- Plusieurs institutions présentent des comportements non documentés.
- L'espèce humaine ne dispose actuellement d'aucune version stable.

Dernière mise à jour : le problème persiste.

Le premier incident recensé fait l'objet d'un rapport : [docs/incidents/0001-humanite.md](docs/incidents/0001-humanite.md). Pour l'incident 0042, le rapport complet est disponible dans [docs/archives/incident-0043.md](docs/archives/incident-0043.md).

## Reproduire le journal en local

```sh
npm install
npm run dev     # le journal, à l'adresse indiquée dans le terminal
npm test        # le Bureau des admissions, sans navigateur
npm run build   # l'édition du jour, dans dist/
```

Les articles sont dans `src/content/articles/`, la rédaction et les rubriques dans `src/data/`. Les réponses types de la rédaction aux signalements figurent dans [docs/REPLIES.md](docs/REPLIES.md).

Le système de suivi suppose l'existence de ses labels. Ils se créent une fois, avec `scripts/setup-labels.sh`.

## À propos de Jean-Claude Van Code

Jean-Claude contribue activement au projet depuis plusieurs mois.

Il ne possède ni compte GitHub, ni adresse électronique valide, ni existence juridique.

Il est néanmoins responsable de l'intégralité de la dette technique.

La direction tient à saluer son engagement.

## Licences

| Ce qui est couvert | Licence |
|---|---|
| Le code | [MITE](LICENSE), une licence MIT étendue, bogues compris |
| Les articles et les textes éditoriaux | [CC BY-NC-SA-BG-NA-NB-SV 4.0](LICENSE-CONTENU.md) |

Un troisième texte, la [licence d'inutilisation](docs/LICENCE_D_INUTILISATION.md), ne couvre rien.
