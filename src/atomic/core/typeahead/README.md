# Headless Arabic-Tolerant Typeahead

## Public API
`createTypeahead({ timeoutMs?, now })` returns `search(char, keys, textOf, from)` and `reset()` exactly as contracted.

## Invariants
- Uses `src/arabic/search` for diacritics/tatweel stripping, hamza, taa marbuta, alef maqsura and Arabic-Indic digit normalization, while preserving source labels.
- The clock is injected, with no DOM/timers. The default timeout is 700 ms; an elapsed interval at/above the timeout clears the typed prefix.
- Consecutive repetitions of the same letter cycle the next matching option from `from`; mixed prefixes accumulate and search from `from` first when appropriate.
- Search wraps in document order, independent of RTL. Content language never implies UI direction.
- Normalized labels are cached once per supplied `keys` array reference. `reset()` invalidates this cache.
- Key labels are read with `textOf`; keys are never transformed, and inputs are never mutated.

## Complexity
One index rebuild O(n * text length); each keystroke O(n) scanning pre-normalized keys (worst-case character prefix matching). Space O(n).

## Known limits
- Mutating the same keys array or changing `textOf` labels without changing array identity requires `reset()` to re-index.
- No grapheme-composition event handling: caller supplies characters/chunks after IME composition commits.
- Typeahead returns candidate IDs; disabled-item skipping must be performed by passing a filtered key scope.
- The supplied `now()` should be mo¶»§q«^