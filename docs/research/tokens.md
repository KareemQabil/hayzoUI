# Design-token references

Layer: `data/tokens/reference/` · kind `token-reference` · scripts `tools/extract/tokens/` · retrieved 2026-11-11.

What other design systems actually ship for control sizes, density, spacing, radius, type, motion, elevation and
colour — read from their published packages — so that Hayzo's own scales are decided against measured practice.

## What was collected

15 files, 309 control-size rows, 2,467 token entries. 14 files are extracted by script (`verified`); one small file
of documentation values is `researched` / `needs-review`.

| File | System | Version read | License | Control rows | Tokens |
|---|---|---|---|---|---|
| `ant-design.json` | Ant Design | antd 6.7.0, @ant-design/colors 8.0.1 | MIT | 19 | 148 |
| `material-3.json` | Material Design 3 | @material/web 2.5.0 (token set v0.192), @angular/material 22.2.6, @material/density + button + textfield 14.0.0, @material/material-color-utilities 0.4.0 | Apache-2.0 (web, color utilities), MIT (MDC, Angular Material) | 89 | 257 |
| `mui.json` | MUI default theme | @mui/material 9.5.0, @mui/system 9.5.0 | MIT | 13 | 141 |
| `radix-themes.json` | Radix Themes + Radix Colors | @radix-ui/themes 3.3.0, @radix-ui/colors 3.0.0 | MIT | 35 | 88 |
| `tailwind.json` | Tailwind CSS v4 default theme | tailwindcss 4.3.5 | MIT | 0 | 136 |
| `open-props.json` | Open Props | open-props 1.7.23 | MIT | 0 | 252 |
| `carbon.json` | IBM Carbon | @carbon/styles 1.119.0, themes 11.85.0, layout 11.63.0, type 11.71.0, motion 11.56.0, colors 11.62.0, grid 11.66.0 | Apache-2.0 | 31 | 175 |
| `fluent-2.json` | Microsoft Fluent 2 | @fluentui/tokens 1.0.0-alpha.24, react-input 9.8.9, react-button 9.11.3, @fluentui/theme 2.7.4 (v8, per-language fonts) | MIT | 6 | 232 |
| `primer.json` | GitHub Primer primitives | @primer/primitives 11.10.0 | MIT | 15 | 235 |
| `spectrum.json` | Adobe Spectrum (Spectrum 2) | @adobe/spectrum-tokens 15.6.0 | Apache-2.0 | 14 | 301 |
| `polaris.json` | Shopify Polaris | @shopify/polaris-tokens 9.4.2, @shopify/polaris 13.9.5 | **Custom** (MIT text + Shopify field-of-use restriction) | 13 | 149 |
| `shadcn-ui.json` | shadcn/ui | git `dd41d19e2f80ff6891951f7ced74c2c9a650b065` (default branch) + tailwindcss 4.3.5 for unit conversion | MIT | 45 | 35 |
| `mantine.json` | Mantine | @mantine/core 9.8.0 | MIT | 15 | 89 |
| `chakra-ui.json` | Chakra UI v3 | @chakra-ui/react 3.38.0 | MIT | 14 | 225 |
| `platform-guidelines.json` | WCAG 2.2, Apple HIG, Material guidance on target size | documentation | W3C Document License / facts | 0 | 4 (researched) |

Licenses were read from each package's `package.json` and `LICENSE` file, not from memory. **Polaris is the one
exception to plain open licensing**: its `LICENSE.md` adds a clause restricting use to applications that integrate
with Shopify or are visually distinct from it. `polaris.json` therefore keeps measurements only (numeric scales,
control sizes, the structure of the colour system) and records no colour or shadow values.

### How it was extracted

```
node tools/extract/tokens/fetch.mjs <scratch>       # npm pack + tar of the versions pinned in sources.mjs; git clone --depth 1 of shadcn-ui/ui
node tools/extract/tokens/build-all.mjs <scratch>   # 14 extractors + guidelines.mjs → data/tokens/reference/*.json
node tools/extract/tokens/compare.mjs               # the tables below
node tools/validate.mjs data/tokens                 # 15 files, 0 failed
```

- Nothing downloaded is imported or executed. CSS and SCSS are read with a small tokenizer; JS/TS with the
  TypeScript parser as an AST (object literals only, no evaluation); JSON as JSON. Helpers are in `lib.mjs`.
- Output is deterministic (two consecutive builds are byte-identical).
- Every token entry carries the `file` it was read from; `provenance.sources[].path` lists the files per package.
- **Derived values are marked** `derived: true` with a `formula`. They exist where upstream publishes a formula
  or padding but not the number:
  - Ant Design compact mode (upstream publishes only the default algorithm's output, as CSS variables in
    `dist/antd.css`). The extractor mirrors the formulas of `es/theme/themes/{shared,compact}/*.js`, asserts that
    each formula is still present in the source text, and checks that the mirror reproduces the published default
    output exactly before applying it to compact. Dark neutrals and motion durations are derived the same way.
  - MUI and Fluent button heights (no height declared; padding + line box + border).
  - Material text-field height in @material/web (top-space + line + bottom-space), Mantine input line-height and
    padding (calc of input height), Primer control line box, Polaris input height, Radix values at scaling ≠ 100 %,
    shadcn/ui px values (Tailwind class × the pinned `--spacing`), Tailwind spacing multiples.
- Documentation-only values (WCAG / HIG / Material target sizes) are in `platform-guidelines.json`, method
  `researched`, confidence `needs-review`, and appear in no extracted file.
- `scales.i18n` in every file is a measured scan: nine regex patterns (Arabic names, Arabic-script characters,
  `ar` locale ids, rtl, `[dir]`/`:dir()`, `:lang()`, bidi, other scripts, logical properties) over the token
  sources of each package, with hit counts, top files and short samples, followed by `findings` that state what
  the hits are. Arabic-script matches are counted but never copied.

