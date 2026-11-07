# Contracts — Arabic Experience (working name)

Status: **draft, prototype release 0**. This records the conventions the code in `src/` actually follows. Items marked _open_ are not decided.

## Layers (as implemented here)

| Layer | Path | Depends on |
|---|---|---|
| L1 Tokens | `src/tokens/` (reference → semantic → component, built to CSS variables at runtime) | — |
| L2 Arabic core | `src/arabic/` — pure TS, no DOM/React | — |
| Content | `src/content/messages.ts` — Arabic copy from error codes | L2 types |
| L3+L5 Components | `src/system/components/` | L1 vars, L2, content |
| L4 Style | `src/system/styles.css` — plain CSS, logical properties, data-attributes | L1 vars only |
| Knowledge | `src/knowledge/` — rules, components, patterns, resources, fixtures, evidence | L2 (fixtures) |
| Product | `src/app/`, `src/pages/` (Tailwind for shell layout only) | all |

**Behavior primitive: React Aria** (`react-aria-components`), behind an adapter in L3. Fallback: Base UI. Radix excluded. Decided 2026-11-05 by the spike in `spikes/primitives/` (evidence: `results.json`, reasoning: `DECISION.md`): React Aria and Base UI both passed 13/13 integration checks; Radix closes a dialog on Escape even when a field inside has a draft to revert (capture-phase listener) and has no Combobox. React Aria wins the tie on Hijri calendars and date components. A component moves onto the adapter only when a check shows a capability we lack (calendars, combobox collections with virtual focus; later menus and table keyboard navigation). Dialog and Drawer stay `own`: they pass the same 14 checks as React Aria, nested dialogs included, at 8.6 KB instead of 27.9 KB gzip (`DECISION.md`, amendment of 2026-11-05).

Adapter rules: public props follow this contract, never the primitive's (`disabled`, not `isDisabled`); styles read only our data-attributes; internal strings come from our content layer (React Aria's Arabic messages use only one/other plural forms), with its built-in messages as a fallback.

## Props

- Value: `value` / `defaultValue` / `onValueChange(value, details)`. Every value component works controlled (`value` present, even `null`) and uncontrolled (`defaultValue`), through one hook (`src/system/use-controllable.ts`); `onValueChange` fires on user changes in both modes, never on a prop update. `details` is an object when the component has something to report (parse result, close reason) and `undefined` otherwise.
- Empty is `null`: required wherever a component can be empty, including text (`TextField`, `SearchField` report `null`, never `''`; `''` is accepted as empty input). Single-choice components that always hold a value (Tabs, SegmentedControl, Select without placeholder) have no empty state.
- Boolean toggles: `checked` / `defaultChecked` / `onCheckedChange` (Switch, later Checkbox).
- Open state: `open` / `onOpenChange(open, details)`.
- States: `disabled`, `readOnly`, `optional` (required is the default), `loading`.
- `size: 'sm' | 'md' | 'lg'`. Density comes from the theme, never a prop.
- `variant: 'solid' | 'soft' | 'outline' | 'ghost'`, `tone: 'accent' | 'neutral' | 'danger'` (Button). Message tones: `info | success | warning | danger`.
- Direction, language, display numerals: only from `LocaleProvider`. No component takes `dir`. Content direction (e.g. a code field) uses `contentDir` on TextField — it describes the data, not the UI.
- Internal strings: `labels` object, Arabic defaults (Dialog/Drawer `close`, SearchField `clear`, CurrencyInput, ToastProvider `dismiss`). Per-instance content is not an internal string and stays a plain prop (Button `loadingLabel`, like `children`). Icon-only buttons require `label`.
- Every component exports a named `<Name>Props` interface (or an alias such as `DialogProps = OverlayProps`), so consumers can type wrappers.
- State-sheet-only props, never documented as public API: `forceState`, `presentation="inline"` (overlays drawn in flow). Interaction states in the matrix come from `data-force-scope`, generated from the real `:hover` / `:focus-visible` / `:active` rules (`src/matrix/force-states.ts`).
- Composition: **`render` prop** (`render={<a href="…" />}` or `render={(props) => <a {...props} />}`), decided 2026-11-05. `asChild` depends on `cloneElement` and implicit prop merging; `render` is typed, explicit, and matches both React Aria render props and Base UI. One mechanism only; no component takes both.
- `ref` always points to the primary DOM element.

## Specs

