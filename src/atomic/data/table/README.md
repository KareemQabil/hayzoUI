# Headless Table Engine

Ant Designâ€“class pure data-table pipeline. No React, DOM, CSS or framework integration. All row identifiers are strings. Accessor functions and column definitions are caller-owned.

## Public API
Exactly `ColumnDef<R>`, `Filter`, `TableState`, `TableModel<R>`, `createTableModel`, `DEFAULT_TABLE_STATE`, `serializeTableState`, `parseTableState`. Additive typed `TableError`.

## Pipeline and invariants
1. Flatten roots and expanded tree children in preorder; verify unique keys in visible scope.
2. Apply ANDed `text/in/range/global` filters, with `matchText` from `src/arabic` and tolerant spelling options.
3. Perform stable multi-column sorting, honoring numeric type/money as integer minor units and locale Collator({ numeric: true }); nulls always last, even descending.
4. Group filtered+sorted rows by `groupBy`. Group headers are marked by `group`; `row` on a group header references its first member (required by fixed public TableModel signature). A group is initially collapsed; pass its emitted `key` into state.expanded to show descendants.
5. Aggregate over **filtered domain rows** independent of pagination or collapsed group state.
6. Paginate the **visible display rows** after grouping, counting group headers in the page-size budget.

Column widths respect explicit overrides, min/max and proportional flexible unused space. `pin:'start'|'end'` uses logical edge offsets; no physical left/right inference. Rows always appear in fresh result wrappers, n¶»§q«^