## Schema changes (`data/schema/token-reference.schema.json`, additive)

The envelope is unchanged. `data.scales` was an open object; it now has a common, comparable shape, all keys
optional (a missing key means "not published"):

- `$defs.token` — `{ name, value, px?, ms?, ratio?, alias?, mode?, file?, derived?, formula?, note? }`: `value` is
  upstream's value as written, the rest are conversions (rem at 16 px) and provenance.
- `$defs.controlSize` — one control size in one density mode: `component, size, mode` (required) and `heightPx,
  minHeightPx, paddingInlinePx, paddingBlockPx, fontSizePx, lineHeightPx, lineHeightRatio, radiusPx, gapPx,
  iconSizePx, touchTargetPx, heightSource, derived, formula, file, note`.
- `scales.controls` — `densityModes[]` (`id`, `mechanism`: single · size-prop · algorithm · density-scale ·
  platform-scale · scaling-factor · spacing-variant · layout-token), `sizes[]`, `touchTarget[]`.
- `scales.spacing | radius | borderWidth | focusRing | breakpoints | containers | zIndex | elevation` — `{ steps: token[], note? }`.
- `scales.typography` — `fontStacks, steps[] ($defs.typeStep: size, line height px and ratio, weight, letter
  spacing, set), fontSizes, lineHeights, fontWeights, letterSpacings`.
- `scales.motion` — `durations[]`, `easings[]`.
- `scales.color` — `structure { ramps[{name, steps, stepNames}], semanticRoles[], modes[] }`, `algorithm { name,
  inputs[], outputs[], description, files[], mappings[] }`, `neutral[]` and `primary[]` (ramps with `mode`).
- `scales.i18n` — `scanned[]`, `patterns[]`, `tokens[]`, `findings[]`.
- `scales.extra` — system-specific data with no common shape.
- `data.gaps[]` — what the system does not publish or the extractor could not read.

`scales` is closed (`additionalProperties: false`) so that a new extractor cannot invent a private shape.

## Comparison tables

Printed by `node tools/extract/tokens/compare.mjs`. The data files hold what upstream publishes; **which upstream
size counts as "default", "compact" and "touch" is this layer's reading**, written down in the `MAP` constant of
`compare.mjs` so it can be disputed in one place.

### Control height by size (px)

Each cell lists upstream size name = border-box height, in the mode named in the second column. **Bold** = the size this analysis treats as the system default.

| System | Mode shown | Button | Text input |
|---|---|---|---|
| Ant Design | default | small 24 · **middle 32** · large 40 | small 24 · middle 32 · large 40 |
| Material 3 | density 0 | **default 40** | default 56\* |
| MUI | default | small 30.75\* · **medium 36.5\*** · large 42.25\* | small 40\* · medium 56\* |
| Radix Themes | scaling-100 | 1 24 · **2 32** · 3 40 · 4 48 | 1 24 · 2 32 · 3 40 |
| Carbon | normal | xs 24 · sm 32 · md 40 · lg 48 · xl 64 · 2xl 80 | xs 24 · sm 32 · **md 40** · lg 48 |
| Fluent 2 | default | small 24\* · **medium 32\*** · large 40\* | small 24 · medium 32 · large 40 |
| Primer | normal | xsmall 24 · small 28 · **medium 32** · large 40 · xlarge 48 | (same token) |
| Spectrum | desktop | xs 20 · s 24 · **m 32** · l 40 · xl 48 · height-400 56 · height-500 64 | (same token) |
| Polaris | desktop | micro 24 · slim 28 · medium 28 · large 32 | slim 28 · **medium 32\*** |
| shadcn/ui | new-york-v4 | xs 24 · sm 32 · **default 36** · lg 40 | default 36 |
| Mantine | default | xs 30 · **sm 36** · md 42 · lg 50 · xl 60 | xs 30\* · sm 36\* · md 42\* · lg 50\* · xl 60\* |
| Chakra UI | default | 2xs 24 · xs 32 · sm 36 · **md 40** · lg 44 · xl 48 · 2xl 64 | 2xs 28 · xs 32 · sm 36 · md 40 · lg 44 · xl 48 · 2xl 64 |

\* derived by the extractor from padding + line box (no height token upstream).

### Where a 3-density model lands (px)

Height / control font size / control line-height for the variant each system would use for a dense desktop grid, its default, and touch. "How" names the upstream mechanism.

| System | Compact | How | Default | Touch | How |
|---|---|---|---|---|---|
| Ant Design | 28 / 12 / 20 | compactAlgorithm | 32 / 14 / 22 | 40 / 16 / 24 | size large (no touch mode) |
| Material 3 | 28 / — / — | density −3 (Angular Material table) | 40 / 14 / 20 | 40 / 14 / 20 | density 0 + 48px touch wrapper |
| MUI | 30.75 / 13 / 22.75 | size small | 36.5 / 14 / 24.5 | 42.25 / 15 / 26.25 | size large |
| Radix Themes | 24 / 12 / 16 | size 1 (or scaling 90%) | 32 / 14 / 20 | 40 / 16 / 24 | size 3 (or scaling 110%) |
| Carbon | 32 / 14 / 18 | size sm + density condensed | 40 / 14 / 18 | 48 / 14 / 18 | size lg (button default) |
| Fluent 2 | 24 / 12 / 16 | size small | 32 / 14 / 20 | 40 / 16 / 22 | size large |
| Primer | 28 / 14 / 20 | size small + condensed padding | 32 / 14 / 20 | 40 / 14 / 20 | size large; minTarget 44 on coarse pointers |
| Spectrum | 24 / 12 / 16 | size S | 32 / 14 / 18 | 40 / 17 / 22 | mobile scale, size M |
| Polaris | 24 / 12 / 16 | button micro / input slim 28 | 32 / 13 / 20 | 36 / 16 / 24 | below 48em viewport |
| shadcn/ui | 28 / 12 / 19.5 | style preset mira | 36 / 14 / 20 | 40 / 14 / 20 | size lg |
| Mantine | 30 / 12 / 12 | size xs (Button also has compact-sm 26) | 36 / 14 / 14 | 42 / 16 / 16 | size md |
| Chakra UI | 32 / 12 / 16 | size xs | 40 / 14 / 20 | 44 / 16 / 24 | size lg |

