# Language and calendar layer — research report

Scope: `data/language/ar/`, `data/calendar/`, their two schemas, `tools/extract/language/`, `tools/extract/calendar/`.
Retrieved 2026-11-11. Everything below was produced by the committed scripts; nothing was typed in by hand except
the wording of gaps, caveats and algorithm descriptions, each of which is backed by a value the script reads or
measures (and asserts, where it is a constant of the ICU source).

## How to regenerate

```bash
bash tools/extract/language/fetch.sh <sources-dir>      # outside the repository; ~410 MB
node tools/extract/language/build.mjs <sources-dir>     # 26 files, < 1 s
node tools/extract/calendar/build.mjs <sources-dir>     # 8 files, ~7 s (runs the Intl verification)
node tools/validate.mjs data/language data/calendar     # 34 files, 0 failed
```

Checked: a fresh `fetch.sh` into an empty directory followed by two runs of both builds gives 34 files with
identical SHA-256 both times. Two parts depend on the Node that runs the build, and record its versions next to the
result: `collation.json → content.intlProbe` and, in calendar files, `intl.probe`, the figures inside
`intl.caveats`, and `verification`. They were generated on Node 22.23.4 / ICU 78.3 / CLDR 48.0 / Unicode 17.0.
Byte-identical output therefore needs the same Node; everything else depends only on the pinned sources.

## What was collected

34 data files, all `verified` (mechanical extraction from a primary source by a committed script).

### `data/language/ar/` — 26 files, 17 datasets

| Dataset | Files | Content |
|---|---|---|
| `plural-rules` | 1 | 6 categories with CLDR conditions, integer and decimal samples; 23 plural-range rules; CLDR minimal pairs |
| `ordinal-rules` | 1 | 1 category (`other`) — Arabic has no ordinal plural distinction in CLDR |
| `spellout` | 1 | 10 RBNF rule sets (7 public, 3 private), 264 rules, parsed to tokens; 7 gaps |
| `numbering-systems` | 1 | `arab`, `arabext`, `latn` digits; default system per locale (2 groups); symbols per system per locale group (arab: 1 group, latn: 3 groups) |
| `number-patterns` | 1 | decimal, percent, scientific, currency (standard, accounting, noCurrency, alphaNextToNumber), currency spacing, compact short and long (12 magnitudes × 6 plural forms), misc and rational patterns, for `arab` and `latn` |
| `gregorian-months` | 6 | one file per name set; wide/abbreviated/narrow × format/stand-alone |
| `weekdays` | 1 | wide/abbreviated/short/narrow × format/stand-alone |
| `quarters` | 1 | same shape |
| `day-periods` | 2 | 7 day-period rules (CLDR `dayPeriods`) and names of am/pm + 7 periods |
| `date-patterns` | 3 | date/time formats and skeletons, date-time glue (standard, atTime, relative), 71 available formats, 36 interval formats, append items |
| `relative-time` | 2 | 22 fields × long/short/narrow: display name, relative −2…+2, future/past × 6 plural forms |
| `list-patterns` | 1 | 9 list types (standard, or, unit × default/short/narrow) |
| `units` | 2 | 78 units long, 77 short, 77 narrow (all of duration, length, mass, digital + percent, permille) with gender, 6 plural forms, per-unit pattern; `h:mm`, `h:mm:ss`, `m:ss` |
| `delimiters` | 1 | quotation marks, text orientation, ellipsis patterns |
| `characters` | 1 | 17 code-point classes (below), 8 Arabic blocks with statistics, CLDR exemplar sets (4 locale groups), CLDR lenient-parse sets, one reference folding |
| `collation` | 1 | CLDR tailoring for `ar` (2 types) and a 21-pair probe of `Intl.Collator('ar')` |

Spell-out rule sets: `%spellout-numbering-year`, `%spellout-numbering`, `%spellout-cardinal-masculine`,
`%spellout-cardinal-feminine`, `%spellout-ordinal-masculine`, `%spellout-ordinal-feminine`, `%digits-ordinal`
(7 public) and `%%spellout-numbering-m`, `%%ordinal-ones-masculine`, `%%ordinal-ones-feminine` (3 private).

