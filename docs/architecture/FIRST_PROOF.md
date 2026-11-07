# First proof — Button and TextField across experiences

**Target (architecture §13):** the same Button and TextField implementations run in Arabic RTL and English LTR, in ERP compact and POS touch contexts, under at least three visual systems, without component forks or behavior changes.

**Status:** met in this repository's browser and unit evidence for 3 visual systems × 3 contexts (ERP compact, POS touch, SaaS responsive) × 2 languages = 18 compositions. Live at `#/proof`. Not yet checked with screen readers or on real touch devices.

## What exists, by layer

| Layer | Files | Responsibility |
|---|---|---|
| S0–S2 tokens | `src/atomic/styles/tokens.ts` | Primitives → semantics → component tokens. Component tokens are pure aliases (`overridableBy: []`). |
| S4 visual systems | same file | `visual-quiet`, `visual-editorial`, `visual-soft`: shape, field treatment, typography, elevation. |
| S5 brand theme | same file | `brand-neutral-blue` (light): colors only. |
| S6 context presets | same file | `context-erp-compact`, `context-pos-touch`, `context-saas-responsive`: sizes only. |
| S7 experience | `src/atomic/styles/experience.ts` | Style assets, versioned token envelopes, profile per selection; `resolveExperienceStyle()` (pure). |
| S3 recipes | `src/atomic/styles/recipes/{button,field}.css` | Plain CSS, logical properties, `data-*` hooks; reads only `--hz-component-*`. |
| F1 platform | `src/atomic/platform/react/{experience.tsx,controllable.ts}` | `ExperienceScope` applies a resolved experience (dir, lang, numerals, density, motion, variables). |
| F2 behavior | `src/atomic/behavior/{press,field}.ts` | Press (native activation, pending guard, auto-pending on promises); field ids and ARIA. |
| F3 atoms | `src/atomic/components/{button,text-field}.tsx` | No colors, sizes or fonts; contracts in `contracts.ts`. |

Resolution path: foundations validate the composition and produce a plan with exact asset versions → the integration port binds the plan's token layers → the token engine resolves and emits CSS variables → the scope applies them → recipes read component tokens.

## Who may change what (enforced by the engine)

- **Theme:** colors. **Visual system:** shape, borders, field treatment, typography, elevation. **Context:** control heights, padding, font sizes, gaps, minimum target. **Language:** direction, internal strings, numbering system — no style values.
- The engine composes visual systems and contexts *before* component tokens, so they act on semantic tokens; a component token can't be overridden by anyone. A context that tries to change a color is rejected (`UNAUTHORIZED_OVERRIDE`, AT-ST-06).

## Evidence

| ID | What it proves |
|---|---|
| AT-ST-01 | All 18 compositions resolve with no issues. |
| AT-ST-02 | Recipes read only component tokens, and every one resolves in every composition (contract read from the CSS). |
| AT-ST-03 | A context changes sizes only, a visual system treatment only, language neither. |
| AT-ST-04 | The three visual systems differ on the same component tokens. |
| AT-ST-05 | POS ≥ 44px touch targets; ERP ≤ 32px controls. |
| AT-ST-06 | A context cannot change a color. |
| AT-ST-07 | Deterministic resolution; exact layers recorded. |
| AT-BT-01…05 | Pending: one call per async press, focusable, announced; disabled; Enter swallowed while pending; language-driven strings; StrictMode settles. |
| AT-TF-01…03 | Null for empty; label/error/description wiring, invalid only with a reason; content direction. |
| AT-INV-01 | Identical behavior DOM (elements, roles, ARIA, hooks) in all 18 compositions. |
| AT-INV-02 | The scope, not the component, carries dir, lang, numerals, density. |
| AT-CT-01/02 | Contracts match the recipe selectors and the rendered anatomy. |
| BR-AT-01 | In Chromium: ERP 32 · SaaS 40 · POS 52 in every system and language; POS small button ≥ 44px. |
| BR-AT-02 | Tab reaches the action with a visible ring; Enter twice saves once; the next Enter saves again. |
| BR-AT-03 | Same component right-aligned in Arabic, left in English; LTR email aligns with the interface. |
| BR-AT-04 | No horizontal scroll at 390px; no console errors. |
| Baselines | `design/baselines/atomic-proof/{quiet,editorial,soft}.png` (`pnpm check:visual`). |
| Blind scan | `#/proof` is in `check:bidi` (digit order, mixed text, numerals per scope). |

BR-AT-02 caught a real defect during this work: under React StrictMode the press primitive stayed pending forever after its first async press. Fixed in `press.ts`; regression AT-BT-05.

## Limitations and open decisions

- Light appearance only; dark mode needs per-appearance theme layers (the brand asset lists one token layer today).
- Recipes are hand-written CSS. A typed recipe schema compiled to the same CSS remains open (architecture §12).
- The three visual systems and three contexts are proof assets, not approved supported profiles.
- Field, Dialog and the remaining components are not migrated; the next step is the P-COLLECT-PAYMENT pattern on these atoms, compared against the reference app.
