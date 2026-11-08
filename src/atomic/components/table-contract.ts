import type { AtomContract } from './contracts'

export const TABLE_CONTRACT: AtomContract = {
  id: 'atomic.table',
  version: '0.1.0',
  purpose: 'Show records in rows and columns, with sorting, filtering, selection, tree rows, groups, totals and pages.',
  nonGoals: ['Spreadsheet editing (DataGrid)', 'Server fetching (the caller owns data)', 'Virtual scrolling of 100k rendered rows (next: DataGrid on the virtual engine)'],
  element: 'table',
  accessibleName: 'The caption (`label`), visible or visually hidden; the scroll region carries the same name.',
  anatomy: ['root', 'scroll', 'caption', 'sort', 'sort-icon', 'sort-rank', 'select', 'toggle', 'toggle-spacer', 'cell-content', 'group-count', 'summary', 'empty', 'pagination', 'pagination-controls', 'page-size', 'page-status'],
  variants: {},
  states: ['sorted ascending', 'sorted descending', 'selected row', 'partially selected page', 'expanded', 'collapsed', 'loading', 'empty'],
  keyboard: [
    { key: 'Tab', action: 'Scroll region, then sort buttons, row checkboxes and toggles in document order (native)' },
    { key: 'Enter / Space on a header', action: 'Cycle sort: none → ascending → descending → none' },
    { key: 'Shift+Enter / Shift+click on a header', action: 'Add the column to a multi-column sort' },
    { key: 'Space on a checkbox', action: 'Select the row; the header box selects the page' },
    { key: 'Enter / Space on a toggle', action: 'Expand or collapse a tree row or group' },
  ],
  aria: [
    'caption names the table; region with the same name for the scroll container',
    'aria-sort on sortable headers only (ascending | descending | none)',
    'aria-selected on rows when selection is on; header checkbox mixed via indeterminate',
    'aria-expanded on tree and group toggles with an action label («توسيع …» / «طي …»)',
    'aria-busy while loading; pagination is a nav with a polite live status',
  ],
  direction: 'Column order, pinning and indentation are logical (inset-inline-start/end, padding-inline-start) and follow the experience direction; chevrons mirror in RTL.',
  recipe: 'recipes.atomic-core@0.1.0 · table.css',
  supportedContexts: ['erp-compact', 'pos-touch', 'saas-responsive'],
  limitations: [
    'No grid keyboard navigation between cells yet (Tab order only)',
    'No virtualization: render a page, not 100k rows',
    'No column resize handle or filter dropdowns yet (the engine supports widths and filters)',
    'Not yet checked with screen readers or on real touch devices',
  ],
  tests: ['TB-01', 'TB-02', 'TB-03', 'TB-04', 'TB-05', 'TB-06', 'TB-07', 'TB-INV-01', 'TB-ST-01'],
}
