# Experience plan validation — 2026-11-06

Foundation base: `dd3a62eeeb3d71f558636175aa8195a4fef0a6ce`.
Delivery branch: `feat/atomic-context-foundations`.

## Result

**110 tests passed across five files; scoped strict TypeScript passed.**

This change adds `resolveExperiencePlan`, exported through the foundation public
entry point, plus its structural input JSON schema and adapter-boundary document.

The planner validates the supplied style catalog, selects exact identities by
kind/ID/version, resolves effective context, and creates detached token/recipe
lookup requests with requesting-source provenance. Duplicate exact assets, missing
versions, incompatible contexts/appearance, and conflicting requested layer versions
fail without a partial plan. Shared exact requests are deduplicated.

Sparse arrays are also rejected across foundation array validators and context
resolution, preventing `forEach` from silently skipping holes in runtime inputs.

## Checks actually run

Repository installation was retried with the unchanged lockfile:

```sh
pnpm install --frozen-lockfile
```

It failed the environment's minimum-release-age policy for `jsdom@31.0.0`. This
time the other two packages previously blocked were no longer reported. No policy,
manifest, or lockfile was changed, and the blocked dependency was not used to run
checks.

The previously installed independent pure-TypeScript harness was reused. An exact
copy of the new foundation sources and the unchanged root TypeScript configuration
was placed under `validation-harness/next-snapshot`:

```sh
./node_modules/.bin/vitest run --config next-snapshot/src/atomic/foundations/vitest.config.ts
./node_modules/.bin/tsc --noEmit --project next-snapshot/src/atomic/foundations/tsconfig.json
```

Results: **5 files / 110 tests passed; TypeScript exit 0.**

Tools: Node `24.22.1`, Vitest `5.1.0`, TypeScript `5.9.3`, Ajv `8.20.0`, Node types
`22.19.17`. The repository requests Node 22; compatibility with that runtime was
not checked in this environment. The scoped compiler configuration has no DOM
library. A source import/global scan found no React/token-engine imports or DOM
globals in the foundation TypeScript files. `git diff --check` passed.

## Coverage added

- Existing Arabic POS, Arabic ERP, and English CRM profile plans.
- Catalog-order independence; exact version selection with multiple versions present.
- Missing-version failure rather than substituting a newer version.
- Kind-aware identity, wrong-kind lookups, and duplicate exact catalog identities.
- Shared layer requests with all sources retained; token/recipe namespaces separated.
- Conflicting versions in both token and recipe requests.
- Optional context recipe references.
- Effective scoped/user context compatibility and appearance selection.
- Validation of unselected catalog entries and malformed top-level inputs.
- Source mutation and frozen source graphs.
- Sparse catalog/reference/enum/preference/context arrays.
- Input JSON schema acceptance/rejection and the limits of structural validation.

## Limits

The token branch was fetched and remained at
`b0c0874a6aeab344c3170cb1941718e6310fb361`; no newer agent work was available during
this checkpoint. Neither branch was merged. The token engine, legacy application,
UI components, and existing visual baselines were not modified.

The planner does not load token/recipe payloads, verify their registry availability,
resolve tokens, generate CSS, enforce accessibility constraints, or render components.
The complete repository suite and application build remain unverified because
dependency installation was blocked. This evidence covers pure foundation contracts.

The next integration boundary is documented in
[`../architecture/EXPERIENCE_PLAN_ADAPTER_BOUNDARY.md`](../architecture/EXPERIENCE_PLAN_ADAPTER_BOUNDARY.md).
