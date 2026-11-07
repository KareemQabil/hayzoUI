# Headless Selection

## Public API
Exact `SelectionMode`, `SelectionState`, `SelectionAction`, `selectionReducer`, `isSelected`, and `selectedKeys` contracts.

## Invariants
- All reducer actions are immutable; every result has a fresh Set and object.
- `none` mode always returns empty. `single` mode never holds more than one key.
- Disabled and unknown keys are filtered from **all reducer actions**, including `selectAll` and `extendTo`.
- Range selection follows collection document order, independent of RTL; action `extendTo` replaces selection with inclusive anchor-to-target range.
- `selectAll` selects the entire supplied collection; to select filtered rows pass a scoped collection.
- Public `'all'` input is materialized to eligible keys during reduction. The reducer never emits lazy `'all'`.
- `selectedKeys` uses the supplied scope's order and ignores duplicate scope keys.

## Complexity
Reducer typically O(n) in collection size; range O(n), selection queries O(1) for Set and O(scope length) for `selectedKeys`. Space O(n).

## Known limits
The supplied public `isSelected(state, key)` and `selectedKeys(state, scope)` signatures do not accept disabled metadata. Consequently, raw external state with `selected: 'all'` is treated as selected for any provided key. Always pass it through `selectionReducer` with the scoped collection before checking disabled states. This is a signature-level ambiguity documented in the handoff as a possible additive extension.

No React/DOM, bro¶»§q«^