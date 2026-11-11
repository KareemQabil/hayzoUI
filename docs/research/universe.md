# Component universe — research report

Layer: `data/catalog/universe` (kind `component`). Retrieved 2026-11-11. Every file is `needs-review`: an entry is a
judgement, and almost all Arabic text in it was written for this layer.

## What was collected

- **149 components**, one file each, with 1,026 features and 797 aliases across 13 libraries.
- 559 features come from the owner's Ant Design parity matrix (English and Arabic names carried as written); 467 were
  written here. 319 features carry an Arabic note (197 requirement, 95 risk, 27 opportunity).
- 20 components have no counterpart in any surveyed library ("ours alone", listed below).
- Features hold 1,975 "library ships this" claims in `in`; 1,747 (88%) are backed by a property found in that
  library's published type declarations and recorded in the feature's `evidence`. The other 228 are asserted (from the
  owner's matrix for AntD, or from knowledge of the library for behaviour that has no prop) and need review.
- 299 features list no library at all: they are the Arabic-first rows and the rows of our own components.

The tables at the end of this file are the verbatim output of `node tools/extract/universe/report.mjs --md`.

## How it was produced

| Step | Script | Input | Output |
|---|---|---|---|
| 1 | `fetch.mjs <scratch>` | `packages.json` (pinned versions) | packages unpacked with `npm pack` + `tar`; shadcn sparse clone; `evidence/resolved-packages.json` |
| 2 | `harvest-matrix.mjs <antd.ts>` | the owner's matrix, parsed as a TypeScript AST, not executed | `seed/antd-matrix.json` (70 components, 564 features, 42 `arabicEdge` notes) |
| 3 | `verify.mjs <scratch>` | `spec/` + unpacked declarations | `evidence/exports.json`, `evidence/verification.json` |
| 4 | `build.mjs` | `spec/`, `seed/`, `evidence/` | `data/catalog/universe/*.json`, `evidence/build-stats.json` |
| 5 | `report.mjs` | the data files | the tables below; exits 1 on any inconsistency |

`spec/*.mjs` is the hand-written part (names, families, tiers, engines, anatomy, dependencies, own features, probes,
Arabic notes, decisions). Steps 4 and 5 need no network. Nothing from a package was imported or run.

**Alias check.** `Name` must be an export of one of the library's entry points (read with the TypeScript checker);
`Name.Member` additionally needs `Member` declared in the declaration files of `Name`; a shadcn alias must be an item
of `apps/v4/public/r/index.json`. An alias that fails is left out of the data and counted.

**Feature check.** A feature may carry a probe: alternative property names (`loading|isPending`). A library is recorded
as shipping the feature when one of the names is declared in the declaration files that belong to its alias — files
whose directory, package or file name matches the alias, including the packages where props are really declared
(`@rc-component/*` for AntD, `@zag-js/*` and Ark UI for Chakra, `react-aria`/`react-stately` for React Aria,
`@radix-ui/*` for Radix). For shadcn the item's own source is read, then the Radix primitive it imports. This is a
check **by name**: it shows the property exists on that component, not that it behaves identically. Names that mean
something else in one library were restricted to the libraries where the meaning holds (`antd:type`). Inherited DOM
attributes are not seen, so the check under-claims rather than over-claims.

## Sources

| Source | Version read | License |
|---|---|---|
| hayzoUI (project owner): `src/atomic/parity/antd.ts`, `docs/MASTER_PLAN.md` §7, `CONTRACTS.md` | commit 9b4eb32 | MIT |
| Ant Design `antd` (+ 43 `@rc-component/*` packages for prop types) | 6.7.0 | MIT |
| Ant Design ProComponents `@ant-design/pro-components` (+ 10 `@ant-design/pro-*`) | 2.8.10 | MIT |
| Material UI `@mui/material` | 9.5.0 | MIT |
| MUI X community: `x-data-grid`, `x-date-pickers`, `x-tree-view`, `x-charts` | 9.17.0 | MIT |
| Mantine: `core`, `dates`, `notifications`, `dropzone`, `spotlight`, `carousel`, `charts`, `tiptap` | 9.8.0 | MIT |
| Chakra UI `@chakra-ui/react` (+ `@ark-ui/react` 5.40.0 and 77 `@zag-js/*` for prop types) | 3.38.0 | MIT |
| React Aria Components (+ `react-aria`, `react-stately`, `@react-types/shared`) | 1.22.1 | Apache-2.0 |
| Base UI `@base-ui/react` | 1.9.0 | MIT |
| Radix Primitives `radix-ui` (+ 60 `@radix-ui/*`) | 1.8.1 | MIT |
| Headless UI `@headlessui/react` | 2.2.10 | MIT |
| AG Grid Community `ag-grid-community` | 36.3.0 | MIT |
| TanStack Table `@tanstack/table-core` | 9.3.1 | MIT |
| shadcn/ui registry | commit dd41d19 | MIT |

Exact versions of every dependency package are in `tools/extract/universe/evidence/resolved-packages.json`. Only facts
were kept (export names, property names, file paths); no documentation text and no code.

## Schema changes (`component.schema.json`, additive)

- `data.summary` and `data.engines` are now required; `engines` needs at least one id (`none` when no engine).
- `features[].origin`: `owner-matrix` or `authored` — tells a reviewer which Arabic strings are the owner's.
- `features[].evidence[]`: `{ library, symbol, path }` for each library of `in` that a probe confirmed.
- `data.decisions[]`: `{ topic: naming | merge | split | tier | engine | scope, note }` — the judgement calls.
- Descriptions of `engines`, `dependsOn`, `aliases` say what is checked and by which script. The old description of
  `engines` pointed at `data/catalog/engines.json`, which does not exist; the closed list lives in `ARCHITECTURE.md`
  and `report.mjs` reads it from there.

## Judgement calls

Each entry records its own in `data.decisions`. The ones that shape the list:

- **Names.** `dialog` not modal, `separator` not divider, `collapsible` not disclosure, `text-field` not input,
  `description-list` not descriptions, `stepper` not steps. `menu` is the action menu (AntD calls it Dropdown) and
  `navigation-menu` is site navigation (AntD calls that Menu). `badge` is the static label; AntD's Badge is
  `count-badge`; removable labels are `tag`.
- **Merged.** Autocomplete and Combobox; Space, Stack, Group, HStack and VStack; Sheet and Drawer; AntD message,
  notification, Snackbar and Sonner into `toast`; native select into `select`; Label into `field`; week, month,
  quarter and year pickers into `date-picker`; close buttons into `icon-button`; loading overlays into `spinner`;
  all chart types into `charts`; ProTable into `data-table`.
- **Split.** AntD ConfigProvider into `locale-provider` and `theme-provider`; AntD Typography into `text`, `heading`,
  `link`; AntD Input into `text-field`, `textarea`, `password-input`, `search-field`, `otp-input`, `input-group`,
  `phone-input`; AntD Select's multiple and tags modes into `multi-select` and `tags-input`; Modal.confirm into
  `alert-dialog`; `toggle-group` kept apart from `segmented-control`.
- **`data-grid` is separate from `data-table`.** 87 features on the table are about reading records; 23 on the grid
  need cell focus, editors or a second virtualisation axis. The grid depends on the table.
- **Tiers.** Where the owner's §7 names a component its tier is kept (T0 Portal, FocusScope, LtrIsland … T5
  AmountInWords, IBANField, Invoice). Everything else was placed by dependency; `report.mjs` fails if anything
  depends on a later tier.