Character classes (selector stated per class in the file; counts are members):
tashkeel 9 · arabic-combining-marks 121 · tatweel 4 · hamza-forms 17 · hamza-marks 3 · alef-forms 29 · yeh-forms 21 ·
teh-marbuta-heh-forms 9 · kaf-forms 25 · waw-forms 16 · lam-alef-ligatures 8 · punctuation 18 · digits 20 ·
currency-symbols 2 · bidi-controls 12 (with role and direction) · join-controls 2 · prepended-concatenation-marks 7.
Each member carries code point, name, general category, bidi class, combining class, joining type and group,
decomposition, Unicode age, and whether CLDR lists it in the `ar` main or auxiliary exemplar set, so L1 can narrow a
class to "letters Arabic users actually type" without a second lookup.

### `data/calendar/` — 8 files

Seven calendars: `gregory`, `islamic-umalqura`, `islamic-civil`, `islamic-tbla`, `islamic`, `islamic-rgsa`, `coptic`.
The list is not chosen by hand: the script fails if CLDR `calendarPreferenceData` lists, for any of the 22 Arab
League regions, a calendar it does not build. `persian` is listed only for AF and IR, so it is not included.

Each file: Arabic and English name, 12 (coptic 13) months with wide and abbreviated names in both languages and day
counts, eras with CLDR codes and start/end, `preferredIn` (region, rank in the CLDR list, list length, explicit or
world default), CLDR date formats for `ar`, the Intl identifier with a runtime probe, and the conversion method with
its constants.

`data/calendar/tables/islamic-umalqura.json`: 301 years (1300–1600 AH), 3 612 months, 106 665 days,
Gregorian 1882-11-12 … 2174-11-25; 190 years of 354 days and 111 of 355. Per year: the ICU mask, the decoded twelve
month lengths, year length, start day from the epoch, Gregorian date of 1 Muharram.

### Verification results (Node 22.23.4, ICU 78.3)

| Check | Days or rows | Mismatches |
|---|---|---|
| Umm al-Qura table vs `Intl.DateTimeFormat('en-u-ca-islamic-umalqura')`, every day of the table | 106 665 | 0 |
| Same calendar, 20 000 days before the table vs islamic-civil arithmetic | 20 000 | 0 |
| Same calendar, 20 000 days after the table vs islamic-civil arithmetic | 20 000 | 0 |
| ICU masks vs `@internationalized/date` 3.12.4 `UMALQURA_DATA` | 301 years | 0 |
| ICU year-start formula (linear estimate + fix table) vs cumulative sum of the table | 301 years | 0 |
| islamic-civil arithmetic vs Intl, 1800-01-01 … 2200-12-31 | 146 462 | 0 |
| islamic-tbla arithmetic vs Intl, same span | 146 462 | 0 |
| coptic arithmetic vs Intl, same span | 146 462 | 0 |
| `islamic` vs `islamic-rgsa` in Intl, same span | 146 462 | 0 differ |

## Sources

| Source | Version | License | Used for |
|---|---|---|---|
| Unicode CLDR, npm `cldr-core`, `cldr-numbers-full`, `cldr-dates-full`, `cldr-units-full`, `cldr-misc-full`, `cldr-rbnf`, `cldr-cal-islamic-full`, `cldr-cal-coptic-full`, `cldr-localenames-full`, `cldr-bcp47` | 49.0.0 | Unicode-3.0 | everything in `language` except code-point properties; calendar names, eras, preference |
| Unicode CLDR XML `common/collation/ar.xml` (github.com/unicode-org/cldr) | tag `release-49` | Unicode-3.0 | collation tailoring (not shipped in cldr-json) |
| Unicode Character Database, unicode.org/Public/17.0.0/ucd: UnicodeData, ArabicShaping, Scripts, ScriptExtensions, PropList, Blocks, DerivedAge, NameAliases | 17.0.0 | Unicode-3.0 | `characters` |
| ICU4C `icu4c/source/i18n`: islamcal.cpp, gregoimp.cpp, cecal.cpp, coptccal.cpp | tag `release-78.3` | Unicode-3.0 | Umm al-Qura table, epochs, leap rules, month lengths |
| `@internationalized/date` (Adobe) | 3.12.4 | Apache-2.0 | cross-check of the Umm al-Qura table only |
| Apache Lucene `ArabicNormalizer.java` | 10.6.0 | Apache-2.0 | `characters → searchFoldingReference` (5 mappings, 9 removals — facts about what it folds) |

The Umm al-Qura table is recorded as taken from **ICU4C**; `@internationalized/date` holds the identical 301 masks.
ICU 78.3 was chosen because it is the ICU inside the Node that verifies the table. CLDR's own package metadata says
`unicodeVersion 16.0.0` while the UCD read here is 17.0.0; no value in this layer depends on the difference.
The npm package `@unicode/unicode-17.0.0` was not used: it ships JavaScript modules, and the protocol says downloads
are read, not executed, so the UCD text files were read instead.

