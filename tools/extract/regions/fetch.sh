#!/usr/bin/env bash
# Downloads the pinned upstream artifacts for build.mjs into a fresh directory OUTSIDE the repository.
#   tools/extract/regions/fetch.sh <empty dir>     then     node tools/extract/regions/build.mjs --src <dir>
# Nothing downloaded is executed: npm tarballs are unpacked with tar, the rest are read as text.
# Versions and sha256 sums are pinned in inputs/sources.json. The ISO 4217 list and the IANA "latest" UCD path
# are not versioned by URL upstream; build.mjs checks the version each file declares and stops if it has moved.
set -euo pipefail
dest="${1:?usage: fetch.sh <empty dir>}"
mkdir -p "$dest"/{tgz,cldr,tzdb/src,iso4217,ucd,libphonenumber}
cd "$dest"
for p in cldr-core cldr-numbers-full cldr-dates-full cldr-localenames-full; do
  (cd tgz && npm pack "$p@49.0.0" --silent >/dev/null)
  mkdir -p "cldr/$p" && tar -xzf "tgz/$p-49.0.0.tgz" -C "cldr/$p" --strip-components=1
done
curl -fsS -o tzdb/tzdata2026f.tar.gz https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz
tar -xzf tzdb/tzdata2026f.tar.gz -C tzdb/src
curl -fsSL -o iso4217/list-one.xml https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
curl -fsS -o ucd/UnicodeData.txt https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt
curl -fsS -o ucd/DerivedAge.txt https://www.unicode.org/Public/18.0.0/ucd/DerivedAge.txt
curl -fsS -o libphonenumber/PhoneNumberMetadata.xml https://raw.githubusercontent.com/google/libphonenumber/v9.0.43/resources/PhoneNumberMetadata.xml
sha256sum tgz/*.tgz tzdb/tzdata2026f.tar.gz iso4217/list-one.xml ucd/*.txt libphonenumber/PhoneNumberMetadata.xml
