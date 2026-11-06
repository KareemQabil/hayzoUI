# Layered Style Asset Contracts

This module defines the metadata contracts that let one atomic component implementation participate in many visual systems, brands, and product contexts.

It deliberately does not contain token values, CSS, React components, or behavior implementations.

## The four independent concepts

### 1. Visual system

A visual system defines the visual grammar:

- Hierarchy and typography principles.
- Shape and surface language.
- Supported appearance modes.
- Supported density modes.
- Token-layer references.
- Component recipe-layer references.

Examples: Quiet Enterprise, Editorial Clean, Expressive Modern, High-Contrast Utility.

It is not a brand palette and it is not a product workflow.

### 2. Brand theme

A brand theme defines identity-specific values and supported appearance modes through token-layer references.

Examples: Neutral Blue, Burgundy, Forest, Monochrome.

A brand theme does not redefine component behavior or replace the visual system's recipes.

### 3. Context preset

A context preset describes the operational constraints of a product environment:

- Product context identifier (POS, ERP, CRM, education, e-commerce, healthcare, or a custom slug).
- Supported densities.
- Minimum target-size policy.
- Data-density expectation.
- Keyboard priority.
- Responsive strategy.
- Supported input modalities.
- Explicit environment defaults.
- Optional token and recipe layer references.

It may influence tokens and selected recipes, but it must not silently change the semantic contract or state machine of a component.

### 4. Experience profile

The existing `ExperienceProfileDefinition` composes exact, versioned references to:

- One visual system.
- One brand theme.
- One context preset.
- Optional locale, direction, regional, density, and accessibility context values.

A profile is a reproducible configuration, not a copied component library.

## Reference compositions

The current examples define three proposed combinations:

| Experience profile | Visual system | Brand theme | Context preset | Locale / direction | Density |
|---|---|---|---|---|---|
| Arabic POS Touch | Quiet Enterprise | Neutral Blue | POS Touch | ar-SA / RTL | touch |
| Arabic ERP Compact | Quiet Enterprise | Neutral Blue | ERP Compact | ar-EG / RTL | compact |
| English CRM Default | Editorial Clean | Neutral Blue | CRM Responsive | en-US / LTR | default |

The first two intentionally reuse the same visual system and brand theme while changing the product context. The third changes the visual system as well. This is a contract-level composition example; it is not yet a rendered visual-regression result.

## Composition contract

Before an experience is used, validate:

1. Every referenced asset matches the exact ID and version requested by the profile.
2. Visual system and brand theme share at least one appearance mode.
3. Visual system and context preset share at least one density.
4. The selected density is supported by both.
5. A concrete selected input modality is supported by the context preset; `unknown` is a neutral runtime hint, not a capability.
6. A touch minimum-target policy requires touch input support, and high keyboard priority requires keyboard input support.

This module checks metadata compatibility only. It does not prove token contrast, visual quality, accessibility, responsive behavior, or component support. Those require the token engine, recipes, component contracts, and executable evidence.

## Context precedence

Use the context resolver to compose environment defaults separately from style token resolution:

```text
library defaults
  → context preset environment defaults
  → experience profile context
  → system preferences
  → user preferences
  → scoped overrides
```

The context preset's token-layer reference is consumed by the token engine. Its environment defaults are converted with `contextPresetToContextLayer`.

## Important boundaries

- A visual-system token layer may control shape, type, spacing, elevation, and motion tokens.
- A brand-theme token layer may control brand and neutral color mappings.
- A context-preset token layer may control operational density, target sizes, and context-specific component token values.
- Recipe layers map component anatomy, state, and variants to plain CSS output.
- L4 remains plain CSS, CSS custom properties, logical properties, and `data-*` attributes. No runtime CSS-in-JS.
- No component implementation is duplicated per theme or context.

The referenced token and recipe assets must be versioned and resolved by their own registries. The references in the examples are proposed identifiers only.

## Effective context resolution

`resolveExperienceContext` validates all four loaded assets before composing preset,
profile, system, user, and scope values. It then checks the **effective** density
and input modality, including library defaults when neither asset sets them.
This prevents a user or scoped override from bypassing capability checks.

```ts
import { resolveExperienceContext } from './index'

const result = resolveExperienceContext({
  profile,
  visualSystem,
  brandTheme,
  contextPreset,
  appearanceMode: 'light',
  preferenceLayers: [
    { id: 'operator', kind: 'user-preferences', values: { motion: 'reduced' } },
  ],
})
```

