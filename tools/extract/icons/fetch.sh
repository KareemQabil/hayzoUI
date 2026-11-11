#!/usr/bin/env bash
# Downloads every input of the icons layer into a scratch directory (never inside the repository).
#   tools/extract/icons/fetch.sh <scratch-dir>
# Nothing downloaded is executed: npm tarballs are unpacked with tar, repositories are sparse clones read as files.
set -euo pipefail
S="${1:?scratch directory}"; mkdir -p "$S/npm" "$S/git" "$S/maven" "$S/gfonts" "$S/remix-repo" "$S/guidance"
pack() { local d="$S/npm/$(echo "$1" | tr '/@' '__')"; mkdir -p "$d"; (cd "$d" && npm pack "$1" --silent >/dev/null && tar xzf ./*.tgz && rm ./*.tgz); }
for p in lucide-static @tabler/icons @phosphor-icons/core heroicons @carbon/icons iconoir bootstrap-icons remixicon; do pack "$p"; done
sparse() { git clone --depth 1 --filter=blob:none --sparse "$1" "$S/git/$2"; shift 2; git -C "$S/git/$REPO" sparse-checkout set --no-cone "$@"; }
REPO=lucide sparse https://github.com/lucide-icons/lucide.git lucide '/LICENSE' '/icons/*.json' '/categories/*.json' '/package.json'
REPO=bootstrap-icons sparse https://github.com/twbs/icons.git bootstrap-icons '/LICENSE' '/docs/content/icons/*.md' '/package.json'
REPO=iconoir sparse https://github.com/iconoir-icons/iconoir.git iconoir '/LICENSE' '/iconoir.com/icons.csv' '/package.json'
REPO=fluent sparse https://github.com/microsoft/fluentui-system-icons.git fluent '/LICENSE' '/README.md' '/assets/*/metadata.json' '/importer/rtl.txt' '/packages/svg-icons/package.json'
REPO=mdi sparse https://github.com/google/material-design-icons.git mdi '/LICENSE' '/update/current_versions.json' '/variablefont/*.codepoints'
# Material Symbols: fetch only the plain 24px outlined Android drawable of each symbol (the file that carries android:autoMirrored).
git -C "$S/git/mdi" ls-tree -r HEAD symbols/android | awk -F'\t' '{split($2,p,"/"); if (p[4]=="materialsymbolsoutlined" && p[5]==p[3]"_24px.xml") print $0}' > "$S/git/mdi-24.txt"
awk '{print $3}' "$S/git/mdi-24.txt" | sort -u | git -C "$S/git/mdi" -c fetch.negotiationAlgorithm=noop fetch origin --no-tags --no-write-fetch-head --recurse-submodules=no --filter=blob:none --stdin
curl -sS -o "$S/gfonts/icons.json" 'https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true'
for a in material-icons-extended-desktop material-icons-core-desktop; do
  curl -sS -o "$S/maven/$a-1.7.8.jar" "https://dl.google.com/android/maven2/androidx/compose/material/$a/1.7.8/$a-1.7.8.jar"
  curl -sS -o "$S/maven/$a-1.7.8.pom" "https://dl.google.com/android/maven2/androidx/compose/material/$a/1.7.8/$a-1.7.8.pom"
done
curl -sS -o "$S/remix-repo/License" https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/License
curl -sS -o "$S/guidance/apple-hig-rtl.json" https://developer.apple.com/tutorials/data/design/human-interface-guidelines/right-to-left.json
echo "done: $S"
