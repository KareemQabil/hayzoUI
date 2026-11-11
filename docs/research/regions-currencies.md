# Regions and currencies — research report

Layer owner paths: `data/regions/`, `data/currencies/`, `data/schema/region.schema.json`,
`data/schema/currency.schema.json`, `tools/extract/regions/`. Retrieved and built on 2026-11-11.

## What was collected

| Kind | Files | File-level confidence |
|---|---|---|
| `region` | 22 (AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE) | 0 verified, 22 needs-review |
| `currency` | 25 (AED BHD DJF DZD EGP EUR GBP ILS IQD JOD KMF KWD LBP LYD MAD MRU OMR QAR SAR SDG SOS SYP TND USD YER) | 2 verified (DJF, KMF), 23 needs-review |

The file-level numbers follow the rule in `docs/DATA_MODEL.md` (a file takes the lowest confidence of anything in
it) and understate the data. Every field in all 47 files is mechanical extraction from a primary source, except:

- `dialectGroup` in the 22 region files: authored, needs-review.
- `subunit` in 23 currency files: researched from a secondary source, needs-review; `subunit.plural` in the same
  23: authored, needs-review.
- `symbol.glyph.note` in 3 currency files: researched. SAR and AED verified against the central bank's own
  publication; OMR needs-review (press report only).

Each exception is listed in `data.fieldProvenance` of the file that holds it, with its own method, confidence and
sources. Without `dialectGroup`, `subunit` and the OMR note, all 47 files would be `verified`.

The 25 currencies are the 22 that CLDR lists as current legal tender in the 22 regions (ILS and JOD for PS), plus
USD, EUR and GBP.

## How to reproduce

```
tools/extract/regions/fetch.sh <empty dir outside the repo>
node tools/extract/regions/build.mjs --src <dir>            # writes the 47 files
node tools/extract/regions/build.mjs --src <dir> --check    # exits 1 if any file differs
```

`build.mjs` has no dependencies and refuses to run when a source's declared version differs from the pin in
`tools/extract/regions/inputs/sources.json` (which also records the sha256 of each download). It was run against
two independent downloads; the second run was `--check` and reported no difference. Hand-written inputs that the
script merges in: `inputs/dialect-groups.json`, `inputs/subunits.json`, `inputs/glyph-notes.json`.

## Sources

| Source | Version | License | Used for |
|---|---|---|---|
| Unicode CLDR, npm `cldr-core`, `cldr-numbers-full`, `cldr-dates-full`, `cldr-localenames-full` | 49.0.0 (published 2026-10-22) | Unicode-3.0 | everything not listed below |
| IANA Time Zone Database, `zone.tab` and `backward` | 2026f | Public domain | `timeZones`, `tzdbLinks` |
| ISO 4217 list one, SIX (the ISO 4217 Maintenance Agency) | published 2026-09-17 | free download; facts only | currency `numeric`, `minorUnits` |
| Unicode Character Database, `UnicodeData.txt`, `DerivedAge.txt` | 18.0.0 | Unicode-3.0 | `symbol.glyph` |
| Google libphonenumber, `resources/PhoneNumberMetadata.xml` | v9.0.43 | Apache-2.0 | `phone.callingCode` |
| Wikipedia, "List of circulating currencies" (en rev. 1384536529) and «قائمة العملات المتداولة» (ar rev. 75971711) | pinned revisions | CC-BY-SA-4.0; facts only | `subunit` |
| SAMA riyal-symbol page; CBUAE press release of 2025-03-27; Oman Observer of 2025-11-19 | — | official publications / press; facts only | `symbol.glyph.note` |

CLDR no longer ships `telephoneCodeData` (absent from cldr-core 49), so calling codes come from libphonenumber.
They agree with the files the phone layer has written. CLDR's own currency numeric codes (`codeMappings`) were
compared with ISO for all 25 and agree; the files carry the ISO value (zero-padded).

## Schema changes (all additive, optional)

`region.schema.json`

- `languages[].role` gains `official-regional`; `languages[]` gains `cldrStatus` (CLDR's value verbatim) and
  `populationPercent`.
- `locales[].monthNamesSharedWith` — for `mixed` only: how many of the 12 names equal each family's.
- `nameVariants.short` — CLDR's alt="short" name.
- `otherLocales` — non-Arabic locales CLDR ships for the region (tags only).
- `tzdbLinks` — zones that tzdb keeps only as a Link, with their target.
- `timeData` — CLDR's preferred and allowed hour symbols for the region.
- `worldDefaults` — fields CLDR does not state for the region, where the value is territory 001's.
- `fieldProvenance` — per-field method, confidence, sources.

`currency.schema.json`

- `plural.arStated` — the count categories CLDR actually states.
- `symbol.variant`, `symbol.codeFallback`, `symbol.byLocale`.
- `cldrFractions` `{digits, rounding, stated}`; `cash.stated`; a description on `cash`.
- `subunit.others`, `subunit.note`.
- `arabLeagueRegions`; `fieldProvenance`.

Mapping rules applied by the script, all visible in it:

- A region's languages are those with an official status in CLDR `territoryInfo` (`official` and
  `de_facto_official` → `official`; `official_regional` → `official-regional`), plus non-official languages used by
  10 % or more of the population as `widely-used`. The threshold is this project's; the percentage is kept so it can
  be changed.