|  | Compact | Default | Touch |
|---|---|---|---|
| min | 24 | 32 | 36 |
| median | 28 | 34 | 40 |
| max | 32 | 40 | 48 |
| systems | 12 | 12 | 12 |

### Density mechanism and touch-target minimum

| System | Density modes published | Mechanism | Touch-target minimum (tokenised) |
|---|---|---|---|
| Ant Design | default, compact | algorithm | none |
| Material 3 | density-0, density--1, density--2, density--3, density--4, density--5 | density-scale | touch target wrapper (chips, fab): 48 |
| MUI | default | size-prop | MenuItem min-height (below sm): 48 |
| Radix Themes | scaling-90, scaling-95, scaling-100, scaling-105, scaling-110 | scaling-factor | none |
| Carbon | condensed, normal | layout-token | none |
| Fluent 2 | default | size-prop | none |
| Primer | condensed, normal, spacious | spacing-variant | control-minTarget-coarse: 44; control-minTarget-fine: 16; control-minTarget-auto @media (pointer: coarse): 44; control-minTarget-auto @media (pointer: fine): 16 |
| Spectrum | desktop, mobile | platform-scale | none |
| Polaris | mobile, desktop | platform-scale | none |
| shadcn/ui | 9 (new-york-v4 … style-vega) | size-prop | none |
| Mantine | default, compact | size-prop | none |
| Chakra UI | default | size-prop | none |
| Tailwind v4 | none | — | none |
| Open Props | none | — | none |

Guidance (documentation, needs-review — `platform-guidelines.json`): WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA = 24px; WCAG 2.2 SC 2.5.5 Target Size (Enhanced), level AAA = 44px; Apple Human Interface Guidelines minimum hit target = 44px; Material Design minimum touch target = 48px.

### Type: body and control text

Body = the step each system uses for default UI text. Control = the default control of the previous table. `H/F` = control height ÷ control font size (vertical room available to a single line, whatever the line-height says).

| System | Body size | Body LH | ratio | Small text | ratio | Control font | Control LH | ratio | H/F |
|---|---|---|---|---|---|---|---|---|---|
| Ant Design | 14 | 22 | 1.571 | 12/20 | 1.667 | 14 | 22 | 1.571 | 2.29 |
| Material 3 | 14 | 20 | 1.429 ~ borderline | 12/16 | 1.333 ⚠ tight | 14 | 20 | 1.429 ~ borderline | 2.86 |
| MUI | 14 | 20.02 | 1.43 ~ borderline | 12/19.92 | 1.66 | 14 | 24.5 | 1.75 | 2.61 |
| Radix Themes | 14 | 20 | 1.429 ~ borderline | 12/16 | 1.333 ⚠ tight | 14 | 20 | 1.429 ~ borderline | 2.29 |
| Carbon | 14 | 18 | 1.286 ⚠ tight | 12/16 | 1.333 ⚠ tight | 14 | 18 | 1.286 ⚠ tight | 2.86 |
| Fluent 2 | 14 | 20 | 1.429 ~ borderline | 12/16 | 1.333 ⚠ tight | 14 | 20 | 1.429 ~ borderline | 2.29 |
| Primer | 14 | 21 | 1.5 | 12/19.5 | 1.625 | 14 | 20 | 1.429 ~ borderline | 2.29 |
| Spectrum | 14 | 18 | 1.286 ⚠ tight | 12/16 | 1.333 ⚠ tight | 14 | 18 | 1.286 ⚠ tight | 2.29 |
| Polaris | 13 | 20 | 1.539 | 12/16 | 1.333 ⚠ tight | 13 | 20 | 1.539 | 2.46 |
| shadcn/ui | 14 | 20 | 1.429 ~ borderline | 12/16 | 1.333 ⚠ tight | 14 | 20 | 1.429 ~ borderline | 2.57 |
| Mantine | 14 | 20.3 | 1.45 ~ borderline | 12/16.8 | 1.4 ~ borderline | 14 | 14 | 1 ⚠ tight | 2.57 |
| Chakra UI | 14 | 20 | 1.429 ~ borderline | 12/16 | 1.333 ⚠ tight | 14 | 20 | 1.429 ~ borderline | 2.86 |
| Tailwind v4 | 14 | 20 | 1.429 ~ borderline | 12/16 | 1.333 ⚠ tight | — | — | — | — |
| Open Props | — | — | — | — | — | — | — | — | — |

⚠ tight: line-height ratio below 1.35; ~ borderline: 1.35–1.5. Thresholds are this layer's flags for the font agent to confirm, not measurements of Arabic faces.

### Type scale (font sizes, px)