## Schema changes (additive)

`language.schema.json`
- `dataset` enum gains `quarters` and `delimiters`.
- `data.allOf` holds one `if dataset = X then content = …` clause for each of the 17 datasets written, with `$defs`
  for plural forms, plural categories, RBNF tokens, character members, width contexts and locale groups.
  `honorifics` and `other` stay untightened (no file uses them).
- File naming made explicit: `<dataset>.<first locale of scope>.json`; a file without `scope` covers all 28 CLDR
  `ar` locales.

`calendar.schema.json`
- `data` is now `if tableOf then monthLengthTable else calendarSystem`. `calendarSystem` is the previous object
  unchanged (same required fields, still closed) plus optional fields: `cldrId`, `cldrCalendarSystem`,
  `bcp47Description`, `preferredIn`, `dateFormats`, `verification`; on eras `cldrIndex`, `start`, `end`,
  `arabicNameIsUntranslated`; `intl.probe`; `conversion.epochJulianDay`.
- `monthLengthTable` is new: `tableOf`, `firstYear`, `lastYear`, `epochJulianDay`, `encoding`, `years[]`
  (`monthLengths` must be twelve values of 29 or 30), `crossChecks`, `verification`.

Both were negative-tested: a wrong plural category, a wrong RBNF rule kind, a malformed month-length row and a
calendar with a missing `months` or an unknown key are all rejected by `tools/validate.mjs`.

Convention note: CLDR patterns contain bidi marks as part of the datum. They are kept, but every invisible character
is written as a JSON `\uXXXX` escape, so no data file (and no script) contains a raw bidi control; a check over all
34 files finds none. 5 language datasets carry such escapes: `numbering-systems`, `number-patterns`,
`date-patterns` (3 files), `characters`, `collation`; the calendar files carry them in `dateFormats`.

## Where `ar-XX` locales differ in a way a UI must respect

CLDR 49 has 28 Arabic locales: `ar` plus 27 regional ones — the 22 Arab League states and `ar-EH`, `ar-ER`,
`ar-IL`, `ar-SS`, `ar-TD`. All 28 were compared field by field; identical content is written once.

1. **Gregorian month names — 6 sets.**
   - `ar` and AE BH DJ EG EH ER IL KM KW LY OM QA SA SD SO SS TD YE: يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر
   - DZ TN: جانفي فيفري مارس أفريل ماي جوان جويلية أوت سبتمبر أكتوبر نوفمبر ديسمبر
   - JO LB PS SY: كانون الثاني شباط آذار نيسان أيار حزيران تموز آب أيلول تشرين الأول تشرين الثاني كانون الأول
   - IQ: the same words as the Levant, but its abbreviated month 10 contains U+00A0 (no-break space) instead of a
     space. A string comparison or a search over month names must normalise it.
   - MA: يناير فبراير مارس أبريل ماي يونيو يوليوز غشت شتنبر أكتوبر نونبر دجنبر
   - MR: يناير فبراير مارس إبريل مايو يونيو يوليو أغشت شتمبر أكتوبر نوفمبر دجمبر
   Narrow names collide inside every set (ar: ي for January, June and July), so narrow month names are not usable as
   labels on their own. Libya follows the default set in CLDR.
2. **Default digits — 2 groups.** `latn` for `ar`, AE, DZ, EH, LY, MA, TN; `arab` for the other 21 (including EG,
   SA and all of the Levant and Gulf except AE). The bare locale `ar` defaults to Latin digits.
3. **Latin-digit separators — 3 groups.** Decimal `.` and group `,` for most; decimal `,` and group `.` for DZ, LB,
   LY, MA, MR, TN; SA and SO share the first group's separators but use U+066A ٪ as the percent sign even with Latin
   digits. Lebanon and Mauritania default to Arabic-Indic digits but use the comma-decimal convention when Latin
   digits are requested.
4. **Arabic-Indic symbols — 1 group.** Decimal U+066B, group U+066C everywhere. Percent is U+066A followed by
   U+061C; minus is U+061C + U+002D (ASCII hyphen-minus, not U+2212); plus is U+061C + U+002B. With Latin digits the
   percent sign is U+200E % U+200E and minus is U+200E + U+002D. A parser that expects a bare `-` or `%` fails on
   formatted Arabic numbers; an input mask must strip U+061C, U+200E and U+200F first.
