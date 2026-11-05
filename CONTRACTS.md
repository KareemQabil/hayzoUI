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

**Behavior primitive: React Aria** (`react-aria-components`), behind an adapter in L3. Fallback: Base UI. Radix excluded. Decided 2026-11-05 by the spike in `spikes/primitives/` (evidence: `results.json`, reasoning: `DECISION.md`): React Aria and Base UI both passed 13/13 integration checks; Radix closes a dialog on Escape even when a field inside has a draft to revert (capture-phase listener) and has no Combobox. React Aria wins the tie on Hijri calendars and date components. Existing components are still `own`; they move onto the adapter family by family.

Adapter rules: public props follow this contract, never the primitive's (`disabled`, not `isDisabled`); styles read only our data-attributes; internal strings come from our content layer (React Aria's Arabic messages use only one/other plural forms), with its built-in messages as a fallback.

## Props

- Value: `value` / `defaultValue` / `onValueChange(value, details)`. Empty is always `null`.
- Open state: `open` / `onOpenChange(open, details)`.
- States: `disabled`, `readOnly`, `optional` (required is the default), `loading`.
- `size: 'sm' | 'md' | 'lg'`. Density comes from the theme, never a prop.
- `variant: 'solid' | 'soft' | 'outline' | 'ghost'`, `tone: 'accent' | 'neutral' | 'danger'` (Button). Message tones: `info | success | warning | danger`.
- Direction, language, display numerals: only from `LocaleProvider`. No component takes `dir`. Content direction (e.g. a code field) uses `contentDir` on TextField — it describes the data, not the UI.
- Internal strings: `labels` object, Arabic defaults. Icon-only buttons require `label`.
- Composition: **`render` prop** (`render={<a href="…" />}` or `render={(props) => <a {...props} />}`), decided 2026-11-05. `asChild` depends on `cloneElement` and implicit prop merging; `render` is typed, explicit, and matches both React Aria render props and Base UI. One mechanism only; no component takes both.
- `ref` always points to the primary DOM element.

## Specs

Every component gets `spec/components/<id>.json`, validated by `spec/schema/component.schema.json` and the closed lists in `spec/vocabulary.json`. `src/spec/spec.test.ts` (SP-01…06) fails on unknown states or content variants, prop names that break this contract, references to missing rules, patterns or tests, and any drift between spec props and the implementation's props. `contexts.tested` may not be written by hand.

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
- `pnpm check:bidi` — blind scan against the dev server: every route discovered from the knowledge base × both numerals × desktop and 390px, with stress values typed into phone and amount fields; measures on screen whether digit groups are drawn in reverse. Fails on any finding. Uses local Chrome/Edge or `CHROMIUM`.
- `pnpm evidence:unit` — runs Vitest and writes `src/knowledge/evidence/unit-run.json`.
- `pnpm evidence:browser` — Playwright (playwright-core + system Chromium) against the dev server; writes `browser-run.json`.

Status vocabulary: proposed · demo (live in browser) · manual · automated (from a run file) · unchecked. No manual checks are recorded in this release.
