# HayzoUI Atomic & Layered Architecture

**Status:** Proposed architecture baseline  
**Branch:** `architecture/atomic-layered-system`  
**Scope:** Greenfield target architecture for the next HayzoUI generation  
**Important:** Existing code is a working reference and evidence source, not an automatic architectural constraint. New foundations are built in an isolated namespace and promoted only after contracts and tests pass. Do not delete or rewrite the current application in one pass.

---

## 1. Product definition

HayzoUI is not a collection of styled React components. It is an **atomic interface system** that provides:

1. A framework-independent foundation for language, numbers, direction, tokens, and deterministic logic.
2. A behavior layer for interaction, state, keyboard, focus, selection, and accessibility.
3. Atomic and composite interface components whose behavior is independent of visual styling.
4. A layered style system that can express many visual languages, brands, densities, and product contexts without forking components.
5. Reusable patterns and tested experience profiles for real product environments.
6. Machine-readable contracts and evidence that explain what is supported, tested, and still unknown.

The target is to build the foundations ourselves. Existing UI libraries may be studied as references or evaluated as optional adapters, but the new core must not be a wrapper around a third-party component library.

## 2. Non-negotiable principles

- **Atomic by construction:** each layer has one responsibility and explicit inputs/outputs.
- **Headless by default:** behavior and semantics do not depend on a visual theme.
- **Framework-independent core:** pure logic must not import React, the DOM, CSS, or browser globals.
- **No visual forks:** one component implementation must support multiple style systems and contexts.
- **Composition over configuration explosions:** use slots, composition, and small typed variant axes rather than dozens of unrelated boolean props.
- **RTL is foundational:** direction is a first-class runtime context, not a final CSS patch.
- **Locale is structured:** language, region, numbering system, calendar, week rules, currency, and time zone are separate dimensions.
- **Evidence over claims:** maturity is earned by executable tests and recorded evidence.
- **No hidden global state:** theme, locale, direction, density, and context are explicit and inspectable.
- **Progressive migration:** build the new system beside the current implementation; migrate proven vertical slices and keep the reference app working.

## 3. Two orthogonal architecture planes

The functional/behavior plane and the visual/style plane must remain independent. A component consumes both through stable contracts; neither plane owns the other.

### 3.1 Functional and behavior plane

| Layer | Responsibility | Must not contain |
|---|---|---|
| F0 — Core | Types, pure functions, parsing, formatting, guards, state machines, collection algorithms | React, DOM, CSS, browser APIs |
| F1 — Platform adapters | DOM/React bindings, lifecycle, event normalization, refs | Domain rules or visual decisions |
| F2 — Behavior primitives | Focus management, keyboard maps, dismissal, selection, validation, overlay behavior | Colors, spacing, typography |
| F3 — Atoms | Small semantic controls and display primitives | Product workflows |
| F4 — Composites | Controls composed from atoms and behavior primitives | App-specific business logic |
| F5 — Patterns | Reusable task/workflow compositions | Brand-specific styling |
| F6 — Experiences | Complete application compositions and reference implementations | Hidden changes to lower-layer contracts |

### 3.2 Visual and style plane

| Layer | Responsibility | Example |
|---|---|---|
| S0 — Primitive tokens | Raw values and scales | blue-600, space-4, radius-2 |
| S1 — Semantic tokens | Meaning independent of component | text-primary, surface-raised, action-primary |
| S2 — Component tokens | Component-specific design decisions | button-height-md, input-padding-inline |
| S3 — Recipes | Map semantic/component tokens to anatomy, variants, and states | button recipe, field recipe |
| S4 — Visual systems | A coherent visual grammar | quiet enterprise, expressive, editorial |
| S5 — Brand themes | Brand identity and appearance modes | brand palette, light/dark |
| S6 — Context presets | Operational constraints for product environments | POS, ERP, CRM, education |
| S7 — Experience profiles | Tested composition of visual system + theme + context + density + locale | Arabic POS touch profile |

These are not nine mandatory wrappers around every component. They are composable layers with typed boundaries. A component may use the default recipe and theme without requiring a context preset.

### 3.3 Cross-cutting foundations

