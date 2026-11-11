# Library API surface (`data/catalog/libraries`)

The measured public API of 19 existing React UI libraries: which components each one exports and which props each
component takes, read from the published type declarations by the TypeScript checker. One `library-api` file per
library. Every number in the generated section below is printed by `tools/extract/catalog/summarize.mjs` from
those files.

## What was collected

- 18 typed libraries, 3,797 prop-taking records (components, compound members, option interfaces) and 49,497 props.
- shadcn/ui as a registry: 65 items, the 355 component names their files export, and their declared dependencies.
  No props (it publishes no types).
- All eleven required libraries and all seven optional ones were done. Two were not read at the npm `latest`
  version; see "Versions that are not latest".

Per record: name (dotted for compound members, `Dialog.Root`), declaring type file, parts, aliases, props type name,
type parameters, and per prop: name, type text (cut at 200 characters), required, `@default` value, deprecated,
`inheritedFrom` (the interface that declares it when that is not the component's own props type) and `declaredIn`
(the npm package that declares it when that is not the library). Description prose is never copied.

## How to reproduce

```
node tools/extract/catalog/install.mjs <installs-dir>            # npm install --ignore-scripts, pinned versions
node tools/extract/catalog/run-all.mjs <installs-dir>            # 18 typed libraries
node tools/extract/catalog/extract-shadcn.mjs <clone of shadcn-ui/ui>
node tools/extract/catalog/summarize.mjs                         # rewrites the generated section of this file
```

`extract-api.mjs <install-dir> <config.json>` does one library. Configs are in `tools/extract/catalog/libraries/`:
package, pinned version, the exact install list, and where needed `entries`, `styleInterfaces`, `domInterfaces`,
`interfaces`. Nothing from a package is imported or executed. A second run produced byte-identical files (19 of 19
checksums), and a clean reinstall of two libraries into a new directory reproduced their files exactly.

## Sources

Retrieved 2026-11-11 from the npm registry; license is the `license` field of each `package.json`.

| Library | Package | Version | License |
|---|---|---|---|
| Ant Design | antd | 6.7.0 | MIT |
| Ant Design ProComponents | @ant-design/pro-components | 2.8.10 (beside antd 5.29.3) | MIT |
| Material UI | @mui/material | 9.5.0 | MIT |
| MUI X Data Grid | @mui/x-data-grid | 9.17.0 | MIT |
| MUI X Date and Time Pickers | @mui/x-date-pickers | 9.17.0 | MIT |
| Mantine | @mantine/core, @mantine/dates | 9.8.0 | MIT |
| Chakra UI | @chakra-ui/react | 3.38.0 | MIT |
| React Aria Components | react-aria-components | 1.22.1 | Apache-2.0 |
| Base UI | @base-ui/react | 1.9.0 | MIT |
| Radix Primitives | radix-ui | 1.8.1 | MIT |
| Headless UI | @headlessui/react | 2.2.10 | MIT |
| Fluent UI React v9 | @fluentui/react-components | 9.75.2 | MIT |
| PrimeReact | primereact | 10.9.9 | MIT |
| Ark UI | @ark-ui/react | 5.40.0 | MIT |
| HeroUI | @heroui/react | 3.2.7 | Apache-2.0 |
| TanStack Table | @tanstack/react-table | 9.3.1 | MIT |
| AG Grid Community | ag-grid-community | 36.3.0 | MIT |
| shadcn/ui | github.com/shadcn-ui/ui, `apps/v4/public/r/index.json` | commit dd41d19e2f80ff6891951f7ced74c2c9a650b065 | MIT |

Read with TypeScript 5.9.3 against react 19.3.1 and @types/react 19.3.0.

### Versions that are not latest

- **PrimeReact**: npm `latest` is 11.2.2, whose `package.json` says `SEE LICENSE IN LICENSE.md`; that file is the
  commercial "PrimeUI License" (free tier by revenue and head count, licence key required). It was not read. The
  file records 10.9.9 (dist-tag `v10-stable`), the last MIT release. PrimeReact 11 is a rewrite, so this file
  describes the previous generation.
- **@ant-design/pro-components** 2.8.10 is `latest` but its peer range is `antd ^4.24.15 || ^5.11.2`, so it was
  read beside antd 5.29.3, not antd 6.
- **Base UI**: the current package is `@base-ui/react` (1.9.0). `@base-ui-components/react` stopped at 1.0.0-rc.0.

## Schema changes (`library-api.schema.json`, all additive and optional)

- `data.library.entryPoints`: module specifiers read.
- `components[].kind`: `component` (default, omitted) · `namespace` (groups parts, takes no props) · `interface`
  (an options object: `GridOptions`, `ColDef`, `TableOptions_All`) · `registry-item` (shadcn).
- `components[].aliases`, `propsType`, `typeParameters`, `excluded: { dom, style }`, `registryDependencies`,
  `dependencies`.
- `props[].declaredIn`.
- `data.stats`: `medianProps`, `families`, `namespaces`, `interfaces`, `aliases`, `excludedDomProps`,
  `excludedStyleProps`, `componentsAcceptingDomDir`, `parts`.
- `data.styleProps[]`: the style-prop interfaces removed from every component, listed once with their member names.

## What is counted and what is left out

- **A component** is an exported PascalCase value whose type has a call signature of at most two parameters
  returning a React element, node or `null` (function, `forwardRef`, `memo`), or a construct signature whose
  instance has `render` and `props`. React contexts are skipped.
- **Compound members** are found two ways: members of a namespace export (`export * as Dialog`) and PascalCase
  static properties of a component (`Select.Option`), to depth three.
- **Aliases.** Many libraries export one component twice (`DialogRoot` and `Dialog.Root`; Radix `Dialog.Dialog`,
  `Dialog.Root`, `Dialog.DialogTrigger`, `Dialog.Trigger`). Two names are folded only when they are related by
  name and resolve to the same symbol, type or props type. The dotted name is kept; the others go in `aliases`.
  Without this Chakra would count 1,520 components instead of 815.
- **DOM props are excluded and counted**: any prop all of whose declarations are in `@types/react`,
  `@types/react-dom`, `csstype` or the TypeScript DOM lib. That is 766,765 prop occurrences across the 18 files.
  For React Aria Components and HeroUI the interfaces `GlobalDOMEvents` and `GlobalDOMAttributes` of
  `@react-types/shared` are treated the same way, because they restate the DOM attributes.
- **Style-prop systems are excluded, counted and listed once** in `data.styleProps`: Chakra `SystemProperties`
  (706 names) and `Conditions` (130) on 628 components; Mantine `MantineStyleProps` (54) on 236 components.
  Left in, Chakra alone would be 532,529 props and a 145 MB file.
- **Required** means required in every call signature and every branch of a union props type.

## Spot checks

Extracted props were compared with an independent source for 37 components.

| Library | Compared with | Components | Result |
|---|---|---|---|
| @mui/material | docs API JSON, tag v9.5.0 | Button, Select, Dialog | every documented prop present (18/18, 24/24, 17/17) |
| @mui/x-data-grid | docs API JSON, tag v9.17.0 | DataGrid, GridToolbarQuickFilter, GridFilterPanel | 130/130, 4/4, 7/7 |
| @mui/x-date-pickers | docs API JSON, tag v9.17.0 | DatePicker, DateCalendar, LocalizationProvider | exact match: 56/56, 39/39, 6/6 |
| antd | `index.en-US.md` API tables, tag 6.7.0 | Button, Select, Table, Modal, DatePicker | Select 51/51, Table 31/31, Modal 31/31, DatePicker 53/54, Button 17/20 |
| @chakra-ui/react | `apps/www/public/r/types`, tag 3.38.0 | Button, Dialog.Root, Select.Root | Select 43/43, Dialog 36/38, Button 8/9 |
| radix-ui | website prop tables | Dialog.Root, Dialog.Content, Select.Root, Select.Content, Select.Item, Tabs.Root, Tabs.Trigger | all present except `disabled` on Tabs.Trigger |
| @base-ui/react | source interfaces, tag v1.9.0 | Dialog.Root, Select.Root, Button | exact: 11/11, 24/24, 1/1 own |
| react-aria-components | source interfaces, 1.22.1 | Button, Select, DatePicker | own members all present |
| @mantine/core | source interfaces, tag 9.8.0 | Button, Table, Select, Modal | own members all present (14, 16, 22, 8) |
| @mantine/dates | source interfaces, tag 9.8.0 | Calendar, DateInput, DatePickerInput | own members all present (28, 17, 1) |
| @headlessui/react | source types | Dialog, Listbox, Menu.Items | own members all present |

What the differences were:

- **Misses, all one cause.** antd Button `onClick` and `target`, Radix Tabs.Trigger `disabled`: props a library
  documents but types by inheriting the DOM attribute. They are excluded as DOM props. antd Button `loadingIcon`
  is documented as global configuration only and is not a Button prop in the types. antd DatePicker
  `showTime.defaultOpenValue` is a nested key. Chakra documents `as`/`asChild` on Dialog.Root, which the types do
  not accept, and `colorPalette`, which is a member of the excluded `SystemProperties`.
- **Over-count relative to documentation, by design.** Documentation pages list a component's own props and say
  "also accepts the props of X"; types resolve the chain. MUI Button is 18 documented and 32 extracted (ButtonBase
  props); antd Select is 51 and 94 (rc-select props, deprecated names such as `dropdownClassName`, `prefixCls`,
  `direction`). `inheritedFrom` and `declaredIn` say where each came from.
- **Fixed during checking:** contexts counted as components; a component and its own `.Root` both counted; HeroUI
  flat and dotted names not recognised as one component because its declarations repeat the function type inline;
  class components reporting `Readonly` as their props type; `@default` tags that hold a sentence (54 dropped and
  counted in `provenance.notes`).

## Known blind spots

- **Props that reuse a DOM attribute name** (`disabled`, `value`, `name`, `type`, `href`, `onClick`, `children`,
  `className`, `style`, `dir`, `lang`) are missing wherever the library does not redeclare them. `excluded.dom`
  tells how many were dropped, not which. This understates small components most: the median of 1 for Ark UI and 2
  for Radix means "one own prop (`asChild`) plus a DOM element".
- **Polymorphic components.** With `as`/`component`/`render` the element's props are a deferred generic. The prop
  itself is recorded; what it brings is not. Mantine Button reports 0 DOM props excluded for this reason, and every
  Headless UI component reports no DOM `dir`.
- **Generic components** keep their type parameters as text (`Value`, `T`); a prop typed `Value` is not
  expanded per mode. Discriminated unions are merged, so "`multiple` changes the type of `value`" is lost.
- **Slot props** (`slots`, `slotProps`, `classNames`, `styles`, `pt`) are recorded as one prop each with the type
  cut at 200 characters. Slot names are not enumerated.
- **Not components, so not here:** hooks (`useForm`, `useDisclosure`), imperative APIs (`message`, `notification`,
  `Modal.confirm`, toasters), theme and token objects, CSS variables, and `data-*` state attributes.
- **Defaults** exist only where the library writes `@default`: antd has 31 across 3,961 props, Headless UI none.
  Some upstream tags are wrong (PrimeReact DataTable `dataKey` carries the paginator template string); they are
  copied as written.
- **Zero-prop records** are real exports whose only props are DOM or deferred (Fluent `*Provider`, styled roots).
- **Entry points.** Only the package root (for PrimeReact 10, every sub-package) was read. `@base-ui/react/internals/*`,
  date adapters and locale packs are not included. `primereact/focustrap` declares a types file that is missing.
- **TanStack Table 9** types its options over a generic feature map; the file records `TableOptions_All` and
  `ColumnDefBase_All`, the union of all stock features, with the feature interface in `inheritedFrom`. AG Grid is
  `GridOptions`, `ColDef`, `ColGroupDef`; enterprise-only options are in the same interfaces and not marked.
- **shadcn/ui** has three variants (Base UI, React Aria, Radix) behind one index; exported names were read from
  the `new-york-v4` files, falling back to `bases/radix`. `form` and `toast` have no file in either.
- **`category`** is not filled for typed libraries: no package states one.

## Findings for an Arabic-first design

1. **No library has a `numberingSystem` or numerals prop.** Not one of 49,497. Numerals are reachable only through
   a locale string with a `-u-nu-` extension (React Aria, Ark, Base UI pass `locale` to `Intl`) or not at all.
   Hayzo's "numerals are a separate dimension" has no precedent to copy and no competitor to match.
2. **Direction is exposed four different ways.** A provider only (Base UI `DirectionProvider`, Mantine
   `DirectionProvider`, Fluent `FluentProvider dir`, antd `ConfigProvider direction`); a provider plus a `dir`
   prop on each root that needs arrow-key logic (Radix: `Direction.Provider` and 14 roots); a `direction` prop
   typed `"ltr" | "rtl"` on 25 antd components besides `ConfigProvider`, most of it inherited from rc-* internals; a boolean (`rtl` on antd Carousel and PrimeReact Dialog, `enableRtl` in AG
   Grid). React Aria and HeroUI have no direction prop at all and derive it from the locale.
3. **The name `direction` is overloaded.** Of the `direction` props found, most mean flex axis, sort order, slide
   or swipe side. `dir` always means text direction. Hayzo should use `dir` and never `direction` for it.
4. **Physical sides are still in APIs**: MUI `direction: "left" | "right"`, PrimeReact `iconPos`, Radix
   `swipeDirection` with left/right. React Aria and HeroUI use `start`/`end`.
5. **Calendar system is selectable in only three families**: React Aria and HeroUI (`createCalendar`), Ark and
   Chakra (`createCalendar` on DatePicker and DateInput), antd (`ConfigProvider calendar`). MUI pickers switch
   calendars by swapping the date adapter (`AdapterMomentHijri`, `AdapterDateFnsJalali`), Mantine by a separate
   package. Nobody takes a calendar identifier as a plain prop.
6. **Week start** is a number (Ark `startOfWeek`), a weekday name (React Aria `firstDayOfWeek`), or a `DayOfWeek`
   with a separate `weekendDays` (Mantine, the only library with a weekend prop).
7. **Locale means two things.** In antd, MUI X, AG Grid and PrimeReact `locale`/`localeText` is a bag of
   translated strings; in React Aria, Ark, Chakra, Base UI and Mantine dates it is a BCP 47 tag. The first group
   cannot format a number for `ar-EG` without the developer doing it.
8. **Number formatting** is `Intl.NumberFormatOptions` in the headless libraries and hand-set separators
   (`decimalSeparator`, `thousandSeparator`, `groupSeparator`) in antd and Mantine.
9. Most components accept the native `dir` attribute through DOM pass-through (see the `DOM dir` column), which
   sets layout direction but does not reach keyboard logic or portalled content.

## Gaps and open questions

- Props inherited from the DOM are counted, not named. A second pass could record, per component, which DOM
  attribute names the library's documentation treats as API.
- Behavioural RTL support cannot be read from types. This layer says where a `dir` prop exists, not whether arrow
  keys flip. That belongs to field reports and patterns.
- PrimeReact 11, pro-components against antd 6, and the Pro/Premium/Enterprise tiers of MUI X and AG Grid are not
  covered.
- Slot and part names for styling (Mantine `classNames` keys, MUI `slots`, Ark anatomy) are a separate dataset
  worth extracting; they define the parts our recipes must cover.

## Requests to other layers

- **catalog/universe**: component ids can be matched to `components[].name` here; `aliases` lists the flat names.
  The generated list below is the evidence for the Arabic requirements of pickers, number fields and providers.
- **field-reports**: the 25 antd components with a per-component `direction` prop and the 14 Radix roots with `dir` are
  where RTL keyboard defects are most likely to be filed upstream.
- **docs/SOURCES.md** will gain 19 sources on the next `node tools/validate.mjs --sources`.

## What L1 and L2 should build from this

- L1 locale: one object with direction, numbering system, calendar, week start, weekend and hour cycle as separate
  fields; the tables below show each is exposed somewhere but never together.
- L2 engines: the largest records per library (Select/Combobox, DatePicker, DataGrid/Table) are the feature
  checklists for `combobox`, `calendar-grid`, `date-range`, `table-model`. `inheritedFrom` shows how others factor
  shared behaviour (overlay, positioning, validation, presence), which maps to our engine list.
- Migration guides: `propsType`, `deprecated` and `aliases` are enough to generate a prop-mapping table per library.

## Measured tables

<!-- BEGIN GENERATED: tools/extract/catalog/summarize.mjs -->

### Counts per library

`components` counts every record that takes props (compound members such as `Dialog.Root` count individually; pure namespaces do not). `families` is the number of distinct top-level names. `DOM dir` is the number of components that accept the native `dir` attribute through the excluded DOM typings.

| Library | Package | Version | License | Families | Components | Props | Median props | Aliases folded | DOM props excluded | Style props excluded | DOM dir |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ag-grid-community | ag-grid-community | 36.3.0 | MIT | 0 | 3 | 669 | 159 | 0 | 0 | 0 | 0 |
| ant-design-pro-components | @ant-design/pro-components | 2.8.10 | MIT | 115 | 151 | 5197 | 22 | 1 | 4389 | 0 | 13 |
| antd | antd | 6.7.0 | MIT | 71 | 154 | 3961 | 17.5 | 0 | 14949 | 0 | 47 |
| ark-ui-react | @ark-ui/react | 5.40.0 | MIT | 69 | 587 | 1949 | 1 | 568 | 142044 | 0 | 489 |
| base-ui-react | @base-ui/react | 1.9.0 | MIT | 40 | 275 | 1596 | 4 | 223 | 69245 | 0 | 250 |
| chakra-ui-react | @chakra-ui/react | 3.38.0 | MIT | 159 | 815 | 7606 | 9 | 705 | 181646 | 524923 | 629 |
| fluentui-react-components | @fluentui/react-components | 9.75.2 | MIT | 256 | 256 | 1761 | 6.5 | 0 | 55843 | 0 | 197 |
| headlessui-react | @headlessui/react | 2.2.10 | MIT | 26 | 65 | 533 | 7 | 38 | 15030 | 0 | 0 |
| heroui-react | @heroui/react | 3.2.7 | Apache-2.0 | 117 | 376 | 4558 | 5 | 390 | 64767 | 0 | 218 |
| mantine-core | @mantine/core | 9.8.0 | MIT | 150 | 297 | 7146 | 20 | 144 | 62463 | 12744 | 212 |
| mantine-dates | @mantine/dates | 9.8.0 | MIT | 40 | 40 | 2682 | 54 | 0 | 10388 | 1998 | 37 |
| mui-material | @mui/material | 9.5.0 | MIT | 149 | 149 | 2333 | 12 | 0 | 38203 | 0 | 136 |
| mui-x-data-grid | @mui/x-data-grid | 9.17.0 | MIT | 120 | 120 | 1037 | 5 | 0 | 15515 | 0 | 29 |
| mui-x-date-pickers | @mui/x-date-pickers | 9.17.0 | MIT | 54 | 54 | 1442 | 25 | 0 | 9921 | 0 | 22 |
| primereact | primereact | 10.9.9 | MIT | 108 | 108 | 3894 | 31 | 0 | 23675 | 0 | 83 |
| radix-ui | radix-ui | 1.8.1 | MIT | 35 | 186 | 706 | 2 | 184 | 45705 | 0 | 131 |
| react-aria-components | react-aria-components | 1.22.1 | Apache-2.0 | 156 | 157 | 2313 | 9 | 0 | 12982 | 0 | 131 |
| shadcn-ui | shadcn | dd41d19e2f80 | MIT | 65 | 65 | 0 | 0 | 0 | 0 | 0 | 0 |
| tanstack-react-table | @tanstack/react-table | 9.3.1 | MIT | 2 | 4 | 114 | 16 | 0 | 0 | 0 | 0 |
| **total** | | | | | **3862** | **49497** | | | | | |

### Ten largest components per library

- **ag-grid-community** — GridOptions 481 · ColDef 159 · ColGroupDef 29
- **ant-design-pro-components** — BaseProList 113 · ProList 113 · ProLayout 110 · CellEditorTable 108 · EditableProTable 108 · RowEditorTable 108 · BetaSchemaForm 107 · DragSortTable 102 · ProTable 99 · ProFormField 96
- **antd** — TreeSelect 107 · ConfigProvider 97 · Select 94 · AutoComplete 92 · DatePicker 92 · TimePicker 92 · Cascader 91 · DatePicker.MonthPicker 91 · DatePicker.QuarterPicker 91 · DatePicker.RangePicker 91
- **ark-ui-react** — Combobox.Root 53 · DatePicker.Root 52 · Drawer.Root 41 · FloatingPanel.Root 41 · Select.Root 40 · JsonTreeView.Root 36 · ColorPicker.Root 34 · Menu.Root 34 · DateInput.Root 33 · Dialog.Root 33
- **base-ui-react** — Combobox.Root 38 · Autocomplete.Root 34 · NumberField.Root 24 · Select.Root 24 · OTPField.Root 21 · Slider.Root 21 · Checkbox.Root 18 · Drawer.Root 17 · Menu.Root 16 · Select.Positioner 16
- **chakra-ui-react** — Combobox.Root 64 · DatePicker.Root 64 · Select.Root 51 · ColorPicker.Root 45 · DateInput.Root 44 · TagsInput.Root 44 · FloatingPanel.Root 43 · TreeView.Root 43 · NumberInput.Root 41 · Command.Dialog 39
- **fluentui-react-components** — NavDrawer 28 · Combobox 27 · AvatarGroupPopover 26 · Dropdown 26 · DataGrid 24 · Popover 20 · TeachingPopover 20 · Menu 18 · SpinButton 18 · Drawer 17
- **headlessui-react** — Transition 21 · Transition.Child 20 · Combobox 19 · Listbox 16 · Checkbox 15 · Dialog 14 · Switch 14 · Combobox.Options 12 · Popover.Panel 12 · RadioGroup 12
- **heroui-react** — SearchField 55 · TextField 53 · Button 49 · Toast.ActionButton 49 · ComboBox 46 · NumberField 46 · Calendar.YearPickerCell 45 · CloseButton 45 · Pagination.Link 45 · RangeCalendar.YearPickerCell 45
- **mantine-core** — TreeSelect 95 · Cascader 94 · MultiSelect 94 · TagsInput 93 · Select 88 · NumberInput 83 · Autocomplete 78 · PhoneInput 77 · Mentions 74 · ColorInput 71
- **mantine-dates** — MaskedDateInput 176 · DatePickerInput 145 · DateTimePicker 143 · WeekPickerInput 143 · DateInput 140 · QuarterPickerInput 118 · MonthPickerInput 114 · YearPickerInput 105 · InlineDateTimePicker 104 · TimePicker 99
- **mui-material** — Autocomplete 67 · Select 61 · NativeSelect 48 · FilledInput 45 · Input 44 · OutlinedInput 44 · InputBase 42 · TextField 38 · Checkbox 37 · Switch 36
- **mui-x-data-grid** — DataGrid 133 · GridActionsCellItem 29 · GridCell 29 · GridColumnHeaderSortIcon 25 · QuickFilterControl 24 · GridRow 23 · GridColumnHeaderItem 20 · GridRowCheckbox 20 · QuickFilterClear 20 · ToolbarButton 20
- **mui-x-date-pickers** — DateTimePicker 68 · DesktopDateTimePicker 67 · MobileDateTimePicker 67 · DateTimeField 66 · TimeField 59 · DateField 58 · DatePicker 56 · StaticDateTimePicker 56 · DesktopDatePicker 55 · MobileDatePicker 55
- **primereact** — DataTable 166 · TreeTable 110 · Calendar 99 · MultiSelect 99 · Dropdown 94 · AutoComplete 88 · Column 82 · TreeSelect 76 · InputNumber 69 · ConfirmDialog 67
- **radix-ui** — Popover.Content 20 · ContextMenu.Content 19 · DropdownMenu.Content 19 · Menubar.Content 19 · unstable_OneTimePasswordField.Root 18 · ContextMenu.SubContent 17 · DropdownMenu.SubContent 17 · HoverCard.Content 17 · Menubar.SubContent 17 · Select.Content 17
- **react-aria-components** — SearchField 53 · TextField 51 · Button 44 · ComboBox 44 · NumberField 44 · DateRangePicker 43 · Checkbox 42 · DatePicker 42 · ColorField 41 · CheckboxField 39
- **tanstack-react-table** — TableOptions_All 79 · ColumnDefBase_All 29 · FlexRender 3 · Subscribe 3

### Shape of the recorded API

Counted over records that take props. `generic`: has type parameters. `polymorphic`: has an `as`, `component`, `asChild`, `render` or `renderRoot` prop. `slots`: has `slots`, `slotProps`, `classNames`, `styles`, `components`, `componentsProps` or `pt`. `no props`: nothing left after the exclusions. `type cut`: prop types longer than the 200-character limit.

| Library | Records | Generic | Polymorphic | Slots | No props | With @default | Deprecated props | Type cut |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ag-grid-community | 3 | 3 | 0 | 1 | 0 | 246 | 43 | 0 |
| ant-design-pro-components | 151 | 25 | 23 | 10 | 6 | 137 | 183 | 111 |
| antd | 154 | 32 | 12 | 95 | 5 | 31 | 334 | 219 |
| ark-ui-react | 587 | 13 | 496 | 0 | 1 | 354 | 0 | 2 |
| base-ui-react | 275 | 25 | 250 | 0 | 0 | 412 | 4 | 9 |
| chakra-ui-react | 815 | 18 | 646 | 1 | 75 | 565 | 0 | 0 |
| fluentui-react-components | 256 | 3 | 198 | 0 | 36 | 554 | 14 | 48 |
| headlessui-react | 65 | 65 | 65 | 0 | 0 | 0 | 3 | 1 |
| heroui-react | 376 | 138 | 318 | 0 | 26 | 493 | 26 | 21 |
| mantine-core | 297 | 45 | 225 | 229 | 2 | 1280 | 0 | 129 |
| mantine-dates | 40 | 12 | 25 | 37 | 0 | 566 | 0 | 44 |
| mui-material | 149 | 73 | 96 | 51 | 4 | 867 | 0 | 60 |
| mui-x-data-grid | 120 | 2 | 15 | 22 | 3 | 97 | 0 | 20 |
| mui-x-date-pickers | 54 | 12 | 21 | 30 | 0 | 520 | 12 | 4 |
| primereact | 108 | 4 | 0 | 103 | 0 | 1866 | 9 | 3 |
| radix-ui | 186 | 0 | 155 | 0 | 1 | 39 | 0 | 0 |
| react-aria-components | 157 | 46 | 129 | 0 | 0 | 276 | 15 | 14 |
| tanstack-react-table | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |

### Props that concern direction, locale, numerals, calendar

Matched on the prop name only, over every recorded prop. A name can match without meaning text direction (`direction` is often a flex or sort direction): the type column shows which. `rtl` in the last column marks types that mention `rtl`.

#### Direction

| Library | Prop | Type | rtl | n | Components |
|---|---|---|---|---:|---|
| ag-grid-community | `enableRtl` | `boolean` |  | 1 | GridOptions |
| ag-grid-community | `fillHandleDirection` | `"x" \| "y" \| "xy"` |  | 1 | GridOptions |
| ant-design-pro-components | `direction` | `"ltr" \| "rtl"` | rtl | 3 | ProHelpSelect, ProLayout, TopNavHeader |
| ant-design-pro-components | `direction` | `"row" \| "column"` |  | 4 | ProCard, ProCard.Group, StatisticCard, StatisticCard.Group |
| ant-design-pro-components | `direction` | `"vertical" \| "horizontal"` |  | 1 | Group |
| ant-design-pro-components | `direction` | `Direction = "ltr" \| "rtl"` | rtl | 7 | BaseProList, CellEditorTable, DragSortTable, EditableProTable, ProList, ProTable, RowEditorTable |
| ant-design-pro-components | `sortDirections` | `SortOrder[]` |  | 7 | BaseProList, CellEditorTable, DragSortTable, EditableProTable, ProList, ProTable, RowEditorTable |
| antd | `direction` | `"ltr" \| "rtl"` | rtl | 17 | AutoComplete, Cascader, Cascader.Panel, DatePicker, DatePicker.MonthPicker, DatePicker.QuarterPicker, DatePicker.RangePicker, DatePicker.TimePicker, DatePicker.WeekPicker, DatePicker.YearPicker, Menu, Segmented, Select, Tabs, TimePicker, TimePicker.RangePicker, TreeSelect |
| antd | `direction` | `"vertical" \| "horizontal"` |  | 1 | Steps |
| antd | `direction` | `AnchorDirection = "vertical" \| "horizontal"` |  | 1 | Anchor |
| antd | `direction` | `Direction = "ltr" \| "rtl"` | rtl | 2 | Mentions, Table |
| antd | `direction` | `DirectionType = "ltr" \| "rtl"` | rtl | 7 | ConfigProvider, Transfer.Operation, Typography, Typography.Link, Typography.Paragraph, Typography.Text, Typography.Title |
| antd | `direction` | `Orientation = "vertical" \| "horizontal"` |  | 2 | Space, Space.Compact |
| antd | `direction` | `TransferDirection = "left" \| "right"` |  | 1 | Transfer.List |
| antd | `rtl` | `boolean` |  | 1 | Carousel |
| antd | `sortDirections` | `SortOrder[]` |  | 3 | Table, Table.Column, Table.ColumnGroup |
| ark-ui-react | `dir` | `"ltr" \| "rtl"` | rtl | 3 | DateInput.Root, FloatingPanel.Root, Toaster |
| ark-ui-react | `swipeDirection` | `SwipeDirection = "start" \| "end" \| "up" \| "down"` |  | 1 | Drawer.Root |
| base-ui-react | `direction` | `"horizontal" \| "vertical"` |  | 1 | NumberField.ScrubArea |
| base-ui-react | `direction` | `TextDirection = "ltr" \| "rtl"` | rtl | 1 | DirectionProvider |
| base-ui-react | `swipeDirection` | `"left" \| "right" \| "up" \| "down" \| ("left" \| "right" \| "up" \| "down")[]` |  | 1 | Toast.Root |
| base-ui-react | `swipeDirection` | `SwipeDirection = "left" \| "right" \| "up" \| "down"` |  | 2 | Drawer.Root, Drawer.SwipeArea |
| chakra-ui-react | `dir` | `"ltr" \| "rtl"` | rtl | 3 | DateInput.Root, FloatingPanel.Root, Toaster |
| chakra-ui-react | `direction` | `ConditionalValue<AnyString \| FlexDirection \| readonly NonNullable<FlexDirection \| undefin…` |  | 2 | Flex, Wrap |
| chakra-ui-react | `direction` | `StackDirection` |  | 4 | ColorPicker.Sliders, HStack, Stack, VStack |
| fluentui-react-components | `dir` | `"ltr" \| "rtl"` | rtl | 1 | FluentProvider |
| fluentui-react-components | `overflowDirection` | `OverflowDirection = "start" \| "end"` |  | 1 | Overflow |
| fluentui-react-components | `sortDirection` | `SortDirection = "ascending" \| "descending"` |  | 2 | DataGridHeaderCell, TableHeaderCell |
| heroui-react | `direction` | `"end" \| "start"` |  | 2 | Table.LoadMore, TableLoadMoreItem |
| heroui-react | `sortDirection` | `TableSortDirection = "ascending" \| "descending"` |  | 1 | Table.SortableColumnHeader |
| heroui-react | `swipeDirection` | `"end" \| "start" \| "top" \| "bottom" \| "left" \| "right" \| "horizontal" \| "vertical"` |  | 1 | Sheet.Backdrop |
| mantine-core | `detectDirection` | `boolean` |  | 1 | DirectionProvider |
| mantine-core | `direction` | `StyleProp<FlexDirection \| undefined>` |  | 1 | Flex |
| mantine-core | `fillDirection` | `"right-to-left" \| "left-to-right"` |  | 1 | SemiCircleProgress |
| mantine-core | `initialDirection` | `Direction = "ltr" \| "rtl"` | rtl | 1 | DirectionProvider |
| mui-material | `direction` | `"desc" \| "asc"` |  | 1 | TableSortLabel |
| mui-material | `direction` | `"left" \| "right"` |  | 1 | TabScrollButton |
| mui-material | `direction` | `"left" \| "right" \| "up" \| "down"` |  | 2 | Slide, SpeedDial |
| mui-material | `direction` | `ResponsiveStyleValue<"row" \| "row-reverse" \| "column" \| "column-reverse">` |  | 1 | Stack |
| mui-material | `direction` | `ResponsiveStyleValue<GridDirection>` |  | 1 | Grid |
| mui-material | `sortDirection` | `SortDirection = false \| "desc" \| "asc"` |  | 2 | TableCell, TablePagination |
| mui-x-data-grid | `direction` | `GridSortDirection = "asc" \| "desc" \| null \| undefined` |  | 1 | GridColumnHeaderSortIcon |
| mui-x-data-grid | `sortDirection` | `GridSortDirection = "asc" \| "desc" \| null \| undefined` |  | 1 | GridColumnHeaderItem |
| primereact | `direction` | `"left" \| "right" \| "up" \| "down" \| "up-left" \| "up-right" \| "down-left" \| "down-right"` |  | 1 | SpeedDial |
| primereact | `rtl` | `boolean` |  | 2 | ConfirmDialog, Dialog |
| radix-ui | `dir` | `Direction = "ltr" \| "rtl"` | rtl | 15 | Accordion.Root, ContextMenu.Root, Direction.Provider, DropdownMenu.Root, Menubar.Root, NavigationMenu.Root, RadioGroup.Root, ScrollArea.Root, Select.Root, Slider.Root, Tabs.Root, ToggleGroup.Root, Toolbar.Root, Toolbar.ToggleGroup, unstable_OneTimePasswordField.Root |
| radix-ui | `swipeDirection` | `SwipeDirection = "right" \| "left" \| "up" \| "down"` |  | 1 | Toast.Provider |
| react-aria-components | `direction` | `"start" \| "end"` |  | 1 | TableLoadMoreItem |
| react-aria-components | `swipeDirection` | `"start" \| "end" \| "horizontal" \| "vertical" \| "bottom" \| "top" \| "left" \| "right"` |  | 1 | SheetOverlay |
| tanstack-react-table | `columnResizeDirection` | `ColumnResizeDirection = "ltr" \| "rtl"` | rtl | 1 | TableOptions_All |

#### Locale and translation

| Library | Prop | Type | rtl | n | Components |
|---|---|---|---|---:|---|
| ag-grid-community | `getLocaleText` | `GetLocaleText<TData>` |  | 1 | GridOptions |
| ag-grid-community | `localeText` | `LocaleText` |  | 1 | GridOptions |
| ant-design-pro-components | `intl` | `IntlType` |  | 1 | ProConfigProvider |
| ant-design-pro-components | `language` | `"text" \| "json"` |  | 1 | FieldCode |
| ant-design-pro-components | `locale` | `"zh-CN" \| "zh-TW" \| "en-US" \| "it-IT" \| "ko-KR"` |  | 1 | ProLayout |
| ant-design-pro-components | `locale` | `TableLocale` |  | 5 | CellEditorTable, DragSortTable, EditableProTable, ProTable, RowEditorTable |
| ant-design-pro-components | `locale` | `TableLocale & ListLocale` |  | 2 | BaseProList, ProList |
| ant-design-pro-components | `locale` | `string` |  | 2 | FieldMoney, ProFormMoney |
| antd | `locale` | `ListLocale` |  | 1 | List |
| antd | `locale` | `Locale` |  | 1 | ConfigProvider |
| antd | `locale` | `PaginationLocale` |  | 1 | Pagination |
| antd | `locale` | `Partial<TransferLocale>` |  | 1 | Transfer |
| antd | `locale` | `PickerLocale` |  | 10 | Calendar, DatePicker, DatePicker.MonthPicker, DatePicker.QuarterPicker, DatePicker.RangePicker, DatePicker.TimePicker, DatePicker.WeekPicker, DatePicker.YearPicker, TimePicker, TimePicker.RangePicker |
| antd | `locale` | `TableLocale` |  | 1 | Table |
| antd | `locale` | `TabsLocale` |  | 1 | Tabs |
| antd | `locale` | `UploadLocale` |  | 2 | Upload, Upload.Dragger |
| ark-ui-react | `locale` | `string` |  | 6 | DateInput.Root, DatePicker.Root, FileUpload.Root, LocaleProvider, NumberInput.Root, Progress.Root |
| ark-ui-react | `translations` | `IntlTranslations` |  | 25 | Carousel.Root, Clipboard.Root, Combobox.Root, DateInput.Root, DatePicker.Root, Editable.Root, FileUpload.Root, FloatingPanel.Root, ImageCropper.Root, JsonTreeView.Root, Marquee.Root, NavigationMenu.Root, NumberInput.Root, Pagination.Root, PasswordInput.Root, PinInput.Root, Popover.Root, Progress.Root, RatingGroup.Root, Select.Root, SignaturePad.Root, Tabs.Root, TagsInput.Root, Timer.Root, TreeView.Root |
| base-ui-react | `locale` | `LocalesArgument` |  | 7 | Autocomplete.Root, Combobox.Root, Menu.FilterProvider, Meter.Root, NumberField.Root, Progress.Root, Slider.Root |
| chakra-ui-react | `language` | `string` |  | 1 | CodeBlock.Root |
| chakra-ui-react | `locale` | `string` |  | 7 | DateInput.Root, DatePicker.Root, FileUpload.Root, LocaleProvider, NumberInput.Root, Progress.Root, ProgressCircle.Root |
| chakra-ui-react | `translations` | `IntlTranslations` |  | 21 | ActionBar.Root, Carousel.Root, Clipboard.Root, Combobox.Root, DateInput.Root, DatePicker.Root, Editable.Root, FileUpload.Root, FloatingPanel.Root, Marquee.Root, NumberInput.Root, Pagination.Root, PinInput.Root, Popover.Root, Progress.Root, ProgressCircle.Root, RatingGroup.Root, Select.Root, Tabs.Root, TagsInput.Root, TreeView.Root |
| heroui-react | `locale` | `string` |  | 1 | I18nProvider |
| mantine-dates | `__locale` | `string` |  | 1 | CalendarHeader |
| mantine-dates | `locale` | `string` |  | 29 | Calendar, DateInput, DatePicker, DatePickerInput, DateTimePicker, DecadeLevel, DecadeLevelGroup, InlineDateTimePicker, MaskedDateInput, MiniCalendar, Month, MonthLevel, MonthLevelGroup, MonthPicker, MonthPickerInput, MonthsList, QuarterLevel, QuarterLevelGroup, QuarterPicker, QuarterPickerInput, QuartersList, WeekPicker, WeekPickerInput, WeekdaysRow, YearLevel, YearLevelGroup, YearPicker, YearPickerInput, YearsList |
| mui-x-data-grid | `localeText` | `Partial<GridLocaleText>` |  | 1 | DataGrid |
| mui-x-date-pickers | `adapterLocale` | `TLocale` |  | 1 | LocalizationProvider |
| mui-x-date-pickers | `localeText` | `Partial<PickersLocaleText>` |  | 1 | LocalizationProvider |
| mui-x-date-pickers | `localeText` | `PickersInputComponentLocaleText` |  | 12 | DatePicker, DateTimePicker, DesktopDatePicker, DesktopDateTimePicker, DesktopTimePicker, MobileDatePicker, MobileDateTimePicker, MobileTimePicker, StaticDatePicker, StaticDateTimePicker, StaticTimePicker, TimePicker |
| primereact | `filterLocale` | `string` |  | 9 | DataTable, Dropdown, ListBox, MultiSelect, OrderList, PickList, Tree, TreeSelect, TreeTable |
| primereact | `locale` | `string` |  | 2 | Calendar, InputNumber |
| primereact | `localeMatcher` | `string` |  | 1 | InputNumber |
| react-aria-components | `locale` | `string` |  | 1 | I18nProvider |

#### Numerals and number format

| Library | Prop | Type | rtl | n | Components |
|---|---|---|---|---:|---|
| ag-grid-community | `paginationNumberFormatter` | `PaginationNumberFormatter<TData>` |  | 1 | GridOptions |
| ant-design-pro-components | `decimalSeparator` | `string` |  | 2 | Statistic, StatisticCard.Statistic |
| ant-design-pro-components | `groupSeparator` | `string` |  | 2 | Statistic, StatisticCard.Statistic |
| ant-design-pro-components | `numberFormatOptions` | `{ localeMatcher?: string \| undefined; style?: string \| undefined; currency?: string \| und…` |  | 1 | FieldMoney |
| antd | `decimalSeparator` | `string` |  | 4 | InputNumber, Statistic, Statistic.Countdown, Statistic.Timer |
| antd | `groupSeparator` | `string` |  | 3 | Statistic, Statistic.Countdown, Statistic.Timer |
| ark-ui-react | `formatOptions` | `NumberFormatOptions` |  | 2 | NumberInput.Root, Progress.Root |
| chakra-ui-react | `formatOptions` | `NumberFormatOptions` |  | 3 | NumberInput.Root, Progress.Root, ProgressCircle.Root |
| heroui-react | `formatOptions` | `NumberFormatOptions` |  | 5 | Meter, NumberField, ProgressBar, ProgressCircle, Slider |
| mantine-core | `allowedDecimalSeparators` | `string[]` |  | 1 | NumberInput |
| mantine-core | `decimalSeparator` | `string` |  | 3 | NumberFormatter, NumberInput, RollingNumber |
| mantine-core | `thousandSeparator` | `string \| boolean` |  | 3 | NumberFormatter, NumberInput, RollingNumber |
| mantine-core | `thousandsGroupStyle` | `"none" \| "thousand" \| "lakh" \| "wan"` |  | 2 | NumberFormatter, NumberInput |
| mantine-dates | `minHoursDigits` | `number` |  | 1 | TimePicker |
| primereact | `currency` | `string` |  | 1 | InputNumber |
| primereact | `currencyDisplay` | `string` |  | 1 | InputNumber |
| primereact | `maxFractionDigits` | `number` |  | 1 | InputNumber |
| primereact | `minFractionDigits` | `number` |  | 1 | InputNumber |
| react-aria-components | `formatOptions` | `NumberFormatOptions` |  | 4 | Meter, NumberField, ProgressBar, Slider |

#### Calendar, week and clock

| Library | Prop | Type | rtl | n | Components |
|---|---|---|---|---:|---|
| antd | `calendar` | `CalendarConfig` |  | 1 | ConfigProvider |
| antd | `use12Hours` | `boolean` |  | 9 | DatePicker, DatePicker.MonthPicker, DatePicker.QuarterPicker, DatePicker.RangePicker, DatePicker.TimePicker, DatePicker.WeekPicker, DatePicker.YearPicker, TimePicker, TimePicker.RangePicker |
| ark-ui-react | `createCalendar` | `(identifier: CalendarIdentifier) => Calendar` |  | 2 | DateInput.Root, DatePicker.Root |
| ark-ui-react | `hourCycle` | `HourCycle = 12 \| 24` |  | 1 | DateInput.Root |
| ark-ui-react | `startOfWeek` | `number` |  | 1 | DatePicker.Root |
| ark-ui-react | `timeZone` | `string` |  | 2 | DateInput.Root, DatePicker.Root |
| chakra-ui-react | `createCalendar` | `(identifier: CalendarIdentifier) => Calendar` |  | 2 | DateInput.Root, DatePicker.Root |
| chakra-ui-react | `hourCycle` | `HourCycle = 12 \| 24` |  | 1 | DateInput.Root |
| chakra-ui-react | `startOfWeek` | `number` |  | 1 | DatePicker.Root |
| chakra-ui-react | `timeZone` | `string` |  | 2 | DateInput.Root, DatePicker.Root |
| heroui-react | `createCalendar` | `(identifier: CalendarIdentifier) => Calendar` |  | 2 | Calendar, RangeCalendar |
| heroui-react | `firstDayOfWeek` | `"sun" \| "mon" \| "tue" \| "wed" \| "thu" \| "fri" \| "sat"` |  | 4 | Calendar, DatePicker, DateRangePicker, RangeCalendar |
| heroui-react | `hourCycle` | `12 \| 24` |  | 4 | DateField, DatePicker, DateRangePicker, TimeField |
| heroui-react | `weekdayStyle` | `"narrow" \| "short" \| "long"` |  | 2 | Calendar.Grid, RangeCalendar.Grid |
| mantine-dates | `firstDayOfWeek` | `DayOfWeek = 0 \| 2 \| 1 \| 3 \| 4 \| 5 \| 6` |  | 13 | Calendar, DateInput, DatePicker, DatePickerInput, DateTimePicker, InlineDateTimePicker, MaskedDateInput, Month, MonthLevel, MonthLevelGroup, WeekPicker, WeekPickerInput, WeekdaysRow |
| mantine-dates | `weekdayFormat` | `DateLabelFormat` |  | 13 | Calendar, DateInput, DatePicker, DatePickerInput, DateTimePicker, InlineDateTimePicker, MaskedDateInput, Month, MonthLevel, MonthLevelGroup, WeekPicker, WeekPickerInput, WeekdaysRow |
| mantine-dates | `weekend` | `boolean` |  | 1 | Day |
| mantine-dates | `weekendDays` | `DayOfWeek[]` |  | 12 | Calendar, DateInput, DatePicker, DatePickerInput, DateTimePicker, InlineDateTimePicker, MaskedDateInput, Month, MonthLevel, MonthLevelGroup, WeekPicker, WeekPickerInput |
| mui-x-date-pickers | `ampm` | `boolean` |  | 15 | DateTimeField, DateTimePicker, DateTimePickerToolbar, DesktopDateTimePicker, DesktopTimePicker, DigitalClock, MobileDateTimePicker, MobileTimePicker, MultiSectionDigitalClock, StaticDateTimePicker, StaticTimePicker, TimeClock, TimeField, TimePicker, TimePickerToolbar |
| mui-x-date-pickers | `ampmInClock` | `boolean` |  | 11 | DateTimePicker, DateTimePickerToolbar, DesktopDateTimePicker, DesktopTimePicker, MobileDateTimePicker, MobileTimePicker, StaticDateTimePicker, StaticTimePicker, TimeClock, TimePicker, TimePickerToolbar |
| mui-x-date-pickers | `timezone` | `string` |  | 22 | DateCalendar, DateField, DatePicker, DateTimeField, DateTimePicker, DesktopDatePicker, DesktopDateTimePicker, DesktopTimePicker, DigitalClock, MobileDatePicker, MobileDateTimePicker, MobileTimePicker, MonthCalendar, MultiSectionDigitalClock, PickersCalendarHeader, StaticDatePicker, StaticDateTimePicker, StaticTimePicker, TimeClock, TimeField, TimePicker, YearCalendar |
| react-aria-components | `createCalendar` | `(identifier: CalendarIdentifier) => Calendar` |  | 2 | Calendar, RangeCalendar |
| react-aria-components | `firstDayOfWeek` | `"sun" \| "mon" \| "tue" \| "wed" \| "thu" \| "fri" \| "sat"` |  | 4 | Calendar, DatePicker, DateRangePicker, RangeCalendar |
| react-aria-components | `hourCycle` | `12 \| 24` |  | 4 | DateField, DatePicker, DateRangePicker, TimeField |
| react-aria-components | `weekdayStyle` | `"narrow" \| "short" \| "long"` |  | 1 | CalendarGrid |

452 prop occurrences matched in 19 files.

Exact-name presence:

- `numberingSystem`: no library
- `numerals`: no library
- `calendar`: antd
- `dir`: ark-ui-react, chakra-ui-react, fluentui-react-components, radix-ui
- `locale`: ant-design-pro-components, antd, ark-ui-react, base-ui-react, chakra-ui-react, heroui-react, mantine-dates, primereact, react-aria-components
- `direction`: ant-design-pro-components, antd, base-ui-react, chakra-ui-react, heroui-react, mantine-core, mui-material, mui-x-data-grid, primereact, react-aria-components

<!-- END GENERATED -->
