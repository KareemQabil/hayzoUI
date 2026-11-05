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

No external behavior primitive is used yet. Decision between React Aria / Base UI / Radix is _open_ (spike not run).

## Props

- Value: `value` / `defaultValue` / `onValueChange(value, details)`. Empty is always `null`.
- Open state: `open` / `onOpenChange(open, details)`.
- States: `disabled`, `readOnly`, `optional` (required is the default), `loading`.
- `size: 'sm' | 'md' | 'lg'`. Density comes from the theme, never a prop.
- `variant: 'solid' | 'soft' | 'outline' | 'ghost'`, `tone: 'accent' | 'neutral' | 'danger'` (Button). Message tones: `info | success | warning | danger`.
- Direction, language, display numerals: only from `LocaleProvider`. No component takes `dir`. Content direction (e.g. a code field) uses `contentDir` on TextField — it describes the data, not the UI.
- Internal strings: `labels` object, Arabic defaults. Icon-only buttons require `label`.
- Composition (`render` vs `asChild`): _open_.

## State attributes

`data-invalid`, `data-disabled`, `data-readonly`, `data-empty`, `data-loading`, `data-state`, `data-selected`, `data-size`, `data-variant`, `data-tone`, `data-dir`, `data-force` (state sheets only). Styles read only these and CSS variables.

## Style rules

Logical properties only · colors from tokens only · no `letter-spacing` on Arabic · icons declare `mirror: auto | never` · motion from tokens, disabled under `prefers-reduced-motion`.

## arabic.amount.v1

Input accepts `0-9`, `٠-٩`, `۰-۹`; decimal `.` or `٫`; grouping `٬`/space only in valid groups of three; `,` and `،` are rejected with explicit suggestions; no rounding; bidi controls removed. Storage: integer minor units or `null`. Display: grouped, in provider numerals, only when not editing. On focus the field switches to the ungrouped editing form and selects it.

Supported currencies: EGP, SAR (2 decimals), KWD (3). Max 12 integer digits.

## Evidence

- `pnpm test` — Vitest suite (fixtures + 6 seeded properties).
- `pnpm evidence:unit` — runs Vitest and writes `src/knowledge/evidence/unit-run.json`.
- `pnpm evidence:browser` — Playwright (playwright-core + system Chromium) against the dev server; writes `browser-run.json`.

Status vocabulary: proposed · demo (live in browser) · manual · automated (from a run file) · unchecked. No manual checks are recorded in this release.
