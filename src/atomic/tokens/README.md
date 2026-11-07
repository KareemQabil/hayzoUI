# Atomic Token Engine

A framework-independent, pure TypeScript token graph for composing visual systems, brand themes, product contexts, component contracts, and recipes. It has no React, DOM, CSS-in-JS, browser, or runtime-library dependency.

## Core concepts

- Primitive: raw scales and values such as color.palette.blue.600, space.4, and radius.control.
- Semantic: meaning independent of a component, such as color.text.primary and control.height.md.
- Theme: brand and appearance mapping, such as light/dark semantic colors.
- Visual system: visual grammar such as shape, typography character, borders, and elevation.
- Context: operational constraints such as POS touch targets and control sizing.
- Component: stable component-specific token contracts.
- Recipe: variant/size/emphasis mappings to component tokens.
- Instance: explicit final escape-hatch values.

These are independent data layers. A theme does not contain a visual system, and a context preset does not become a second theme.

## Deterministic precedence

Layers are composed from lower to higher precedence:

1. primitive
2. semantic
3. theme
4. visual-system
5. context
6. component
7. recipe
8. instance

The resolver sorts by this fixed order regardless of the order in which different layer types are passed. Multiple layers of the same type retain their input order; later same-type layers are considered later overrides. Identical ordered inputs always produce identical output.

An override is accepted only when the first/original definition lists the incoming layer type in overridableBy. An override cannot widen that permission. The token type must remain unchanged. Unauthorized or incompatible overrides are issues, not last-write-wins behavior.

## Token definitions

A definition has a stable dot-separated path, one of the supported token types, a typed value or explicit reference, optional description/deprecation metadata, and an explicit override allow-list.

    const actionPrimary = {
      path: "color.action.primary",
      type: "color",
      value: { $ref: "color.palette.blue.600" },
      description: "Primary action foreground",
      overridableBy: ["theme", "visual-system", "context"],
    };

References are structured objects. A reference inherits the type of its owning token; an optional expectedType can make the contract more explicit. The target must exist in the effective composed graph and have the same type.

## Public API

- TokenDefinition, TokenLayer, TokenReference, TokenType
- ResolvedToken, TokenResolutionResult, TokenTrace, TokenIssue
- orderTokenLayers, composeTokenLayers
- validateTokenLayers
- resolveTokens
- validateCssVariableNames, generateCssVariables, toCssVariableName
- GENERIC_FONT_FAMILIES, isGenericFontFamily
- createTokenTrace

## Usage

    import {
      createArabicPosStack,
      generateCssVariables,
      resolveTokens,
    } from "./atomic/tokens";

    const layers = createArabicPosStack("dark", {
      visualSystem: true,
      context: true,
    });

    const result = resolveTokens(layers);
    if (!result.isValid) {
      console.error(result.issues);
    } else {
      const css = generateCssVariables(result, "hz");
      if (css.isValid) {
        console.log(css.css);
        console.log(result.traces["component.button.height.md"]);
      }
    }

## Validation rules and supported value subset

Validation is conservative and intentionally does not claim to parse the complete CSS grammar.

| Token type | Accepted representation |
| --- | --- |
| color | #RGB, #RGBA, #RRGGBB, #RRGGBBAA, transparent, currentColor, black, white |
| dimension | Finite numeric value plus px, rem, em, %, vh, vw, ch, ex, cm, mm, in, pt, or pc |
| duration | Non-negative finite value plus ms or s |
| font-family | Non-empty array of printable strings. An entry equal to a CSS generic family (serif, sans-serif, monospace, cursive, fantasy, system-ui, math, emoji, fangsong, ui-serif, ui-sans-serif, ui-monospace, ui-rounded; ASCII case-insensitive) is emitted unquoted and lowercase; every other entry is a family name, quoted and escaped |
| font-weight | Integer from 1 through 1000 |
| opacity | Finite number in the inclusive range 0 through 1 |
| number | Any finite number |
| integer | Any safe integer |
| shadow | none, or a comma-separated list where each shadow is `[inset] <x> <y> [<blur> [<spread>]] <color>`. Lengths are px/rem/em or a unitless 0; offsets and spread may be negative, blur may not. Color uses the color subset above and comes last |
| easing | linear, ease, ease-in, ease-out, ease-in-out, or cubic-bezier() with x control points in [0, 1] |

Unknown token-definition and deprecation metadata keys, as well as duplicate override permissions, are rejected. Reference cycles are reported even when they also contain incompatible types.

Token paths use lowercase dot-separated segments. Segments may be lowercase words, kebab-case words, or numeric scale values. Empty segments, uppercase characters, whitespace, and other punctuation are rejected.