The following are explicit contexts/services, not incidental theme properties:

- Direction: `ltr | rtl`
- Locale: BCP 47 language tag
- Region: ISO 3166-1 alpha-2 or an explicitly supported custom region
- Numbering system: explicit identifier
- Calendar: explicit identifier
- First day of week: explicit value or resolved regional rule
- Time zone: IANA identifier
- Density: `compact | comfortable | touch`
- Motion preference: `full | reduced`
- Contrast preference: `normal | more | forced`
- Input modality: `pointer | touch | keyboard | assistive`

Do not infer all of these from a single `locale` string.

---

## 4. Dependency direction

Allowed dependency direction:

```text
Core
  ↑ consumed by
Platform adapters
  ↑ consumed by
Behavior primitives
  ↑ consumed by
Atoms
  ↑ composed by
Composites
  ↑ composed by
Patterns
  ↑ assembled by
Experiences / Applications

Style plane:
Primitive tokens → Semantic tokens → Component tokens → Recipes
                                      ↑             ↑
Visual system + Brand theme + Context preset ──────┘
                                      ↓
                              Experience profile
```

The diagram indicates dependency direction, not a requirement that every layer import the layer immediately below it.

Rules:

1. F0 cannot import any other HayzoUI layer.
2. Token resolution is pure and deterministic; it cannot read `window`, `document`, or computed CSS.
3. Behavior primitives may consume F0 and F1 contracts, never style recipes.
4. Atoms may consume behavior contracts and style recipe outputs through a styling adapter.
5. Composites may compose atoms; atoms must never import composites.
6. Patterns may compose composites and atoms, but lower layers cannot import patterns.
7. Style recipes may target component anatomy and state attributes; they cannot own business behavior.
8. Context presets may provide documented token overrides and defaults; they cannot silently change component semantics.
9. Applications may compose any public layer, but must not reach into private implementation files.
10. No circular dependencies. Enforce boundaries through TypeScript project references, package exports, and lint/import-boundary checks when the repository is ready.

---

## 5. Component contract

Every component, including an atom, must have a machine-readable contract before it is considered complete.

Minimum contract fields:

- Stable component ID and version.
- Purpose and non-goals.
- Anatomy and named slots.
- Semantic HTML element and accessible name strategy.
- Public props and typed variants.
- Controlled/uncontrolled behavior, where applicable.
- State model and transitions.
- Events and callback semantics.
- Keyboard interaction table.
- Focus entry, movement, exit, and restoration rules.
- ARIA attributes and relationships.
- Direction-sensitive behavior.
- Responsive and input-modality behavior.
- Token/recipe contract.
- Supported contexts and known exclusions.
- Unit, interaction, accessibility, visual, and regression test references.
- Evidence provenance, environment, date, and result.

A contract is not complete because a component renders. It is complete when its behavior, accessibility, style hooks, supported contexts, and limitations are explicit.

### Anatomy and slots

Prefer stable named slots over DOM selectors or assumptions about internal markup. Example anatomy for a button:

- root
- leading icon
- label
- trailing icon
- loading indicator

Not every component needs every slot. Slots are part of the styling contract and must not expose arbitrary implementation internals.

### State model

Separate state into:

- Interaction state: idle, hover, pressed, focused, disabled.
- Validation state: default, invalid, warning, success.
- Async state: idle, loading, success, error.
- Selection state: unselected, selected, mixed.
- Component-specific domain state.

Only applicable state dimensions should be present. Do not generate a Cartesian product of impossible states.

---

## 6. Style composition and token resolution

### 6.1 Token categories

Use typed token categories rather than an unstructured bag of CSS variables.

- Color
- Typography
- Spacing
- Sizing
- Radius
- Border
- Elevation
- Shadow
- Motion
- Opacity
- Layering/z-index
- Focus
- Breakpoints and layout constraints

Token values must carry metadata where useful: type, unit, description, status, source, deprecation, and supported modes.

### 6.2 Token naming

Use stable semantic paths, for example:

```text
color.palette.blue.600
space.4
radius.control
color.text.primary
color.surface.raised
color.border.subtle
control.height.md
component.button.height.md
component.field.border.invalid
motion.duration.fast
focus.ring.width
```