5. **Time format — 3 groups.** 12-hour `h:mm a` everywhere except KM and MA (`HH:mm`) and IL (`H:mm`).
6. **Day-period names — 2 groups.** LY and SA abbreviate `night2` as ل where the others have ليلاً.
7. **Relative time — 2 groups.** AE says هذه السنة / السنة التالية where the others say السنة الحالية / السنة القادمة.
8. **Units — 2 groups.** SA differs from all others in 45 of the 232 extracted unit entries: it has true dual and
   plural forms (كيلومتران، سنتيمترات، ثوانٍ) where `ar` repeats the singular with a number. For a UI that prints
   "2 km" in words, `ar-SA` is the better-formed data.
9. **Exemplar characters — 4 groups** (number set differs by digit default; MA adds ڭ and ݣ to auxiliary letters
   and drops tatweel).
10. **Era alternates.** AE alone has قبل الميلاد for the BCE variant; no effect on the default era names.

Identical across all 28: plural rules, weekdays, quarters, date formats and skeletons, list patterns, number and
currency patterns, delimiters, Hijri and Coptic month names.

## Findings that matter for an Arabic-first design

- **CLDR's Arabic RBNF cannot be used as-is for تفقيط.** The rule sets are faithfully extracted and executable (a
  reference interpreter is in `tools/extract/language/rbnf.mjs`), and running them shows what they produce:
  300 → «ثلاثة مائة», 2 000 000 → «إثنان مليون», feminine 21 → «واحد وعشرون», masculine 11 → «إحدى عشر»,
  ordinal 21 → «الحادي  والعشرون» (two spaces), ordinal 2 000 000 → «إثنان الألف». These outputs come from this
  layer's interpreter, which was not compared with ICU's RBNF engine (Node does not expose it); the rule text
  itself is CLDR's. L1 should treat `spellout.json` as the documented baseline and write its own reviewed rules.
- `spellout.json → gaps` lists 7 needs RBNF does not meet: currency agreement, «فقط لا غير», dual of the counted
  noun, case and tanween, gender agreement for 3–10, minor units read as a whole number, values from 10^18.
  Each is tied to a mechanical check (`checks`: no currency rule set, no tanween, no tashkeel at all, no «فقط»).
- **`Intl.Collator('ar')` results** (ICU 78.3; all 21 pairs are in `collation.json`):
  trusted at `sensitivity: 'base'` for ignoring tashkeel, shadda, tatweel, U+200F, U+200C, presentation forms and
  lam-alef ligatures, for أ/إ = ا, ى = ي = ی, and for treating ASCII, Arabic-Indic and Extended Arabic-Indic digits
  as equal; alphabet order matches the CLDR index order; Arabic sorts before Latin.
  **Not** folded even at base: آ vs ا (آ sorts as ءا), ٱ vs ا, ؤ vs و, ئ vs ي, ك vs ک (Persian keheh), ة vs ه, and
  `,` vs `،`. And ة equals ت at base, which is right for sorting and wrong for search.
  With `usage: 'search'` the four pairs tried (tashkeel, أ/ا, ى/ي, ة/ه) all compare equal, so the search collator
  folds ة/ه where the sort collator does not. `numeric: true` orders Arabic-Indic digit strings by value.
  Conclusion: use Intl.Collator for sorting; do search normalisation in L1 from `characters.json`.
- **U+FEFF (BOM) sits inside the block "Arabic Presentation Forms-B"** and U+FDD0–U+FDEF inside Forms-A are
  noncharacters. A range test `FE70–FEFF` for "is Arabic" matches the BOM. `characters.json → blocks` lists the
  non-Arabic members of each block.
- Presentation forms: 592 code points in Forms-A and 139 in Forms-B have a compatibility decomposition
  (`String.prototype.normalize('NFKC')` handles them); 64 and 2 do not.
- The tatweel class has 4 members in Unicode 17 (U+0640 and U+0883–U+0885), not 1.
- `hamza-forms` are found by canonical decomposition, so NFD plus removal of U+0653–U+0655 folds آ أ إ ؤ ئ to
  their carriers with no table. ٱ (U+0671) has no decomposition and needs an explicit rule.
- **`islamic-umalqura` is only Umm al-Qura between 1882-11-12 and 2174-11-25.** Outside, ICU returns islamic-civil
  arithmetic under the same calendar name, with no error. A date picker must clamp or label that range.
