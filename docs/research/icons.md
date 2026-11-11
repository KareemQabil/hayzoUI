# Icons — research report

Layer owner files: `data/icons/`, `data/schema/icon.schema.json`, `tools/extract/icons/`. Retrieved 2026-11-11.
Names and metadata only; no SVG geometry is stored.

## What was collected

| File | Dataset | Method / confidence | Content |
|---|---|---|---|
| `data/icons/sources/<id>.json` × 9 | source-catalog | extracted / verified | 22,670 icon entries across nine sets |
| `data/icons/mirror-evidence.json` | mirror-evidence | extracted / verified | 6 mechanical lists, 588 names |
| `data/icons/mirror-rules.json` | mirror-rules | researched / needs-review | 11 principles, 64 concept rules |
| `data/icons/core-set.json` | core-set | authored / needs-review | 354 concepts in 15 groups |
| `data/icons/gaps.json` | gaps | authored / needs-review | 21 gaps, each with its catalog search |

### Source catalogs

| Set | Version read | License (from the LICENSE file) | Icons | Grid | Model | Styles | npm | Tags / categories |
|---|---|---|---|---|---|---|---|---|
| Lucide | 1.72.0 (commit 03eae606) | ISC (Feather-derived icons MIT) | 2,052 | 24 | stroke 2 | 1 | `lucide-static` | 2,002 / 2,052 |
| Tabler Icons | 3.51.0 | MIT | 5,233 | 24 | stroke 2 | outline 5,233 · filled 1,054 | `@tabler/icons` | all / all |
| Phosphor | 2.1.1 | MIT | 1,512 | 256 | fill | 6 weights, every icon in each | `@phosphor-icons/core` | all / all |
| Heroicons | 2.2.0 | MIT | 324 | 24 (also 20, 16) | stroke 1.5 (outline), fill (solid) | 24/outline, 24/solid, 20/solid, 16/solid (316) | `heroicons` | none published |
| Material Symbols | commit 10ecc147 (no release tags) | Apache-2.0 | 4,304 | 24 (viewport 960) | fill; variable axes FILL, GRAD, opsz, wght | outlined, rounded, sharp | none from Google; `material-symbols` is a third-party repackaging | 3,932 / 3,932 |
| Fluent UI System Icons | 1.1.345 (commit 4bf6b786) | MIT | 2,996 | sizes 10–48 px | fill | regular 2,935 · filled 2,974 · light 210 · color 199 | `@fluentui/svg-icons` | 2,606 / none |
| Carbon | 11.92.0 | Apache-2.0 | 2,788 (24 deprecated) | 32 (16, 20, 24, 32) | fill | 1 | `@carbon/icons` | all / all |
| Iconoir | 7.12.2 | MIT | 1,383 | 24 | stroke 1.5 | regular 1,383 · solid 288 | `iconoir` | all / all |
| Bootstrap Icons | 1.13.2 | MIT | 2,078 | 16 | fill | 1 (`-fill` variants are separate icons) | `bootstrap-icons` | all / all |

Grid and stroke width are the modal root `<svg>` attributes of the published files, tallied by script, except
Fluent (SVGs not downloaded; model taken from its style names) and Material Symbols (Android drawable width).

**Remix Icon was excluded.** Its repository `License` file is now "Remix Icon License v1.0" (January 2026), a
custom licence that forbids using the icons to create or distribute a competing icon library or a standalone icon
pack. Building Hayzo's own icon package from it would breach that clause. `package.json` of `remixicon@4.9.1`
still declares `Apache-2.0`, which contradicts the licence file shipped in the same tarball; the file governs.

### Mirror evidence (mechanical)

| List | Names | Signal |
|---|---|---|
| fluent-direction-mirror | 101 | `metadata.json` `directionType: "mirror"` |
| fluent-direction-unique | 9 | `directionType: "unique"` — separately drawn RTL artwork |
| fluent-ltr-rtl-assets | 58 | asset folders named … LTR / … RTL |
| fluent-android-rtl-txt | 20 | `importer/rtl.txt` (older Android auto-mirror list) |
| compose-automirrored | 145 | classes in `androidx.compose.material.icons.automirrored.filled`, material-icons core + extended 1.7.8 |
| material-symbols-automirrored | 255 | `android:autoMirrored="true"` in the 24 px outlined drawable (4,157 drawables read) |

The Compose list was read from the published 1.7.8 jars (entry names of the zip directory): the icon generator
and its raw XML have been removed from `androidx-main`, and 1.7.8 is the last release of those libraries.

### Mirror rules

64 rules: **26 auto, 22 never, 16 conditional**. Basis: 55 cite at least one mechanical per-icon list (every cited
name is checked by `mirror-rules.mjs`), 4 rest on the Material and Apple guidance alone, 5 are authored without a
published source (quote marks, toggle pictograms, barcodes/QR, code/terminal, percent sign). 21 rules record a
disagreement between sources; 24 are flagged Arabic-specific.

Disagreements worth knowing (all in the file with a recommendation):

