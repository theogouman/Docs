#!/usr/bin/env bash
#
# copy-docs.sh — Copie et renomme les 21 PDF du dossier de vente dans
# public/documents/, d'après le mapping `sourceFile` -> `file` de
# src/data/documents.json.
#
# À LANCER SUR VOTRE MACHINE LOCALE (les originaux n'existent pas dans
# l'environnement cloud). Les originaux ne sont JAMAIS modifiés.
#
# Usage :
#   ./scripts/copy-docs.sh
#   SRC="/chemin/vers/Docs : Hyères" ./scripts/copy-docs.sh
#
# Le fichier aae-acte-vente-annexes.pdf (original ~19,5 Mo) est compressé
# sous ~9 Mo via Ghostscript (-dPDFSETTINGS=/screen, 60 dpi) si `gs` est
# installé et que l'original dépasse le seuil. Sinon il est copié tel quel
# (et un avertissement est affiché).

set -euo pipefail

# Dossier source (modifiable via variable d'environnement SROBOT/SRC).
SRC="${SRC:-/Users/theogouman/Downloads/Docs : Hyères}"

# Racine du projet = dossier parent de scripts/.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/public/documents"
MANIFEST="$ROOT/src/data/documents.json"

COMPRESS_TARGET="aae-acte-vente-annexes.pdf"
COMPRESS_THRESHOLD_BYTES=$((12 * 1024 * 1024)) # 12 Mo

if [[ ! -d "$SRC" ]]; then
  echo "❌ Dossier source introuvable : $SRC"
  echo "   Définissez-le : SRC=\"/chemin/vers/Docs : Hyères\" $0"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js requis pour lire le manifeste $MANIFEST"
  exit 1
fi

mkdir -p "$DEST"
echo "Source      : $SRC"
echo "Destination : $DEST"
echo

filesize() {
  # Taille en octets (compatible macOS et Linux).
  if stat -f%z "$1" >/dev/null 2>&1; then stat -f%z "$1"; else stat -c%s "$1"; fi
}

copied=0
missing=0

# Émet des lignes "sourceFile<TAB>file" depuis le manifeste JSON.
while IFS=$'\t' read -r sourceFile file; do
  [[ -z "$sourceFile" ]] && continue
  in="$SRC/$sourceFile"
  out="$DEST/$file"

  if [[ ! -f "$in" ]]; then
    echo "⚠️  MANQUANT : $sourceFile"
    missing=$((missing + 1))
    continue
  fi

  if [[ "$file" == "$COMPRESS_TARGET" ]]; then
    size="$(filesize "$in")"
    if (( size > COMPRESS_THRESHOLD_BYTES )) && command -v gs >/dev/null 2>&1; then
      echo "🗜  Compression Ghostscript : $file ($((size / 1024 / 1024)) Mo -> ~9 Mo)"
      gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
         -dPDFSETTINGS=/screen \
         -dColorImageResolution=60 -dGrayImageResolution=60 -dMonoImageResolution=60 \
         -dNOPAUSE -dQUIET -dBATCH \
         -sOutputFile="$out" "$in"
      echo "    -> $(($(filesize "$out") / 1024 / 1024)) Mo (couche texte et 323 pages conservées)"
    else
      cp "$in" "$out"
      if (( size > COMPRESS_THRESHOLD_BYTES )); then
        echo "⚠️  $file copié SANS compression ($((size / 1024 / 1024)) Mo) — installez Ghostscript (brew install ghostscript) pour l'alléger."
      else
        echo "✓  $file"
      fi
    fi
  else
    cp "$in" "$out"
    echo "✓  $file"
  fi
  copied=$((copied + 1))
done < <(node -e '
  const docs = require(process.argv[1]);
  for (const d of docs) process.stdout.write(d.sourceFile + "\t" + d.file + "\n");
' "$MANIFEST")

echo
echo "Terminé : $copied copié(s), $missing manquant(s)."
[[ "$missing" -gt 0 ]] && echo "⚠️  Vérifiez les fichiers manquants ci-dessus."
exit 0
