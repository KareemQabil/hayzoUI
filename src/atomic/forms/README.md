# Headless Form Store

Pure TypeScript subscription-based form state and validation, independent of React and DOM.

## Public API
Exact public FieldPath, Validator, FieldConfig, FieldState and FormStore contracts plus createFormStore({initialValues,scheduler?}).

## Invariants
- Values use nested dot paths and numeric array indices; empty string is normalized to null.
- Every public snapshot is a new object. Caller-owned initial data are never mutated.
- Field validation returns message **codes**; async stale results are discarded, AbortSignals are signaled, dependencies revalidate, and an optional injected scheduler handles debouncing.
- No implicit timers without an injected scheduler (debounced validation becomes immediate in that case).
- Submit validates all registered fields regardless of validateOn and never invokes onValid twice during concurrent submissions.
- List keys are stable across moves/removals and independent of positional field paths.
- Reset aborts pending validations, clears errors and counters, and restores a clean baseline.
- Dangerous prototype-polluting field-path segments are rejected.

## Complexity
Field lookup/write O(path depth), snapshots O(values size), dependent validation O(registered fields), list reordering O(items count).

## Known limits
- Dynamic numeric fields such as items.0.qty refer to positions; list.keys() remain stable but UI adapters must map stable keys to changing indices.
- Multiple registrations of one path use the latest config until all unregister.
- Cooperative abort does not cancel third-party network side effects; stale resolutions are ignored.
- Caller-owned onValid side effects cannot be cancelled by reset.
- Class instances are carried by reference; arrays and plain records are recursively copied.

**Evidence:** unit-verified only, no browser or screen-reader verification.

