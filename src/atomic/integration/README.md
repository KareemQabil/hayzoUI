# Experience → token engine adapter

`resolveExperienceTokens` binds the foundation's exact token requests to supplied
payloads, then calls an explicitly supplied token engine through its public API.
It imports the foundation public entry point and has no production dependency on
React, the DOM, CSS, or a specific token engine implementation.

```ts
import { resolveExperienceTokens } from './atomic/integration'

const result = resolveExperienceTokens({
  experience: { profile, styleAssets, appearanceMode: 'light' },
  tokenAssets: [
    {
      schemaVersion: 1,
      kind: 'token-layer',
      id: 'brand.neutral-blue', // Exact registry reference.
      version: '0.1.0',
      layerId: lightTheme.id,  // Explicit engine-layer binding; no ID conversion.
      payload: lightTheme,
    },
    visualAsset,
    contextAsset,
  ],
  baseLayers: [primitives, semantics, componentTokenContracts],
}, {
  validateTokenLayers: engine.validateTokenLayers,
  resolveTokens: engine.resolveTokens,
})

if (result.ok) {
  console.log(result.resolution)
  console.log(result.bindings) // Exact references and all requesting sources.
}
```

The named inputs in this example are caller-supplied values. A real, runnable
contract test is in `token-engine.contract.test.ts`, using a selected external
engine's public entry point and example stack.

## Binding contract

- A token envelope identifies one exact registry ID/version and explicitly maps
  it to `payload.id` through `layerId`. The engine validates its own ID grammar.
- All catalog envelopes must be unique by exact ID/version and contain JSON data.
  Several versions can coexist; only the exact request is selected. No latest,
  range resolution, name guessing, or dot-to-hyphen conversion occurs.
- All selected payload IDs, including base layers, must be unique. Distinct registry
  IDs cannot silently collapse to the same engine ID.
- Caller data is copied before either engine function is invoked. Only the new
  payload graphs and stack array are frozen; caller-owned data is never frozen.
- JSON snapshots accept finite numbers, strings, booleans, null, dense arrays,
  and plain objects. Optional undefined object properties are omitted. Undefined
  array elements, functions, symbols on objects, non-plain objects, accessors,
  cycles, and graphs exceeding 100 nesting levels fail with diagnostics.
- Base layers are explicit. Shared primitives/semantics/component tokens are not
  inferred from selected style metadata. Request traversal does not replace the
  engine's precedence rules.
- The injected validator owns the complete token shape and semantics. Only after
  it succeeds are layer types narrowed and the engine resolver invoked. Validation
  and resolution diagnostics are returned with their original engine codes/data.
- The port is synchronous and trusted application code. Exceptions or inconsistent
  responses produce adapter diagnostics rather than partial success.

The success result contains the plan, exact bindings, frozen layer stack, and the
engine's original resolution result. The engine owns its output representation;
the adapter does not freeze or rewrite that result.

## Failure stages

| Stage | Meaning |
|---|---|
| `plan` | The foundation could not validate/select compatible style assets/context |
| `binding` | A catalog, exact payload, JSON snapshot, or layer ID binding is invalid |
| `engine-validation` | The engine rejected the complete composed token stack |
| `engine-resolution` | The engine returned a failed resolution |
| `adapter` | The engine threw or violated the synchronous result contract |

No failure result contains a partial plan, binding list, token stack, or resolution.
`token-asset.v1.schema.json` validates only envelope structure; register the existing
experience-profile schema by its `$id` before compiling it. A schema-valid envelope
can still have an invalid payload. Runtime binding plus engine validation is required.

## Scope and limits

This is a deterministic in-memory adapter, not a network registry loader. An envelope
attests the supplied payload's version; it is not a cryptographic provenance check.
The caller/registry producer is responsible for that attestation.

Appearance/density selectors are not inferred: the caller supplies the appropriate
catalog for the explicit experience. The adapter does not prove the supplied theme
has correct colors for its claimed mode. The live contract test selects light/dark
payloads explicitly and checks their known resulting values.

Recipe collection requests remain visible in `result.plan.recipeLayers`; they are
not loaded or executed. The engine's example recipe **token aliases** can be explicit
base layers, but those are not implemented component recipe collections. No CSS
generation, accessibility-constraint enforcement, component rendering, or migration
of the legacy app occurs here.

## Verification

```sh
pnpm exec tsc --noEmit --project src/atomic/integration/tsconfig.json
pnpm exec vitest run src/atomic/integration/experience-tokens.test.ts
```

To run against a reviewed engine commit without merging branches, export its exact
`src/atomic/tokens` tree to a temporary directory, then provide the absolute public
entry path:

```sh
HAYZO_TOKEN_ENGINE_ENTRY=/absolute/snapshot/src/atomic/tokens/index.ts pnpm exec vitest run src/atomic/integration/token-engine.contract.test.ts
```

Without that explicit path, the five external-engine tests are skipped. They are
never replaced by a mock. The default unit file uses a small port implementation
to exercise adapter failures independently of engine behavior.

Executed commands, counts, source SHA, and remaining engine findings are in
`docs/reviews/EXPERIENCE_TOKEN_INTEGRATION_2026-11-06.md`.
