# Headless Collection

## Purpose
A pure TypeScript, document-order key registry for nested selectable items and sections. No React, DOM or direction inference.

## Public API
`CollectionItem<T>`, `Collection<T>`, `CollectionError`, `createCollection(items)`; see exported interfaces.

## Invariants
- Keys must be nonempty, unique strings over the *entire* tree.
- Repeated keys throw `CollectionError('DUPLICATE_KEY', key, ...)`; cycles and invalid input also throw typed errors.
- Traversal uses preorder, independent of visual direction and expansion. `keys()` contains nested items, including collapsed descendants.
- `flatten(expanded)` shows roots and expanded descendants, with depth and parent metadata.
- `first/last/next/prev` skip disabled items by default; explicit `skipDisabled: false` allows them.
- `next(null)` starts at the beginning, `prev(null)` at the end; unknown non-null keys return `null`.
- Input item structure is snapshotted; no input is mutated. The collection's stored item wrappers are frozen, while generic values `T` are treated as caller-owned references.

## Complexity
Create O(n); get O(1); keys O(n); next/prev worst O(n) over disabled runs; flatten O(visible items). Memory O(n).

## Known limits
- Expansion applies only to `flatten`; selection/navigation over visible items should provide an explicit visible scope.
- Generic `value: T` is not deep-copied or frozen; callers own domain data immutability.
- Very deeply recursive input structures can reach th¶»§q«^