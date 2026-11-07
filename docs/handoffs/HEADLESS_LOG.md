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

## Module 2 — Selection (SE)

- **Commit:** [`c8b52a8683ac9f6f7098aa2451347bb330736844`](https://github.com/KareemQabil/hayzoUI/commit/c8b52a8683ac9f6f7098aa2451347bb330736844).
- **Public contract:** exact `SelectionMode`, `SelectionState`, `SelectionAction`, `selectionReducer`, `isSelected` and `selectedKeys` signatures.
- **Tests:** 37/37 passing, including 600 deterministic seeded property cases, Arabic and RTL, all three modes, immutability, disabled keys, select-all over a filtered collection, and bidirectional range selection.
- **Typecheck:** repo `tsc -p tsconfig.json --noEmit` passed; Selection + Collection source and test passed standalone `--strict --noUncheckedIndexedAccess`.
- **Performance:** Set membership O(1), scope resolution and selection reduction O(n). No numerical threshold was specified for Selection; CI checked a 600-seed invariant suite.
- **Invariants:** reducer materializes eligible keys (never returns raw `'all'`), filters disabled/unknown keys, range is inclusive document-order independent of RTL, and no inputs are mutated.
- **Known limits:** raw externally constructed `selected: 'all'` has no disabled information available in the exported two-parameter `isSelected` signature. Consuming code must pass such a state through the reducer with scoped collection metadata first.
- **Evidence:** unit-verified only; no browser/device/assistive-technology claims.

## Module 3 — Keyboard (KB)

- **Commit:** [`f324bdad836efe79f3890f688ab89445b73d03fe`](https://github.com/KareemQabil/hayzoUI/commit/f324bdad836efe79f3890f688ab89445b73d03fe).
- **Public contract:** exact `Dir`, `KeyInput`, `ListMove`, `listKeyAction`, `GridPos`, `gridKeyAction` signatures.
- **Tests:** 45/45 passing, including 600 seeded property cases, Arabic/unrecognized input, RTL horizontal mirroring, shift/control/alt modifiers, grid boundaries and page jumps, and million-operation performance assertion.
- **Typecheck:** repo `tsc -p tsconfig.json --noEmit` passed; keyboard source and tests passed standalone `--strict --noUncheckedIndexedAccess`.
- **Measured budget:** one million grid navigation calls in 31 ms (Node single run); CI asserts < 5,000 ms including test overhead. Both maps O(1) time/memory.
- **Invariants:** RTL mirrors *horizontal arrows only*. Grid coordinates are logical, clamped at edges. Ctrl/Meta+Home/End address grid endpoints; Shift preserves movement intent.
- **Known limits:** no focus management or ARIA bindings (platform/Claude owns those); keyboard events are abstract structs, not DOM events. Grid boundary returns clamped same position.
- **Evidence level:** unit-verified only; no browser, screen-reader or physical-keyboard claim.

## Module 4 — Typeahead (TA)

- **Commit:** [`440814e2581ce7f46347c5c60cdf61a05c99c492`](https://github.com/KareemQabil/hayzoUI/commit/440814e2581ce7f46347c5c60cdf61a05c99c492).
- **Public contract:** exact `createTypeahead({ timeoutMs?, now })` with `search` and `reset`.
- **Tests:** 35/35 passing, including 650 fixed-seed property runs, Arabic hamza/taa marbuta/alef maqsura/diacritic/tatweel/digit tolerance, RTL-invariant cycling, timeout, reset, caching, mixed script and a 100,000-label budget.
- **Typecheck:** repo standard `tsc -p tsconfig.json --noEmit` passed. Additional `--noUncheckedIndexedAccess` compilation of imported source is currently blocked by pre-existing errors inside read-only `src/arabic/search.ts` lines 78–80; **no errors were reported in the owned Typeahead source or tests**.
- **Budget:** first 100,000-label index+query asserted under 5,000 ms (generous CI bound); subsequent searches scan cached normalized labels O(n), no repeated normalization.
- **Invariants:** injected clock, no timers, no mutation, normalization from `src/arabic/search`, repeated-character cycling and accumulating prefixes, explicit key scope.
- **Known limits:** reindex when keys array identity changes or on `reset()`; altered labels with identical keys array require reset; caller must pass post-IME committed characters.
- **Evidence level:** unit-verified only.

## Module 5 — Virtual window (VW)

- **Commit:** [`f79c4e92286580030c238ac1bdae020bea13c0ee`](https://github.com/KareemQabil/hayzoUI/commit/f79c4e92286580030c238ac1bdae020bea13c0ee).
- **Public contract:** exact `VirtualWindow`, `createSizeCache`, `computeWindow`, `scrollToIndex`, `normalizeScrollLeft`.
- **Tests:** 44/44 passing, including 700 deterministic seeded naive-versus-Fenwick scenarios, Arabic/RTL, variable-size updates, half-open window boundaries, all alignment modes and 100,000-item/10,000-update performance assertion.
- **Typecheck:** standard repository `tsc -p tsconfig.json --noEmit` and standalone source/tests `--strict --noUncheckedIndexedAccess` passed.
- **Budgets:** `set/offsetOf/indexAt` O(log n) via Fenwick. CI asserts 100,000-item initial cache, 10,000 size updates, and 20,000 inverse lookups in under 5,000 ms (generous cross-CI bound).
- **Invariants:** explicit direction; RTL negative scrollLeft normalized 0..max from inline-start; half-open [start,end) windows; scroll offsets clamped; no DOM reads.
- **Known limits:** only negative RTL scrollLeft mode is normalized; input `count` must match the provided size cache; float sums may accumulate tiny rounding differences.
- **Evidence level:** unit-verified only.

## Module 6 — Table (TE)

- **Commit:** [`b7e9dc20a6424df0ab2b9346dbd5039fd67a1d70`](https://github.com/KareemQabil/hayzoUI/commit/b7e9dc20a6424df0ab2b9346dbd5039fd67a1d70).
- **Public contract:** exact `ColumnDef<R>`, `Filter`, `TableState`, `TableModel<R>`, `createTableModel`, `DEFAULT_TABLE_STATE`, `serializeTableState`, `parseTableState`; additive typed `TableError`.
- **Tests:** 53/53 passing; entire published Headless core+data 250/250 passing. Includes 700 seeded stable-sort/property cases, explicit Arabic matching, numeric Arabic digits, money in integer minor units, trees, grouped headers, logical column pinning, column flex widths, serialization, malformed input, and a real 100,000-row filter+sort+paginate assertion.
- **Typecheck:** standard repo `tsc -p tsconfig.json --noEmit` passed; no `--noUncheckedIndexedAccess` errors reported in owned Table files (repository-wide strict baseline still has read-only source errors).
- **Performance budget:** **100,000-row numeric filter + stable sort + paginate <250 ms**, asserted and passed in Node/Vitest. Pipeline O(n log n) dominated by sorting; no browser performance claim.
- **Invariants:** filter/search uses `src/arabic`; stable multi-sort and nulls-last; grouping after sorting, aggregation over filtered domain rows before paging; integer money; columns pinned at logical start/end; saved-view JSON stable and version 1.
- **Known limits:** group-header `row: R` reuses first group member because public `TableModel<R>` does not allow an optional row; inspect `group` discriminator. Dates are canonical ISO text. Money mean rounded to nearest integer minor unit.
- **Evidence level:** unit-verified only.

## Contract change requests

**SE-CR-01 (pending, non-breaking option):** The public `isSelected(state, key)` and `selectedKeys(state, scope)` APIs cannot know whether a key is disabled when `state.selected === 'all'`. Consider an *optional* disabled-key context for these selectors, or explicitly ban raw `all` outside reducer-managed state; no public signature has been changed. Claude may safely consume the published exact signatures now.

No breaking contract changes have been made.
