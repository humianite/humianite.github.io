/**
 * Le justificatif en image, pour les réseaux : dessiné dans un canevas, aux polices du journal,
 * tampon compris. Format paysage 1600 × 900 (16:9), que les réseaux affichent en entier dans le fil, liens et cartes compris.
 */

export type DonneesJustificatif = {
  numero: string;
  article: string;
  paru: string;
  releve: [string, string][];
  verdict: string;
  delivre: string;
};

const L = 1600;
const H = 900;
const MARGE = 72;
/** La colonne de droite, celle du relevé. */
const DROITE = 860;
const PAPIER = '#f6f4ec';
const ENCRE = '#0c0b09';
const GRIS = '#69655c';
const GRIS_CLAIR = '#b7b2a4';
const ROUGE = '#c3141b';

const TITRE = 'Gloock';
const TEXTE = '"Newsreader Variable"';
const UTIL = '"Sofia Sans Condensed Variable"';

/** Découpe un texte en lignes qui tiennent dans la largeur, au plus `maximum`, la dernière coupée d'une ellipse. */
const lignes = (ctx: CanvasRenderingContext2D, texte: string, largeur: number, maximum = Infinity) => {
  const resultat: string[] = [];
  let courante = '';
  for (const mot of texte.split(/\s+/)) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (ctx.measureText(essai).width <= largeur || !courante) courante = essai;
    else {
      resultat.push(courante);
      courante = mot;
    }
  }
  if (courante) resultat.push(courante);
  if (resultat.length > maximum) {
    const gardees = resultat.slice(0, maximum);
    let derniere = gardees[maximum - 1];
    while (ctx.measureText(`${derniere}…`).width > largeur) derniere = derniere.slice(0, -1);
    gardees[maximum - 1] = `${derniere.trimEnd()}…`;
    return gardees;
  }
  return resultat;
};

/** Hasard reproductible : le même numéro donne le même tampon. */
const hasard = (graine: number) => () => {
  graine = (graine * 1_664_525 + 1_013_904_223) % 4_294_967_296;
  return graine / 4_294_967_296;
};