| System | Sizes | Steps | Mean step ratio | Font stacks |
|---|---|---|---|---|
| Ant Design | 12 14 16 20 24 30 38 | 7 | 1.212 | 2 |
| Material 3 | 11 12 14 16 22 24 28 32 36 45 57 | 11 | 1.179 | 2 |
| MUI | 12 14 16 20 24 34 48 60 96 | 9 | 1.297 | 1 |
| Radix Themes | 12 14 16 18 20 24 28 35 60 | 9 | 1.223 | 6 |
| Carbon | 12 14 16 18 20 24 28 32 36 42 48 54 60 68 76 84 92 102 112 122 132 144 156 | 23 | 1.124 | 11 |
| Fluent 2 | 10 12 14 16 20 24 28 32 40 68 | 10 | 1.237 | 4 |
| Primer | 12 13 14 16 20 32 40 | 7 | 1.222 | 4 |
| Spectrum | 10 11 12 14 16 18 20 22 25 28 32 36 40 45 51 58 65 73 | 18 | 1.124 | 18 |
| Polaris | 11 12 13 14 16 18 20 22 24 30 32 36 40 | 13 | 1.114 | 2 |
| shadcn/ui | inherits Tailwind | — | — | — |
| Mantine | 12 14 16 18 20 22 26 34 | 8 | 1.16 | 3 |
| Chakra UI | 10 12 14 16 18 20 24 30 36 48 60 72 96 128 | 14 | 1.217 | 3 |
| Tailwind v4 | 12 14 16 18 20 24 30 36 48 60 72 96 128 | 13 | 1.218 | 3 |
| Open Props | 8 12 16 17.6 20 24 32 40 48 56 | 10 | 1.241 | 18 |

### Spacing scale (px)

| System | Steps ≤ 64px | Base unit | Note |
|---|---|---|---|
| Ant Design | 4 8 12 16 20 24 32 48 | 4px grid | sizeUnit 4 × (sizeStep 4 + n) |
| Material 3 | — | — | no spacing tokens |
| MUI | 4 8 12 16 24 32 40 48 64 | 4px grid | A multiplier, not an enumerated scale. |
| Radix Themes | 4 8 12 16 24 32 40 48 64 | 4px grid |  |
| Carbon | 2 4 8 12 16 24 32 40 48 64 | 2px grid |  |
| Fluent 2 | 0 2 4 6 8 10 12 16 20 24 32 | 2px grid |  |
| Primer | 2 4 6 8 12 16 20 24 28 32 36 40 44 48 64 | 2px grid |  |
| Spectrum | 1 2 4 6 8 12 16 20 24 32 40 48 64 | 1px grid |  |
| Polaris | 0 1 2 4 6 8 12 16 20 24 32 40 48 64 | 1px grid |  |
| shadcn/ui | — | — | inherits Tailwind |
| Mantine | 10 12 16 20 32 | 2px grid |  |
| Chakra UI | 2 4 6 8 10 12 14 16 18 20 24 28 32 36 40 44 48 56 64 | 2px grid |  |
| Tailwind v4 | 2 4 6 8 10 12 14 16 20 24 28 32 36 40 44 48 56 64 | 2px grid | v4 has no enumerated spacing scale; the listed multiples are the ones the v3 scale named,  |
| Open Props | 4 8 16 20 24 28 32 48 64 | 4px grid |  |

### Radius scale (px)

| System | Steps | Default control radius |
|---|---|---|
| Ant Design | 2 4 6 8 | 6 |
| Material 3 | 0 4 8 12 16 28 + full | 9999 |
| MUI | 4 | — |
| Radix Themes | 3 4 6 8 12 16 | 4 |
| Carbon | 0 2 4 8 16 24 + full | — |
| Fluent 2 | 0 2 4 6 8 12 16 24 32 40 + full | 4 |
| Primer | 3 6 12 + full | 6 |
| Spectrum | 0 3 4 5 6 7 8 9 10 16 + full | — |
| Polaris | 0 2 4 6 8 12 16 20 30 + full | — |
| shadcn/ui | 6 8 10 14 18 22 26 | 8 |
| Mantine | 2 4 8 16 32 | — |
| Chakra UI | 0 1 2 4 6 8 12 16 24 32 + full | — |
| Tailwind v4 | 2 4 6 8 12 16 24 32 | — |
| Open Props | 2 5 16 32 64 + full | — |

### Border width and focus ring (px)

| System | Border widths | Focus ring |
|---|---|---|
| Ant Design | 1 2 | line-width-focus 3; control-outline-width 2; control-outline rgba(5,145,255,0.1) |
| Material 3 | — | active-width 8; inward-offset 0; outward-offset 2; width 3 |
| MUI | — | — |
| Radix Themes | — | — |
| Carbon | — | focus outline width 1; focus outline width 2; focus border width 2; outline-offset -2 |
| Fluent 2 | 1 2 3 4 | focus outline (strokeWidthThick) 2 |
| Primer | 1 2 4 | focus-outline-offset -2; focus-outline-width 2 |
| Spectrum | 1 2 4 | focus-indicator-gap 2; focus-indicator-thickness 2; focus-ring-gap 2; side-focus-indicator 4 |
| Polaris | 0 0.66 1 2 4 | — |
| shadcn/ui | — | focus-visible:ring width 3 |
| Mantine | — | outline width 2; outline-offset 2 |
| Chakra UI | — | preflight outlineOffset -2 |
| Tailwind v4 | — | — |
| Open Props | 1 2 5 10 | — |

### Motion durations (ms) and easing count

| System | Durations | Easings |
|---|---|---|
| Ant Design | 100 200 300 | 8 |
| Material 3 | 50 100 150 200 250 300 350 400 450 500 550 600 700 800 900 1000 | 9 |
| MUI | 150 195 200 225 250 300 375 | 4 |
| Radix Themes | — | — |
| Carbon | 70 110 150 240 400 700 | 6 |
| Fluent 2 | 50 100 150 200 250 300 400 500 | 9 |
| Primer | 0 50 100 200 300 400 500 600 700 800 900 1000 | 5 |
| Spectrum | — | — |
| Polaris | 0 50 100 150 200 250 300 350 400 450 500 5000 | 4 |
| shadcn/ui | — | — |
| Mantine | — | — |
| Chakra UI | 50 100 150 200 300 400 500 | 4 |
| Tailwind v4 | 150 | 3 |
| Open Props | 0 80 120 180 260 320 420 | 40 |

### Breakpoints (min-width, px)