- **Feature priority.** Matrix features take the priority of their matrix component (the matrix has no per-feature
  priority). Features written here have their own.
- **Engines.** Every component names at least one id from the closed list. `none` is used for 54 components.

## Gaps and open questions

- **One alias could not be verified and was left out:** `mantine:ToggleGroup` (guessed; Mantine 9 exports `Toggle`
  only).
- **Asserted, not verified:** 228 `in` claims have no evidence row. All AntD claims on matrix rows without a probe
  rest on the owner's matrix, which states its feature lists were "written from knowledge of the AntD v5
  documentation, not scraped" — and the package read here is antd 6.
- **Probes that found nothing in any library (17):** carousel.pause, command-palette.groups, data-table.infinite,
  data-table.url-state, date-range-picker.order, field.count, icon-button.label-required, link.external,
  listbox.sections, meter.ranges, money-text.currency-form, otp-input.ltr-cells, popconfirm.placement,
  pro-form.dependency, toast.progress, transition.reduced-motion, tree-select.max-tag. Either no library ships it or
  the probe names are wrong for these versions.
- **Matrix rows not carried (7 of 564):** icon.iconfont, modal.draggable (out of scope); message.types and
  message.duration (duplicates of the notification rows merged into toast); app.context, app.config, util.get-ref
  (not components). 27 rows were moved to another entry rather than dropped; `evidence/build-stats.json` lists them.
