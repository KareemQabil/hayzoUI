# Virtualization Math

## Public API
`VirtualWindow`, `createSizeCache`, `computeWindow`, `scrollToIndex`, `normalizeScrollLeft` with exactly the requested signatures.

## Invariants
- Fenwick tree stores positive finite item sizes, supports variable-size `set()`, prefix offsets and inverse offset lookup.
- `indexAt(offset)` returns the item containing the offset; exact boundaries point to the *following* item, and total/end points clamp to last item.
- `offsetOf(count)` is the total end offset. Empty cache `indexAt` returns 0 as a harmless sentinel; empty window returns all zeros.
- Window uses half-open `[start,end)`, overscan in item counts, and `offsetStart` at the first included item.
- Alignment supports start, center, end, nearest and clamps to the available scroll extent.
- RTL normalization uses the negative-scrollLeft convention (0 at inline-start, -max at inline-end). LTR uses direct nonnegative offset.
- Direction comes explicitly from the caller. No DOM measurement or browser assumptions beyond the documented negative RTL model.

## Complexity
Construction O(n) time/memory; updates, prefix offset and `indexAt` O(log n); window and scrollToIndex O(log n); RTL normalization O(1).

## Known limits
- The exported cache interface has no `count()` accessor; `computeWindow` assumes its count matches `sizes` argument.
- Floating-point sizes are allowed; very large sums can accumulate IEEE-754 rounding.
- Only negative RTL scroll mode is normalized. Browsers exposing lega¶»§q«^