const tampon = (numero: string) => {
  const toile = document.createElement('canvas');
  toile.width = 440;
  toile.height = 230;
  const ctx = toile.getContext('2d')!;
  ctx.strokeStyle = ctx.fillStyle = ROUGE;
  ctx.lineWidth = 7;
  ctx.strokeRect(20, 20, 400, 190);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(9, 9, 422, 212);
  ctx.textAlign = 'center';
  ctx.font = `800 128px ${UTIL}`;
  ctx.letterSpacing = '18px';
  ctx.fillText('LU', 229, 150);
  ctx.font = `800 24px ${UTIL}`;
  ctx.letterSpacing = '3px';
  ctx.fillText('POUR VALOIR CE QUE DE DROIT', 220, 190);

  // L'encre manque par endroits, comme sur un tampon fatigué.
  const aleatoire = hasard(Number(numero.replace(/\D/g, '')) || 1873);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    ctx.globalAlpha = 0.35 + aleatoire() * 0.65;
    ctx.beginPath();
    ctx.arc(aleatoire() * toile.width, aleatoire() * toile.height, 0.6 + aleatoire() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  return toile;
};

export async function dessinerJustificatif(d: DonneesJustificatif): Promise<Blob> {
  await Promise.all(
    [`400 76px ${TITRE}`, `400 34px ${TEXTE}`, `italic 400 34px ${TEXTE}`, `600 30px ${UTIL}`, `800 30px ${UTIL}`].map((police) =>
      document.fonts.load(police),
    ),
  );

  const toile = document.createElement('canvas');
  toile.width = L;
  toile.height = H;
  const ctx = toile.getContext('2d')!;
  const gauche = DROITE - MARGE - 70;
  const droite = L - MARGE - DROITE;

  ctx.fillStyle = PAPIER;
  ctx.fillRect(0, 0, L, H);
  ctx.textBaseline = 'alphabetic';

  // En-tête, sur toute la largeur
  ctx.textAlign = 'left';
  ctx.fillStyle = ENCRE;
  ctx.font = `800 26px ${UTIL}`;
  ctx.letterSpacing = '4px';
  ctx.fillText('L’HUMIANITÉ · SERVICE DES JUSTIFICATIFS', MARGE, 112);
  ctx.letterSpacing = '0px';
  ctx.font = `400 88px ${TITRE}`;
  ctx.fillText('Attestation de lecture', MARGE, 210);
  ctx.textAlign = 'right';
  ctx.fillStyle = GRIS;
  ctx.font = `800 30px ${UTIL}`;
  ctx.letterSpacing = '4px';
  ctx.fillText(`N° ${d.numero}`.toUpperCase(), L - MARGE, 210);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = ENCRE;
  ctx.fillRect(MARGE, 244, L - MARGE * 2, 7);

  // À gauche, l'article
  ctx.textAlign = 'left';
  ctx.font = `400 30px ${TEXTE}`;
  let y = 312;
  for (const ligne of lignes(ctx, 'Il est certifié que le porteur du présent document a consulté l’article', gauche)) {
    ctx.fillText(ligne, MARGE, y);
    y += 42;
  }
  y += 22;
  ctx.font = `400 50px ${TITRE}`;
  for (const ligne of lignes(ctx, d.article, gauche, 4)) {
    ctx.fillText(ligne, MARGE, y);
    y += 58;
  }
  ctx.font = `italic 400 30px ${TEXTE}`;
  ctx.fillText(d.paru, MARGE, y + 4);

  // À droite, le relevé
  y = 300;
  for (const [intitule, valeur] of d.releve) {
    ctx.fillStyle = ENCRE;
    ctx.textAlign = 'left';
    ctx.font = `600 28px ${UTIL}`;
    ctx.fillText(intitule, DROITE, y);
    ctx.textAlign = 'right';
    ctx.font = `400 31px ${TEXTE}`;
    ctx.fillText(valeur, L - MARGE, y);
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = GRIS_CLAIR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(DROITE, y + 18);
    ctx.lineTo(L - MARGE, y + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 54;
  }

  // Le verdict
  y += 26;
  ctx.textAlign = 'left';
  ctx.fillStyle = ENCRE;
  ctx.font = `italic 400 31px ${TEXTE}`;
  for (const ligne of lignes(ctx, d.verdict, droite, 3)) {
    ctx.fillText(ligne, DROITE, y);
    y += 42;
  }

  // Le pied
  const pied = H - 92;
  ctx.fillStyle = GRIS;
  ctx.font = `600 24px ${UTIL}`;
  ctx.fillText(`Délivré le ${d.delivre}.`, MARGE, pied - 32);
  ctx.fillText('Valable jusqu’à la prochaine mise à jour.', MARGE, pied);
  ctx.textAlign = 'right';
  ctx.fillStyle = ENCRE;
  ctx.font = `600 26px ${UTIL}`;
  ctx.fillText('Pour la direction,', L - MARGE, pied - 38);
  ctx.font = `italic 400 34px ${TEXTE}`;
  ctx.fillText('poste vacant depuis 2026', L - MARGE, pied);
  ctx.fillStyle = GRIS_CLAIR;
  ctx.fillRect(MARGE, H - 58, L - MARGE * 2, 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = GRIS;
  ctx.font = `600 22px ${UTIL}`;
  ctx.letterSpacing = '2px';
  ctx.fillText('HUMIANITE.GITHUB.IO', L / 2, H - 22);
  ctx.letterSpacing = '0px';

  // Le tampon, en dernier, par-dessus la signature.
  ctx.save();
  ctx.translate(L - MARGE - 190, pied - 92);
  ctx.rotate((-11 * Math.PI) / 180);
  ctx.scale(0.72, 0.72);
  ctx.globalAlpha = 0.86;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(tampon(d.numero), -220, -115);
  ctx.restore();

  return new Promise((resoudre, rejeter) => toile.toBlob((b) => (b ? resoudre(b) : rejeter(new Error('Image indisponible.'))), 'image/png'));
}
