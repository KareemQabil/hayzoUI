# Experience plan → token/recipe adapter boundary

Status: implemented foundation planning contract; token/recipe integration pending.

## What the foundation now provides

`resolveExperiencePlan`, exported from `src/atomic/foundations/index.ts`, accepts an
explicit profile, in-memory style asset catalog, appearance selection, and optional
preference layers. It returns either diagnostics or a serializable plan containing:

- Exact selected profile, visual system, brand theme, and context preset references.
- Effective context, field provenance, and applied context layer IDs.
- Explicit appearance and the context preset's operational requirements.
- Deduplicated token/recipe lookup requests with exact versions and requesting paths.

Style definitions are metadata. A reference to `visual.quiet-enterprise@0.1.0`
does not contain a token payload or establish that a corresponding layer exists.

## Responsibility at the next boundary

| Step | Owner | Required result |
|---|---|---|
| Validate style catalog and exact profile references | Foundations | A complete plan or diagnostics |
| Load exact token/recipe payloads | Application/registry adapter | Explicit versioned bindings; no silent substitution |
| Verify payload identity and supported mapping | Adapter | Each request bound to the intended loaded layer |
| Validate token values/references and override permissions | Token engine | Its own structured validation result |
| Order token layers and resolve values/provenance | Token engine | Deterministic token snapshot |
| Apply declared recipe variant/size/state contributions | Recipe layer, subject to its final contract | Plain CSS-compatible outputs |
| Apply accessibility constraints | Relevant final constraint stage | Explicit forced-colors, motion, and target-size handling |
| Render and verify component behavior | Component/platform layers | Actual interaction and visual evidence |

The adapter must not move token validation, precedence, or component behavior into
foundation planning. Foundations must not import the token engine, React, DOM,
CSS-in-JS, platform preferences, or a network registry.

## Explicit unresolved mappings

1. **Reference ID versus engine layer ID.** Foundation IDs allow dots. The reviewed
   token engine accepts narrower layer IDs. Preserve the original exact reference
   and provide a verified binding to the loaded layer ID; do not replace dots with
   hyphens implicitly because distinct IDs can then collide.
2. **Reference version versus payload version.** The reviewed `TokenLayer` has no
   version field. A versioned registry envelope/binding must attest which exact
   loaded payload satisfies the request. This contract does not require changing
   the pure engine's data shape.
3. **Appearance/density mapping.** The plan records explicit appearance and the
   effective context. Current asset metadata contains static layer references;
   it does not define light/dark or density selectors for payloads. Any mapping must
   be specified by the adapter/asset contract rather than inferred from names.
4. **Shared references.** Two style assets may request the same exact layer. The
   plan requests it once and retains both sources. It does not infer the layer's type
   from the requesting asset's kind. Actual layer type/permissions require engine
   validation and the adapter's explicit binding contract.
5. **Requirements are metadata, not enforcement.** `minimumTargetSize: 'touch'`
   does not prove a 24px or 48px rendered target; the value is a policy identifier.
   Final token/recipe constraints and rendered measurements must establish results.

## Failure contract

No partial plan is returned for malformed catalogs, duplicate exact identities,
missing requested assets, incompatible effective contexts/appearance, or conflicting
layer versions. Token and recipe request IDs occupy separate namespaces. An empty
catalog is structurally valid but cannot satisfy a normal profile.

Catalog order is irrelevant to successful resolution. Request traversal uses the
fixed brand → visual system → context order and each asset's own reference order.
That is deterministic loading order, not a replacement for engine precedence.

## Verification and non-goals

Contract tests exercise the three existing illustrative POS/ERP/CRM compositions,
exact versions, duplicate identities, source provenance, request de-duplication,
version conflicts, input mutation, frozen inputs, malformed data, and sparse arrays.

This work does not merge the independent feature branches, load executable payloads,
resolve CSS variables, implement recipes, render components, or claim production
accessibility. The other agent continues to own `src/atomic/tokens/`.