Appearance is an explicit selection and must be supported by both visual system
and brand. `preferenceLayers` only accepts system, user, and scope sources; the
selected preset and profile are supplied through their dedicated inputs. Failed
resolution returns diagnostics without a partial context. Successful results
contain the detached scalar context, contribution trace, applied layer IDs, and
selected appearance. Output is mutable caller-owned data; it is not frozen.

The lower-level `validateExperienceComposition` accepts an optional fifth argument
for an already resolved context. Without it, it only checks profile/preset selections;
use the facade above when runtime preferences or library defaults are involved.

These metadata checks do not enforce token contrast, hit-target dimensions, or
accessibility constraints. Those checks belong to the subsequent token/recipe and
component integrations.

Exact versions follow SemVer syntax, including prerelease and build identifiers;
version ranges and numeric prerelease identifiers with leading zeros are rejected.
JSON schemas are structural validation. Locale canonicalization, duplicate reference
IDs across different versions, and cross-field capabilities still require the runtime
validators; schema validation alone is not a full composition acceptance check.

## Verification

With the repository dependencies installed, from the repository root:

```sh
pnpm exec vitest run --config src/atomic/foundations/vitest.config.ts
pnpm exec tsc --noEmit --project src/atomic/foundations/tsconfig.json
```

The dedicated configuration runs in Node and avoids application plugins. The scoped
TypeScript configuration excludes the DOM library. See the dated review evidence in
`docs/reviews/ATOMIC_FOUNDATIONS_VALIDATION.md` for commands actually run
and dependency-install limitations during this change.

## Exact asset lookup and layer request planning

`resolveExperiencePlan` takes a profile and a caller-supplied, in-memory catalog.
It validates every catalog entry, loads the three exact style identities, calls
`resolveExperienceContext`, then collects token and recipe **lookup requests**.

```ts
import { resolveExperiencePlan } from './index'

const result = resolveExperiencePlan({
  profile,
  styleAssets: [visualSystem, brandTheme, contextPreset],
  appearanceMode: 'light',
  preferenceLayers: [
    { id: 'operator', kind: 'user-preferences', values: { motion: 'reduced' } },
  ],
})

if (result.ok) {
  // Exact asset identities, effective context/trace, operational requirements.
  console.log(result.plan.assets, result.plan.context)
  // Registry lookup requests with exact versions and all requesting sources.
  console.log(result.plan.tokenLayers, result.plan.recipeLayers)
}
```

- An asset identity includes kind, ID, and the exact version string. Different
  versions may coexist; duplicate exact identities fail, even if payloads match.
- Missing references fail. There is no latest-version fallback, SemVer range
  resolution, network request, or global registry.
- Every supplied catalog entry is validated, including unselected entries. To
  isolate unrelated catalog failures, pass a smaller catalog explicitly.
- Within token requests, and separately within recipe requests, an ID may have
  only one requested version. Identical requests are deduplicated with all sources
  retained; conflicting versions fail without a partial plan.
- Request traversal is brand → visual system → context, preserving each asset's
  reference order. Catalog reordering cannot change a successful plan. This is
  loading order only; the token engine still owns composition precedence.
- IDs stay unchanged. Dot-separated registry IDs are not silently converted to
  token-engine layer IDs. The adapter must verify an explicit binding.
- Plans own copies of selected references, requesting-source records, requirements,
  and their modality lists. Context resolution already copies scalar values.
  Editing source objects after resolution cannot change a completed plan.
- Sparse arrays are rejected across foundation array contracts rather than allowing
  array iteration to skip validation of missing entries.

`schema/experience-plan-input.v1.schema.json` uses the existing profile and style
asset schemas by their `$id`; register both before compiling it. It validates input
structure only. Exact lookup, identity uniqueness, conflicting layer versions,
locale canonicalization, and cross-asset compatibility require the runtime API.

See `docs/architecture/EXPERIENCE_PLAN_ADAPTER_BOUNDARY.md` for the next integration
boundary. A successful plan does not prove that referenced token/recipe payloads
exist, render correctly, satisfy accessibility constraints, or have been loaded.

The plan checkpoint's executed checks and limitations are recorded in
`docs/reviews/EXPERIENCE_PLAN_VALIDATION_2026-11-06.md`.

`src/atomic/integration` now provides `resolveExperienceTokens` for binding these
requests to supplied exact token payloads and invoking a caller-supplied engine
through its public API. Recipe collections remain pending. The live-engine evidence
and independent engine limitations are recorded in
`docs/reviews/EXPERIENCE_TOKEN_INTEGRATION_2026-11-06.md`.
