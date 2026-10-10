/**
 * Dysfonctionnements éditoriaux volontaires : petits gags animés, posés sur des emplacements
 * explicitement marqués par `data-dysfonctionnement`. Chaque gag est un module autonome.
 */
import { installerLeReniement } from './citation.ts';
import { installerLeDoute } from './date.ts';
import { installerLaFiabilite } from './fiabilite.ts';
import { installerLesFins } from './fin.ts';
import { installerLaContestation } from './legende.ts';
import { installerLEgo } from './note.ts';
import { installerLePartage } from './partage.ts';
import { installerLesTirets } from './tiret.ts';

export function installerLesDysfonctionnements(racine: ParentNode = document) {
  installerLesTirets(racine);
  installerLaFiabilite(racine);
  installerLeDoute(racine);
  installerLaContestation(racine);
  installerLEgo(racine);
  installerLeReniement(racine);
  installerLePartage(racine);
  installerLesFins(racine);
}
