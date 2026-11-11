#!/usr/bin/env bash
# Downloads every source the language and calendar extractors read into <sources-dir> (outside the repository).
# Nothing downloaded is executed: npm packages are packed and untarred, the rest are plain files.
#   bash tools/extract/language/fetch.sh <sources-dir>
#   node tools/extract/language/build.mjs <sources-dir>
#   node tools/extract/calendar/build.mjs <sources-dir>
set -euo pipefail
S="${1:?usage: fetch.sh <sources-dir>}"
CLDR=49.0.0
UCD=17.0.0
ICU=release-78.3
INTL_DATE=3.12.4
LUCENE=10.6.0
mkdir -p "$S/tgz" "$S/cldr" "$S/ucd" "$S/icu/$ICU" "$S/intl-date" "$S/cldr-xml" "$S/lucene"
cd "$S/tgz"
for p in cldr-core cldr-numbers-full cldr-dates-full cldr-units-full cldr-misc-full cldr-rbnf cldr-cal-islamic-full cldr-cal-coptic-full cldr-localenames-full cldr-bcp47; do
  npm pack "$p@$CLDR" --silent >/dev/null
  mkdir -p "$S/cldr/$p"
  tar -xzf "$p-$CLDR.tgz" -C "$S/cldr/$p" --strip-components=1
done
npm pack "@internationalized/date@$INTL_DATE" --silent >/dev/null
tar -xzf "internationalized-date-$INTL_DATE.tgz" -C "$S/intl-date" --strip-components=1
for f in UnicodeData.txt ArabicShaping.txt Scripts.txt ScriptExtensions.txt PropList.txt Blocks.txt DerivedAge.txt NameAliases.txt; do
  curl -fsS -o "$S/ucd/$f" "https://www.unicode.org/Public/$UCD/ucd/$f"
done
for f in islamcal.cpp gregoimp.cpp cecal.cpp coptccal.cpp; do
  curl -fsS -o "$S/icu/$ICU/$f" "https://raw.githubusercontent.com/unicode-org/icu/$ICU/icu4c/source/i18n/$f"
done
curl -fsS -o "$S/cldr-xml/ar.collation.xml" "https://raw.githubusercontent.com/unicode-org/cldr/release-49/common/collation/ar.xml"
curl -fsS -o "$S/lucene/ArabicNormalizer.java" "https://raw.githubusercontent.com/apache/lucene/releases/lucene/$LUCENE/lucene/analysis/common/src/java/org/apache/lucene/analysis/ar/ArabicNormalizer.java"
echo "sources ready in $S"