- **`islamic` and `islamic-rgsa` are the same computation in ICU** (0 differing days in 400 years; the RGSA class
  overrides only its name), and that computation differs from Umm al-Qura on 117 431 of 146 462 days — it usually
  runs a day ahead. islamic-civil differs from Umm al-Qura on 42 397 of those days. Defaulting a Hijri picker to
  `ca-islamic` shows users in the Gulf the wrong day most of the time.
- CLDR ranks `islamic-umalqura` second (after gregorian) for AE, BH, KW, QA, SA only; the other 15 listed states
  have `islamic` second; SO has no entry and inherits the world default (gregorian only); EG has coptic second.
- CLDR 49 has no Arabic text for the "before Hijra" era (ar carries `BH`) nor for the Coptic era (`AM`). Hijri era
  name and abbreviation are both هـ. Files flag these with `arabicNameIsUntranslated`.
- Hijri narrow month names in `ar` are the numbers ١…١٢, in Arabic-Indic digits regardless of the locale's digit
  default.
- Quotation marks in CLDR `ar` are ” … “ (U+201D to open, U+201C to close), not « ».
- The list pattern is `{0} و{1}` — the conjunction و attaches to the next word with no space.

## Gaps and open questions

- `arabext` (Extended Arabic-Indic) has digits but no symbols in any `ar` locale; recorded in
  `numbering-systems.json → symbolsNotProvided`. Separators for it would come from `fa`/`ur`, outside this layer.
- No `honorifics` dataset: CLDR has none, and no open authoritative source was found in this pass.
- No Arabic era name for BH and Coptic AM (above). Needs an authored, reviewed string.
- `officialIn` is left empty in every calendar file. CLDR records preference, not legal status, and no primary
  legal source was read. `preferredIn` holds what CLDR says.
- Not verified here, and deliberately left out of the data: whether announced Saudi month starts differ from the
  Umm al-Qura table for specific months, and the status of `islamic` / `islamic-rgsa` in the ECMAScript Temporal
  and Intl era/monthCode work. Both need a primary source before they become data.
- Temporal is not available in Node 22.23.4, so no Temporal behaviour was probed.
- The RBNF interpreter was not compared with ICU's engine (see above).
- Time-zone names, currency names and week data were not extracted (regions and currencies layers).
- `units` takes whole CLDR categories, so it includes units a UI rarely shows (parsec, shaku, dalton); L1 should
  pick a subset.
- `characters → searchFoldingReference` is one implementation's choice (Lucene). Which foldings Hayzo's search
  applies by default — notably ة→ه and ى→ي, which lose distinctions — is a design decision, not a datum.
- Intl probe results are for one runtime. Browsers ship other ICU versions; the observational calendars in
  particular are version-specific.

## Requests to other layers

- **Regions:** default numbering system per locale is duplicated here (`numbering-systems.json → defaults`) from
  the same CLDR field; if the regions files carry it, they should agree — 7 locales `latn`, 21 `arab`. The legal
  calendar of each state belongs there; this layer only has CLDR preference.
- **Currencies:** amount-in-words needs, per currency, the counted-noun forms for one, two, 3–10, 11–99 and 100+,
  for the major unit and the subunit, with the gender of each. CLDR `displayName-count-*` gives the major unit only.
- **Fixtures:** the 21 collation pairs, the RBNF sample outputs above, and the Umm al-Qura boundary dates
  (1882-11-11/12, 2174-11-25/26) are ready-made test inputs.
- **Rules:** "no raw bidi control characters in source or data; write them as escapes" was applied here and could
  be checked by `tools/validate.mjs`.

## What L1 and L2 should build from this

- `plural(n)` from the 6 conditions; range plurals from the 23 range rules.
- Number formatting from `number-patterns` + `numbering-systems`, with the symbol code points as given, and a
  lenient parser that strips U+061C/U+200E/U+200F and accepts all three digit sets and both separator conventions.
- Month names selected by region through the 6 `gregorian-months` scopes, never by language alone.
- Search normalisation from `characters.json`: NFKC for presentation forms, strip `tashkeel` (or the wider
  `arabic-combining-marks`), strip `tatweel`, fold `hamza-forms` by decomposition, then optional foldings by class.
- A Hijri engine that reads `tables/islamic-umalqura.json` directly (3 612 month lengths, epoch 1948440) and uses
  the civil arithmetic outside 1300–1600 AH only when the UI says so; the same arithmetic serves islamic-civil and
  islamic-tbla (epoch 1948439). Calendar-grid tests can be generated against Intl from the table.
- Amount in words: new, reviewed rules; `spellout.json` is the baseline to beat and its `gaps` the checklist.