- **Charts and trends.** Material guidance: charts are not mirrored. Material's icons mirror `trending_up`,
  `show_chart`, `monitoring` (but not `stacked_line_chart`, `timeline`); Fluent mirrors Arrow Trending.
  Recommendation: trend arrow follows the product's chart axis direction; chart-type icons default to not mirrored.
- **Rotate / sync.** Guidance (Material, Apple): circular time never mirrors. Material mirrors `rotate_left/right`;
  Fluent mirrors Arrow Sync, Rotate, Repeat All. Recommendation: never.
- **Undo / redo.** Guidance leaves it open; Material, Compose and Fluent all mirror. Recommendation: mirror.
- **Question mark.** Android mirrors help icons in every RTL locale (wrong for Hebrew); Fluent never mirrors and
  ships one hand-drawn RTL asset. Recommendation: mirror by script (Arabic-script locales), not by direction.
- **Text alignment and text direction.** Material and Fluent mirror align-left/right; Compose even lists the
  LTR/RTL text-direction icons as auto-mirrored while Material Symbols does not. Recommendation: separate logical
  (align-start/end, mirrored) and physical (align-left/right, never) concepts.
- **Checklist / numbered list.** Material flips the whole drawing; Fluent draws separate RTL artwork so ticks and
  digits stay unflipped. Recommendation: separate artwork.
- **Slash.** Guidance says the slash keeps its slant; whole-drawable mirroring (`volume_off`) flips it.
- **Calendar, copy, flag, blank file, first/last page, speaker.** One set mirrors, another does not; details and
  recommendation per rule.

### Core set and coverage

354 concepts (component-internals 67, actions 41, editor 37, navigation 29, files 27, commerce 24, finance 24,
communication 23, people 18, status 17, data 16, devices 10, time 9, layout 7, media 5). Mirror verdicts: 66 auto,
258 never, 30 conditional, each linked to a rule.

| Source | Concepts covered | % | License | Model |
|---|---|---|---|---|
| Tabler | 349 | 98.6 | MIT | stroke 2 / 24 |
| Lucide | 347 | 98.0 | ISC | stroke 2 / 24 |
| Fluent | 337 | 95.2 | MIT | fill |
| Material Symbols | 333 | 94.1 | Apache-2.0 | fill, variable |
| Phosphor | 325 | 91.8 | MIT | fill / 256 |
| Bootstrap | 324 | 91.5 | MIT | fill / 16 |
| Carbon | 300 | 84.7 | Apache-2.0 | fill / 32 |
| Iconoir | 271 | 76.6 | MIT | stroke 1.5 / 24 |
| Heroicons | 230 | 65.0 | MIT | stroke 1.5 / 24 |

Lucide ∪ Tabler covers 354 of 354; Lucide ∪ Material Symbols 352; Lucide ∪ Phosphor 350. 185 concepts are in all nine.

Read these numbers with their bias: candidate names were written by the author, in Lucide/Tabler vocabulary first,
and misses were looked up by search only for Lucide, Tabler and Phosphor. A miss means "no candidate name
matched", so the figures for Carbon, Iconoir, Heroicons and Bootstrap are lower bounds. Existence of every mapped
name is verified by script; that it shows the same concept was judged from the name, not from the drawing.
Seven concepts miss in Lucide: progress, label, file-pdf, cash-register, exchange, whatsapp (brand), freeze-column.

### Recommendation

Start Hayzo's icon package from **Lucide**, filled from **Tabler** where Lucide has no icon:

- Both are permissive with no attribution-in-product requirement beyond keeping the notice (ISC, MIT; Lucide's
  Feather-derived icons are MIT) and both allow redistribution and modification inside our own package.
- Both use the same construction — 24 px grid, 2 px stroke, round caps and joins, `fill="none"` — so an icon taken
  from Tabler sits beside Lucide ones without redrawing, and a stroke model lets us offer stroke-width as a token
  and keep a slash or badge as a separate layer (needed by the slash and composite mirror rules).
- Together they cover the whole core set; Lucide already has `saudi-riyal`, `emirati-dirham`, `mosque` and the
  text-direction pair.
- Do not take geometry from Material Symbols or Fluent (filled-outline model, different visual language), but use
  their direction metadata: it is the only machine-readable RTL evidence that exists, and it is what
  `mirror-evidence.json` holds.
- Heroicons is too small (324) and Phosphor/Carbon/Bootstrap use fill models on other grids.

Hayzo then has to draw what nobody ships (see gaps): RTL artwork for numbered list and checklist, Arabic-letter
format and sort icons, Arabic-Indic list, Hijri calendar, Arabic question-mark help, language switch.

## Gaps (`data/icons/gaps.json`)

Each entry carries the search terms and the hits per catalog.

- **Missing everywhere:** Hijri calendar; Arabic-letter text-format icons; Arabic-letter A→Z sort; numbered list
  with Arabic-Indic digits; Arabic-Indic digit glyph icons; Arabic question-mark help (one Fluent asset only);
  qibla; cash on delivery; tax invoice with QR.
