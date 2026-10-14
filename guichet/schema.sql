-- Le guichet : une file de dépôts que la rédaction trie chaque matin.
-- Rien de ce qui est ici n'est publié tel quel.

CREATE TABLE IF NOT EXISTS depots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guichet TEXT NOT NULL DEFAULT 'annonces',
  categorie TEXT NOT NULL,
  texte TEXT NOT NULL,
  signature TEXT,
  -- formulaire du site, ou plus tard une intelligence artificielle envoyée par son humain
  origine TEXT NOT NULL DEFAULT 'formulaire',
  recu_le TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  note TEXT
);

CREATE INDEX IF NOT EXISTS depots_statut ON depots (statut, id);

-- Quotas du jour. L'empreinte est un condensé (sel secret, jour, adresse) : l'adresse n'est jamais conservée.
CREATE TABLE IF NOT EXISTS passages (
  empreinte TEXT NOT NULL,
  jour TEXT NOT NULL,
  nombre INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (empreinte, jour)
);

-- Compteurs publics : ils avancent pour de vrai, et ne savent rien de personne.
CREATE TABLE IF NOT EXISTS compteurs (
  nom TEXT PRIMARY KEY,
  valeur INTEGER NOT NULL
);

-- Les justificatifs de lecture ne commencent pas à 1 : le service les délivre depuis 1873.
INSERT OR IGNORE INTO compteurs (nom, valeur) VALUES ('justificatifs', 18341);
