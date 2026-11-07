# Headless Keyboard

Pure physical-key to logical-intent maps implementing common WAI-ARIA Authoring Practices list and grid navigation behavior. No DOM, React or keydown side effects.

## Public API
Exact `Dir`, `KeyInput`, `ListMove`, `GridPos`, `listKeyAction`, `gridKeyAction`.

## Invariants
- RTL reverses horizontal arrow meaning only. Vertical arrows, Home/End, PageUp/PageDown retain their logical meanings.
- Vertical list handles ArrowUp/ArrowDown; horizontal list handles ArrowLeft/ArrowRight. Both handle Home/End and PageUp/PageDown.
- Ctrl/Meta+Home/End moves to grid first/last; plain Home/End moves to row start/end.
- Grid positions are logical, zero based, and clamped at edges. Unrecognized keys and invalid dimensions return null.
- Alt chords are not captured; Shift preserves movement intent so a selection layer can implement range extension.

## Complexity
O(1) time and memory for both functions, regardless of grid dimensions.

## Known limits
- Returns intents/coordinates, not aria attributes or focus operations. A platform layer must handle `preventDefault`, DOM focus and keyboard event composition.
- Boundary grid arrows return the current clamped position (rather than null). Null means unsupported/invalid.
- PageSize invalid/zero falls back to one row. Disabled grid cells need a higher-level navigation adapter.
- The explicit direction parameter is UI direction, not the language of content.

Unit-verified; not a browser, keyboard device or screen-reader audit¶»§q«^