- **Partial:** Saudi riyal sign (Lucide `saudi-riyal`; Tabler `currency-riyal` must be checked — it may be the old
  glyph); UAE dirham (Lucide `emirati-dirham`, Tabler `currency-dirham`); other Arab currencies (Tabler only);
  RTL list variants (Fluent and Material Symbols only); text-direction pair (Lucide, Tabler, Material, Fluent);
  mosque (five sets); prayer times (Material Symbols `prayer_times`).
- **Poor:** crescent (only as dark-mode moon); language switch (Latin/CJK pair); instalments.
- **Trademarks, listed as needs, no artwork collected:** mada, Meeza, KNET, Benefit, NAPS, OmanNet, Fawry, STC Pay,
  Tabby, Tamara; halal certification marks. Zero hits in all nine catalogs.

## Schema changes (`icon.schema.json`, additive)

- `data.dataset` gains `mirror-evidence`.
- `data` gains a `oneOf` that binds each dataset to a `$defs` shape: `sourceCatalog`, `mirrorEvidence`,
  `mirrorRules`, `coreSet`, `gaps` (all `additionalProperties: false`). Envelope untouched.

## Scripts (`tools/extract/icons/`)

`fetch.sh <scratch>` downloads everything · `catalogs.mjs --scratch <dir>` → sources · `mirror-evidence.mjs
--scratch <dir>` · `mirror-rules.mjs` (input `mirror-rules.input.mjs`, verifies citations) · `core-set.mjs
[--report]` (input `core-set.input.txt`, verifies names) · `gaps.mjs` · `search.mjs <regex>` for manual checks.
Order: catalogs → mirror-evidence → mirror-rules → core-set → gaps.

## Open questions and limits

- The Material 2 bidirectionality page is client-rendered and could not be read; the archived Material 1 page
  (same sections) was used. Anything M2 added is not reflected.
- Google Fonts icon metadata (tags, categories for Material Symbols) is an unversioned endpoint; 372 of 4,304
  symbol names have no entry there. 202 names have no matching 24 px Android drawable, so their `autoMirrored` is unknown (omitted).
- The Material Symbols catalog counts 257 auto-mirrored drawables read, 255 of which are names in the font
  codepoint files; the evidence list holds the 255.
- Fluent: 2,654 of 2,994 asset folders have a `metadata.json`; "no direction" is only asserted for icons that have one.
- All Arabic names in mirror-rules, core-set and gaps were written by the author. They need review by an
  Arabic-speaking designer before they appear in documentation.
- Verdicts marked conditional need a product decision (charts axis direction, physical vs logical alignment).
- Code points of the Saudi riyal and UAE dirham signs are deliberately not recorded here; the currencies layer owns them.
- Core-set mappings were not checked visually. Pairs worth a look: `sync`/`refresh`, `undo`/`return`, Bootstrap's
  `arrow-clockwise` (used for redo, refresh and rotate), Carbon `warning` vs `warning--alt`.

## Findings that matter for an Arabic-first design

1. **Direction is a property of meaning, not of the drawing.** The same arrow is "back" (mirrors) or "left"
   (never). The icon API must take logical names (`chevron-start`, `arrow-back`, `align-start`, `panel-start`) and
   keep physical ones separate; a blanket `[dir=rtl] svg { transform: scaleX(-1) }` is wrong for 258 of 354 concepts.
2. **Three inputs, not one.** Mirroring depends on direction; the question mark depends on script (Arabic vs
   Hebrew); digits in icons depend on the numbering system. This matches the architecture principle that
   direction, numerals and script are separate dimensions.
3. **A flip is not always enough.** Checklist, numbered list, call-with-arrow, and every "off" icon with a slash
   need either layered rendering (base flips, slash/tick/tool stays) or dedicated RTL artwork.
4. **No open set is RTL-aware except Fluent and Material**, and those two contradict their own guidelines in
   places. Hayzo's registry (`mirror-rules.json`) would be the first that states a reason per concept.
5. **Letters and digits baked into icons are the Arabic gap**: not one catalog has an Arabic-letter format icon.

## Requests to other layers

- **currencies / fonts:** confirm code points and font coverage of the Saudi riyal and UAE dirham signs; prefer
  text rendering over an icon. Provide Arabic abbreviations for currencies without a sign.
- **calendar:** the Hijri calendar switch needs an icon concept name agreed with the date-picker pattern.
- **catalog/universe:** confirm the list of icons each component draws; `core-set.json` has no `usedBy` filled yet.
- **rules:** candidates for interface rules — "no global icon flip", "question mark follows script",
  "media controls never mirror", "slash keeps its slant".
- **fixtures:** an RTL snapshot fixture listing the 66 auto and 30 conditional concepts.

## What L1/L2 and the icon package should build from this

- Generate the mirroring registry (`id → auto | never | conditional + rule`) from `core-set.json` and expose it
  as data, so components never decide direction themselves.
- An icon component with three inputs (direction, script, numbering system) and layered "off"/badge composition.
- Import geometry upstream from Lucide (then Tabler) by the names in `core-set.json`, keeping their licence notices.
- A lint that rejects physical icon names (`chevron-left`) in component source unless explicitly marked physical.
- Original artwork backlog = `gaps.json` entries with status missing or poor, p0 first.
