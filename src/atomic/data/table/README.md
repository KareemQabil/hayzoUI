# Table engine (headless, F0)

The data side of an Ant Design–class Table / DataGrid / ProTable. Pure TypeScript — no React, DOM or timers — so it runs and is tested in plain Node. The React Table atom (F3) will render `TableModel` and own focus, ARIA and pinning CSS.

## Public API (shared contract with the headless-engines brief §6)

- `createTableModel({ rows, rowKey, columns, state, locale, availableWidth, getChildren? }) → TableModel`
- `DEFAULT_TABLE_STATE`, `serializeTableState(state)`, `parseTableState(json) → TableState | { error }`
- `groupKey(path)`, `TableError` (`DUPLICATE_ROW_KEY`, `TREE_CYCLE`)
- Types: `ColumnDef`, `Filter` (`text` · `in` · `range` · `global`), `TableState`, `TableRow`, `TableColumn`, `TableModel`

## Pipeline

tree → filter → sort → group → aggregates → paginate, plus column layout.

| Step | Behavior |
|---|---|
| Tree | `getChildren`; children visible only under keys in `state.expanded`; `depth` per row. Duplicate keys and cycles throw `TableError`. |
| Filter | AND of filters. `text`/`global` are Arabic-tolerant (hamza, diacritics, tatweel via `src/arabic`), and phones/codes match by digits in any numeral system («٠١٠» finds «+20 10 …»). `in` compares normalized values. `range` works on numbers (Arabic digits accepted), money (minor units) and ISO dates. Empty queries and unknown columns are ignored. A tree keeps the ancestors of a match. |
| Sort | Multi-column, stable, keys computed once per row. Text: `Intl.Collator(locale, { numeric: true, sensitivity: 'base' })`. Numbers written with Arabic-Indic digits sort numerically. Empty values last in both directions. `compare` overrides; `sortable: false` ignores requests. Siblings sort within each tree level. |
| Group | `groupBy` (multi-level). Group rows carry `{ column, value, count }` and a stable key `group:region=…/active=…`; members appear when the group key is in `expanded`. Groups appear in the order of their first sorted row. |
| Aggregates | `sum · avg · min · max · count` over **all filtered rows** (every level, not the page). Money stays integer minor units (average rounds to a unit). |
| Paginate | Over visible rows; index clamped; `pageCount ≥ 1`. |
| Columns | `columnOrder` (unknown keys ignored, missing appended), `hidden`, widths: explicit (`columnWidths`, e.g. after resize) → `width` → flex shares of the remainder, clamped by `minWidth`/`maxWidth` with redistribution. Visual order start-pinned · unpinned · end-pinned; `offset` is the distance from the column's own pinned edge — logical, so RTL needs no special case. |
| Saved views | `serializeTableState` is versioned (`v: 1`), stable (sets sorted). `parseTableState` validates and returns `{ error }` instead of throwing. |

## Evidence

TE-01…21 in `table.test.ts`: Arabic filters, digit search, ranges, multi-sort with Arabic collation and Arabic-digit numbers, tree filter/sort, groups, aggregates, pagination, column layout and pinning, saved views, purity, 600 seeded property cases, and the 100,000-row budget (filter + two-column sort + page measured at 236 ms in Node on the dev machine; CI asserts < 1500 ms).

## Limits

- No UI yet: rendering, keyboard grid navigation, selection UI, virtualization and resize handles belong to the React layer (selection, keyboard and virtual engines are separate modules).
- Grouping is by row value; custom group buckets (date ranges) are not supported yet.
- Server-side data: pass the server's page as `rows` with `page: null`; the engine does not fetch.
