# Atomic Context Foundations

**Status:** Initial contract implementation  
**Scope:** Pure environment context, experience-profile contract, validation, and deterministic context composition.

This module is deliberately separate from the token engine, Arabic text-processing core, React providers, and CSS.

## Responsibility boundary

This module answers:

- Which locale is active?
- Which writing direction is explicitly requested?
- Which numbering system and calendar should formatting services use?
- Which region and time zone are in effect?
- Which density, motion, contrast, and input-modality hints describe the current experience?
- Which versioned visual system, brand theme, and context preset does an experience profile reference?

It does **not**:

- Infer RTL/LTR from the locale.
- Convert digits or parse Arabic input (that belongs to the Arabic core).
- Resolve colors, spacing, typography, CSS variables, or component recipes (that belongs to the token/style layers).
- Read `window`, `document`, media queries, storage, or React context.
- Prove that a referenced visual system, theme, or context preset exists in a registry.
- Claim that an example profile is supported or tested.

## Context dimensions

| Dimension | Contract | Notes |
|---|---|---|
| Locale | BCP 47 tag | Canonical language identifier; never used to infer direction |
| Direction | `ltr` / `rtl` | Explicit and independently overridable |
| Region | ISO alpha-2 | Two-letter uppercase shape check only; independent from locale and time zone |
| Default currency | ISO 4217 code | Three-letter uppercase shape check only; transaction currency remains domain data |
| Numbering system | Unicode identifier | Examples: `latn`, `arab`, `arabext` |
| Calendar | Unicode identifier | Examples: `gregory`, `islamic-umalqura` |
| Time zone | IANA-style identifier | Structural validation only; actual tzdb availability is platform-dependent |
| First day of week | ISO weekday 1–7 | Monday = 1, Sunday = 7 |
| Density | `compact` / `default` / `touch` | Matches the existing repository vocabulary |
| Motion | `full` / `reduced` | Resolved preference; adapter supplies OS signals |
| Contrast | `normal` / `more` / `forced` | `forced` represents a forced-colors environment |
| Input modality | `unknown` / `pointer` / `touch` / `keyboard` / `assistive` | Current hint, not all available device capabilities |
| Mixed-script alignment | `ui` / `content` | Preserves the existing locale provider's distinction |

Optional regional fields are omitted when unknown. Do not fill them by guessing.

## Context precedence

`resolveContextLayers` starts from `DEFAULT_EXPERIENCE_CONTEXT` and then applies layers in this order:

1. `context-preset`
2. `experience-profile`
3. `system-preferences`
4. `user-preferences`
5. `scope`

Within the same kind, the caller's array order is preserved and later entries override earlier entries.

The built-in base context is Arabic-first (`ar-EG`, `rtl`, `latn`) and is deliberately explicit. This order means:
- A product preset supplies operational defaults.
- An experience profile may refine those defaults.
- System preferences fill in environmental signals.
- Explicit user preferences override system preferences.
- A nested scope can intentionally override the current experience locally.

The resolver returns a provenance trace for every resolved field, including the default source and every later contribution.

## Usage

```ts
import {
  profileToContextLayer,
  resolveContextLayers,
  validateExperienceProfile,
} from './index'
import { arabicPosTouchProfile } from './examples/profiles'

const validation = validateExperienceProfile(arabicPosTouchProfile)

if (!validation.valid) {
  throw new Error(JSON.stringify(validation.issues))
}

const result = resolveContextLayers([
  {
    id: 'pos-touch-preset',
    kind: 'context-preset',
    values: { density: 'touch', inputModality: 'touch' },
  },
  profileToContextLayer(arabicPosTouchProfile),
  {
    id: 'operator-preferences',
    kind: 'user-preferences',
    values: { numberingSystem: 'latn', motion: 'reduced' },
  },
])

if (result.ok) {
  // result.context is a plain serializable context snapshot.
  // result.trace explains exactly where each value came from.
}
```

## Validation guarantees and limitations

- BCP 47 locale tags are checked using the standard `Intl.getCanonicalLocales` API.
- Numbering-system and calendar identifiers are checked for Unicode locale-type syntax, not for runtime support.
- Region codes are structurally checked as two ASCII letters.
- Time zones are structurally checked; this module does not load or verify a time-zone database.
- First-day-of-week values use ISO numbering.
- Unknown properties are rejected to catch misspellings.
- Invalid layers fail the entire resolution. They are never silently skipped.
- Inputs are not mutated.

## Relationship to the master plan

This module contributes to L0 contracts and the T0 foundations. It is not a replacement for the existing `src/system/locale.tsx` provider. A future React adapter can consume the resolved snapshot and expose it through context without moving these rules into React.

The existing `src/system/settings.tsx`, `src/system/locale.tsx`, and `src/arabic/*` remain untouched by this implementation.

## Example profiles

The profiles in `examples/profiles.ts` are proposed configurations. Their referenced style-system, brand-theme, and context-preset IDs are illustrative registry references only. They are not implemented asset claims or test evidence.