- `hourCycle` is read from the locale's short time pattern (`h` → h12, `H` → h23).
- `gregorianMonthNames` compares the locale's 12 wide month names with those of `ar` (english-derived), `ar-LB`
  (syriac) and `ar-DZ` (french-derived); anything else is `mixed`.
- `currency.primary` is the first current-tender entry in CLDR `currencyData` for the region, `alsoUsed` the rest.
- `timeZones` are the `zone.tab` rows of the country, in file order.
- `symbol.glyph` is CLDR's variant symbol, else its English symbol, when that is a single code point of general
  category Sc.
- Bidi control characters inside data are written as `\uXXXX` escapes, so no file contains an invisible character.

## Findings that matter for an Arabic-first design

### Default numerals — the datum the library keys off

| CLDR default | Count | Regions |
|---|---|---|
| `latn` | 5 | AE, DZ, LY, MA, TN |
| `arab` | 17 | BH, DJ, EG, IQ, JO, KM, KW, LB, MR, OM, PS, QA, SA, SD, SO, SY, YE |

- **AE defaults to Latin digits**, alone among the Gulf states. SA, KW, QA, BH and OM default to Arabic-Indic.
- **LY defaults to Latin digits** with the Maghreb; **MR does not** — it is the one Maghreb locale on `arab`.
- **The bare `ar` locale (and `ar-001`) defaults to `latn`.** An application that sets only `lang="ar"` gets
  Latin digits; it gets Arabic-Indic digits only by naming one of the 17 regions.
- `nativeNumberingSystem` is `arab` for all 22.

### Time, week and calendar

- Hour cycle: h23 in KM and MA; h12 in the other 20.
- First day of week: Saturday in 12 (BH DJ DZ EG IQ JO KW LY OM QA SD SY), Sunday in 2 (SA YE), Monday in 8
  (AE KM LB MA MR PS SO TN). Only AE and LB state Monday; the other 6 inherit it from 001.
- Weekend: Friday–Saturday in 13 (BH DZ EG IQ JO KW LY OM QA SA SD SY YE), Saturday–Sunday in 9
  (AE DJ KM LB MA MR PS SO TN) — all 9 by inheritance from 001. AE is correct since 2022. For DJ, PS and SO the
  inherited value is doubtful (DJ has a Saturday first day stated but no weekend); treat these three as CLDR gaps
  to be checked against a national source before L1 relies on them.
- `minDaysInFirstWeek` is 1 for all 22, inherited. Measurement system (metric) and paper size (A4) are inherited
  for all 22.
- Calendar preference: Gregorian is first for all 22, including SA. `islamic-umalqura` is second in AE, BH, KW,
  QA and SA; SA alone lists `islamic-rgsa`; EG lists `coptic` second; SO has no entry and inherits
  `["gregorian"]` — no Islamic calendar is listed for it.
- Month names: english-derived 13 (AE BH DJ EG KM KW LY OM QA SA SD SO YE), syriac 5 (IQ JO LB PS SY),
  french-derived 2 (DZ TN), mixed 2. The two mixed locales are each their own list, not a blend to be guessed:
  MA has يوليوز، غشت، شتنبر، نونبر، دجنبر (6 names shared with english-derived, 3 with french-derived); MR has
  إبريل، أغشت، شتمبر، دجمبر (8 shared with english-derived). L1 needs five month tables, not three. LY is
  english-derived, not french-derived.

### Time zones

One zone each except PS (Asia/Gaza, Asia/Hebron). For 8 regions the country's zone is only a Link in tzdb:
BH → Asia/Qatar, KW and YE → Asia/Riyadh, OM → Asia/Dubai, DJ, KM and SO → Africa/Nairobi,
MR → Africa/Abidjan. The files keep the country's own identifier in `timeZones` and the target in `tzdbLinks`.

### Currencies

- **CLDR decimals differ from ISO 4217 for 5 currencies**: IQD (ISO 3, CLDR 0), LBP, SOS, SYP, YER (ISO 2,
  CLDR 0). `Intl.NumberFormat` follows CLDR, so it prints these without decimals, while ledgers and payment APIs
  that follow ISO count in fils or piastres. `minorUnits` is ISO; `cldrFractions.digits` is CLDR. L1 money must
  choose explicitly.
- CLDR states cash rounding for one of the 25: MRU, increment 20 at 2 digits (0.20, one khoums).
- **CLDR's Arabic plural names are not usable for amounts in words.** Only 7 of 25 state all six categories
  (DZD EGP LBP LYD MAD SDG TND); the other 18 state `other` only, so every category holds the singular. Of the 7,
  LBP and SDG give the singular for `two`, and LBP also for `many`. `plural.ar` holds the LDML fallback
  (missing category → `other`), and `plural.arStated` says what CLDR really has.
