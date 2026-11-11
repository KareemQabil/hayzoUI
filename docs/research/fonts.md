# Fonts layer — open Arabic typefaces, measured

Retrieved and measured 2026-11-11. Everything below is reproduced by:

```
node tools/extract/fonts/fetch.mjs <scratch>     # pinned downloads (sources.lock.json), ~180 MB
node tools/extract/fonts/build.mjs <scratch>     # data/fonts/*.json, generated/*, and the tables in this file
node tools/validate.mjs data/fonts
```

Two consecutive runs of `build.mjs` produce byte-identical output.

## What was collected

- **Catalogue:** 62 families in google/fonts declare the `arabic` subset (of 2,042 `METADATA.pb` files read under
  ofl/, apache/, ufl/). All 62 are OFL-1.1. Full list in the first generated table below and in
  `tools/extract/fonts/generated/google-fonts-arabic.json`.
- **Measured `font` files:** 64 in `data/fonts/` — all 62 catalogued families plus Kawkab Mono and Vazir Code.
  38 are marked `interfaceText: true` (the comparison set); 26 are display, calligraphic, nastaliq, ruqaa,
  handwriting or colour faces, measured the same way but not proposed for interface text.
- **Files parsed:** 189 font files, each listed with its SHA-256 in `data.files` of its family: 104 TTF from the
  google/fonts tree, 4 TTF from upstream releases, and 81 WOFF 1.0 static instances from `@fontsource/*` (the
  lightest, 400 and heaviest weight of 30 variable families, Arabic subset).
- **Latin reference faces** (report only, no data file): Inter, Roboto, IBM Plex Sans, Noto Sans, Lexend, Open Sans,
  measured by the same code (`generated/latin-reference.json`).

Every family asked for in the brief is present. "Noto Sans Arabic UI" and "Noto Naskh Arabic UI" exist as separate
families in google/fonts and are measured separately.

## Sources