| System | Breakpoints | Containers (px) |
|---|---|---|
| Ant Design | XS 480 · SM 576 · MD 768 · LG 992 · XL 1200 · XXL 1600 · XXXL 1920 | — |
| Material 3 | — | — |
| MUI | xs 0 · sm 600 · md 900 · lg 1200 · xl 1536 | 444 600 900 1200 1536 |
| Radix Themes | xs 520 · sm 768 · md 1024 · lg 1280 · xl 1640 | 448 688 880 1136 |
| Carbon | sm 320 · md 672 · lg 1056 · xlg 1312 · max 1584 | — |
| Fluent 2 | — | — |
| Primer | xsmall 320 · small 544 · medium 768 · large 1012 · xlarge 1280 · xxlarge 1400 | — |
| Spectrum | — | — |
| Polaris | xs 0 · sm 490 · md 768 · lg 1040 · xl 1440 | — |
| shadcn/ui | — | — |
| Mantine | xs 576 · sm 768 · md 992 · lg 1200 · xl 1408 | — |
| Chakra UI | sm 480 · md 768 · lg 1024 · xl 1280 · 2xl 1536 | 224 256 320 384 448 512 576 672 768 896 1024 1152 1280 1440 |
| Tailwind v4 | sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536 | 256 288 320 384 448 512 576 672 768 896 1024 1152 1280 |
| Open Props | xxs 240 · xs 360 · sm 480 · md 768 · lg 1024 · xl 1440 · xxl 1920 | 240 360 480 768 1024 1440 1920 |

### Layers and elevation

| System | z-index values | Elevation levels |
|---|---|---|
| Ant Design | 0 10 1000 1030 1050 1060 1070 1080 2010 2050 | 4 |
| Material 3 | — | 6 |
| MUI | 1000 1050 1100 1200 1300 1400 1500 | 25 |
| Radix Themes | — | 6 |
| Carbon | -1 5000 6000 8000 9000 9100 | — |
| Fluent 2 | 0 1 1000 2000 3000 4000 5000 6000 | 6 |
| Primer | -1 0 100 200 300 400 500 600 | 8 |
| Spectrum | — | 22 |
| Polaris | 100 400 510 512 513 514 515 516 517 518 519 520 | 7 |
| shadcn/ui | — | — |
| Mantine | 100 200 300 400 9999 | 5 |
| Chakra UI | -1 0 10 1000 1100 1200 1300 1400 1500 1600 1700 1800 2147483647 | 8 |
| Tailwind v4 | — | 8 |
| Open Props | 1 2 3 4 5 2147483647 | 11 |

### Colour structure

| System | Ramps | Steps per ramp | Semantic roles | Modes | Algorithm |
|---|---|---|---|---|---|
| Ant Design | 13 | 10 | 100 | 3 | defaultAlgorithm / darkAlgorithm / compactAlgorithm (theme.algorithm, composable) |
| Material 3 | 8 | 1/13/24 | 49 | 2 | Material dynamic colour (HCT tonal palettes + DynamicScheme) |
| MUI | 19 | 14 | 13 | 2 | augmentColor |
| Radix Themes | 31 | 12 | 5 | 5 | Radix custom palette |
| Carbon | 12 | 10 | 234 | 4 | static |
| Fluent 2 | 2 | 16/50 | 184 | 5 | createLightTheme(brand) / createDarkTheme(brand) |
| Primer | 9 | 10/14 | 94 | 14 | static |
| Spectrum | 36 | 2/3/5/13/16/18 | 191 | 3 | static |
| Polaris | 0 | — | 225 | 5 | static |
| shadcn/ui | 0 | — | 31 | 2 | static |
| Mantine | 14 | 10 | 18 | 2 | variantColorResolver + generateColors (optional) |
| Chakra UI | 12 | 11 | 107 | 2 | static |
| Tailwind v4 | 26 | 11 | 0 | 1 | static |
| Open Props | 20 | 13/16 | 0 | 2 | static |

### Direction, language and script: what the token sources contain

Line counts from a regex scan of the files listed in each data file (`scales.i18n.scanned`); patterns are in `lib.mjs`. "Script tokens" = tokens the extractor found that vary by language or script.

| System | arabic | ar locale | rtl | [dir]/:dir() | :lang() | bidi | other scripts | logical props | Script/direction tokens |
|---|---|---|---|---|---|---|---|---|---|
| Ant Design | 0 | 5 | 3 | 0 | 0 | 0 | 0 | 2 | Tabs.horizontalItemMarginRTL |
| Material 3 | 0 | 0 | 17 | 10 | 0 | 0 | 0 | 173 | md.sys.shape.corner-large-end, md.sys.shape.corner-large-start |
| MUI | 0 | 3 | 7 | 0 | 0 | 0 | 0 | 2 | theme.direction |
| Radix Themes | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | none |
| Carbon | 17 | 0 | 101 | 83 | 0 | 0 | 67 | 3299 | sans-arabic, sans-devanagari, sans-hebrew, sans-jp, sans-kr, sans-thai-looped … (7) |
| Fluent 2 | 4 | 0 | 1 | 0 | 1 | 0 | 20 | 0 | lang ar, lang bg, lang cs, lang el, lang et, lang he … (26) |
| Primer | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 28 | none |
| Spectrum | 0 | 0 | 0 | 0 | 0 | 0 | 141 | 0 | cjk-font-family, cjk-letter-spacing, cjk-line-height-100, cjk-line-height-200, text-align-end, text-align-start … (9) |
| Polaris | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 198 | none |
| shadcn/ui | 1 | 0 | 46 | 9 | 0 | 0 | 0 | 0 | none |
| Mantine | 0 | 0 | 22 | 17 | 0 | 1 | 0 | 280 | none |
| Chakra UI | 0 | 0 | 9 | 0 | 0 | 2 | 0 | 38 | none |
| Tailwind v4 | 0 | 1 | 2 | 2 | 0 | 0 | 0 | 15 | none |
| Open Props | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 118 | none |