Reference validation checks unknown targets, target type mismatches, and direct/indirect cycles. Cycle issues include the complete closed path. CSS variable generation converts dots to hyphens under a validated namespace (default hz) and rejects collisions instead of overwriting.

## Provenance

Every resolved token exposes:

- originalDefinition: the first definition in the stack.
- originalSourceLayer: the layer that originally introduced the token.
- definition: the winning authorized definition.
- sourceLayer / sourceLayer.type: where the winning definition came from.
- valueSource: where the terminal literal value came from after aliases.
- overrideHistory: accepted override steps.
- referenceChain: ordered path from the requested token to its terminal literal.
- value: final typed value.

The traces record contains serializable TokenTrace explanations keyed by token path.

## Error behavior

validateTokenLayers and resolveTokens both accept `unknown` (for example the result of JSON.parse) and never throw on malformed data: null, a non-array stack, non-object layers, missing or non-array tokens, and malformed definitions all come back as issues (INVALID_LAYER, INVALID_TOKEN_DEFINITION, …). resolveTokens validates before resolving. If any issue exists, the result is invalid and exposes no resolved token map. There are no silent fallbacks. Issues include stable codes and relevant token, source-layer, reference-chain, or override-chain context.

### Snapshot semantics

resolveTokens copies the validated stack before composing it. The returned result — values, definitions, original definitions, provenance, traces, and issues — is a detached snapshot that is **deeply frozen**. Editing the input afterwards changes nothing in a result already returned, and CSS generated from that result stays consistent with it. The engine freezes only its own copies; caller-owned layers, definitions, arrays, and value objects are never mutated or frozen. validateTokenLayers returns fresh issue objects and does not freeze them.

### API changes in this revision

- `validateTokenLayers(layers: unknown)` and `resolveTokens(layers: unknown)` — previously `readonly unknown[]` and `readonly TokenLayer[]`. Typed callers are unaffected.
- Font-family generic keywords are emitted unquoted (`"Noto Sans Arabic", sans-serif`), where they were quoted before and lost their generic meaning. The representation stays `readonly string[]`. Limitation: a real family whose name equals a generic keyword cannot be expressed; CSS requires such a name to be quoted and no shipping font uses one.
- Shadow validation is a small parser instead of a regular expression: it rejects negative blur and now accepts a unitless `0`.
- `GENERIC_FONT_FAMILIES` and `isGenericFontFamily` are exported.

## Architecture alignment and coordination

**Precedence.** Architecture §6.3 lists eight resolution steps; this engine's eight layer types map onto them as follows: primitive (1), semantic + theme (2, split so a brand theme remaps semantic tokens without editing them), visual-system (3), context (4, and only for tokens whose original definition lists `context` in overridableBy), component + recipe (5), instance (8). Steps 6 and 7 — explicit variant/size and component state — are **not** separate layer types yet. At this stage a recipe layer holds flat tokens whose paths name the variant, size, or state (for example `component.button.height.md`, `component.button.background.pressed`); selecting among them is the job of the future recipe contract (§6.4), whose runtime API the architecture leaves open. The engine does not invent a precedence for variants or states, and no component implementations live here. Accessibility constraints (forced colors, reduced motion, minimum target size) are applied after resolution, per §6.3, not as layers.

**Foundation asset references.** Foundation contracts reference assets and layers by exact `id` + `version`; a `TokenLayer` carries `id` + `type`. Loading a referenced asset, checking its version, and turning its payload into a TokenLayer belong to an adapter outside this pure resolver (the foundation branch's `resolveExperienceTokens` is that adapter). The engine has no registry and does not read versions.

**Identifier mapping.** Foundation IDs allow lowercase slugs separated by dots or hyphens (`visual.quiet-enterprise`); layer IDs here are lowercase kebab-case only. A dotted foundation ID is therefore not a valid layer ID and cannot be passed through unchanged. The foundation adapter already handles this without guessing: each versioned token-layer envelope carries an explicit `layerId`, and the adapter rejects a payload whose `id` differs from it (`layer-id-mismatch`). No automatic dot-to-hyphen mapping is assumed. The engine reports an invalid or duplicate ID as INVALID_LAYER or DUPLICATE_LAYER_ID rather than normalizing it.

**Context.** The engine consumes an explicit, already-resolved stack. It never reads React context, the DOM, media queries, or environment detection; the effective experience context (density, input modality, appearance) is resolved upstream by `resolveExperienceContext` and arrives here only as the choice of layers.

## Example stack

examples/arabic-pos.ts provides primitive, semantic, light/dark theme, quiet-enterprise visual-system, POS touch context, component, and recipe layers. createArabicPosStack composes the same foundation with appearance, visual-system, and context selected independently. No React components are created.
