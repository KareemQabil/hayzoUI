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
- generateCssVariables, toCssVariableName
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
| font-family | Non-empty array of printable family names; CSS output quotes and escapes each name |
| font-weight | Integer from 1 through 1000 |
| opacity | Finite number in the inclusive range 0 through 1 |
| number | Any finite number |
| integer | Any safe integer |
| shadow | none or a restricted comma-separated box-shadow subset using px/rem/em lengths and hex/basic named colors |
| easing | linear, ease, ease-in, ease-out, ease-in-out, or cubic-bezier() with x control points in [0, 1] |

Token paths use lowercase dot-separated segments. Segments may be lowercase words, kebab-case words, or numeric scale values. Empty segments, uppercase characters, whitespace, and other punctuation are rejected.

Reference validation checks unknown targets, target type mismatches, and direct/indirect cycles. Cycle issues include the complete closed path. CSS variable generation converts dots to hyphens under a validated namespace (default hz) and rejects collisions instead of overwriting.

## Provenance

Every resolved token exposes:

- originalDefinition: the first definition in the stack.
- definition: the winning authorized definition.
- sourceLayer / sourceLayer.type: where the winning definition came from.
- valueSource: where the terminal literal value came from after aliases.
- overrideHistory: accepted override steps.
- referenceChain: ordered path from the requested token to its terminal literal.
- value: final typed value.

The traces record contains serializable TokenTrace explanations keyed by token path.

## Error behavior

validateTokenLayers is pure and accepts unknown data, making it suitable for validating JSON-loaded token files. resolveTokens validates before resolving. If any issue exists, the result is invalid and exposes no resolved token map. There are no silent fallbacks. Issues include stable codes and relevant token, source-layer, reference-chain, or override-chain context.

## Example stack

examples/arabic-pos.ts provides primitive, semantic, light/dark theme, quiet-enterprise visual-system, POS touch context, component, and recipe layers. createArabicPosStack composes the same foundation with appearance, visual-system, and context selected independently. No React components are created.
