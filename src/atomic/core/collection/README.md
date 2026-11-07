# Collection
Pure TypeScript ordered key registry, nested tree support and disabled navigation. Public API: CollectionItem<T>, Collection<T>, createCollection<T>(), typed CollectionError.
Invariants: globally unique nonempty string keys; stable preorder; flatten obeys expanded Set; navigation skips disabled by default; no input mutation. RTL does not reverse document order.
Complexity: O(n) initialization and flatten, O(1) get, O(n) worst-case navigation over disabled runs.
Limits: recursion depth bounded by JS call stack; generic values are caller-owned references. No DOM/browser testing. 33 unit tests including 700 seeded property scenarios.