Every component gets `spec/components/<id>.json`, validated by `spec/schema/component.schema.json` and the closed lists in `spec/vocabulary.json`. `src/spec/spec.test.ts` (SP-01…06) fails on unfilled `TODO` fields, unknown states, content or variant values, prop names that break this contract, references to missing rules, patterns or tests, and any drift between spec props and the implementation's props. `contexts.tested` may not be written by hand.

Factory: `scripts/spec-draft.mjs <id>` drafts a spec from the code (props, types, defaults, JSDoc via the TypeScript compiler) and the knowledge record; judgment fields come out as `TODO`. `scripts/spec-fill.mjs` holds those fields (purpose, keyboard, aria, invariants, contexts) for all components in one reviewable file. 17 components have specs; Combobox and Date Picker are planned on React Aria.

## License

Core packages: MIT (decided 2026-11-05). Final product name: _open_ (working name hayzoUI).

## State attributes

`data-invalid`, `data-disabled`, `data-readonly`, `data-empty`, `data-loading`, `data-state`, `data-selected`, `data-size`, `data-variant`, `data-tone`, `data-dir`, `data-force` (state sheets only). Styles read only these and CSS variables.

## Style rules

Logical properties only · colors from tokens only · no `letter-spacing` on Arabic · icons declare `mirror: auto | never` · motion from tokens, disabled under `prefers-reduced-motion`.

## arabic.amount.v1

Input accepts `0-9`, `٠-٩`, `۰-۹`; decimal `.` or `٫`; grouping `٬`/space only in valid groups of three; `,` and `،` are rejected with explicit suggestions; no rounding; bidi controls removed. Storage: integer minor units or `null`. Display: grouped, in provider numerals, only when not editing. Arabic-Indic display groups with U+202F (not «٬», which looks like «٫» in UI fonts); typed ASCII spaces become U+202F (R-BIDI-003).

## arabic.phone.eg.v1 display

Groups are joined with U+00A0, never an ASCII space: between Arabic-Indic digits an ASCII space makes UAX #9 reverse the group order even inside an LTR field. Typed spaces become U+00A0 with the caret preserved (R-BIDI-003). On focus the field switches to the ungrouped editing form and selects it.

