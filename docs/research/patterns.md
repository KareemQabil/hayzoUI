# Behaviour patterns (layer report)

Keyboard, focus and ARIA contract of every interaction pattern, as data for the L2 engines and for generated
keyboard tests in both directions. Files: `data/patterns/<id>.json`. Retrieved 2026-11-11.

## What was collected

- **54 pattern files, 488 key bindings.** 61 bindings are direction-sensitive (55 `mirror-horizontal`, 6 `visual`);
  39 bindings are marked debatable and point at one of 16 recorded RTL decisions.
- **31 files cover the 30 APG pattern pages** (the "Menu and Menubar" page is split into `menu` and `menubar`).
  In these, every binding was checked by reading the page at the recorded commit; `data.verification.keyboard`
  is `verified`. A build-time check confirms that every key a page names in `<kbd>` is bound or listed in
  `apg.keysNotBound` with a reason.
- **23 files go beyond APG**: popover, toast, drawer, calendar-grid, date-field, date-picker, date-range-picker,
  time-field, segmented-control, select, autocomplete, tag-input, rating, color-picker, context-menu,
  navigation-menu, command-palette, pagination, stepper, file-upload, data-grid-editing, drag-reorder,
  virtual-list. Each binding carries an `origin` (apg, react-aria, base-ui, radix, material, mui-x, ant-design,
  convention, hayzo). These are `needs-review`: partly read from library source, partly convention.
- Per pattern: roles and attributes with `on`/`values`/`required`, the WAI-ARIA 1.2 requirements of every role
  used (derived mechanically), focus strategy with entry, exit, restore and tab stops, variants, orientation,
  the patterns it composes (`uses`), component ids reconciled with `data/catalog/universe`, and the RTL decisions with library evidence.

**Envelope confidence is `needs-review` for all 54 files.** `docs/DATA_MODEL.md` caps a file at needs-review when
its Arabic text is not from an authoritative Arabic source, and the Arabic pattern names are our own
translations. What was actually checked is in `data.verification` (`keyboard`, `arabicName`, `rtl`), so a
consumer can select the 31 keyboard-verified files. If the project decides names should not cap the file, it is
a one-line change in `tools/extract/patterns/build.mjs`.

## Sources