Primitive names describe values; semantic names describe meaning; component names describe a component-specific contract. Do not make component code depend directly on palette values.

### 6.3 Resolution order

The resolver must be pure, deterministic, typed, and explainable.

Default resolution pipeline:

1. Primitive token defaults.
2. Semantic theme mapping.
3. Visual-system mapping.
4. Context-preset overrides, limited to declared overrideable tokens.
5. Component recipe defaults.
6. Explicit component variant and size.
7. Component state.
8. Explicit instance-level custom properties, only through documented escape hatches.

System accessibility constraints are applied as final constraints to the relevant properties, not as ordinary theme overrides. Examples: forced-colors handling, reduced motion, and minimum target-size policies.

The resolver must:

- Validate unknown token references.
- Detect cycles.
- Detect invalid value types and units.
- Report the origin of each resolved token.
- Support deterministic fallback behavior.
- Reject forbidden overrides.
- Produce a serializable resolution trace for debugging.
- Never mutate source token objects.

### 6.4 Recipe contract

A recipe maps a component's anatomy, state, and typed variants to style outputs. It does not implement interaction logic.

Conceptual example:

```ts
defineRecipe({
  component: "button",
  slots: ["root", "leadingIcon", "label", "trailingIcon"],
  variants: {
    intent: ["primary", "neutral", "danger"],
    emphasis: ["solid", "soft", "outline", "ghost"],
    size: ["sm", "md", "lg"],
  },
  states: ["disabled", "loading", "focused", "pressed"],
  tokenContract: [/* declared semantic/component tokens */],
});
```

This is a conceptual contract, not a commitment to a particular runtime API. Final API decisions require a working prototype and usability tests.

---

## 7. Separate four concepts that are often incorrectly merged

### Visual system

Defines visual grammar: typography character, shape language, border treatment, elevation, interaction feedback, and visual hierarchy.

Examples to explore, not pre-approved designs:
- Quiet enterprise
- Expressive modern
- Editorial
- Soft neutral
- High-contrast utility
- Geometric / brutalist

### Brand theme

Defines identity and appearance modes: brand colors, neutral palette, light/dark mappings, and approved brand typography.

### Context preset

Defines operational constraints and defaults for a type of product:

- POS: touch-first, high legibility, large targets, resilient focus, fast repeated actions.
- ERP: information-dense, keyboard-efficient, compact tables and forms.
- CRM: readable records, search, activity timelines, relationship navigation.
- Education: long-form readability, clear hierarchy, learning-oriented interaction.
- E-commerce: product imagery, conversion flows, responsive browsing.
- Healthcare/admin: cautious forms, explicit validation, traceable actions.

A context preset must not be a bag of colors or a hidden layout rewrite. It can only override declared tokens and documented defaults.

### Experience profile

A named, tested composition of:
- Visual system
- Brand theme
- Context preset
- Density
- Locale/direction
- Accessibility preferences
- Optional pattern recipes

An experience profile is a reproducible configuration, not a separate component library.

---

## 8. Context and style test strategy

Do not attempt every possible combination. Use risk-based coverage plus pairwise testing.

### Required baseline contexts

1. RTL Arabic Egypt.
2. RTL Arabic Saudi Arabia.
3. LTR English.
4. Mixed Arabic/Latin content.
5. Compact desktop data-heavy ERP.
6. Touch-first POS.
7. Responsive CRM.
8. Mobile e-commerce.
9. Education / long-form content.
10. High-contrast accessibility mode.

### Required style dimensions

- Light and dark modes.
- At least three materially different visual systems.
- At least two brand themes.
- Compact, comfortable, and touch density.
- Reduced motion and normal motion.
- Normal and increased contrast.

### Test layers

- Core unit tests: pure functions and token resolution.
- Contract tests: every component matches its spec.
- Behavior tests: keyboard, focus, selection, dismissal, validation.
- Accessibility tests: automated checks plus manual assistive-technology review.
- Visual regression: representative style/context combinations.
- Responsive tests: breakpoint transitions and content stress.
- Bidi tests: mixed scripts, numbers, punctuation, icons, and logical layout.
- Integration tests: patterns in real workflows.

