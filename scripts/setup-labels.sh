#!/usr/bin/env bash
# Crée ou met à jour les labels du système de suivi de L'Humianité.
#
# À lancer une fois, avant d'ouvrir les formulaires au public : un formulaire
# ne peut attribuer qu'un label déjà présent dans le dépôt.
#
#   GH_TOKEN=<jeton du compte du journal> scripts/setup-labels.sh
#
# Le jeton évite de changer le compte actif de `gh` sur la machine.
set -euo pipefail

DEPOT="${DEPOT:-humianite/humianite.github.io}"
COMPTE_ATTENDU="${DEPOT%%/*}"

command -v gh >/dev/null || { echo "La commande gh est introuvable : https://cli.github.com" >&2; exit 1; }

compte="$(gh api user --jq .login)"
if [ "$compte" != "$COMPTE_ATTENDU" ]; then
  echo "gh agit au nom de « $compte », et non de « $COMPTE_ATTENDU ». Opération annulée." >&2
  echo "Relancez avec GH_TOKEN=<jeton du compte $COMPTE_ATTENDU>." >&2
  exit 1
fi

label() {
  gh label create "$1" --repo "$DEPOT" --color "$2" --description "$3" --force
}

label "type: offended"         "c3141b" "Susceptibilité détectée"
label "working as intended"    "0c0b09" "Le système fonctionne malheureusement normalement"
label "wontfix"                "69655c" "La rédaction décline poliment toute évolution"
label "needs more indignation" "e1ddd0" "Indignation insuffisamment documentée"
label "cannot reproduce"       "b7b2a4" "Impossible de reproduire le préjudice"
label "known human issue"      "8a1016" "Dysfonctionnement humain déjà référencé"
label "fact-check"             "1f5f8b" "Vérification éditoriale nécessaire"
label "legal: review"          "f2c200" "Signalement réel nécessitant une vérification humaine"

echo "Labels à jour sur $DEPOT."