## What exists for RTL, Arabic, language and density — measured

Full detail per system is in `scales.i18n.findings` of each file. Summary of what the packages contain:

| System | What exists | What does not |
|---|---|---|
| Carbon | `@carbon/type` SCSS names a font stack `sans-arabic` ('IBM Plex Sans Arabic' + system fallbacks) beside Hebrew, Devanagari, Thai, JP, KR; `@carbon/styles` can emit its `@font-face` (flag off by default) and a `.cds--type-sans-arabic` class. Two type sets (productive / expressive). Size and density are separate layout tokens. | The Arabic stack is a family name only: no line height, letter-spacing or weight changes with it. The JS export of `@carbon/type` omits it (mono, sans, sansCondensed, sansHebrew, serif). |
| Fluent | `@fluentui/theme` (v8) maps 26 language prefixes to font families; `ar` → 'Segoe UI Web (Arabic)'. | `@fluentui/tokens` (Fluent 2 / v9) has no per-language anything: three Latin stacks, fixed px line heights. The v8 map swaps the family only. |
| Spectrum | The only **script-specific line-height tokens** found: `cjk-line-height-100` 1.5 vs `line-height-100` 1.3, `cjk-line-height-200` 1.7 vs 1.5, plus `cjk-font-family` and `cjk-letter-spacing`. Desktop/mobile platform scale on every size token. Logical names (`text-align-start`, `field-end-edge-…`). | Nothing for Arabic, Hebrew or RTL. Component line heights have no CJK variant. |
| Material 3 | Logical naming in tokens (`corner-large-start/-end`, `leading-space/trailing-space`); `:dir(rtl)` rules in component styles. Density −1…−5 as per-component tables (Angular Material) and a formula (MDC). 48 px touch wrapper. | Two typeface slots (brand, plain), both Roboto. No per-script typeface, line height or tracking. Density is not a token in @material/web. |
| Ant Design | `direction` on ConfigProvider, logical properties in styles, one component token named for RTL (`Tabs.horizontalItemMarginRTL`), locale files for ar_EG, fa_IR, he_IL, ku_IQ, ur_PK. Compact algorithm. | No seed/map/alias token for language or script; line height is `(fontSize + 8) / fontSize` for every language. No touch mode. |
| MUI | `theme.direction` and `RtlProvider`/`useRtl`. | A flag only; styles are physical and flipped by an app-configured plugin. One Roboto stack; letter-spacing tuned for Roboto. |
| Primer | Touch as a token: `control-minTarget-auto` = 44 px under `(pointer: coarse)`, 16 px under `(pointer: fine)`; stack gaps grow on coarse pointers. Density as padding/gap variants. | No direction, language or script token. |
| Polaris | Logical properties in component CSS; sizes grow below the `md` breakpoint. | No direction/language token, no Arabic locale file in the package, touch inferred from viewport width. |
| Mantine | `DirectionProvider`, `[dir="rtl"]` overrides plus logical properties in component CSS. Compact button sizes. | Nothing in the theme object. |
| Chakra UI | `_rtl` conditions in recipes; logical style props. | Nothing in tokens. |
| shadcn/ui | Newer registry bases: `rtl:` variants and a DirectionProvider wrapper. | The classic `new-york-v4` sources use 121 physical utilities against 5 logical ones. No font or direction variable. |
| Radix Themes | — | `Theme` renders `<Direction.Provider dir="ltr">` and removes `dir` from its props; no rtl rule in its CSS; physical paddings. LTR-only as shipped. |
| Tailwind v4 | Logical utilities and `rtl:`/`ltr:` variants in the compiler. | No theme variable for direction or script; line height is welded to font size. |
| Open Props | Pointer custom media (`--touch`, `--mouse`). | Nothing else. |

Across all 14 systems: **zero tokens whose value depends on Arabic script** (line height, letter-spacing, font
size or weight). The only language-aware values are font-family names (Carbon, Fluent v8) and Spectrum's CJK
multipliers.

## What this implies for an Arabic-first system

**1. Line heights at control sizes are too tight to adopt.** Arabic text with marks needs more vertical room than
Latin at the same size (the font layer is measuring by how much; nothing here duplicates that). By ratio alone:

