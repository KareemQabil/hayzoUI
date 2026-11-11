# Rules and fixtures — layer report

Researched 2026-11-11. Everything below is reproducible from `tools/extract/rules/`; `node tools/validate.mjs data/rules data/fixtures` passes (108 files, 0 failed).

## What was collected

**91 rules** in `data/rules/` (15 harvested, 76 new) and **17 fixture sets** in `data/fixtures/` (693 cases).

### Rules by area

| Area | Harvested (ids kept) | New | Ids |
|---|---|---|---|
| numerals | 4 | 4 | R-NUM-001, 002, 004, 005 · new R-NUM-006…009 |
| money | 1 | 6 | R-NUM-003 · new R-MONEY-001…006 |
| bidi | 2 | 11 | R-BIDI-001, 003 · new R-BIDI-004…014 |
| phone | 0 | 3 | R-PHONE-001…003 |
| date | 0 | 6 | R-DATE-001…006 |
| search | 2 | 3 | R-SRCH-001, 002 · new R-SRCH-003…005 |
| typography | 1 | 9 | R-TYPE-001 · new R-TYPE-002…010 |
| icons | 1 | 3 | R-BIDI-002 (the owner's id; its area is icons) · new R-ICON-001…003 |
| layout | 0 | 10 | R-LAYOUT-001…010 |
| input | 0 | 8 | R-INPUT-001…008 |
| content | 1 | 6 | R-CNT-001 · new R-CNT-002…007 |
| flow | 1 | 2 | R-FLOW-001 · new R-FLOW-002, 003 |
| accessibility | 2 | 5 | R-A11Y-001, 002 · new R-A11Y-003…007 |

Every rule has at least one check written so a machine could evaluate it (91 of 91; 3–6 checks each). None of the checks has been run: there is no harness yet.

The owner's `rules.ts` holds 15 rules, not 16; all 15 were harvested. Old file paths, component ids and test ids were dropped; the conditions those tests assert were rewritten as `checks`.

### Fixture sets

| Set | Cases | needs-expected | How the expectations were obtained | Confidence |
|---|---|---|---|---|
| `amounts-harvested` | 18 | 0 | script, from `amount(...)` calls in the owner's `fixtures.ts` | verified |
| `phones-harvested` | 6 | 0 | script, from `phone(...)` calls | verified |
| `formatting-harvested` | 4 | 0 | script for id/rule/expected string; structured input by hand | verified |
| `search-harvested` | 7 | 0 | script for id/rule; structured input and expected by hand from each `run()` | verified |
| `mixed-text-runs-harvested` | 15 | 0 | script, every `expect()` on a literal in `bidi-runs.test.ts` (BD-01…08) | verified |
| `table-harvested` | 16 | 0 | script, rows plus every `expect(ids(model(literal))).toEqual(literal)` in `table.test.ts` | verified |
| `properties-harvested` | 11 | 0 | transcribed by hand: the seeded invariants PROP-01…07, CT-01, BD-09, BD-10, TE-20 | needs-review |
| `mixed-direction` | 86 | 0 | inputs by hand; levels and visual order computed by the UAX #9 oracle | verified |
| `names` | 102 | 0 | synthetic names by hand; lengths, graphemes, directions, search keys computed | needs-review |
| `text-stress` | 66 | 0 | strings by hand; counts, normalisation, control inventory computed | needs-review |
| `amounts` | 69 | 6 | by hand under `arabic.amount.v1`, cross-checked by a re-implementation of the contract | needs-review |
| `phone-inputs` | 34 | 4 | by hand under `arabic.phone.eg.v1` (27 Egyptian cases cross-checked); 7 other-country cases | needs-review |
| `search-pairs` | 40 | 0 | by hand; verdict per tolerance level cross-checked against `arabic.search.v1` | needs-review |
| `numerals-in-copy` | 20 | 0 | by hand from CONTRACTS.md "Numerals in copy", cross-checked | needs-review |
| `plural-agreement` | 102 | 0 | CLDR rule for `ar`, equal to `Intl.PluralRules` for every count; 3 nouns × 32 counts + 6 fractions | needs-review |
| `dates` | 95 | 4 | computed with ICU 78.3 / CLDR 48 / tzdata 2026e; typed-date readings by hand | needs-review |
| `unicode-bidi-conformance` | 2 | 0 | record of the two upstream test files (not copied) | verified |

The 14 `needs-expected` cases have no `expected`: percent inputs (6, no contract exists), phone numbers whose answer depends on the numbering plan (4), and typed dates that need a century window or the field's calendar (4).

### Scripted versus transcribed

- **Scripted** (`harvest.mjs`, TypeScript parser, source never executed): all Arabic text of the 15 harvested rules; the 24 `amount()`/`phone()` fixtures in full; ids, rules and expected strings of the other 11 owner fixtures; the 15 bidi-run cases; the table rows and 16 table cases.
- **Transcribed by hand** (`harvest-overlay.mjs`): English translation of every harvested rule field; area, severity and checks; structured inputs of FM-F01…04 and SR-F01…07; the 11 seeded properties.
- **Authored** (`rules-src/`, `fixtures-src/`): the 76 new rules and all inputs of the nine new fixture sets. `build-fixtures.mjs` refuses to write a set when a hand-written expectation differs from the contract re-implementation; all agree.

### The bidi oracle

No third-party bidi code could be run under the protocol, so `tools/extract/rules/lib/uax9.mjs` is an implementation of UAX #9 (P2–P3, X1–X10, W1–W7, N0–N2, I1–I2, L1–L2) written for this layer. `uax9-conformance.mjs` runs it against the Unicode 18.0.0 files: **770,241 of 770,241** cases of BidiTest.txt and **91,707 of 91,707** of BidiCharacterTest.txt pass. No visual order in `mixed-direction` was typed by hand.

Result worth knowing: of the 68 mixed-direction cases that have an opposite-direction unit, **34 are displayed in the wrong order as bare strings** and 34 happen to come out right. Examples the algorithm gets wrong without isolation: `أستخدم C++` (the plus signs jump), `من 10–20 قطعة` (drawn 20–10), `الرصيد -50` (minus on the right of the digits), phone numbers with spaces, paths, `SKU: 12-AB-34`.

### Unicode conformance files (left upstream)

| File | Bytes | Lines | Tests | SHA-256 |
|---|---|---|---|---|
| [BidiTest.txt](https://www.unicode.org/Public/18.0.0/ucd/BidiTest.txt) | 7,959,988 | 497,590 | 770,241 | `9af2f882…e905aa` |
| [BidiCharacterTest.txt](https://www.unicode.org/Public/18.0.0/ucd/BidiCharacterTest.txt) | 6,880,771 | 96,465 | 91,707 | `045b24d2…573e01` |

Unicode 18.0.0, Unicode License V3 (redistribution allowed with the notice). Full hashes, format notes and URLs are in `data/fixtures/unicode-bidi-conformance.json`. Property files the oracle needs: `extracted/DerivedBidiClass.txt`, `BidiBrackets.txt`, `BidiMirroring.txt`, `UnicodeData.txt` from the same directory.

## Sources

| Source | Version read | License |
|---|---|---|
| hayzoUI, the owner's prototype (`github.com/KareemQabil/hayzoui`) | commit `9b4eb3271c64872768f0a5533796a8a36b67e6eb` (2026-11-08) | MIT |
| Unicode UAX #9 | Revision 52, Unicode 18.0.0, 2026-09-01 | Unicode-3.0 |
| Unicode Character Database | 18.0.0 | Unicode-3.0 |
| W3C Arabic & Persian Layout Requirements | Group Draft Note 2025-10-02 | W3C Document License |
| W3C i18n: Inline markup and bidirectional text in HTML; UBA basics; Structural markup and right-to-left text; Unicode controls for bidi; Declaring language in HTML | pages read 2026-11-11 | W3C Document License |
| CSS Logical Properties 1 | WD 2025-12-04 | W3C Document License |
| CSS Writing Modes 4 | CR 2019-07-30 | W3C Document License |
| CSS Text 3 / Text 4 / Overflow 3 / Fonts 4 | CRD 2026-08-14 / WD 2026-08-14 / WD 2025-10-07 / WD 2026-11-04 | W3C Document License |
| WCAG 2.2 | Recommendation 2024-12-12 | W3C Document License |
| HTML Living Standard | read 2026-11-11 | CC-BY-4.0 |
| Apple HIG, Right to left | page read 2026-11-11 (Markdown rendition) | proprietary; cited and re-expressed only |
| Microsoft Learn, Globalization: Text directionality; Format numbers | pages read 2026-11-11 | CC-BY-4.0 (as published for Microsoft Learn; not re-verified per page) |
| Material Design 2, Bidirectionality | **not readable** (JavaScript-only page) | — |
| ICU via Node.js Intl | ICU 78.3, CLDR 48.0, tzdata 2026e, Node 22.23.4 | Unicode-3.0 |
| CLDR plural rules (`cldr-json` main) | read 2026-11-11 | Unicode-3.0 |

Section numbers cited in rules were checked against the downloaded text for UAX #9, alreq, CSS Logical, CSS Writing Modes and WCAG. For CSS Text, CSS Fonts, CSS Overflow, HTML and the APG the headings could not be checked mechanically, so those references carry a topic, not a number.

## Schema changes

All in my two schema files, all optional fields except where noted.

- `rule.schema.json`: added `problem`, `context`, `exceptions` (localized, to keep the owner's fields apart), `origin` (harvested | new), `status` (proposed | in-review | accepted), `references` [{name, url, section}], `fixtures` [set id]. `checks` now needs at least one entry when present.
- `fixture.schema.json`: added `inputShape`, `expectedShape`, `rules`, `tagVocabulary`, `shared`, `externalFiles` on the set, and `rules` on a case.
- **Id pattern widened** in both files from `^R-[A-Z]+-[0-9]{3}$` to `^R-[A-Z][A-Z0-9]*-[0-9]{3}$`. The brief said both "keep their ids" and gave the stricter pattern; the owner's `R-A11Y-001/002` contain digits. I kept the ids. If another layer validates rule ids with the strict pattern it will reject these two and my five new `R-A11Y-*`.

## Decisions that need the owner

1. **Harvested rules are marked `verified`.** The Arabic is verbatim from the owner's file, but there every rule's review state is `proposed`, and the English and the checks are mine. If "verified" should mean "accepted by the owner", these 15 files drop to `needs-review`.
2. **CONTRACTS.md decisions that deserve to be rules.** I wrote them up as new rules or checks, all `proposed`:
   - Empty is `null` everywhere, including text fields — only amounts are covered (R-NUM-005). Candidate for a general rule.
   - "Dominant script, isolated islands" for names versus the browser's first-strong — recorded in `mixed-text-runs-harvested` and cited by R-BIDI-005, which does not choose between them. The two disagree on every Latin-first Arabic name (`Dr. سامي الحلبي`).
   - `mixedAlign` (`ui` versus `content`) as a regional preference — referenced in R-LAYOUT-009; no rule fixes the default.
   - Numerals in copy and the identifier exemptions — R-NUM-007 and the `numerals-in-copy` set.
   - Date storage as ISO Gregorian — R-DATE-002.
   - Grouping with U+202F in amounts and U+00A0 in phones — already R-BIDI-003. Open point: CLDR and alreq give `٬` (U+066C) as the Arabic thousands separator; the owner rejects it for display because common UI fonts draw it like `٫`. R-NUM-009 follows the owner. This is a deliberate departure from CLDR and should be confirmed with the fonts layer's measurements.
   - Display while not editing, ungrouped while editing (amounts, phones) — in R-PHONE-003 only.
   - No component takes `dir`; `contentDir` describes data — R-LAYOUT-002, R-BIDI-009.
   - Dialog does not close during submission — already R-A11Y-002.
3. **`arabic.amount.v1` details not stated in CONTRACTS.md but present in the code**, now pinned by fixtures: U+2212 accepted as minus; NBSP, NNBSP and thin space accepted as grouping; `-0` rejected when negatives are off; `50.000` rejected in a two-decimal currency; `1,234` in KWD offers two readings.
4. **Search gaps** (`search-pairs`, tag `v1-gap`): no NFC normalisation, so decomposed alef-madda fails a strict match; Farsi yeh and keheh are never folded; presentation forms never match; diacritics are folded even at the strict level. R-SRCH-005 proposes closing them.
5. **Chart and timeline direction** (R-LAYOUT-005) is stated as "decide explicitly"; published guidance does not agree and I did not invent a default.

## Gaps and open questions

- Material Design bidirectionality could not be read; rules citing it (R-ICON-001, 003, R-LAYOUT-004, 005, 007, R-BIDI-009, R-CNT-003) rest on Apple's page and prior knowledge for that part. R-BIDI-002's owner citation is kept as the owner wrote it.
- All Arabic in the 76 new rules, the noun forms in `plural-agreement` and the synthetic names are my wording: a native reviewer is needed. Dual and plural forms are nominative only.
- `dates` expectations come from ICU, not from this repository's calendar data; Umm al-Qura values can differ from an official announcement by a day. Week data is ICU's view (e.g. AE Monday, EG Saturday, SA Sunday).
- `text-stress` grapheme counts use Unicode 17 data (Node's ICU); the bidi work uses Unicode 18.
- Percent input has no contract; phone validity outside Egyptian mobiles is not covered; no fixture for keyboard-layout mistakes (R-INPUT-005 has no mapping table yet); no pixel fixtures (line height, clipping, joining under highlight) — they need the fonts layer and a browser.
- Mirrored-glyph expectations cover only characters with a mirror pair in BidiMirroring.txt.
- Screen-reader pronunciation (R-A11Y-005) has no evidence at all; it asks for recorded runs.

## Findings that matter for an Arabic-first design

- Isolation is not optional polish: half of ordinary mixed strings are misordered without it, and the fix is always the same (one LTR isolate around the unit).
- An ASCII space between Arabic-Indic digit groups reverses the groups even inside an LTR field (MX-062); U+00A0 / U+202F keep one run (MX-063). Confirmed by the oracle, as the owner found in Chromium.
- First-strong (`dir="auto"`) is wrong for Latin-first Arabic names; digits are not strong, so `1. مقدمة` stays RTL.
- Tolerant search has a real cost: 7 of the 40 pairs are different words that a tolerance level joins.
- The three Islamic calendar variants never all agree on any of the 25 sampled days.
- `type="number"` cannot be used; six plural forms are required; `101, 102` are `other`, `103` is `few`.

## Requests to other layers

- **Phone**: decide the 4 `needs-expected` phone cases; confirm trunk-zero and `00` handling per country.
- **Calendar / regions**: compare `dates` (conversions, month lengths, week start) with your data and report differences.
- **Fonts**: measure whether `٬` and `٫` are distinguishable per typeface (decides R-NUM-009 / R-BIDI-003), and ink extents of TS-052 for R-TYPE-002.
- **Language**: review the six noun forms; supply the honorific list R-CNT-006 mentions.
- **Icons**: `R-ICON-001` expects `mirror: auto | never` plus a reason category on every icon record.
- **Patterns**: every horizontal keyboard contract needs the RTL variant R-LAYOUT-006 describes.
- **Anyone validating rule ids**: use `^R-[A-Z][A-Z0-9]*-[0-9]{3}$`.

## What L1/L2 should build from this

- L1 `text/bidi`: must pass `unicode-bidi-conformance`, then `mixed-direction` (levels, order, and an isolation helper that reproduces `isolated`). `lib/uax9.mjs` is a readable reference, not production code.
- L1 `money`, `phone`, `numerals`, `search`, `plural`, `date`: the harvested and authored sets are the acceptance tests; `properties-harvested` lists the seeded invariants to re-create.
- L2 engines: checks in R-LAYOUT-006, R-INPUT-001/002/007, R-FLOW-001/002 are engine tests in both directions.
- Harness: each rule's `fixtures` names its sets; each set's `rules` names its rules; `build-rules.mjs` fails if either side points at something missing.

## Files

- `tools/extract/rules/harvest.mjs <hayzoui checkout>` + `harvest-overlay.mjs` — harvested rules and sets.
- `tools/extract/rules/build-rules.mjs` + `rules-src/` — new rules.
- `tools/extract/rules/build-fixtures.mjs <ucd dir>` + `fixtures-src/` — authored sets. Run `harvest.mjs` first.
- `tools/extract/rules/uax9-conformance.mjs <ucd dir>`, `lib/uax9.mjs`, `lib/contracts.mjs`, `lib/common.mjs`.
- No data file and no script contains a raw bidi control or no-break space; they are written as JSON escapes or built from code points.