- Arabic symbols: 16 of 25 end in U+200F (AED BHD DZD EGP IQD JOD KWD LBP LYD MAD OMR QAR SAR SYP TND YER);
  MRU and SDG have Arabic abbreviations without it. Three have no Arabic symbol at all, so the ISO code is used:
  DJF, KMF, SOS — `ar-DJ`, `ar-KM` and `ar-SO` override these with Fdj, CF and S. ILS is ₪; USD and GBP are
  `US$` and `UK£` in Arabic.
- The `ar-XX` locales override no currency name. Symbol overrides for the 25: the three above, `ar-LB` SDG
  → "SDG", `ar-SS` GBP → "GB£".
- PS: CLDR's name is «الأراضي الفلسطينية» / Palestinian Territories, with «فلسطين» / Palestine as the short
  variant (kept in `nameVariants.short`). ISO 4217 lists no currency for Palestine; CLDR lists ILS then JOD.

### New currency signs

| Currency | Character | Unicode | Status in CLDR 49 |
|---|---|---|---|
| SAR | U+20C1 SAUDI RIYAL SIGN | 17.0 | alt="variant" only |
| AED | U+20C3 UAE DIRHAM SIGN | 18.0 | alt="variant" only |
| OMR | U+20C4 OMANI RIAL SIGN | 18.0 | alt="variant" only |

All three are encoded (UCD 18.0.0, `DerivedAge.txt`). The UAE dirham sign is therefore no longer pending: it is in
Unicode 18.0. The Omani rial sign, not in the brief, arrived with it. CLDR keeps the letter abbreviations as the
default symbol, so a formatter shows the new signs only if asked for the variant, and fonts older than the
respective Unicode version have no glyph — the token and font layers need a fallback. `cldr-core`'s
`package.json` still declares `unicodeVersion` 16.0.0 although its data contains these characters. Announcements:
SAMA, approved 20 February 2025; CBUAE, 27 March 2025 (the circled Digital Dirham mark is a different symbol and
is not encoded as this character); Central Bank of Oman, reported 19 November 2025.

## Gaps and open questions

- `officialName`: omitted for all 22. CLDR has no official names.
- `subunit`: omitted for DJF and KMF. The two Wikipedia lists disagree (English: none; Arabic: سنتيم, 100); the
  files follow the English list, which matches ISO's zero minor units.
- `subunit` for the other 23 rests on Wikipedia only. No central-bank publication was checked. JOD: both lists
  give the piastre (100) as the unit; the file makes the fils (1000) primary because ISO counts three minor units,
  and lists piastre and dirham under `others`. This choice needs a decision.
- `subunit.plural` (23 files) was written by hand from grammar, from no source.
- `cash.smallestCoin`: not collected for any currency.
- `symbol.glyph.note` for OMR: the central bank's page returned HTTP 503; the date is from the press.
- `week.weekend` for DJ, PS, SO and `calendars` for SO are CLDR world defaults that look wrong for the country.
- `dialectGroup` is authored for all 22: gulf (AE BH KW OM QA SA), levantine (JO LB PS SY), maghrebi
  (DZ LY MA MR TN), egyptian (EG), mesopotamian (IQ), sudanese (SD), yemeni (YE), other (DJ KM SO). SA is one
  group although it has Najdi, Hejazi and Gulf varieties.
- `languages` uses a 10 % threshold for `widely-used`; CLDR's population figures are estimates.
- `locales` holds only the `ar-XX` locale of each region (one each, all 22 exist). Non-Arabic locales are tags in
  `otherLocales` without numbering or hour data, because some default to systems the enum does not have
  (ff-Adlm-MR).
- The ISO 4217 list URL is not versioned; `fetch.sh` will fetch a newer list after the next amendment and
  `build.mjs` will then stop until the pin is updated.

## Proposal: confidence of mixed files

File-level confidence is the lowest of any field, so one authored field makes a whole extracted file
`needs-review`. Either (a) let the validator accept `verified` at file level when every weaker field is listed in
`data.fieldProvenance`, and report both counts, or (b) move `dialectGroup` and `subunit` into their own kinds
(for example `region-editorial`, `currency-subunit`) so extracted files stay purely extracted. `fieldProvenance`
is already written in both schemas and can be lifted into `common.schema.json` if other layers want it.

## Requests to other layers

- Language: authoritative Arabic number forms (singular, dual, plural, tamyiz) for currency and subunit names;
  CLDR does not provide them. The five Gregorian month lists (english-derived, syriac, french-derived, ar-MA,
  ar-MR).
- Finance: smallest coin in circulation and cash rounding practice per country; official country names.
- Phone: calling codes here are from libphonenumber v9.0.43; keep the two layers on one version.
- Fonts and tokens: coverage of U+20C1, U+20C3 and U+20C4 in each recorded typeface.

## What L1 should build from this

- Locale table: region → `ar-XX`, default and native numbering system, hour cycle, month-name family, first day,
  weekend, calendar order, zones. Make numerals an explicit option whose default comes from this table, and never
  infer it from `ar` alone.
- Money table: ISO minor units for storage and arithmetic, `cldrFractions.digits` for CLDR-compatible display,
  `cash` for cash rounding, symbols with the trailing U+200F preserved, and the variant sign as an opt-in.
- Treat `worldDefaults` as "CLDR is silent", not as fact.