| Source | Version read | License | Used for |
|---|---|---|---|
| WAI-ARIA Authoring Practices Guide, github.com/w3c/aria-practices | commit `0f765e4dc33e` (2026-09-29) | W3C Software and Document License (SPDX W3C-20150513; the repository's LICENSE.md names the license without a year) | Pattern pages, two example pages (date picker dialog, select-only combobox) |
| WAI-ARIA 1.2, w3.org/TR/wai-aria-1.2 | Recommendation 2023-06-06 | W3C Software and Document License | Required states, owned elements and context roles |
| React Aria, github.com/adobe/react-spectrum | react-aria 3.53.1, commit `d354aa2a642f` | Apache-2.0 | RTL behaviour, calendar, date segments, colour area, drag and drop, tags |
| Base UI, github.com/mui/base-ui | 1.9.0, commit `5aacdbb78524` | MIT | RTL behaviour, composite and text inputs, toast hotkey |
| Radix Primitives, github.com/radix-ui/primitives | commit `eb3a2b709129` | MIT | RTL behaviour, menu, slider, roving focus, navigation menu, toast, select |
| Material UI, github.com/mui/material-ui | 10.0.0-alpha.0, commit `0c82795c732a` | MIT | Slider, tabs, toggle group, autocomplete tags, rating |
| MUI X, github.com/mui/mui-x | 9.17.0, commit `bb99a92f284a` | MIT | Tree view, day calendar, field sections, data grid navigation and editing |
| Ant Design, github.com/ant-design/ant-design and @rc-component packages from npm | antd 6.7.0, commit `0572a24a2ada`; slider 1.2.1, tabs 2.0.0, menu 1.6.2, tree 1.5.3, picker 1.17.0, rate 1.0.1, segmented 1.4.0, switch 1.0.3 | MIT | RTL behaviour |

Only facts (key names, role names, which key does what) are kept; actions are re-expressed, no guide or
documentation text is copied. Clones were read as files; nothing was executed. "Material" in the brief was read
as Material UI (plus MUI X); Material Design's own specification and Angular Material were not consulted.

## Scripts (`tools/extract/patterns/`)

| Script | Does |
|---|---|
| `apg-skeleton.mjs <clone>` | Parses the 30 pattern pages: title, referenced roles/states/properties, every `<kbd>` item with heading context, optional flag and a SHA-1 of its text. Writes `apg-skeleton.json` (278 key items, 39 distinct combinations). |
| `aria-roles.mjs <saved spec html>` | Extracts role requirements from WAI-ARIA 1.2. Writes `aria-roles.json` (94 roles). |
| `build.mjs [--check]` | Turns the researched definitions in `src/*.mjs` into `data/patterns/*.json` and enforces the invariants below. |
| `report.mjs [--json]` | The summary reproduced at the end of this file. |

Invariants enforced by `build.mjs`: `directionSensitive` is true exactly when `rtl` is not `none`; every binding
on ArrowLeft or ArrowRight names the `rtlDecisions` entry that justifies its `rtl` value, and agrees with it; a
debatable binding has a decision; every role is a WAI-ARIA 1.2 role; APG key completeness; `uses` resolves.

## Conventions a consumer needs

- **Key names** are `KeyboardEvent.key` values, except `Space` for the space bar and `Printable` for any
  character-producing key. Modifiers join with `+`: `Control`, `Shift`, `Alt`, `Meta`.
- **Actions are written for LTR.** `rtl: mirror-horizontal` means: in RTL the ArrowLeft binding performs the
  ArrowRight action and the reverse (also for `Shift+ArrowLeft` and the like). `rtl: visual` means the key keeps
  its physical direction and the logical target or value change is resolved from layout (date and time segments,
  splitter). `rtl: none` means identical in both directions.
- **Test generation:** for each binding emit the LTR case from `keys` and `action`; for RTL, swap
  `ArrowLeft`/`ArrowRight` inside `keys` when `rtl` is `mirror-horizontal`, keep everything else. `visual`
  bindings need a geometry assertion (see the notes of `date-field` and `window-splitter`).
- `group` separates variants inside one file (for example combobox `input`, `listbox popup`, `grid popup`,
  `tree popup`, `dialog popup`); bindings without a group apply to the whole pattern. `when` is a condition.
- Composition is by `uses`: `alert-dialog` has no bindings of its own and applies `dialog-modal`; `date-picker`
  binds only the glue between `date-field`, `calendar-grid` and `dialog-modal`.

## Schema changes (additive, `pattern.schema.json`)

- `keyboard[].rtl`: new value `visual`. New optional `group`, `origin`, `debatable`, `decision`.
- `focus.tabStops`.
- `data.uses`, `data.orientation`, `data.apg` (`pages`, `keysNotBound`), `data.ariaRequired`,
  `data.rtlDecisions` (question, what APG says, per-library behaviour with version, evidence file and whether
  the source was read, recommendation, reason, status), `data.verification`.

## The RTL decisions

APG is silent on right-to-left: no pattern page mentions it, and keys are named physically. The only trace is an
aside in the tabs page ("the right-most tab in a left-to-right horizontal tab list"). Everything below is
therefore from library source plus our judgement. Status: consensus = every library that implements it agrees;
divergent = libraries disagree; open = no library evidence, our call.

| Decision | Recommendation | Status | What the libraries do |
|---|---|---|---|
| `roving-horizontal` (tabs, toolbar, menubar, radio group) | mirror | consensus | React Aria, Base UI, Radix, Material UI, Ant Design (tabs, menu) all swap the horizontal arrows |
| `segmented-arrows` | mirror | divergent | Material UI, Radix, React Aria swap; Ant Design's segmented control does not |
| `submenu-open-close` | mirror | consensus | React Aria, Radix, Base UI, Ant Design: ArrowLeft opens, ArrowRight closes |
| `tree-expand-collapse` | mirror | divergent | React Aria and MUI X swap; Ant Design's tree does not |
| `grid-cell-navigation` | mirror | consensus | React Aria, Base UI, MUI X move visually |
| `slider-arrows` | mirror (ArrowLeft increases) | consensus | All five reverse the horizontal axis; Ant Design by turning `reverse` on |
| `slider-page-home-end` | none | consensus | All five keep PageUp = more, Home = minimum |
| `calendar-day-arrows` | mirror (ArrowLeft = next day) | consensus | React Aria and MUI X swap; no arrow day navigation found in @rc-component/picker; Base UI and Radix have no calendar |
| `date-segments` | visual | divergent | React Aria uses bounding rectangles in RTL; MUI X precomputed visual neighbours; Ant Design moves by index with no direction test |
| `text-caret` (text input inside a composite) | none: never remap caret keys | consensus | Base UI and Material UI return to native behaviour unless the caret is at an edge |
| `input-edge-handoff` (leaving an input for the tags before it) | mirror, with a guard | divergent | Base UI uses container direction on the logical caret index; Material UI always ArrowLeft |
| `splitter-arrows` | visual: the divider follows the arrow; value sign flips | open | No library binds arrows on a splitter; Ant Design's separator is pointer-only |
| `switch-arrows` | do not bind | divergent | Only Ant Design binds Left = off, Right = on, without RTL handling |
| `rating-arrows` | mirror | consensus | Ant Design reverses; Material UI mirrors the pointer and leaves keys to native radios |
| `color-area-arrows` | none (do not mirror the colour plane), opt-in to mirror | open | React Aria mirrors the area and swaps Home/End |
| `reorder-arrows` | mirror in horizontal lists | open | React Aria's keyboard drag uses Tab and Enter, not arrows |

## Findings that matter for an Arabic-first design

1. **A swap is not enough.** Two cases cannot be expressed as "ArrowLeft and ArrowRight exchange": segmented date
   and time fields (numeric runs stay left-to-right inside right-to-left text, so DOM order and visual order
   diverge) and the window splitter (physical movement, flipped value). Hence the third value `visual`.
2. **Ant Design is the outlier.** Its tree, segmented control and switch ignore direction for arrow keys, and
   its date input moves segments by index. These read as defects and are candidates for field reports.
3. **Mixed-direction text breaks the caret-edge test.** Base UI decides when an arrow leaves a text input from
   the logical caret index and the container direction. With a Latin word or a number inside an RTL composite,
   index 0 is the visual left edge, not the edge next to the preceding item. This is an analysis of the source,
   not an observed run; our rule adds a guard on the input's resolved direction.
4. **Value keys never mirror.** Home, End, PageUp, PageDown, ArrowUp and ArrowDown mean first, last, more and
   less in every library and both directions. The one exception found: React Aria's colour area swaps Home/End.
5. **Vertical-orientation edge:** React Aria does not swap the horizontal arrows of a radio group declared
   vertical, and does swap them for tabs in any orientation; Radix swaps whenever it listens.
6. **Things that look like key bindings but are data from other layers:** first weekday and calendar system for
   the calendar grid; accepted digit sets and separators for spinbutton, date and time segments; the Arabic comma
   (U+060C) as a tag separator; type-ahead and filtering on normalised Arabic text; shortcut matching on
   `KeyboardEvent.code` because an Arabic layout changes `key`; Arabic plural forms in announcements.
7. **Scroll offsets in RTL** (virtual-list): `scrollLeft` is zero at the right edge and negative leftward;
   offsets must be normalised to an inline-start distance. React Aria has RTL branches for this in
   `virtualizer/utils.ts` and `utils/scrollIntoView.ts`.
8. **Toast hotkey disagreement:** Radix F8, Base UI F6.

## Gaps and open questions

- **Arabic names** of all 54 patterns are unreviewed translations. A sourced alternative exists and was not
  pursued for lack of time: the Arabic role names that screen readers announce (NVDA's Arabic locale, Chromium's
  ChromeVox strings), which would also tell us what Arabic users actually hear.
- **Not checked against a primary source:** the 23 non-APG files. In particular `command-palette` (no library
  source read; cmdk and kbar not downloaded), move-mode bindings of `drag-reorder` (dnd-kit not read),
  `popover` and `toast` Tab and Escape details (Radix behaviour from memory beyond the constants read),
  `stepper`, `pagination`, `file-upload` (convention).
- **APG example pages** other than the date picker dialog and the select-only combobox were not read (carousel,
  tabs with actions, the rating slider, the treegrid email inbox). They sometimes add keys the pattern page
  lacks.
- **Material Design (Google) and Angular Material** were not consulted; "Material" is Material UI and MUI X.
- **Ant Design:** `@rc-component/select`, `color-picker`, `table`, `cascader`, `input-number` were not unpacked;
  the claim that the picker panel has no arrow-key day navigation rests on a search of version 1.17.0 for arrow
  handlers and should be confirmed in a browser.
- **Native browser behaviour in RTL** (radio inputs, `input type=range`, `select`) was not measured. It matters
  wherever a component is built on a native control.
- **No behaviour was observed in a browser.** Every library claim is from reading source.
- **Open decisions needing a person:** `color-area-arrows`, `splitter-arrows`, `reorder-arrows`.
- Timing values (type-ahead timeout, tooltip delays, toast duration) are not recorded; APG gives none.
- Touch and pointer contracts (swipe, long-press, drag) are mentioned in notes only.
- Not covered as separate files: OTP field, number field with scrubbing, scroll area, hover card, tour.

## Requests to other layers

- **catalog/universe:** component ids were reconciled against the 149 ids present on 2026-11-11: all 71 ids now
  used in `components` exist there (the build fails otherwise). 46 assumed ids were rewritten through
  `COMPONENT_ALIASES` in `src/_shared.mjs` (for example tag-input → tags-input, time-field → time-picker,
  autocomplete → combobox, sheet → drawer) and 4 were dropped for lack of a component (file-manager, filter,
  emoji-picker, checkout). Please review that table. The universe has no `autocomplete`, `time-field` or
  `tag-input` id although patterns with those ids exist; pattern ids and component ids are separate namespaces.
- **language:** search normalisation for type-ahead and filtering; plural forms for position announcements.
- **calendar / regions:** first weekday and calendar system feed `calendar-grid`.
- **icons:** chevrons of accordion, disclosure, tree, submenu, breadcrumb separator, pagination and carousel
  controls must be in the mirroring registry.
- **field-reports:** Ant Design tree, segmented control, switch and date input arrow keys in RTL; Material UI
  autocomplete tag hand-off in RTL; Base UI composite caret-edge test with mixed-direction text.
- **rules / fixtures:** each `rtlDecisions` entry can become a rule with a keyboard fixture in both directions.
- **architecture:** `ARCHITECTURE.md` engine ids are not referenced from pattern files; a mapping
  pattern → engine belongs in the universe or in a later additive field here.

## What L1 and L2 should build from this

- **L2 engines:** one roving-focus engine parameterised by orientation and direction covers tabs, toolbar,
  menubar, radio group, segmented control, tag list and listbox; a grid-navigation engine covers grid, treegrid,
  calendar grid and combobox grid popups; the menu engine adds submenu keys; `focus.strategy` selects among
  roving tabindex, active descendant and focus trap. Direction is an explicit engine input, never read from
  the DOM implicitly, and text inputs are exempt from remapping.
- **Generated tests:** iterate `keyboard`, once per direction, as described under conventions; use `group` and
  `when` to set up the variant; assert `focus.entry`, `exit` and `restore`; assert `ariaRequired`.
- **L1:** nothing directly; the digit parsing, plural and normalisation needs listed above.

## Report output (`node tools/extract/patterns/report.mjs`)

```
Patterns: 54   bindings: 488   direction-sensitive: 61 (mirror-horizontal 55, visual 6)   debatable: 39   keyboard verified against APG: 31

== Patterns by focus strategy ==
active-descendant   4  autocomplete, combobox, command-palette, select
focus-trap          5  alert-dialog, date-picker, date-range-picker, dialog-modal, drawer
native-tab         22  accordion, breadcrumb, button, carousel, checkbox, color-picker, date-field, disclosure, feed, file-upload, link, menu-button, navigation-menu, pagination, popover, slider-multithumb, slider, spinbutton, stepper, switch, time-field, window-splitter
none                6  alert, landmarks, meter, table, toast, tooltip
roving-tabindex    17  calendar-grid, context-menu, data-grid-editing, drag-reorder, grid, listbox, menu, menubar, radio-group, rating, segmented-control, tabs, tag-input, toolbar, tree-view, treegrid, virtual-list

== Direction-sensitive bindings per pattern ==
pattern                bindings  dir-sens  mirror  visual  kbd-verified
accordion                     3         0       0       0  yes
alert-dialog                  0         0       0       0  yes
alert                         0         0       0       0  yes
autocomplete                 10         0       0       0  no
breadcrumb                    0         0       0       0  yes
button                        2         0       0       0  yes
calendar-grid                14         2       2       0  no
carousel                      2         0       0       0  yes
checkbox                      1         0       0       0  yes
color-picker                 15         0       0       0  no
combobox                     44         4       4       0  yes
command-palette              12         0       0       0  no
context-menu                 12         2       2       0  no
data-grid-editing            13         0       0       0  no
date-field                   11         2       0       2  no
date-picker                   6         0       0       0  no
date-range-picker             3         0       0       0  no
dialog-modal                  3         0       0       0  yes
disclosure                    2         0       0       0  yes
drag-reorder                 15         2       2       0  no
drawer                        3         0       0       0  no
feed                          4         0       0       0  yes
file-upload                   5         0       0       0  no
grid                         44        10      10       0  yes
landmarks                     0         0       0       0  yes
link                          2         0       0       0  yes
listbox                      23         2       2       0  yes
menu-button                   4         0       0       0  yes
menu                         12         2       2       0  yes
menubar                      24         4       4       0  yes
meter                         0         0       0       0  yes
navigation-menu              10         2       2       0  no
pagination                    4         0       0       0  no
popover                       4         0       0       0  no
radio-group                  13         4       4       0  yes
rating                        6         2       2       0  no
segmented-control             8         2       2       0  no
select                       18         0       0       0  no
slider-multithumb             9         2       2       0  yes
slider                        8         2       2       0  yes
spinbutton                    7         0       0       0  yes
stepper                       3         0       0       0  no
switch                        2         0       0       0  yes
table                         0         0       0       0  yes
tabs                         10         2       2       0  yes
tag-input                    11         3       3       0  no
time-field                   11         2       0       2  no
toast                         6         0       0       0  no
toolbar                       8         2       2       0  yes
tooltip                       1         0       0       0  yes
tree-view                    25         2       2       0  yes
treegrid                     19         4       4       0  yes
virtual-list                  8         0       0       0  no
window-splitter               8         2       0       2  yes

== Debatable bindings ==
pattern              keys                         group            rtl                decision
autocomplete         ArrowLeft                                     none               text-caret
autocomplete         ArrowRight                                    none               text-caret
calendar-grid        ArrowRight                                    mirror-horizontal  calendar-day-arrows
calendar-grid        ArrowLeft                                     mirror-horizontal  calendar-day-arrows
color-picker         ArrowRight                   area             none               color-area-arrows
color-picker         ArrowLeft                    area             none               color-area-arrows
color-picker         Shift+ArrowRight             area             none               color-area-arrows
color-picker         Shift+ArrowLeft              area             none               color-area-arrows
color-picker         ArrowRight                   channel strip    none               color-area-arrows
color-picker         ArrowLeft                    channel strip    none               color-area-arrows
combobox             ArrowRight                   listbox popup    none               text-caret
combobox             ArrowLeft                    listbox popup    none               text-caret
data-grid-editing    ArrowLeft                    edit mode        none               text-caret
data-grid-editing    ArrowRight                   edit mode        none               text-caret
date-field           ArrowRight                                    visual             date-segments
date-field           ArrowLeft                                     visual             date-segments
drag-reorder         ArrowRight                   move mode (arrows) mirror-horizontal  reorder-arrows
drag-reorder         ArrowLeft                    move mode (arrows) mirror-horizontal  reorder-arrows
rating               ArrowRight                                    mirror-horizontal  rating-arrows
rating               ArrowLeft                                     mirror-horizontal  rating-arrows
segmented-control    ArrowRight                                    mirror-horizontal  segmented-arrows
segmented-control    ArrowLeft                                     mirror-horizontal  segmented-arrows
slider-multithumb    ArrowRight                                    mirror-horizontal  slider-arrows
slider-multithumb    ArrowLeft                                     mirror-horizontal  slider-arrows
slider-multithumb    Home                                          none               slider-page-home-end
slider-multithumb    End                                           none               slider-page-home-end
slider-multithumb    PageUp                                        none               slider-page-home-end
slider-multithumb    PageDown                                      none               slider-page-home-end
slider               ArrowRight                                    mirror-horizontal  slider-arrows
slider               ArrowLeft                                     mirror-horizontal  slider-arrows
slider               Home                                          none               slider-page-home-end
slider               End                                           none               slider-page-home-end
slider               PageUp                                        none               slider-page-home-end
slider               PageDown                                      none               slider-page-home-end
tag-input            ArrowLeft                    input            mirror-horizontal  input-edge-handoff
time-field           ArrowRight                                    visual             date-segments
time-field           ArrowLeft                                     visual             date-segments
window-splitter      ArrowLeft                                     visual             splitter-arrows
window-splitter      ArrowRight                                    visual             splitter-arrows

== RTL decisions ==
calendar-day-arrows    mirror-horizontal  consensus  calendar-grid
color-area-arrows      none               open       color-picker
date-segments          visual             divergent  date-field, time-field
grid-cell-navigation   mirror-horizontal  consensus  combobox, grid, treegrid
input-edge-handoff     mirror-horizontal  divergent  tag-input
rating-arrows          mirror-horizontal  consensus  rating
reorder-arrows         mirror-horizontal  open       drag-reorder
roving-horizontal      mirror-horizontal  consensus  listbox, menubar, navigation-menu, radio-group, tabs, tag-input, toolbar, virtual-list
segmented-arrows       mirror-horizontal  divergent  segmented-control
slider-arrows          mirror-horizontal  consensus  slider-multithumb, slider
slider-page-home-end   none               consensus  slider-multithumb, slider
splitter-arrows        visual             open       window-splitter
submenu-open-close     mirror-horizontal  consensus  context-menu, menu, menubar, navigation-menu
switch-arrows          do-not-bind        divergent  switch
text-caret             none               consensus  autocomplete, combobox, data-grid-editing
tree-expand-collapse   mirror-horizontal  divergent  combobox, tree-view, treegrid

== Component ids assumed (71) ==
accordion, address-form, alert, alert-dialog, app-shell, breadcrumb, button, button-group, calendar, carousel, cascader, checkbox, checkbox-group, collapsible, color-picker, combobox, command-palette, context-menu, country-select, currency-select, data-grid, data-table, date-field, date-picker, date-range-picker, description-list, dialog, drawer, field, file-upload, hover-card, icon-button, link, list-view, listbox, mentions, menu, menubar, meter, multi-select, navigation-menu, number-input, pagination, popconfirm, popover, progress, radio-group, rating, rich-text-editor, search-field, segmented-control, select, sidebar, slider, splitter, stepper, switch, tabs, tag, tags-input, time-picker, timeline, toast, toggle-button, toggle-group, toolbar, tooltip, transfer, tree, tree-select, virtual-list
```