- **Not unpacked:** AG Grid Enterprise, MUI X Pro/Premium (commercial), AntV charts, antd-mobile, Ant Design X,
  `@mantine/modals`, `@mantine/code-highlight`, `@mantine/nprogress`, `@tanstack/react-table` (the core was read).
  Features only those ship show no `in` for them — notably MUI's DateRangePicker and row grouping.
- **Left out on purpose:** AI chat components (shadcn `message`, `bubble`, `attachment`, `questionnaire`, `trace`,
  `marker`, `message-scroller`; Ant Design X), framework utilities (MUI `NoSsr`, `ClickAwayListener`, `CssBaseline`;
  Chakra `ClientOnly`, `Show`, `For`, `Bleed`, `DownloadTrigger`; Radix `Slot`), AntD `App` and `BorderBeam`,
  ProComponents help system, prayer-time scheduling. The last table of the report lists every export not reached.
- **Country rules quoted in notes** (national id and tax number lengths, week start, mandatory invoice language) are
  from memory and are illustrations; `data/finance` and `data/regions` are the source of truth.
- **`patterns`** (behaviour pattern ids) is left empty in every entry: the patterns layer was being written at the
  same time and its ids were not final.
- **Library ids differ from `data/catalog/libraries`.** This layer names libraries (`mantine`, `mui-x`), that layer
  names packages. Mapping: antd → antd · antd-pro → ant-design-pro-components · mui → mui-material · mui-x →
  mui-x-data-grid, mui-x-date-pickers (+ tree-view, charts) · mantine → mantine-core, mantine-dates (+ six
  extensions) · chakra → chakra-ui-react · react-aria → react-aria-components · base-ui → base-ui-react · radix →
  radix-ui · headless-ui → headlessui-react · shadcn → shadcn-ui · ag-grid → ag-grid-community · tanstack-table →
  tanstack-react-table (this layer read `@tanstack/table-core`).

## Findings that matter for an Arabic-first design

1. **The libraries moved since the owner's matrix.** antd is at 6, MUI and Mantine at 9, TanStack Table at 9.
   Mantine 9 now ships `PhoneInput`, `MaskInput`, `Cascader`, `Mentions`, `Tour`, `Splitter`, `EmptyState`,
   `DataList`, `ActionBar`, `Menubar`, `Toolbar`; Base UI ships `Drawer` and `OTPField`; Chakra ships `DatePicker`,
   `DateInput`, `Command`; React Aria ships `Sheet`, `TokenField`, `NavigationTree`; shadcn ships a `direction` item.
   So `phone-input` is not ours alone — but none of its Arabic rows has a counterpart.
2. **What is ours alone is the money, identity and calendar surface**: currency-input, amount-in-words, name-field,
   iban / national-id / tax-number fields, hijri and dual-calendar pickers, invoice, receipt, tax-summary, and the
   three text primitives (ltr-island, auto-direction-text, count-text). 12 of the 20 are p0.