- *Tight (below 1.35) at the default control*: Carbon 14/18 (1.286), Spectrum 14/18 (1.286), Mantine button
  (line-height 1 — the label's line box equals the font size).
- *Borderline (1.35–1.5)*: Material 14/20, Radix 14/20, Fluent 14/20, Primer 14/20, shadcn/Tailwind 14/20,
  Chakra 14/20 — the 1.43 "Tailwind pair" is the industry default for control text.
- *At or above 1.5*: Ant Design 14/22 (1.571), Polaris 13/20 (1.54), MUI button 14/24.5 (1.75).
- *Small text is worse*: 12/16 (1.333) in nine systems (Material, Radix, Carbon, Fluent, Spectrum, Polaris,
  shadcn, Chakra, Tailwind). Only Ant (12/20), MUI caption (1.66) and Primer small (1.625) give 12 px text room.
- Line heights are welded to font sizes in most systems (px pairs in Material, Radix, Fluent, Spectrum, Polaris,
  Chakra and Tailwind; a formula in Ant Design). A script-dependent line
  height therefore cannot be added by overriding one token; it has to be a dimension of the type scale from the
  start. Spectrum's `cjk-line-height-*` is the only precedent and the model to follow.
- Non-zero letter-spacing is baked into body or control text in Material (0.1–0.5 px), Carbon (0.16/0.32 px),
  MUI, Radix (size 1) and Polaris headings. Hayzo's Arabic type steps must carry letter-spacing 0.

**2. Density is two axes that most systems conflate.** Height, padding and font size move together almost
everywhere: 8 of 12 systems shrink control text to 12 px in their dense variant (Ant compact, Radix 1, Fluent
small, Spectrum S, Polaris micro, shadcn mira, Mantine xs, Chakra xs). Only Carbon and Primer keep 14 px text
while changing height or padding — and they are the two systems built for dense data products. For Arabic,
12 px with marks is the least legible option, so Hayzo's compact mode should compress padding and height, not
type, as Carbon and Primer do.

**3. Where three densities land numerically.** Compact: 24–32 px, median 28. Default: 32–40 px, median 34 —
bimodal, with 32 (Ant, Radix, Fluent, Primer, Spectrum, Polaris input) and 36–40 (MUI, shadcn, Mantine, Chakra,
Material, Carbon). Touch: 36–48 px, median 40; only Primer (44, by pointer type), Material (48 wrapper) and
Spectrum (a whole mobile scale: 40 at M, 50 at L) treat touch as something other than "the large size".
No system publishes all three as named modes; the closest are Spectrum (desktop/mobile × S/M/L) and Primer
(size × condensed/normal/spacious × pointer).

**4. Touch should follow the pointer, not the viewport.** Polaris enlarges controls below 768 px, which makes a
desktop POS touchscreen compact and a narrow desktop window touch-sized. Primer's `(pointer: coarse)` token is
the mechanism to copy; an explicit mode must still be able to override it (a POS kiosk with a mouse attached).

**5. Direction belongs in recipes, not in tokens — but names must be logical.** No system needs a direction
token; the ones that work in RTL do it with logical properties (Carbon 3,299 lines, Mantine, Polaris, Material)
and logical token names (Material `leading/trailing`, Spectrum `start/end`). The failures are physical class
names (shadcn classic) and a hard-coded direction provider (Radix Themes).

## Proposed starting scale for Hayzo

A starting point for L3, each number with its reference. Numbers marked † depend on the font layer's measurement
of Arabic line height with tashkeel and must be confirmed there before they are frozen.

### Density and control height

| | compact (ERP grids) | default | touch (POS) |
|---|---|---|---|
| Control height (md) | **28** | **36** | **44** |
| sm / lg in the same mode | 24 / 32 | 32 / 40 | 40 / 48 |
| Control font size | 13 | 14 | 16 |
| Control line box † | 20 (1.54) | 24 (1.71) | 28 (1.75) |
| Block padding incl. border | 4 | 6 | 8 |
| Inline padding | 8 | 12 | 16 |
| Icon size | 16 | 16 | 20 |
| Minimum target | 24 | 24 | 44 |

- 28: the median compact height; Ant compact 28, Primer small 28, Polaris desktop button 28, Material density −3
  28, shadcn mira 28.
- 36: between the two default clusters (32 and 40); shadcn 36, Mantine sm 36, MUI medium 36.5, Chakra sm 36. Chosen
  over 32 because a 14 px Arabic line needs a 24 px box † and 32 would leave 4 px each side including the border.
- 44: Primer `control-minTarget-coarse` 44, Chakra lg 44; meets the 44 px guidance values (needs-review file).
  48 as `lg` in touch mode matches Material's 48 px target, Carbon lg and Radix size 4.
- The ladder 24 · 28 · 32 · 36 · 40 · 44 · 48 is a 4 px step; every value occurs in at least two systems.
- Font size: 14 is body and control size in 12 of 13 systems with type. 13 for compact follows Polaris desktop
  (13/20) and MUI small (13), instead of the 12 px most systems use, because of point 2 above. 16 for touch
  follows Polaris mobile input (16/24), Spectrum mobile (17) and shadcn inputs below `md` (16).
- Inline padding 8/12/16: Primer and Carbon condensed 8, Fluent/Primer 12, Carbon normal/Chakra/shadcn 16.
- Mode selection: explicit attribute first; default to touch under `(pointer: coarse)` (Primer).

### Type

| Step | Size | Latin line height | Arabic line height † |
|---|---|---|---|
| xs | 12 | 16 (1.33) | 20 (1.67) |
| sm | 13 | 20 (1.54) | 22 (1.69) |
| md (body) | 14 | 20 (1.43) | 24 (1.71) |
| lg | 16 | 24 (1.5) | 28 (1.75) |
| xl | 18 | 28 (1.56) | 30 (1.67) |
| 2xl | 20 | 28 (1.4) | 32 (1.6) |
| 3xl | 24 | 32 (1.33) | 38 (1.58) |
| 4xl | 30 | 36 (1.2) | 46 (1.53) |
| 5xl | 36 | 40 (1.11) | 54 (1.5) |

- Sizes: the Tailwind/Chakra scale (12 14 16 18 20 24 30 36) plus 13 (Polaris, Primer). Ant's generated scale
  (12 14 16 20 24 30 38) nearly coincides.
- Latin line heights are the Tailwind/Chakra/Radix pairs where those exist (13/20 is Polaris's), kept so Latin UI text matches what users of those
  systems expect.
- Arabic line heights are **placeholders** set by precedent, not measurement: Spectrum raises CJK by +0.2 over
  Latin (1.3 → 1.5, 1.5 → 1.7); Ant's 14/22 (1.571) is the roomiest shipped control text; the values above apply
  roughly +0.2 to +0.3. The font layer decides the real numbers per typeface.
- Line height is a per-script column of the type scale (token name pattern `line-height.<step>.<script>`), the
  Spectrum `cjk-line-height` idea generalised. Letter-spacing is 0 for Arabic at every step.
- Weights 400 / 500 / 600 / 700 (Fluent, Radix, Tailwind); which of them exist is a font-layer question.

### Spacing, radius, borders, focus

- Spacing (px): 0 · 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 — drawn from the overlap of Carbon,
  Primer, Spectrum, Polaris and Chakra; a 4 px grid with 2 and 6 as half-steps (Fluent `sNudge`).
- Radius (px): 0 · 2 · 4 · 6 · 8 · 12 · 16 · full; default control radius 6 (Ant 6, Primer 6; Radix and Fluent
  4, shadcn 8). The set equals Fluent's and Polaris's lower range.
- Border width: 1 and 2 (Ant, Fluent, Primer, Spectrum).
- Focus ring: 2 px wide, 2 px offset, outside (Mantine 2/2, Spectrum 2/2, Material 3 wide with 2 offset); inset
  −2 px for controls inside clipped containers such as table cells (Primer, Carbon).

### Motion, breakpoints, layers, elevation, colour

- Durations (ms): 100 · 150 · 200 · 300 · 400 — fast/base/slow = 100/200/300 is Ant's set and a subset of
  Fluent, Chakra, Primer and Polaris. Easing: `cubic-bezier(0.4, 0, 0.2, 1)` standard, `(0, 0, 0.2, 1)` enter,
  `(0.4, 0, 1, 1)` exit — identical in Tailwind, MUI and Material's legacy set.
- Breakpoints (px): 480 · 768 · 1024 · 1280 · 1536 (Chakra exactly; Tailwind without 480). 768 is a breakpoint in
  8 of 10 systems that publish any.
- Layers: named, small integers in steps of 100 — sticky 100 · dropdown 200 · overlay 300 · modal 400 · popover
  500 · toast 600 (Primer). Avoid the 1000+/9000+ conventions (Ant, MUI, Chakra, Carbon), which exist to beat
  host-page z-indexes.
- Elevation: 5 levels (Mantine xs–xl; Fluent, Radix and Material have 6).
- Colour: 12-step ramps where the step number is the role (Radix: 1–2 backgrounds, 3–5 component backgrounds,
  6–8 borders, 9–10 solid, 11–12 text), light and dark values per step, plus paired semantic roles
  (`x` / `on-x`, as shadcn and Material). A generator (Ant's HSV steps or Material's HCT tones) can come later;
  static ramps are what most of these systems ship.

## Gaps and open questions

- **Material density is partly second-hand.** @material/web does not tokenise density; the −1…−5 rows are from
  Angular Material's M3 tables, a different Google implementation. Material's documentation values for density
  were not used.
- **Ant Design compact component paddings** (Button/Input `paddingBlock`) are computed inside each component and
  were not derived; compact rows carry height, font size and line height only. Dark-mode primary steps are the
  `blueDark` preset of @ant-design/colors, not the output of `darkAlgorithm` on the seed (they should match; not
  verified).
- **Derived heights** (MUI, Fluent buttons, Material text field, Polaris input) are arithmetic on extracted
  values, not rendered measurements; sub-pixel results (MUI 36.5) are reported as computed.
- **Confidence of files containing derived entries** is `verified` (every derived entry is flagged, and the
  formulas are asserted against the source). A reviewer who prefers the strict reading of "a file takes the
  lowest confidence of anything in it" should downgrade ant-design, mui and fluent-2 to `needs-review`.
- **Primer** does not bind a font size to control sizes; 14 px is taken from `text.body.size.medium`, which the
  token description calls the default UI font.
- **Fluent 2** breakpoints, **Spectrum** motion/breakpoints, **Material** spacing/breakpoints, **Radix** motion,
  **Mantine** motion: not published in the packages read (listed in each file's `gaps`).
- **shadcn/ui** is read from the repository's default branch at one commit; it has no versioned release of its
  theme. Its style presets (luma, lyra, maia, mira, nova, rhea, sera, vega) are recorded as density modes.
- **Polaris** colour and shadow values are deliberately absent (licence).
- **Touch-target guidance** (WCAG 2.5.8 = 24, 2.5.5 = 44, Apple 44, Material 48) is from memory of the cited
  documents — `needs-review` until someone re-reads them.
- The i18n scan is a text search. It can miss mechanisms expressed without the searched words and counts
  minified bundles where they were inside the scanned paths; samples and top files are recorded so each count
  can be checked.
- Not covered: per-component tokens beyond button, input and a few list/table rows; high-contrast themes;
  Teams/other Fluent themes; Carbon g10/g90.

## Requests to other layers

- **Fonts**: measure, for each candidate Arabic face at 12, 13, 14 and 16 px, the line box needed to clear
  stacked tashkeel, and replace the † placeholders above. Report whether 13 px is acceptable for compact body
  text, and which weights exist (the scale assumes 400/500/600/700).
- **Rules**: adopt as checks — control text never below 13 px in Arabic locales; letter-spacing 0 on Arabic text;
  target size ≥ 24 px everywhere and ≥ 44 px in touch mode; no physical (`left`/`right`) properties in recipes.
- **Patterns / catalog**: components that set `line-height: 1` on labels (Mantine's approach) clip Arabic marks
  when the control also clips overflow; the universe entries for button, tag, badge and tab should carry that as
  an Arabic requirement.
- **Field reports**: two defects found here are worth fixtures — Radix Themes pinning `dir="ltr"`, and Polaris
  choosing touch sizes by viewport width.

## What L3 should build from this

1. A token model with **three explicit dimensions**: density (compact · default · touch), size (sm · md · lg) and
   script (latin · arabic), where script selects line height and letter-spacing and density selects height,
   padding and font size. No system reviewed has the third dimension.
2. Control recipes that take height, line box and padding from the table above and never derive one from another
   by formula (Ant's `fontSize + 8` and Mantine's `height − 2px` both break when the script changes).
3. Logical names only (`inline-start`, `block-end`) in tokens and recipes.
4. A generated comparison: `compare.mjs` can take Hayzo's own token file as a fifteenth row once it exists, so
   every later change is seen against the same references.