Behavioral invariants must remain stable when the visual system changes. A theme change must not change keyboard behavior, validation semantics, or state transitions.

Every visual baseline must identify the exact token set, recipe version, theme, context preset, locale, viewport, browser, and commit.

---

## 9. Suggested logical source boundaries

Start with logical boundaries inside the existing repository. Do not create a large empty monorepo before the contracts stabilize.

```text
src/atomic/
  core/
    types/
    guards/
    collections/
    numbers/
    text/
    state/
  tokens/
    schema/
    primitives/
    semantic/
    component/
    resolver/
    validation/
  foundations/
    direction/
    locale/
    typography/
    density/
    motion/
    layout/
  platform/
    dom/
    react/
  behavior/
    focus/
    keyboard/
    overlay/
    selection/
    validation/
    collection/
  components/
    atoms/
    composites/
  styles/
    recipes/
    visual-systems/
    themes/
    context-presets/
    experience-profiles/
  patterns/
    forms/
    data/
    commerce/
    operations/
  testing/
    contracts/
    fixtures/
    matrix/
```

Documentation and reference applications should live outside the atomic source tree:

```text
docs/architecture/
apps/docs/
apps/lab/
apps/reference/
```

Physical package extraction can happen later when dependency boundaries and public APIs are proven. Do not prematurely publish unstable packages.

---

## 10. Migration strategy

The existing implementation is retained as a reference while the new architecture is built in parallel.

1. Freeze new feature work in the legacy component system unless needed to keep the reference app healthy.
2. Inventory existing behavior, tests, specs, and edge cases. Treat them as evidence, not unquestionable design.
3. Build F0 core and S0-S2 token foundations in an isolated namespace.
4. Prove token resolution using pure unit tests and resolution traces.
5. Build one end-to-end vertical slice: Button + TextField + Field + Dialog only after the relevant behavior contracts exist.
6. Apply at least three visual systems and three contexts to the same components.
7. Verify RTL Arabic, LTR English, mixed content, keyboard, touch, and accessibility.
8. Migrate one real pattern and compare it against the existing reference app.
9. Promote only when the new slice passes its gates.
10. Retire legacy code only after all consumers have migrated and parity is evidenced.

Do not rewrite all 19 current components before proving the architecture with a small vertical slice.

---

## 11. Definition of done

A layer is not done because files exist. It is done when:

- Its public contract is documented.
- Its dependency boundaries are enforced.
- Its inputs and outputs are deterministic where expected.
- Positive, negative, boundary, and failure cases are tested.
- It has no untracked global side effects.
- It exposes limitations and unsupported contexts.
- It has evidence generated from the current commit.
- A downstream layer can consume it without importing its internals.

A component is not Beta until its behavior, keyboard, accessibility, visual, RTL/LTR, and context tests pass. Stable requires additional manual assistive-technology and real-device evidence.

---

## 12. Decisions intentionally left open

These require prototypes or evidence; do not silently decide them during implementation:

- Final styling runtime: CSS variables + authored CSS, CSS Modules, or a typed recipe compiler.
- Whether recipes compile at build time or resolve at runtime.
- Exact React adapter API and support for other frameworks.
- Whether the package workspace should be introduced immediately or after the first vertical slice.
- Final names and public exports.
- Whether a subset of behavior primitives should use optional third-party adapters.
- Which visual systems and context presets become official supported profiles.

Any proposal must include trade-offs, a small working prototype, tests, and migration cost.

## 13. Immediate implementation sequence

1. Token schema and pure resolver.
2. Token validation, provenance, and resolution trace.
3. Direction/locale/density/motion context contracts.
4. Behavior primitives: focus, keyboard, overlay, selection.
5. One atom with a complete contract.
6. Three distinct visual systems.
7. Three context presets (ERP desktop, POS touch, responsive SaaS).
8. Cross-product regression matrix.
9. One production-like pattern.

**First proof target:** the same Button and TextField implementations must run in Arabic RTL and English LTR, in ERP compact and POS touch contexts, under at least three visual systems, without component forks or behavior changes.
