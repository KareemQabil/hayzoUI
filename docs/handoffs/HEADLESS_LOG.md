# Headless Engines — implementation log

**Branch:** `feat/atomic-headless-engines` (started from main `98de39900af3b6d1f76e462b1af5c6188b1678ab`)
**Ownership:** `src/atomic/core/**`, `src/atomic/data/**`, `src/atomic/forms/**`, and this log only.

## Module 1 — Collection (CO)

- **Commit:** [`6745d0e134730f8350cb0bce8706e21bec900a79`](https://github.com/KareemQabil/hayzoUI/commit/6745d0e134730f8350cb0bce8706e21bec900a79).
- **Public contract:** `CollectionItem<T>`, `Collection<T>`, `createCollection<T>()`; additive typed `CollectionError`.
- **Tests:** 36/36 passing in Vitest, including 700 deterministic seeded property runs, Arabic text/keys, RTL-invariant document order, navigation, nested expansion, duplicate and cyclic keys, immutability and performance.
- **Typecheck:** repo `tsc -p tsconfig.json --noEmit` passed; collection and its tests passed standalone `--strict --noUncheckedIndexedAccess`.
- **Observed budgets:** 100,000 entries constructed in 147 ms; 100,000 key lookups in 8 ms (Node in Vercel sandbox, one run; not a guaranteed cross-hardware SLA). 20,000-item construction/navigation budget asserted < 5,000 ms in tests.
- **Invariants:** unique string keys in whole tree, preorder navigation, nested descendants in `keys()`, `flatten(expanded)` visibility only, disabled skipped by default, no input mutation, no visual-direction inference.
- **Known limits:** Recursive construction/flatten susceptible to extremely deep nesting; generic domain value `T` remains caller-owned, not deep-frozen. The repository-wide additional `--noUncheckedIndexedAccess` check currently reveals unrelated errors outside owned paths; no collection errors appear.
- **Evidence level:** unit-verified only; no browser, accessibility, screen-reader, or device claim.

## Contract change requests

None required for Collection. New requests must be added here before changing a public contract.