Validation messages follow the display numerals, and number examples inside them use U+00A0 too: inside an Arabic sentence an ASCII space reverses Latin digit groups as well (UAX #9 W7 only turns them into L after left-to-right text). Checked by `CT-01` over every error code × currency × numerals.

Supported currencies: EGP, SAR (2 decimals), KWD (3). Max 12 integer digits.

## Evidence

- `pnpm test` — Vitest suite (fixtures, 7 seeded properties, content invariants).
- `pnpm check:bidi` — blind scan against the dev server: every route discovered from the knowledge base × both numerals × desktop and 390px, with stress values typed into phone and amount fields. Three oracles, measured on screen: (1) digit groups drawn in reverse, (2) mixed-script direction and alignment, (3) every visible number in the numerals of its nearest locale provider. Fails on any finding. Uses local Chrome/Edge or `CHROMIUM`.
- `pnpm evidence:unit` — runs Vitest and writes `src/knowledge/evidence/unit-run.json` (with each test's file); pages read counts and dates from it, never typed by hand.
- `pnpm evidence:browser` — Playwright (playwright-core + system Chromium) against the dev server; writes `browser-run.json`.

Status vocabulary: proposed · demo (live in browser) · manual · automated (from a run file) · unchecked. No manual checks are recorded in this release.

## Numerals in copy (R-NUM-004)

Every number a person reads follows the numerals preference of the nearest `LocaleProvider` (each provider writes `data-numerals`; the root writes it on `<html>`). Tools, in order of preference:

- `Digits` — static copy with numbers; source may use either digit system. `localizeNumbers()` does the work and also converts separators inside a number (`1,234.50` ↔ `١ ٢٣٤٫٥٠`) and spaces between digit groups (U+202F).
- `NumberText` — a number already formatted the Latin way (`87,500.00`, `42`), e.g. table cells.
- `Prose` — prose that contains literals: numbers outside «…» follow the preference; text inside «…» is shown as written.
- `Literal` (`data-verbatim`) — shown exactly as written: what a person typed, stored or canonical values, strings a test compares, version metadata, a numerals picker's own labels. Use sparingly.

Kept Latin by rule, without markup: identifiers (a number inside a word with an ASCII letter or starting with `#`: `CUS-0008`, `R-NUM-004`, `16px`, `#284190`) and a number right after a Latin word (`React 18`, `Material Design 3`, `Vitest 5.1.0`). `check:bidi` oracle 3 applies the same exemptions; anything else in the wrong numerals fails the scan. A state-matrix sheet follows the preference unless `?numerals=` pins it.

## State matrix and visual baselines

`#/matrix/<id>` renders every `spec.states` × direction × theme from the spec, with density and content variant as page axes. Renderers live in `src/matrix/renderers.tsx`; a state or variant without one shows as a visible gap and fails `BR-MX-01`. `pnpm check:visual` photographs each spec × content × density and pixel-diffs against `design/baselines/` (tolerance 0.1% of pixels); `pnpm baselines:update` records new baselines only after a person approves the change.

## arabic.date (DatePicker)

Storage: ISO 8601 Gregorian `YYYY-MM-DD` or `null`, independent of the display calendar. Display: `calendar` (`gregory` | `islamic-umalqura`) and the provider's numerals, recombined by the adapter into one locale tag (`ar-EG-u-ca-islamic-umalqura-nu-arab`). Input: segments accept Latin, Arabic-Indic and Extended Arabic-Indic digits whatever the display numerals. React Aria parses segment digits with the locale's numbering system only and drops the others silently; the component re-dispatches `beforeinput` with the expected digits (BR-DP-02).

## arabic.search: digits

`matchDigits(query, target)` matches phone numbers and codes by digits only, in any numeral system, ignoring spaces, `+` and dashes, from 3 digits up. For Egypt «010…» finds «+20 10 …» (SR-F06, SR-F07). Combobox matches item descriptions this way in addition to tolerant text matching.

## Entry points

`src/system` (main) never imports React Aria. Components built on it are exported from `src/system/aria` (Combobox, DatePicker, the adapter), the equivalent of a package subpath export: an app that does not use them does not load React Aria or its calendar systems (355 KB in the Explorer build, loaded only on pages that use them).

## Mixed text

Names and other free text of unknown script render through `AutoText` (`.ax-auto`), which follows the rule "dominant script, isolated islands" (`scriptRuns` in `src/arabic/bidi-runs.ts`):

1. **Line direction = dominant script.** Each whitespace-separated word takes the script of the majority of its own strong letters; the line is `rtl` when RTL words ≥ LTR words, otherwise `ltr`. Words are counted, not letters: Arabic spells names in fewer letters, so a letter count would turn «أحمد Khaled» LTR. Text without strong letters sets no `dir` and keeps the surrounding direction. «Sara Haddad» is `ltr`; an all-Arabic name is `rtl`.
2. **Foreign runs are isolated.** In an `rtl` line every maximal run of Latin words — with their attached punctuation and digits, the spaces between them, and neutral words between two Latin words — is wrapped in `<bdi dir="ltr">`, so punctuation stays with its word; symmetrically, Arabic runs in an `ltr` line get `<bdi dir="rtl">`. Paired brackets and quotes at a word's edge stay outside the island (they mirror into place in the line).

So in an RTL UI «Dr. سامي الحلبي» is an RTL line with «Dr.» at the far right, read naturally right-to-left (not the old first-strong LTR line with «Dr.» on the left); «3M مصر» has «3M» on the right; «محمد (Mido) السيد» keeps its parentheses around «Mido»; «أحمد Khaled» is RTL with «Khaled» isolated. Children other than plain text or one `<Highlight>` fall back to `dir="auto"`. Alignment is a regional preference, `mixedAlign`:

- `ui` (default): every line starts at the container's start edge, so a Latin name in an Arabic list lines up with the Arabic names.
- `content`: each line starts on its own direction's side; Latin names sit on the left in RTL.

The provider resolves the preference to a side (`--ax-mixed-align`: `right` / `left` / `start`). `text-align: match-parent` would express it logically, but Chromium computes it as `start`, measured. Overlays and popovers portaled out of the provider carry the variable explicitly. Content variants `latin` («Sara Haddad») and `latin-first` («Dr. سامي الحلبي») are in the closed vocabulary. Checked by `check:bidi` oracle 2 (direction = dominant script, first run at the line start with its first character at the island's own start, alignment per preference; one pass per preference), BD-01…10 (unit) and BR-MIX-01…03. Codes (`CUS-0008`, `INV-2026-0148`) are identifiers and keep the digits they were written with; only quantities, amounts, phones and dates follow the numerals preference.