| Source | Version | License | Used for |
|---|---|---|---|
| [google/fonts](https://github.com/google/fonts) | commit `5bb28733cec313b63fbd415b574b5ae35c8aa8b8` (2026-11-08) | per family; all 62 Arabic families OFL-1.1 | METADATA.pb (catalogue, designers, license, axes, upstream repository and commit), TTF binaries, descriptions (read for style and Latin-companion statements, not copied) |
| [@fontsource/*](https://www.npmjs.com/org/fontsource) | per package, pinned in `sources.lock.json` (5.3.0–5.3.2) | per family (OFL-1.1) | static instances of variable fonts at extreme weights; npm package name and version |
| [aiaf/kawkab-mono](https://github.com/aiaf/kawkab-mono) | tag v0.501 (`45630ed`), release zip | OFL-1.1 (OFL.txt in repository and zip) | Kawkab Mono TTF |
| [rastikerdar/vazir-code-font](https://github.com/rastikerdar/vazir-code-font) | commit `abc484a` | Bitstream Vera license + public-domain changes (LICENSE file) | Vazir Code TTF |

Font binaries are not stored in the repository; only metrics, names and hashes are.

## How the numbers are made

**Read directly from each file** (`tools/extract/fonts/sfnt.mjs`): `head` (unitsPerEm, font bbox), `hhea`, `OS/2`
(typo and win metrics, x-height, cap height, USE_TYPO_METRICS), `fvar` axes, `cmap` coverage, `hmtx` advances,
`name` version string, GSUB/GPOS feature lists, GDEF glyph classes, `glyf` bounding boxes.

**Coverage sets:** 36 letters (U+0621–063A, U+0641–064A); 9 tashkeel (U+064B–0652, U+0670); Arabic-Indic digits
(U+0660–0669); Extended Arabic-Indic digits (U+06F0–06F9); punctuation (U+060C, 061B, 061F, 0640, 066A, 066B, 066C,
066D, 06D4); 13 Persian/Urdu letters; U+20C1 Saudi riyal sign; U+FDFC rial sign; Basic Latin letters.

**Tabular digits:** a digit set counts as tabular when its ten glyphs have one advance width by default (`D` in the
table) or when a `tnum` lookup substitutes all ten with equal-width glyphs (`T`). `no` means neither.

**Vertical extents** (font units from the baseline, in `arabic.extents`), three scenarios:

1. *unvocalised* — every glyph reachable from the 36 letters and tatweel through the default Arabic shaping
   features (`ccmp locl isol fina fin2 fin3 medi med2 init rlig rclt calt liga mset`, script `arab`, default
   language system; contextual rules followed without their context), plus both digit sets and punctuation. Where
   `ccmp` splits a letter into base + mark (e.g. alef + hamza above), the mark is placed by GPOS and counted.
2. *singleMark* — any one tashkeel mark on any of those letter forms, placed by the font's `mark` anchors
   (mark-to-base and mark-to-ligature), and one mark on a decomposed hamza through `mkmk`.
3. *fullStack* — shadda with a vowel on top through `mkmk`, and precomposed shadda+vowel ligature marks, with the
   deepest single mark below.

The Allah ligature (which is drawn with its own shadda and superscript alef) counts in scenario 1 and is not used as
a base for further marks. Each extreme records the glyph sequence that produces it (`topBy`, `bottomBy`).

**Derived line heights** (labelled derived; formula repeated in every file's `recommendedLineHeight.basis`), with
T, B = top and bottom extreme ÷ unitsPerEm, A, D = ascent and descent of a metrics set ÷ unitsPerEm:

- `stacking = T + B` — baseline distance at which the deepest ink of one line cannot touch the tallest of the next.
- `containment = max(2T − (A − D), 2B + (A − D))` — line-height at which ink stays inside its own CSS line box
  (half-leading puts the baseline (L + A − D)/2 below the top of the box). Taken as the maximum over the metric
  sets a browser may use: hhea, plus OS/2 typo when USE_TYPO_METRICS is set, otherwise OS/2 win.
- `ui` = containment(unvocalised + Basic Latin). `body` = stacking(singleMark). `withTashkeel` = stacking(fullStack).
- `naturalLineHeight` = (ascender − descender + lineGap) ÷ unitsPerEm, per metrics set.
- All rounded **up** to 0.01 and taken as the **maximum over the measured files** of the family.

These are collision-free bounds for the worst pair of glyphs the font can produce, not taste recommendations and
not typical text: ordinary unvocalised paragraphs are safe at the "Bare" column (stacking of unvocalised text).
Which platform uses which metrics set is stated from general knowledge of browser behaviour, not tested here.

**Cross-check:** for all 30 variable families that have an npm static instance at the default weight, the extents
measured from the upstream variable TTF (default master) and from the independently instanced npm WOFF are
identical in all three scenarios (30 of 30).

## Parser limits

- Containers: TTF/OTF and WOFF 1.0. No WOFF2 (no Brotli, no table transform), no TTC.
- Outlines: `glyf` bounding boxes from glyph headers only. CFF/CFF2 would be reported as not measured; none of the
  64 measured primaries is CFF (Kawkab Mono ships OTF and TTF; the TTF was measured).
- Variable fonts: the upstream file is read at its default master; no `gvar`, `HVAR`, `MVAR` or variation-store
  evaluation. Weight extremes come from npm static instances instead. Four variable families have no such
  instance, so their bounds are for the default master only and understate bold: **Firjar, Google Sans, Noto Naskh
  Arabic UI, Noto Sans Arabic UI**. Width, slant, optical-size and grade axes are never varied.
- Layout: GSUB closure ignores context (over-approximates which forms occur). GPOS types 4/5/6 only: contextual
  positioning that raises or lowers marks, kerning, and **cursive attachment** are not applied. Fonts with `curs`
  are flagged (`extents.cursiveAttachment`): Amiri in the comparison set; Amiri Quran, Aref Ruqaa (+Ink), Alkalami,
  Ruwudu, Gulzar, Noto Nastaliq Urdu, Playpen Sans Arabic, Qahiri, Rakkas, Vibes outside it. Their real extents can
  exceed the figures here, by an unknown amount.
- Only script `arab` default language system; language-specific forms (Urdu, Sindhi, Kurdish) are not measured.
- Italic files are not measured. Glyph labels come from `post` format 2 names; fonts without names show
  `U+XXXX` or `gidN`.
- Marks are stacked only as letter + mark and letter + shadda + vowel. Quranic annotation marks, and stacks of
  three or more, are out of scope.
- Nothing was rendered: no browser or shaping-engine run confirms these positions.

## Generated tables

Columns: Asc/Desc/x-height are hhea ascender, hhea descender and OS/2 sxHeight ÷ unitsPerEm. "hhea=typo=win" says
whether the three metric sets agree. UI/Bare/Body/Vocalised are the derived line heights defined above ("Bare" =
stacking of unvocalised text). "Own Latin UI" is the containment bound of the family's own Basic Latin.
n/m = not measured.

<!-- BEGIN:generated-tables -->
### Catalogue: families in google/fonts that declare the `arabic` subset (62)

Source: google/fonts@5bb28733cec3 (2026-11-08), `METADATA.pb` of every directory under ofl/, apache/, ufl/ (2042 families read).

| Family | License | Google category | Style (authored) | Weights | Italic | Variable axes | Designers |
|---|---|---|---|---|---|---|---|
| Alan Sans | OFL-1.1 | sans_serif | sans | 400 | no | wght 300–900 | Raphaël Ronot, Samar Zureik |
| Alexandria | OFL-1.1 | sans_serif | geometric | 400 | no | wght 100–900 | Mohamed Gaber, Julieta Ulanovsky |
| Alkalami | OFL-1.1 | serif | calligraphic | 400 | no | no | SIL International |
| Almarai | OFL-1.1 | sans_serif | sans | 300 400 700 800 | no | no | Boutros Fonts, Mourad Boutros |
| Alyamama | OFL-1.1 | serif | naskh | 400 | no | wght 300–900 | Yazeed Omar |
| Amiri | OFL-1.1 | serif | naskh | 400 700 | yes | no | Khaled Hosny, Sebastian Kosch |
| Amiri Quran | OFL-1.1 | serif | naskh | 400 | no | no | Khaled Hosny, Sebastian Kosch |
| Aref Ruqaa | OFL-1.1 | serif | ruqaa | 400 700 | no | no | Abdullah Aref, Khaled Hosny, Hermann Zapf |
| Aref Ruqaa Ink | OFL-1.1 | serif (display) | ruqaa | 400 700 | no | no | Abdullah Aref, Khaled Hosny, Hermann Zapf |
| Badeen Display | OFL-1.1 | display | display | 400 | no | no | Hani Alasadi |
| Baloo Bhaijaan 2 | OFL-1.1 | display (display) | display | 400 | no | wght 400–800 | Ek Type |
| Beiruti | OFL-1.1 | sans_serif | geometric | 400 | no | wght 200–900 | Boutros Fonts, Arlette Boutros, Volker Schnebel |
| Blaka | OFL-1.1 | display | display | 400 | no | no | Mohamed Gaber |
| Blaka Hollow | OFL-1.1 | display | display | 400 | no | no | Mohamed Gaber |
| Blaka Ink | OFL-1.1 | display | display | 400 | no | no | Mohamed Gaber |
| Cairo | OFL-1.1 | display sans_serif | kufi | 400 | no | slnt -11–11, wght 200–1000 | Mohamed Gaber, Accademia di Belle Arti di Urbino |
| Cairo Play | OFL-1.1 | display sans_serif | kufi | 400 | no | slnt -11–11, wght 200–1000 | Mohamed Gaber, Accademia di Belle Arti di Urbino |
| Cascadia Code | OFL-1.1 | sans_serif | monospace | 400 | yes | wght 200–700 | Aaron Bell, Mohamad Dakak, Viktoriya Grabowska, Liron Lavi Turkenich |
| Cascadia Mono | OFL-1.1 | sans_serif | monospace | 400 | yes | wght 200–700 | Aaron Bell, Mohamad Dakak, Viktoriya Grabowska, Liron Lavi Turkenich |
| Changa | OFL-1.1 | sans_serif (display) | sans | 400 | no | wght 200–800 | Eduardo Tunni |
| El Messiri | OFL-1.1 | sans_serif | naskh | 400 | no | wght 400–700 | Mohamed Gaber, Jovanny Lemonad |
| Estedad | OFL-1.1 | sans_serif | sans | 400 | no | wght 100–900 | Amin Abedi, Fontamin |
| Firjar | OFL-1.1 | sans_serif (display) | kufi | 400 | no | wdth 75–125, wght 100–800 | Yazeed Omar |
| Fustat | OFL-1.1 | sans_serif | kufi | 400 | no | wght 200–800 | Mohamed Gaber, Laura Garcia Mut, Khaled Hosny |
| Google Sans | OFL-1.1 | sans_serif | sans | 400 | yes | GRAD -50–200, opsz 17–18, wght 400–700 | Google |
| Gulzar | OFL-1.1 | serif (display) | nastaliq | 400 | no | no | Borna Izadpanah, Fiona Ross, Alice Savoie, Simon Cozens |
| Handjet | OFL-1.1 | display (display) | display | 400 | no | ELGR 1–2, ELSH 0–16, wght 100–900 | Rosetta, David Březina |
| Harmattan | OFL-1.1 | sans_serif | sans | 400 500 600 700 | no | no | SIL International |
| IBM Plex Sans Arabic | OFL-1.1 | sans_serif | sans | 100 200 300 400 500 600 700 | no | no | Mike Abbink, Bold Monday, Khajag Apelian, Wael Morcos |
| Jomhuria | OFL-1.1 | display (display) | display | 400 | no | no | KB Studio |
| Katibeh | OFL-1.1 | display (display) | display | 400 | no | no | KB Studio |
| Kufam | OFL-1.1 | sans_serif | kufi | 400 | yes | wght 400–900 | Original Type, Wael Morcos, Artur Schmal |
| Lalezar | OFL-1.1 | sans_serif | display | 400 | no | no | Borna Izadpanah |
| Lateef | OFL-1.1 | serif | naskh | 200 300 400 500 600 700 800 | no | no | SIL International |
| Lemonada | OFL-1.1 | display (handwriting) | display | 400 | no | wght 300–700 | Mohamed Gaber, Eduardo Tunni |
| Mada | OFL-1.1 | sans_serif | sans | 400 | no | wght 200–900 | Khaled Hosny, Paul D. Hunt |
| Marhey | OFL-1.1 | display (display) | display | 400 | no | wght 300–700 | Nur Syamsi, Bustanul Arifin |
| Markazi Text | OFL-1.1 | serif | naskh | 400 | no | wght 400–700 | Borna Izadpanah, Florian Runge, Fiona Ross |
| Mirza | OFL-1.1 | serif | naskh | 400 500 600 700 | no | no | KB Studio |
| Noto Kufi Arabic | OFL-1.1 | sans_serif | kufi | 400 | no | wght 100–900 | Google |
| Noto Naskh Arabic | OFL-1.1 | serif | naskh | 400 | no | wght 400–700 | Google |
| Noto Naskh Arabic UI | OFL-1.1 | serif | naskh | 400 | no | wght 400–700 | Google |
| Noto Nastaliq Urdu | OFL-1.1 | serif | nastaliq | 400 | no | wght 400–700 | Google |
| Noto Sans Arabic | OFL-1.1 | sans_serif | sans | 400 | no | wdth 62.5–100, wght 100–900 | Google |
| Noto Sans Arabic UI | OFL-1.1 | sans_serif | sans | 400 | no | wdth 62.5–100, wght 100–900 | Google |
| Oi | OFL-1.1 | display (display) | display | 400 | no | no | Kostas Bartsokas |
| Parastoo | OFL-1.1 | serif | naskh | 400 | no | wght 400–700 | Saber Rastikerdar |
| Playpen Sans Arabic | OFL-1.1 | handwriting | handwriting | 400 | no | wght 100–800 | TypeTogether, Azza Alameddine, Laura Meseguer, Veronika Burian, José Scaglione |
| Qahiri | OFL-1.1 | sans_serif | kufi | 400 | no | no | Khaled Hosny |
| Rakkas | OFL-1.1 | display (display) | display | 400 | no | no | Zeynep Akay |
| Readex Pro | OFL-1.1 | sans_serif | sans | 400 | no | HEXP 0–100, wght 160–700 | Thomas Jockin, Nadine Chahine, Bonnie Shaver-Troup, Santiago Orozco, Héctor Gómez |
| Reem Kufi | OFL-1.1 | sans_serif | kufi | 400 | no | wght 400–700 | Khaled Hosny, Santiago Orozco |
| Reem Kufi Fun | OFL-1.1 | sans_serif | kufi | 400 | no | wght 400–700 | Khaled Hosny, Santiago Orozco |
| Reem Kufi Ink | OFL-1.1 | sans_serif | kufi | 400 | no | no | Khaled Hosny, Santiago Orozco |
| Rubik | OFL-1.1 | sans_serif | sans | 400 | yes | wght 300–900 | Hubert and Fischer, Meir Sadan, Cyreal, Daniel Grumer, Omaima Dajani |
| Ruwudu | OFL-1.1 | serif | calligraphic | 400 500 600 700 | no | no | SIL International |
| Scheherazade New | OFL-1.1 | serif | naskh | 400 500 600 700 | no | no | SIL International |
| Tajawal | OFL-1.1 | sans_serif | geometric | 200 300 400 500 700 800 900 | no | no | Boutros Fonts, Mourad Boutros, Soulaf Khalifeh |
| Thabit | OFL-1.1 | serif (display) | monospace | 400 700 | yes | no | Khaled Hosny |
| Vazirmatn | OFL-1.1 | sans_serif | sans | 400 | no | wght 100–900 | Saber Rastikerdar |
| Vibes | OFL-1.1 | display | display | 400 | no | no | AbdElmomen Kadhim (blueMix) |
| Zain | OFL-1.1 | sans_serif | sans | 200 300 400 700 800 900 | yes | no | Boutros Fonts |

### Measured families for interface text (38)

| Family | Style | Asc | Desc | x-height | Natural LH | hhea=typo=win | UI | Bare | Body | Vocalised | Own Latin UI | Tabular: Latin / Arabic-Indic / Extended | Digit sets | U+20C1 | Latin | Weights | Variable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Alan Sans | sans | 0.990 | -0.310 | 0.500 | 1.300 | no | 1.58 | 1.46 | 2.03 | 2.24 | 1.11 | T / no / no | both | yes | yes | 300–900 (7) | wght |
| Alexandria | geometric | 0.968 | -0.251 | 0.531 | 1.219 | no | 1.96 | 1.94 | 2.49 | 2.85 | 1.13 | T / no / no | both | no | yes | 100–900 (9) | wght |
| Almarai | sans | 0.905 | -0.211 | 0.514 | 1.116 | no | 1.60 | 1.57 | 2.03 | 2.34 | 1.13 | no / no / no | both | no | yes | 300–800 (4) | no |
| Alyamama | naskh | 0.900 | -0.530 | 0.450 | 1.430 | no | 1.50 | 1.45 | 1.87 | 2.10 | 1.10 | D / no / no | both | yes | yes | 300–900 (7) | wght |
| Amiri | naskh | 1.124 | -0.634 | 0.433 | 1.758 | no | 1.82 | 1.78 | 2.55 | 2.67 | 1.33 | D / D / D | both | no | yes | 400–700 (2) | no |
| Baloo Bhaijaan 2 | display | 1.080 | -0.632 | 0.460 | 1.712 | yes | 1.53 | 1.47 | 2.11 | 2.36 | 0.97 | T / no / no | both | no | yes | 400–800 (5) | wght |
| Beiruti | geometric | 0.900 | -0.300 | 0.390 | 1.200 | no | 1.29 | 1.19 | 1.66 | 1.85 | 1.02 | D / no / no | both | no | yes | 200–900 (8) | wght |
| Cairo | kufi | 1.303 | -0.571 | 0.500 | 1.874 | no | 1.70 | 1.55 | 2.04 | 2.27 | 1.21 | D / no / no | both | no | yes | 200–1000 (9) | wght,slnt |
| Cascadia Code | monospace | 0.928 | -0.234 | 0.518 | 1.162 | no | 1.50 | 1.24 | 1.67 | 1.86 | 1.17 | D / D / D | both | no | yes | 200–700 (6) | wght |
| Cascadia Mono | monospace | 0.928 | -0.234 | 0.518 | 1.162 | no | 1.50 | 1.24 | 1.67 | 1.86 | 1.17 | D / D / D | both | no | yes | 200–700 (6) | wght |
| Changa | sans | 1.227 | -0.613 | 0.500 | 1.840 | no | 1.84 | 1.73 | 2.10 | 2.36 | 0.98 | no / no / no | both | no | yes | 200–800 (7) | wght |
| El Messiri | naskh | 1.019 | -0.544 | 0.480 | 1.563 | yes | 1.34 | 1.30 | 1.99 | 2.21 | 1.00 | no / no / no | both | no | yes | 400–700 (4) | wght |
| Estedad | sans | 1.025 | -0.500 | 0.490 | 1.525 | yes | 1.58 | 1.56 | 2.06 | 2.06 | 1.09 | T / T / T | both | no | yes | 100–900 (9) | wght |
| Fustat | kufi | 1.000 | -0.420 | 0.500 | 1.420 | no | 1.52 | 1.46 | 2.10 | 2.22 | 1.04 | T / T / T | both | no | yes | 200–800 (7) | wght |
| Google Sans | sans | 0.966 | -0.286 | 0.510 | 1.252 | no | 1.49 | 1.35 | 2.10 | 2.18 | 1.15 | T / T / no | both | yes | yes | 400–700 (4) | opsz,wght,GRAD |
| Harmattan | sans | 1.058 | -0.646 | 0.380 | 1.704 | no | 1.39 | 1.25 | 1.94 | 2.21 | 0.79 | D / D / D | both | no | yes | 400–700 (4) | no |
| IBM Plex Sans Arabic | sans | 1.085 | -0.415 | 0.516 | 1.500 | no | 1.72 | 1.46 | 2.22 | 2.44 | 1.10 | D / no / no | both | no | yes | 100–700 (7) | no |
| Kufam | kufi | 0.900 | -0.400 | 0.544 | 1.300 | no | 1.78 | 1.48 | 2.08 | 2.37 | 1.22 | D / no / no | both | no | yes | 400–900 (6) | wght |
| Lateef | naskh | 0.946 | -0.500 | 0.337 | 1.446 | no | 1.32 | 1.22 | 1.82 | 2.17 | 0.81 | D / T / T | both | no | yes | 200–800 (7) | no |
| Mada | sans | 0.950 | -0.350 | 0.486 | 1.300 | no | 1.37 | 1.28 | 2.03 | 2.11 | 1.10 | D / D / D | both | no | yes | 200–900 (8) | wght |
| Markazi Text | naskh | 0.839 | -0.361 | 0.364 | 1.200 | no | 1.31 | 1.18 | 1.77 | 1.97 | 0.83 | no / D / D | both | no | yes | 400–700 (4) | wght |
| Mirza | naskh | 0.547 | -0.453 | 0.500 | 1.200 | no | 1.78 | 1.32 | 1.74 | 1.84 | 1.21 | no / no / no | both | no | yes | 400–700 (4) | no |
| Noto Kufi Arabic | kufi | 1.282 | -0.615 | 0.536 | 1.897 | no | 1.64 | 1.49 | 2.14 | 2.20 | 1.15 | D / D / D | both | no | yes | 100–900 (9) | wght |
| Noto Naskh Arabic | naskh | 1.069 | -0.634 | 0.000 | 1.703 | no | 1.48 | 1.38 | 1.87 | 1.87 | 1.11 | D / D / D | both | yes | yes | 400–700 (4) | wght |
| Noto Naskh Arabic UI | naskh | 1.069 | -0.293 | 0.000 | 1.362 | yes | 1.36 | 1.23 | 1.64 | 1.75 | – | D / T / T | both | no | no | 400–700 (4) | wght |
| Noto Sans Arabic | sans | 1.374 | -0.738 | 0.536 | 2.112 | no | 1.57 | 1.48 | 2.11 | 2.18 | 1.12 | D / D / D | both | no | yes | 100–900 (9) | wght,wdth |
| Noto Sans Arabic UI | sans | 1.069 | -0.293 | 0.528 | 1.362 | yes | 1.32 | 1.28 | 1.91 | 2.12 | – | D / no / no | both | no | no | 100–900 (9) | wght,wdth |
| Parastoo | naskh | 0.966 | -0.440 | 0.397 | 1.406 | no | 1.29 | 1.18 | 1.59 | 1.75 | 0.94 | T / no / no | both | no | yes | 400–700 (4) | wght |
| Readex Pro | sans | 1.000 | -0.250 | 0.525 | 1.250 | no | 1.75 | 1.52 | 2.23 | 2.42 | 1.21 | no / no / – | ar only | no | yes | 200–700 (6) | wght,HEXP |
| Reem Kufi | kufi | 1.100 | -0.400 | 0.418 | 1.500 | no | 1.42 | 1.38 | 2.05 | 2.05 | 1.17 | no / D / D | both | no | yes | 400–700 (4) | wght |
| Rubik | sans | 0.935 | -0.250 | 0.520 | 1.185 | no | 1.62 | 1.42 | 1.77 | 1.97 | 1.13 | T / no / no | both | no | yes | 300–900 (7) | wght |
| Scheherazade New | naskh | 1.343 | -0.697 | 0.334 | 2.040 | no | 1.82 | 1.63 | 2.56 | 2.93 | 1.15 | D / D / D | both | yes | yes | 400–700 (4) | no |
| Tajawal | geometric | 0.643 | -0.357 | 0.454 | 1.200 | no | 1.93 | 1.53 | 2.10 | 2.40 | 1.12 | no / no / – | ar only | no | yes | 200–900 (7) | no |
| Thabit | monospace | 0.960 | -0.238 | – | 1.296 | no | 1.63 | 1.22 | 1.86 | 2.06 | 1.11 | D / D / D | both | no | yes | 400–700 (2) | no |
| Vazirmatn | sans | 1.025 | -0.537 | 0.528 | 1.563 | no | 1.45 | 1.43 | 1.94 | 2.14 | 1.17 | D / T / T | both | no | yes | 100–900 (9) | wght |
| Zain | sans | 1.086 | -0.574 | 0.600 | 1.660 | yes | 1.51 | 1.49 | 2.05 | 2.33 | 1.25 | T / no / no | both | no | yes | 200–900 (6) | no |
| Kawkab Mono | monospace | 1.300 | -0.650 | 0.430 | 1.950 | yes | 1.92 | 1.92 | 2.88 | 3.19 | 1.24 | D / D / D | both | no | yes | 300–700 (3) | no |
| Vazir Code | monospace | 0.859 | -0.190 | 0.457 | 1.049 | yes | 1.44 | 1.27 | 1.81 | 2.03 | 1.02 | D / D / D | both | no | yes | 400 | no |

### Measured families not proposed for interface text (26)

| Family | Style | Asc | Desc | x-height | Natural LH | hhea=typo=win | UI | Bare | Body | Vocalised | Own Latin UI | Tabular: Latin / Arabic-Indic / Extended | Digit sets | U+20C1 | Latin | Weights | Variable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Alkalami | calligraphic | 1.035 | -0.857 | 0.430 | 1.892 | no | 1.89 | 1.88 | 2.41 | 2.70 | 1.45 | D / no / – | ar only | no | yes | 400 | no |
| Amiri Quran | naskh | 1.815 | -0.634 | 0.433 | 2.449 | no | 2.76 | 1.85 | 2.57 | 2.69 | 2.00 | D / D / D | both | no | yes | 400 | no |
| Aref Ruqaa | ruqaa | 1.221 | -0.244 | 0.462 | 1.563 | no | 1.75 | 1.35 | 1.97 | 2.14 | 1.48 | D / no / no | both | no | yes | 400–700 (2) | no |
| Aref Ruqaa Ink | ruqaa | 1.221 | -0.244 | 0.462 | 1.563 | no | 1.75 | 1.35 | 1.97 | 2.14 | 1.48 | D / no / no | both | no | yes | 400–700 (2) | no |
| Badeen Display | display | 1.150 | -0.250 | 0.600 | 1.400 | no | 1.30 | 1.07 | 1.21 | 1.31 | 1.30 | no / no / no | both | no | yes | 400 | no |
| Blaka | display | 0.932 | -0.235 | 0.500 | 1.167 | no | 1.28 | 1.15 | 1.36 | 1.47 | 1.19 | no / no / no | both | no | yes | 400 | no |
| Blaka Hollow | display | 0.932 | -0.235 | 0.500 | 1.167 | no | 1.28 | 1.15 | 1.36 | 1.47 | 1.19 | no / no / no | both | no | yes | 400 | no |
| Blaka Ink | display | 0.932 | -0.235 | 0.500 | 1.167 | no | 1.28 | 1.15 | 1.36 | 1.47 | 1.19 | no / no / no | both | no | yes | 400 | no |
| Cairo Play | kufi | 1.303 | -0.571 | 0.500 | 1.874 | no | 1.70 | 1.55 | 2.04 | 2.27 | 1.21 | D / no / no | both | no | yes | 200–1000 (9) | wght,slnt |
| Firjar | kufi | 1.000 | -0.400 | 0.440 | 1.400 | yes | 1.21 | 1.17 | 1.52 | 1.72 | 1.00 | no / no / no | both | yes | yes | 100–800 (8) | wdth,wght |
| Gulzar | nastaliq | 1.500 | -1.200 | 0.500 | 2.700 | no | 2.30 | 1.98 | 2.95 | 3.19 | 1.22 | no / no / no | both | no | yes | 400 | no |
| Handjet | display | 0.882 | -0.235 | 0.471 | 1.118 | no | 1.30 | 1.24 | 1.71 | 1.95 | 1.00 | D / D / D | both | no | yes | 100–900 (9) | wght,ELGR,ELSH |
| Jomhuria | display | 0.613 | -0.387 | 0.283 | 1.000 | no | 0.94 | 0.89 | 1.27 | 1.41 | 0.83 | no / no / no | both | no | yes | 400 | no |
| Katibeh | display | 0.490 | -0.510 | 0.500 | 1.200 | no | 1.73 | 1.25 | 1.71 | 1.86 | 1.16 | no / no / no | both | no | yes | 400 | no |
| Lalezar | display | 0.979 | -0.588 | 0.186 | 1.567 | yes | 1.34 | 1.29 | 1.74 | 1.93 | 1.18 | no / no / no | both | no | yes | 400 | no |
| Lemonada | display | 1.345 | -0.653 | 0.575 | 1.998 | no | 1.86 | 1.81 | 2.46 | 2.70 | 1.19 | no / no / no | both | no | yes | 300–700 (5) | wght |
| Marhey | display | 1.100 | -0.640 | 0.450 | 1.740 | no | 1.50 | 1.46 | 1.99 | 2.14 | 1.26 | no / no / no | both | no | yes | 300–700 (5) | wght |
| Noto Nastaliq Urdu | nastaliq | 1.904 | -0.596 | 0.536 | 2.500 | no | 2.91 | 2.39 | 3.03 | 3.25 | 1.79 | D / no / no | both | no | yes | 400–700 (4) | wght |
| Oi | display | 1.070 | -0.510 | 0.696 | 1.580 | no | 1.58 | 1.55 | 2.18 | 2.43 | 1.25 | no / no / no | both | no | yes | 400 | no |
| Playpen Sans Arabic | handwriting | 1.100 | -0.550 | 0.537 | 1.650 | no | 1.63 | 1.62 | 2.29 | 2.53 | 1.22 | no / no / no | both | no | yes | 100–800 (8) | wght |
| Qahiri | kufi | 0.800 | -0.333 | 0.307 | 1.133 | yes | 1.38 | 1.33 | 1.66 | 1.77 | 1.14 | no / no / no | both | no | yes | 400 | no |
| Rakkas | display | 1.046 | -0.445 | 0.450 | 1.491 | yes | 1.50 | 1.50 | 1.95 | 2.18 | 1.14 | no / no / no | both | no | yes | 400 | no |
| Reem Kufi Fun | kufi | 1.100 | -0.400 | 0.418 | 1.500 | no | 1.42 | 1.38 | 2.05 | 2.05 | 1.17 | no / D / D | both | no | yes | 400–700 (4) | wght |
| Reem Kufi Ink | kufi | 1.100 | -0.400 | 0.418 | 1.500 | no | 1.42 | 1.38 | 2.05 | 2.05 | 1.17 | no / D / D | both | no | yes | 400 | no |
| Ruwudu | calligraphic | 0.867 | -0.741 | 0.430 | 1.608 | no | 1.83 | 1.71 | 2.36 | 2.61 | 1.50 | D / no / – | ar only | no | yes | 400–700 (4) | no |
| Vibes | display | 1.105 | -0.680 | 0.500 | 1.785 | yes | 1.78 | 1.53 | 1.66 | 1.81 | 1.38 | no / no / no | both | no | yes | 400 | no |

### Latin reference faces (6)

| Family | File | Asc | Desc | x-height | Natural LH | Basic Latin top / bottom | UI containment | Stacking |
|---|---|---|---|---|---|---|---|---|
| Inter | Inter[opsz,wght].ttf (Version 4.001) | 0.969 | -0.241 | 0.546 | 1.210 | 0.962 / -0.234 | 1.20 | 1.20 |
| Roboto | Roboto[wdth,wght].ttf (Version 3.015) | 0.928 | -0.244 | 0.528 | 1.172 | 0.826 / -0.229 | 1.16 | 1.06 |
| IBM Plex Sans | IBMPlexSans[wdth,wght].ttf (Version 3.201) | 1.025 | -0.275 | 0.516 | 1.300 | 0.780 / -0.212 | 1.18 | 1.00 |
| Noto Sans | NotoSans[wdth,wght].ttf (Version 2.015) | 1.069 | -0.293 | 0.536 | 1.362 | 0.766 / -0.241 | 1.26 | 1.01 |
| Lexend | Lexend[wght].ttf (Version 1.007) | 1.000 | -0.250 | 0.525 | 1.250 | 0.782 / -0.230 | 1.21 | 1.02 |
| Open Sans | OpenSans[wdth,wght].ttf (Version 3.003) | 1.069 | -0.293 | 0.535 | 1.362 | 0.766 / -0.242 | 1.27 | 1.01 |

<!-- END:generated-tables -->

## Findings for an Arabic-first design

All statements refer to the 38 interface-text families unless said otherwise.

1. **No Arabic family fits a Latin line-height token.** The six Latin reference faces stay inside their line box
   at 1.16–1.27. The lowest Arabic `ui` bound is 1.29 (Beiruti, Parastoo); the median is about 1.52; the highest
   is 1.96 (Alexandria). In every family that includes Latin, its own Latin needs less than its Arabic (own-Latin
   bound 0.79–1.33). A shared token therefore has to be set by the Arabic face.
2. **Three groups by `ui` bound.**
   - ≤ 1.40, can share a compact control token of 1.4: Beiruti 1.29, Parastoo 1.29, Markazi Text 1.31, Lateef
     1.32, Noto Sans Arabic UI 1.32 (default master only), El Messiri 1.34, Noto Naskh Arabic UI 1.36 (default
     master only), Mada 1.37, Harmattan 1.39.
   - 1.41–1.60, fit a 1.5–1.6 token: Reem Kufi 1.42, Vazir Code 1.44, Vazirmatn 1.45, Noto Naskh Arabic 1.48,
     Google Sans 1.49 (default master only), Alyamama 1.50, Cascadia Code/Mono 1.50, Zain 1.51, Fustat 1.52, Baloo
     Bhaijaan 2 1.53, Noto Sans Arabic 1.57, Alan Sans 1.58, Estedad 1.58, Almarai 1.60.
   - > 1.60, need more leading than any common Latin token or will clip in tight controls: Rubik 1.62, Thabit
     1.63, Noto Kufi Arabic 1.64, Cairo 1.70, IBM Plex Sans Arabic 1.72, Readex Pro 1.75, Kufam 1.78, Mirza 1.78,
     Amiri 1.82, Scheherazade New 1.82, Changa 1.84, Kawkab Mono 1.92, Tajawal 1.93, Alexandria 1.96.
3. **Identical vertical metrics make true pairs.** Noto Sans Arabic UI and Noto Naskh Arabic UI have exactly the
   metrics of Noto Sans and Open Sans (1.069 / −0.293, natural 1.362); Readex Pro has exactly Lexend's (1.000 /
   −0.250). IBM Plex Sans Arabic (1.085 / −0.415, natural 1.5) does not match IBM Plex Sans (1.025 / −0.275,
   natural 1.3), so mixing them under `line-height: normal` changes line height per run.
4. **`line-height: normal` is unusable as a token.** Natural line height ranges from 1.049 (Vazir Code) to 2.112
   (Noto Sans Arabic). Only 8 of 38 families have hhea, typo and win in agreement (Noto Sans Arabic UI, Noto Naskh
   Arabic UI, Estedad, El Messiri, Zain, Baloo Bhaijaan 2, Kawkab Mono, Vazir Code); the other 30 can resolve
   `normal` differently per platform. Tajawal is the extreme: hhea 0.643 / −0.357 against win 1.016 / 0.375.
5. **Vocalised text needs about 2×.** `withTashkeel` runs from 1.75 (Parastoo, Noto Naskh Arabic UI) to 3.19
   (Kawkab Mono); 29 of 38 families need more than 2.0. A single "tashkeel-safe" token is not realistic; it has to
   be per family.
6. **Tabular digits are a real gap.** Arabic-Indic digits are tabular in 20 of 38 families: by default in 14
   (Amiri, Cascadia Code, Cascadia Mono, Harmattan, Kawkab Mono, Mada, Markazi Text, Noto Kufi Arabic, Noto Naskh
   Arabic, Noto Sans Arabic, Reem Kufi, Scheherazade New, Thabit, Vazir Code) and only through `tnum` in 6
   (Estedad, Fustat, Google Sans, Lateef, Noto Naskh Arabic UI, Vazirmatn). They are proportional with no `tnum`
   in 18, including Cairo, IBM Plex Sans Arabic, Almarai, Tajawal, Readex Pro, Noto Sans Arabic UI, Rubik, Zain,
   Alexandria, Kufam, Beiruti. Six families have no tabular digits of any kind: Almarai, Changa, El Messiri, Mirza,
   Readex Pro, Tajawal.
7. **Digit sets.** All 38 have Arabic-Indic digits. Tajawal and Readex Pro lack Extended Arabic-Indic digits
   (U+06F0–06F9), so Persian and Urdu numerals fall back to another font.
8. **Saudi riyal sign U+20C1** is present in 5 of 38: Alan Sans, Alyamama, Google Sans, Noto Naskh Arabic,
   Scheherazade New (and in Firjar outside the set). Everything else needs a fallback glyph or an icon.
9. **Punctuation holes.** U+06D4 is missing in Parastoo, Rubik, Vazir Code, Zain, Tajawal, Readex Pro; the Arabic
   decimal and thousands separators U+066B/U+066C are missing in Reem Kufi, Thabit and Tajawal; Reem Kufi and
   Markazi Text lack the Arabic percent sign U+066A. Thabit also lacks the superscript alef U+0670.
10. **A font defect found.** In Tajawal ExtraBold, kasratan on the lam-alef ligatures attaches about 950 units too
    low (bottom −1532 against −827 in Bold). That file is recorded but excluded from Tajawal's bounds.
11. **Weight matters.** From the lightest to the heaviest weight the full-stack top grows by roughly 0.3–0.55 em in the families
    checked (Cairo 1207 → 1532, Alexandria 1360 → 1905, Tajawal 1107 → 1578, per 1000 units). A bound taken at Regular is not safe for
    bold headings.

## Recommended defaults, with the numbers

These rank the measured candidates on the criteria stated; they are not a visual judgement, and none was rendered.

**(a) Dense ERP tables** — criteria: low `ui` bound, Latin and Arabic-Indic digits tabular, wide weight range.

1. **Mada** — ui 1.37, bare 1.28, all three digit sets tabular by default, 200–900 variable, Latin included.
   Lacks U+066D only.
2. **Vazirmatn** — ui 1.45, bare 1.43, digits tabular (Arabic-Indic and Extended need
   `font-variant-numeric: tabular-nums`), 100–900 variable, Latin included, has U+FDFC.
3. **Noto Sans Arabic** — ui 1.57, bare 1.48, all digit sets tabular by default, 100–900 with width axis.
   **Noto Sans Arabic UI** is tighter (ui 1.32, exact Noto Sans metrics) but its Arabic-Indic digits are
   proportional, it has no Latin letters, and it was measured at the default master only: suitable when the product
   uses Western digits.

**(b) Touch POS** — criteria: digits and currency first, bold weights, room for larger line boxes.

1. **Google Sans** — ui 1.49, Latin and Arabic-Indic digits tabular through `tnum`, has U+20C1, Latin included.
   Weights 400–700; default master only measured; Extended digits not tabular.
2. **Mada** — as above; no U+20C1.
3. **Noto Sans Arabic** — as above; no U+20C1.
   Cairo is common in this segment but measures ui 1.70 and has proportional Arabic-Indic digits.

**(c) Long-form reading** — criteria: naskh, low `body` and `withTashkeel` bounds, tabular digits.

1. **Noto Naskh Arabic** — body 1.87, vocalised 1.87, all digit sets tabular by default, has U+20C1 and U+FDFC,
   400–700 variable.
2. **Markazi Text** — body 1.77, vocalised 1.97, ui 1.31; Latin digits not tabular; lacks U+066A.
3. **Amiri** or **Scheherazade New** for classical typesetting, with much more leading: body 2.55 / 2.56,
   vocalised 2.67 / 2.93. Amiri's figures exclude cursive attachment.

## Schema changes (`data/schema/font.schema.json`, additive)

- `category` enum gains `calligraphic` and `handwriting`.
- New optional `data` fields: `interfaceText`, `subsets`, `weightsBasis`, `googleFonts`, `files`, `latin`,
  `features`.
- `source` gains `commit`, `distribution`, `npmVersion`, `npmVariable`.
- `metrics` gains `useTypoMetrics`, `head`, `verticalMetricsAgree`, `naturalLineHeight`.
- `arabic` gains `coverage`, `extents`, `lineHeightBounds`; `arabic.digits` gains `tnumFeature`, `detail`.

No existing field was removed or tightened.

## Gaps and open questions

- **Vazir Code license** is not OFL: the LICENSE file gives Bitstream Vera terms plus public-domain changes, while
  the README says the Latin comes from Inconsolata and Hack, which the LICENSE does not mention. The project is
  archived. File is `needs-review`; do not ship without a license check.
- **Kawkab Mono** is OFL-1.1 but unmaintained since 2016 and not on npm. Cascadia Code/Mono and Thabit are the
  other open Arabic-capable monospaces found (all in google/fonts).
- **npm:** no `@fontsource` package for Firjar, Noto Sans Arabic UI, Noto Naskh Arabic UI, Thabit (HTTP 404 on
  2026-11-11); `@fontsource/google-sans` has no Arabic subset file.
- **Not measured:** FiraGO, Sahel, Shabnam, Samim, DejaVu Sans, Droid Arabic Kufi/Naskh, and upstream IBM Plex
  (the google/fonts copy of IBM Plex Sans Arabic was measured, not IBM's own release). Proprietary faces common in
  Arabic products (Dubai, SST Arabic, DIN Next Arabic, system fonts) are out of scope.
- `category` and `interfaceText` are authored labels, read against upstream descriptions; they are not measurements.
- `latinCompanion` is filled only where the upstream description states it (10 families).
- Designers come from google/fonts `METADATA.pb`, which sometimes lists foundries and contributors together.
- The fontsource instances are made by Google Fonts' instancer from a release tagged per package (e.g. v31 for
  Cairo); name-table versions matched the google/fonts file wherever checked, but the two trees are not guaranteed
  to be the same build.
- Whether the UAE dirham sign has a code point in fonts was not checked.

## Requests to other layers

- **tokens/reference:** when recording other systems' line-height scales, record them as unitless ratios so they
  can be compared with the bounds here.
- **rules / fixtures:** a rendering test (real browser, real shaper) of the extreme sequences in
  `arabic.extents.*.topBy/bottomBy` would turn these derived bounds into evidence. The Tajawal ExtraBold defect is
  a ready fixture.
- **currencies:** U+20C1 coverage is 5 of 38; the riyal symbol needs a fallback strategy that does not depend on
  the text face.
- **field-reports:** Cairo's descender clipping at tight line heights (ui bound 1.70) is the kind of defect worth
  looking for in other libraries.

## What L1/L3 should build from this

- Typography tokens keyed by family: `lineHeight.control` from `recommendedLineHeight.ui`, `lineHeight.body` from
  `lineHeightBounds.unvocalised.stacking` (unvocalised) or `recommendedLineHeight.body`, `lineHeight.vocalised`
  from `withTashkeel`. Never `normal`.
- A numerals rule: apply `font-variant-numeric: tabular-nums` in tables and amounts, and treat families marked `no`
  for the product's digit set as unsuitable for numeric columns.
- Weight tokens from `weights`; bound checks at the heaviest weight used.
- A fallback chain for U+20C1 and for Extended Arabic-Indic digits.