3. **No surveyed provider has a numerals setting or a calendar setting.** Direction and locale are covered by nine
   libraries; numerals, calendar and region are not dimensions anywhere. Hijri is reachable only through adapters
   (MUI X `AdapterMomentHijri`, React Aria's `createCalendar`), never as a component.
4. **Physical names survive in current APIs**: Mantine `leftSection`/`rightSection`, drawer edges `left`/`right`
   everywhere, toast swipe directions in Radix and Base UI. A logical vocabulary (start/end) is a real difference.
5. **RTL risk concentrates in four mechanisms**, each recurring across many entries: `scrollLeft` sign (scroll-area,
   tabs, data-table shadows, virtualisation, carousel); arrow-key direction (every roving-focus and grid component);
   placement mirroring (every anchored overlay); icon mirroring. Solving each once in an engine removes most of the
   95 risk notes.
6. **Tables.** Of 87 data-table features, the Arabic-specific ones (collation, cell direction, money cells, scroll
   shadows, tolerant filter, logical pinning) have no library evidence at all. AG Grid alone declares an RTL switch
   (`enableRtl`); TanStack has `columnResizeDirection`.
7. **Things that must not mirror** are recorded as explicitly as things that must: OTP cells, numeric keypad layout,
   clockwise progress, colour-area axes, up/down trend arrows, hour:minute order.

## Requests to other layers

- **Architecture (engine ids).** Wanted, not added: `presence` (mount/unmount with exit animation — transition and
  every overlay), `scroll-area` (thumb geometry and RTL scroll normalisation; today folded under `none`), `clipboard`
  (copy-button, code, data-grid), `chart-scale` (charts), `rich-text` (rich-text-editor). Possibly `mask` if
  `segmented-input` is meant for date segments only: iban, national-id, tax-number and mask-input currently use it.
- **Architecture.** `component.schema.json` used to refer to `data/catalog/engines.json`; if a machine-readable
  engine list is wanted, it should be created by the owner of `ARCHITECTURE.md` and `report.mjs` pointed at it.
- **Libraries layer.** Agree one set of library ids (mapping above). With full prop tables, the 228 unverified `in`
  claims can be re-checked by type rather than by name.
- **Patterns layer.** Fill `patterns` on each entry once ids are stable; the engines column says which patterns each
  component needs.
- **Finance / regions.** Confirm the country rules quoted in notes of national-id-field, tax-number-field, calendar,
  invoice and address-form, then replace the prose with references to those data files.
- **Icons.** The mirroring registry is assumed by 14 features (`mirrorIcon` notes).

## What L1 / L2 should build from this

- **Order.** Engines by reach: `field` (38 components, 23 p0), `overlay-layers` (33), `anchored-position` (25),
  `selection` (23), `roving-focus` (17), `collection` (15), `text-input` (13), `segmented-input` (12). The greedy
  table below gives a step-by-step order: after `press`, `field`, `text-input`, `segmented-input`, `toggle`, `form`
  and `numeric-input`, 79 components are buildable, including most p0 inputs.
- **54 components need no engine** and can start as soon as L1 (numbers, money, text direction) and tokens exist;
  they include number-text, money-text, count-text, ltr-island and auto-direction-text, on which most others depend.
- **L1 before L2 for**: tolerant Arabic search and collation (cited by 20+ features), digit normalisation
  (every numeric and identity field), plural selection (every count and message), calendar conversion.
- **Generate from the data**: the component checklist per tier, the RTL test list (every feature with an Arabic
  note is a test to write), migration tables from each library (aliases), and prop-name hints (evidence symbols).

## Report output

### Totals

| measure | value |
|---|---|
| components | 149 |
| features | 1026 |
| features from the owner matrix | 559 |
| features written for this layer | 467 |
| aliases | 797 |
| library claims in `in` | 1975 |
| … with declaration evidence | 1747 (88%) |
| features with no library in `in` | 299 |

### Components per family and tier

| family | T0 | T1 | T2 | T3 | T4 | T5 | total | p0 | p1 | p2 |
|---|---|---|---|---|---|---|---|---|---|---|
| action | · | 4 | 2 | 1 | · | · | 7 | 2 | 3 | 2 |
| choice | · | 4 | 2 | · | · | · | 6 | 3 | 3 | · |
| data | · | · | · | 1 | 4 | 3 | 8 | 1 | 6 | 1 |
| date-time | · | · | 1 | · | 8 | · | 9 | 6 | 3 | · |
| display | 4 | 7 | 8 | 3 | · | 1 | 23 | 7 | 10 | 6 |
| feedback | · | 1 | · | 9 | · | · | 10 | 2 | 4 | 4 |
| layout | 7 | 1 | · | 3 | · | · | 11 | · | 6 | 5 |
| media | · | · | 1 | · | 1 | 3 | 5 | · | 1 | 4 |
| navigation | · | 1 | 3 | 8 | 2 | · | 14 | 4 | 6 | 4 |
| numeric-input | · | · | 4 | · | · | 1 | 5 | 2 | 1 | 2 |
| overlay | · | · | 2 | 5 | 1 | 1 | 9 | 5 | 1 | 3 |
| pattern | · | · | 1 | · | · | 5 | 6 | 2 | 4 | · |
| selection | · | · | 6 | · | 4 | 1 | 11 | 4 | 6 | 1 |
| text-input | · | 3 | 6 | 1 | · | 5 | 15 | 8 | 4 | 3 |
| utility | 7 | 2 | 1 | · | · | · | 10 | 8 | 2 | · |
| total | 18 | 23 | 37 | 31 | 20 | 20 | 149 | 54 | 60 | 35 |

### Components per engine

| engine | components | p0 | earliest tier | used by |
|---|---|---|---|---|
| none | 54 | 13 | T0 | alert, amount-in-words, aspect-ratio, auto-direction-text, avatar, badge, blockquote, box, breadcrumb, button-group, card, charts, code, container, count-badge, count-text, date-text, description-list, empty-state, flex, grid, heading, highlight, icon, input-group, kbd, list, locale-provider, ltr-island, marquee, meter, money-text, number-text, progress-circle, progress, prose, qr-code, receipt, result, rich-text-editor, scroll-area, separator, skeleton, skip-link, spinner, stack, stat, tax-summary, text, theme-provider, timeline, transition, visually-hidden, watermark |
| field | 38 | 23 | T1 | address-form, cascader, checkbox-group, checkbox, combobox, country-select, currency-input, currency-select, date-field, date-picker, date-range-picker, date-time-picker, dual-calendar-date-picker, entity-picker, field, fieldset, form, hijri-date-picker, iban-field, mask-input, multi-select, name-field, national-id-field, number-input, otp-input, password-input, phone-input, pro-form, radio-group, search-field, select, switch, tags-input, tax-number-field, text-field, textarea, time-picker, tree-select |
| overlay-layers | 33 | 16 | T0 | action-bar, alert-dialog, cascader, color-picker, combobox, command-palette, context-menu, country-select, currency-select, date-picker, date-range-picker, date-time-picker, dialog, drawer, dual-calendar-date-picker, entity-picker, floating-panel, hijri-date-picker, hover-card, image, menu, menubar, multi-select, navigation-menu, popconfirm, popover, portal, select, time-picker, toast, tooltip, tour, tree-select |
| anchored-position | 25 | 11 | T2 | cascader, color-picker, combobox, context-menu, country-select, currency-select, date-picker, date-range-picker, date-time-picker, dual-calendar-date-picker, entity-picker, hijri-date-picker, hover-card, mentions, menu, menubar, multi-select, navigation-menu, popconfirm, popover, select, time-picker, tooltip, tour, tree-select |
| selection | 23 | 7 | T1 | bottom-navigation, cascader, checkbox-group, combobox, country-select, currency-select, data-grid, data-table, entity-picker, list-view, listbox, multi-select, radio-group, rating, segmented-control, select, tabs, tag, tags-input, toggle-group, transfer, tree-select, tree |
| roving-focus | 17 | 5 | T1 | accordion, bottom-navigation, context-menu, listbox, menu, menubar, navigation-menu, radio-group, rating, segmented-control, sidebar, tabs, tag, tags-input, toggle-group, toolbar, tree |
| collection | 15 | 7 | T2 | combobox, command-palette, context-menu, country-select, currency-select, data-table, entity-picker, list-view, listbox, menu, multi-select, navigation-menu, select, tags-input, tree |
| text-input | 13 | 8 | T1 | editable-text, iban-field, mask-input, mentions, name-field, national-id-field, password-input, phone-input, search-field, tags-input, tax-number-field, text-field, textarea |
| segmented-input | 12 | 8 | T2 | date-field, date-picker, date-range-picker, date-time-picker, dual-calendar-date-picker, hijri-date-picker, iban-field, mask-input, national-id-field, otp-input, tax-number-field, time-picker |
| listbox | 9 | 4 | T2 | combobox, command-palette, country-select, currency-select, entity-picker, listbox, multi-select, select, transfer |
| press | 9 | 2 | T1 | button, copy-button, file-upload, floating-action-button, icon-button, link, numeric-keypad, tag, toggle-button |
| combobox | 8 | 2 | T2 | address-form, combobox, command-palette, country-select, currency-select, entity-picker, mentions, multi-select |
| focus-scope | 8 | 5 | T0 | alert-dialog, command-palette, dialog, drawer, focus-scope, popconfirm, popover, tour |
| disclosure | 7 | 2 | T2 | accordion, app-shell, collapsible, floating-action-button, navigation-menu, popover, sidebar |
| calendar-grid | 6 | 5 | T4 | calendar, date-picker, date-range-picker, date-time-picker, dual-calendar-date-picker, hijri-date-picker |
| dialog | 6 | 3 | T2 | alert-dialog, command-palette, dialog, drawer, image, pro-form |
| form | 5 | 2 | T2 | address-form, data-grid, form, name-field, pro-form |
| grid-navigation | 5 | 2 | T3 | calendar, data-grid, data-table, list-view, numeric-keypad |
| resize | 5 | 1 | T3 | app-shell, data-grid, data-table, floating-panel, splitter |
| toggle | 5 | 2 | T1 | checkbox, password-input, switch, toggle-button, toggle-group |
| virtual-list | 5 | 1 | T3 | data-grid, data-table, list-view, tree, virtual-list |
| menu | 4 | 1 | T2 | cascader, context-menu, menu, menubar |
| typeahead | 4 | 3 | T2 | listbox, menu, select, tree |
| numeric-input | 3 | 2 | T2 | currency-input, number-input, numeric-keypad |
| stepper | 3 | 0 | T3 | pro-form, stepper, tour |
| table-model | 3 | 2 | T4 | data-grid, data-table, invoice |
| tree-model | 3 | 0 | T4 | cascader, tree-select, tree |
| date-range | 2 | 2 | T4 | calendar, date-range-picker |
| drag-sort | 2 | 0 | T4 | data-grid, tree |
| pagination | 2 | 2 | T3 | data-table, pagination |
| scroll-spy | 2 | 0 | T3 | affix, table-of-contents |
| slider | 2 | 0 | T2 | color-picker, slider |
| time | 2 | 0 | T4 | date-time-picker, time-picker |
| tooltip | 2 | 1 | T2 | hover-card, tooltip |
| carousel | 1 | 0 | T4 | carousel |
| color | 1 | 0 | T5 | color-picker |
| tabs | 1 | 1 | T2 | tabs |
| toast-queue | 1 | 1 | T3 | toast |
| upload-queue | 1 | 0 | T4 | file-upload |

### Engine leverage (build order)

Greedy order: at each step the engine that completes the most components whose other engines are already built (ties: most p0 completed, then most components using it, then the earliest tier). "Completes" counts components that become buildable at that step; the cumulative column includes the components that need no engine.

| step | engine | used by | completes | p0 completed | cumulative | components completed at this step |
|---|---|---|---|---|---|---|
| 1 | press | 9 | 4 | 2 | 58 | button, copy-button, icon-button, link |
| 2 | field | 38 | 2 | 1 | 60 | field, fieldset |
| 3 | text-input | 13 | 5 | 4 | 65 | editable-text, phone-input, search-field, text-field, textarea |
| 4 | segmented-input | 12 | 6 | 4 | 71 | date-field, iban-field, mask-input, national-id-field, otp-input, tax-number-field |
| 5 | toggle | 5 | 4 | 2 | 75 | checkbox, password-input, switch, toggle-button |
| 6 | form | 5 | 2 | 2 | 77 | form, name-field |
| 7 | numeric-input | 3 | 2 | 2 | 79 | currency-input, number-input |
| 8 | overlay-layers | 33 | 2 | 1 | 81 | action-bar, portal |
| 9 | disclosure | 7 | 2 | 0 | 83 | collapsible, floating-action-button |
| 10 | roving-focus | 17 | 3 | 0 | 86 | accordion, sidebar, toolbar |
| 11 | selection | 23 | 7 | 1 | 93 | bottom-navigation, checkbox-group, radio-group, rating, segmented-control, tag, toggle-group |
| 12 | resize | 5 | 3 | 0 | 96 | app-shell, floating-panel, splitter |
| 13 | scroll-spy | 2 | 2 | 0 | 98 | affix, table-of-contents |
| 14 | focus-scope | 8 | 1 | 1 | 99 | focus-scope |
| 15 | dialog | 6 | 4 | 3 | 103 | alert-dialog, dialog, drawer, image |
| 16 | anchored-position | 25 | 2 | 1 | 105 | popconfirm, popover |
| 17 | calendar-grid | 6 | 3 | 3 | 108 | date-picker, dual-calendar-date-picker, hijri-date-picker |
| 18 | stepper | 3 | 3 | 0 | 111 | pro-form, stepper, tour |
| 19 | collection | 15 | 2 | 1 | 113 | navigation-menu, tags-input |
| 20 | tooltip | 2 | 2 | 1 | 115 | hover-card, tooltip |
| 21 | combobox | 8 | 2 | 0 | 117 | address-form, mentions |
| 22 | listbox | 9 | 7 | 2 | 124 | combobox, command-palette, country-select, currency-select, entity-picker, multi-select, transfer |
| 23 | typeahead | 4 | 2 | 2 | 126 | listbox, select |
| 24 | menu | 4 | 3 | 1 | 129 | context-menu, menu, menubar |
| 25 | tree-model | 3 | 2 | 0 | 131 | cascader, tree-select |
| 26 | time | 2 | 2 | 0 | 133 | date-time-picker, time-picker |
| 27 | table-model | 3 | 1 | 1 | 134 | invoice |
| 28 | pagination | 2 | 1 | 1 | 135 | pagination |
| 29 | date-range | 2 | 1 | 1 | 136 | date-range-picker |
| 30 | grid-navigation | 5 | 2 | 1 | 138 | calendar, numeric-keypad |
| 31 | virtual-list | 5 | 3 | 1 | 141 | data-table, list-view, virtual-list |
| 32 | drag-sort | 2 | 2 | 0 | 143 | data-grid, tree |
| 33 | tabs | 1 | 1 | 1 | 144 | tabs |
| 34 | toast-queue | 1 | 1 | 1 | 145 | toast |
| 35 | slider | 2 | 1 | 0 | 146 | slider |
| 36 | upload-queue | 1 | 1 | 0 | 147 | file-upload |
| 37 | carousel | 1 | 1 | 0 | 148 | carousel |
| 38 | color | 1 | 1 | 0 | 149 | color-picker |

Need no engine: 54 components. Engines of the closed list that no component uses: none.

### Ours alone (no alias in any surveyed library)

| id | tier | priority | family | name |
|---|---|---|---|---|
| address-form | T5 | p1 | pattern | Address form |
| amount-in-words | T5 | p0 | display | Amount in words |
| auto-direction-text | T0 | p0 | display | Auto-direction text |
| count-text | T1 | p1 | display | Count text |
| country-select | T2 | p1 | selection | Country select |
| currency-input | T2 | p0 | numeric-input | Currency input |
| currency-select | T2 | p1 | selection | Currency select |
| date-text | T2 | p1 | date-time | Date text |
| dual-calendar-date-picker | T4 | p0 | date-time | Dual-calendar date picker |
| entity-picker | T2 | p1 | pattern | Entity picker |
| hijri-date-picker | T4 | p0 | date-time | Hijri date picker |
| iban-field | T5 | p0 | text-input | IBAN field |
| invoice | T5 | p0 | pattern | Invoice |
| ltr-island | T0 | p0 | utility | LTR island |
| name-field | T2 | p0 | text-input | Name field |
| national-id-field | T5 | p0 | text-input | National ID field |
| numeric-keypad | T5 | p2 | numeric-input | Numeric keypad |
| receipt | T5 | p0 | pattern | Receipt |
| tax-number-field | T5 | p0 | text-input | Tax number field |
| tax-summary | T5 | p1 | pattern | Tax summary |

### Aliases per library

| library | components covered | alias names |
|---|---|---|
| mantine | 106 | 175 |
| chakra | 92 | 122 |
| antd | 84 | 95 |
| mui | 59 | 92 |
| react-aria | 54 | 79 |
| shadcn | 54 | 58 |
| base-ui | 38 | 41 |
| radix | 31 | 32 |
| headless-ui | 19 | 25 |
| antd-pro | 14 | 35 |
| mui-x | 10 | 39 |
| ag-grid | 2 | 2 |
| tanstack-table | 2 | 2 |

Shipped by the most libraries: data-table (10), checkbox (9), dialog (9), field (9), locale-provider (9), menu (9), popover (9), radio-group (9), select (9), switch (9), tabs (9), accordion (8).

### Features carrying an Arabic note, by kind

| kind | features | p0 | p1 | p2 | from owner matrix | components |
|---|---|---|---|---|---|---|
| requirement | 197 | 118 | 65 | 14 | 22 | 103 |
| risk | 95 | 32 | 46 | 17 | 16 | 77 |
| opportunity | 27 | 9 | 12 | 6 | 4 | 22 |
| total | 319 | 159 | 123 | 37 | 42 | 139 |

Components with no Arabic note on any feature: aspect-ratio, card, checkbox-group, container, date-time-picker, fieldset, flex, focus-scope, separator, toggle-button.

### Arabic notes per family

| family | requirement | risk | opportunity |
|---|---|---|---|
| action | 4 | 6 | · |
| choice | 3 | 2 | · |
| data | 27 | 15 | 3 |
| date-time | 18 | 4 | 4 |
| display | 31 | 18 | 2 |
| feedback | 9 | 6 | · |
| layout | 4 | 4 | · |
| media | 2 | 3 | · |
| navigation | 13 | 7 | 3 |
| numeric-input | 13 | 3 | 1 |
| overlay | 3 | 8 | · |
| pattern | 17 | 3 | 3 |
| selection | 14 | 4 | 4 |
| text-input | 24 | 7 | 7 |
| utility | 15 | 5 | · |

### Library exports not reached by any alias

PascalCase value exports of each entry point that are neither an alias nor a part of one (name starting with an alias name), after removing contexts, providers, icons and other non-components by name. This is the list to read when asking "did we miss a component?".

| library | component-like exports | reached | not reached | names not reached |
|---|---|---|---|---|
| antd | 69 | 67 | 2 | App BorderBeam |
| antd-pro | 93 | 69 | 24 | DefaultHeader DropdownFooter ErrorBoundary FilterDropdown FormControlRender FormItemProvide FormItemRender Group IndexColumn InlineErrorFormItem LabelIconTip ListSkeletonItem ProHelp ProHelpContentPanel ProHelpDrawer ProHelpModal ProHelpPanel ProHelpPopover ProHelpProvide ProHelpSelect RenderContentPanel Search SelectKeyProvide TableStatus |
| mui | 154 | 133 | 21 | Breakpoint BreakpointOverrides Breakpoints BreakpointsOptions ClickAwayListener ColorFormat ColorObject CreateMUIStyled CssBaseline DataAttributesOverrides Direction EventHandlers GlobalStateSlot InitColorSchemeScript Interpolation NoSsr ScopedCssBaseline SlotComponentPropsWithSlotState StorageManager WithDataAttributes WithOptionalOwnerState |
| mui-x | 98 | 61 | 37 | MuiBaseEvent MuiEvent PropsFromSlot RenderProp StylesheetErrorReason Toolbar ToolbarButton ToolbarRoot PickerDay AreaElement AreaPlot BarElement BarLabel BarPlot ContinuousColorLegend LineElement LineHighlightElement LineHighlightPlot LinePlot MarkElement MarkPlot PieArc PieArcLabel PieArcLabelPlot PieArcPlot PiePlot PiecewiseColorLegend RadarAxis RadarAxisHighlight RadarGrid RadarMetricLabels RadarSeriesArea RadarSeriesMarks RadarSeriesPlot Scatter ScatterMarker ScatterPlot |
| mantine | 362 | 325 | 37 | ColorSchemeScript FlatTreeNode FloatingArrow OptionsDropdown OverflowList RemoveScroll Day DecadeLevel DecadeLevelGroup HiddenDatesInput LevelsGroup Month MonthLevel MonthLevelGroup MonthsList PickerInputBase QuarterLevel QuarterLevelGroup QuartersList WeekdaysRow YearLevel YearLevelGroup YearsList FileRejection FileWithPath AreaGradient BarsList BulletChart CandlestickChart ChartBrush ChartLegend ChartTooltip GaugeChart MatrixChart SunburstChart WaffleChart Link |
| chakra | 647 | 642 | 5 | Bleed ClientOnly DownloadTrigger For Show |
| react-aria | 147 | 125 | 22 | CollectionBuilder ColorThumb DefaultCollectionRenderer DropIndicator Focusable Header Layout LayoutInfo ListLayout OverlayArrow Point Pressable PreviewTrigger Rect Section SelectionIndicator SharedElement SharedElementTransition Size Token TokenInput WaterfallLayout |
| base-ui | 434 | 434 | 0 | — |
| radix | 32 | 31 | 1 | Slot |
| headless-ui | 64 | 63 | 1 | DataInteractive |
| shadcn | 65 | 58 | 7 | attachment bubble marker message message-scroller questionnaire trace |
