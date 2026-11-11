# Field reports — research report

Layer: `data/field-reports/` · schema: `data/schema/field-report.schema.json` · scripts: `tools/extract/field-reports/`
Retrieved: 2026-11-11.

Every table between `BEGIN generated` and `END generated` markers is written by
`node tools/extract/field-reports/stats.mjs --write docs/research/field-reports.md` from the data files. The same
command checks that every `library#number` reference in the prose is a report in the data and links it.

## 1. What was collected

Arabic, RTL, bidirectional-text, numeral and Hijri/Persian-calendar defects that users reported against 23 existing
libraries, each reduced to: what went wrong, how it ended, and the requirement it puts on Hayzo.

<!-- BEGIN generated:libraries -->
327 reports in 23 libraries.

| Library | Reports | Open | Closed | of which not planned | With a linked fix | Verified | Needs review | Median days open |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ag-grid | 11 | 0 | 11 | 0 | 0 | 4 | 7 | 17 |
| ant-design | 43 | 1 | 42 | 1 | 13 | 33 | 10 | 5 |
| base-ui | 8 | 0 | 8 | 0 | 7 | 8 | 0 | 12 |
| chakra-ui | 12 | 0 | 12 | 0 | 4 | 4 | 8 | 0 |
| chartjs | 7 | 2 | 5 | 0 | 3 | 5 | 2 | 366 |
| date-fns | 7 | 5 | 2 | 0 | 0 | 5 | 2 | 1851 |
| dayjs | 8 | 5 | 3 | 0 | 0 | 6 | 2 | 355 |
| floating-ui | 7 | 0 | 7 | 2 | 3 | 3 | 4 | 2 |
| fluentui | 23 | 3 | 20 | 0 | 4 | 17 | 6 | 178 |
| headlessui | 2 | 0 | 2 | 0 | 0 | 1 | 1 | 0 |
| mantine | 22 | 0 | 22 | 3 | 7 | 16 | 6 | 6 |
| material-ui | 39 | 9 | 30 | 1 | 12 | 26 | 13 | 24 |
| moment-hijri | 4 | 3 | 1 | 1 | 0 | 3 | 1 | 1643 |
| mui-x | 48 | 5 | 43 | 2 | 26 | 41 | 7 | 17 |
| primereact | 7 | 1 | 6 | 0 | 0 | 7 | 0 | 378 |
| radix-primitives | 11 | 0 | 11 | 3 | 2 | 11 | 0 | 86 |
| react-datepicker | 7 | 0 | 7 | 1 | 0 | 5 | 2 | 318 |
| react-day-picker | 11 | 1 | 10 | 0 | 3 | 9 | 2 | 12 |
| react-spectrum | 18 | 3 | 15 | 2 | 7 | 15 | 3 | 81 |
| recharts | 4 | 1 | 3 | 0 | 0 | 4 | 0 | 937 |
| shadcn-ui | 20 | 7 | 13 | 6 | 2 | 18 | 2 | 282 |
| tailwindcss | 5 | 0 | 5 | 0 | 0 | 1 | 4 | 6 |
| tanstack-table | 3 | 0 | 3 | 0 | 0 | 1 | 2 | 474 |
| **total** | 327 | 46 | 281 | 22 | 93 | 243 | 84 | 23 |
<!-- END generated:libraries -->

- "With a linked fix" counts reports that have `fixedBy`: a merged pull request of the same repository that names the
  issue after a closing keyword. It is a lower bound (see Gaps).
- `react-hook-form` was searched (15 candidates) and has no file: none of its issues is about Arabic or RTL
  formatting. "RTL" in that tracker, as in many others, mostly means React Testing Library.
- Target check: Material UI 39, MUI X 48, Ant Design 43, Radix + shadcn 31, React Spectrum 18. React Spectrum is at the
  low end because its tracker has few such issues: 153 candidates in total, most of them noise.

### How

1. `search.mjs` queried the GitHub issue search API for each repository × term (`rtl`, `"right-to-left"`, `arabic`,
   `bidi`, `bidirectional`, `hijri`, `"umm al-qura"`, `"arabic numerals"`, `"eastern arabic"`, `persian`, `farsi`,
   `hebrew`, `jalali`, `"dir=rtl"`, `mirror`, `"logical properties"`; then four supplementary terms `islamic`,
   `"numbering system"`, `"text direction"`, `ltr`). 491 response pages cached; 2,933 distinct issues after the first
   pass, 3,080 after the supplementary one (which added 147 candidates and 2 reports — the fixed list was sufficient).
2. `shortlist.mjs` ranked them mechanically (term in title, labels, reactions, comments). The researcher read the
   ranked titles of every repository and chose which to open.
3. `digest.mjs` printed the cleaned body of each chosen issue from the cache. About 365 issues were read this way.
4. `search.mjs --prs` fetched merged pull requests for nine of the terms (231 pages, 2,677 pull requests) and recorded
   which issue numbers each one closes; `build.mjs` turns that into `fixedBy`.
5. For 22 issues where the outcome or cause mattered and the body did not give it, the issue page itself was fetched
   and its thread read (list in section 2).
6. Notes — category, components, summary, resolution, lesson — were written by hand in
   `tools/extract/field-reports/curation/<library>.txt`; `build.mjs` joins them with the mechanical fields of the
   cached API response and refuses any issue number that the API did not return.

Kept: concrete, reproducible defects; missing capabilities; and a few bare "add RTL support" requests where the
interesting fact is how long they stayed open. Dropped: support questions, duplicates inside one library, testing
library noise, and reports whose body did not describe the defect.

## 2. Sources

| Source | Version | License | Retrieved |
|---|---|---|---|
| GitHub issue search API, `GET /search/issues`, 24 repositories (list in `tools/extract/field-reports/config.mjs`) | REST API 2022-11-28, state as of 2026-11-11 | GitHub Terms of Service; issues are user content. Kept: URL, number, title, state, dates, counts, label names (facts) and our own summaries. No issue text is copied. | 2026-11-11 |
| GitHub issue pages (HTML), 22 issues | as of 2026-11-11 | same | 2026-11-11 |

Issue pages read in full (thread and outcome): [material-ui#22726](https://github.com/mui/material-ui/issues/22726), [material-ui#25336](https://github.com/mui/material-ui/issues/25336), [material-ui#28326](https://github.com/mui/material-ui/issues/28326),
[material-ui#30207](https://github.com/mui/material-ui/issues/30207), [material-ui#35169](https://github.com/mui/material-ui/issues/35169), [material-ui#47368](https://github.com/mui/material-ui/issues/47368), [mui-x#5561](https://github.com/mui/mui-x/issues/5561), [mui-x#8665](https://github.com/mui/mui-x/issues/8665), [mui-x#9317](https://github.com/mui/mui-x/issues/9317), [mui-x#10790](https://github.com/mui/mui-x/issues/10790), [mui-x#11488](https://github.com/mui/mui-x/issues/11488),
[mui-x#23493](https://github.com/mui/mui-x/issues/23493), [ant-design#22555](https://github.com/ant-design/ant-design/issues/22555), [ant-design#22635](https://github.com/ant-design/ant-design/issues/22635), [ant-design#35478](https://github.com/ant-design/ant-design/issues/35478), [react-spectrum#1880](https://github.com/adobe/react-spectrum/issues/1880), [react-spectrum#4711](https://github.com/adobe/react-spectrum/issues/4711),
[radix-primitives#2368](https://github.com/radix-ui/primitives/issues/2368), [radix-primitives#2378](https://github.com/radix-ui/primitives/issues/2378), [chakra-ui#9526](https://github.com/chakra-ui/chakra-ui/issues/9526), [ag-grid#4045](https://github.com/ag-grid/ag-grid/issues/4045), [primereact#3096](https://github.com/primefaces/primereact/issues/3096).

API limits met: none on search (0 waits; the environment's proxy authenticates requests, so the limit was 30 per
minute and the script paced itself at about 26). The per-issue endpoints (`/repos/{owner}/{repo}/issues/{n}` and
`…/timeline`) and `github.com` HTML were refused by the environment's proxy for repositories not attached to the
session (HTTP 403), so comment threads could not be pulled mechanically; that is why only 22 threads were read, through
the web fetch tool.

## 3. Schema changes (additive, all optional)

- Report fields: `number`, `stateReason` (`completed` · `not_planned` · `duplicate` · `reopened`), `createdAt`,
  `closedAt`, `daysOpen` (to close, or to the retrieval date when open), `comments`, `reactions`, `labels`,
  `resolution` (our words), `fixedBy[]` (`url`, `title`, `mergedAt` — mechanical).
- `category` enum extended with `value-direction`, `portal-direction`, `chart`, `style-engine`, `direction-api`, and
  given a description that defines every value.
- Nothing was removed or made required; the envelope is unchanged.

Confidence: URL, number, title, state, dates, counts, labels and `fixedBy` are mechanical. A report is `verified` when
its summary says only what the issue (or its thread, or the title of the linked fix) states. It is `needs-review` when
the stated cause is the researcher's inference from the symptom. Files take the lowest confidence of their reports, so
19 of 23 files are `needs-review`. One inference was checked against its thread and turned out wrong ([mui-x#23493](https://github.com/mui/mui-x/issues/23493): no
bidi control characters in the bundle, the scanner had reacted to Arabic locale text) — treat `needs-review` causes as
hypotheses.

## 4. Taxonomy

<!-- BEGIN generated:matrix -->
| Category | Total | MUI | MUI X | Ant Design | Radix + shadcn | React Spectrum | Mantine | Chakra | Fluent | Base UI, Headless UI, Floating UI | PrimeReact, Tailwind | Grids (AG Grid, TanStack) | Date libraries and pickers | Charts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `direction-api` | 44 | 7 | 5 | 7 | 8 | 3 | 1 | 2 | 1 | 2 | 3 | 3 | 2 |  |
| `scroll` | 32 | 4 | 10 | 4 | 4 |  |  |  |  | 2 | 1 | 7 |  |  |
| `layout` | 27 | 2 | 3 | 3 | 3 |  | 1 | 5 | 4 |  | 2 |  | 3 | 1 |
| `calendar` | 26 |  | 7 | 3 | 2 | 2 |  |  |  |  |  |  | 12 |  |
| `overlay-position` | 23 | 4 | 1 | 5 | 1 |  | 2 |  | 3 | 7 |  |  |  |  |
| `style-engine` | 23 | 7 |  | 2 | 5 |  | 1 | 1 | 3 |  | 4 |  |  |  |
| `value-direction` | 23 | 3 |  | 4 | 2 | 2 | 5 | 2 | 3 | 1 | 1 |  |  |  |
| `keyboard` | 21 | 1 | 3 |  | 1 | 3 | 3 |  | 2 | 3 |  |  | 4 | 1 |
| `mirroring` | 17 | 3 | 2 | 3 |  |  | 2 | 1 | 3 |  | 1 |  | 2 |  |
| `bidi` | 16 | 1 | 6 | 3 | 1 | 2 | 1 |  |  |  |  |  | 2 |  |
| `numerals` | 16 |  | 3 |  |  | 5 |  |  |  | 1 |  |  | 6 | 1 |
| `chart` | 15 |  | 4 |  |  |  | 1 |  | 1 |  |  | 1 |  | 8 |
| `input` | 15 | 2 | 1 | 4 |  |  | 3 |  | 2 |  |  | 3 |  |  |
| `animation` | 12 | 3 |  | 3 | 2 |  | 2 | 1 | 1 |  |  |  |  |  |
| `locale-strings` | 9 | 1 | 1 | 1 |  |  |  |  |  |  |  |  | 6 |  |
| `portal-direction` | 6 | 1 | 1 | 1 | 1 | 1 |  |  |  | 1 |  |  |  |  |
| `other` | 1 |  | 1 |  |  |  |  |  |  |  |  |  |  |  |
| `typography` | 1 |  |  |  | 1 |  |  |  |  |  |  |  |  |  |
| **total** | 327 | 39 | 48 | 43 | 31 | 18 | 22 | 12 | 23 | 17 | 12 | 14 | 37 | 11 |
<!-- END generated:matrix -->

<!-- BEGIN generated:categories -->
| Category | Reports | Libraries | Still open | Closed not planned | Median days open | Longest (years) |
| --- | --- | --- | --- | --- | --- | --- |
| `direction-api` | 44 | 16 | 4 | 6 | 140 | 7.6 |
| `scroll` | 32 | 9 | 3 | 0 | 30 | 6.0 |
| `layout` | 27 | 11 | 1 | 2 | 6 | 3.3 |
| `calendar` | 26 | 9 | 5 | 2 | 35 | 8.0 |
| `overlay-position` | 23 | 8 | 0 | 3 | 5 | 2.6 |
| `style-engine` | 23 | 7 | 5 | 2 | 50 | 4.6 |
| `value-direction` | 23 | 9 | 4 | 1 | 17 | 6.3 |
| `keyboard` | 21 | 12 | 2 | 0 | 17 | 3.2 |
| `mirroring` | 17 | 9 | 1 | 0 | 14 | 4.2 |
| `bidi` | 16 | 8 | 5 | 1 | 97 | 6.2 |
| `numerals` | 16 | 7 | 5 | 0 | 45 | 5.7 |
| `chart` | 15 | 6 | 2 | 0 | 23 | 4.1 |
| `input` | 15 | 7 | 0 | 1 | 16 | 1.6 |
| `animation` | 12 | 7 | 2 | 1 | 5 | 2.9 |
| `locale-strings` | 9 | 6 | 6 | 0 | 712 | 7.7 |
| `portal-direction` | 6 | 6 | 1 | 2 | 12 | 1.1 |
| `other` | 1 | 1 | 0 | 0 | 3 | 0.0 |
| `typography` | 1 | 1 | 0 | 1 | 435 | 1.2 |
<!-- END generated:categories -->

Components named most often: <!-- BEGIN generated:components -->
DatePicker 21 · DataGrid 16 · Tabs 13 · all components 11 · DayPicker 11 · Switch 8 · Drawer 7 · Grid 7 · Menu 7 · Scheduler 7 · Slider 7 · Table 7 · Calendar 6 · NumberField 6 · Select 6 · Tooltip 6 · Carousel 5 · DateField 5 · Dialog 5 · DirectionProvider 4 · format 4 · Icon 4 · locale ar 4 · Modal 4 · Popover 4
<!-- END generated:components -->

The classes below follow the brief's list; `direction-api`, `bidi` and `layout` are added because the data needed
them. The first is the largest class of all.

### 4.1 How direction is declared (`direction-api`)

**Pattern.** Direction lives in two or three places that the developer must keep in sync: a DOM attribute for CSS, a
context or theme flag for behaviour, sometimes a style-engine plugin as well. Components then default to `ltr` when
the context is missing, even on a document marked RTL; direction is inferred from the locale and cannot be set
independently; it is read once and not updated.
**Reports.** [radix-primitives#3830](https://github.com/radix-ui/primitives/issues/3830) and [radix-primitives#2703](https://github.com/radix-ui/primitives/issues/2703) (no provider → `ltr`, auto-detection declined),
[radix-primitives#2378](https://github.com/radix-ui/primitives/issues/2378) (components stamp `dir="ltr"` on themselves), [base-ui#831](https://github.com/mui/base-ui/issues/831) (two-step setup adopted as the design),
[chakra-ui#9614](https://github.com/chakra-ui/chakra-ui/issues/9614), [fluentui#7966](https://github.com/microsoft/fluentui/issues/7966) (only `<html dir>` recognised), [material-ui#13137](https://github.com/mui/material-ui/issues/13137) (a slider "bug" closed by rewriting the
setup guide), [material-ui#28138](https://github.com/mui/material-ui/issues/28138) and [mantine#633](https://github.com/mantinedev/mantine/issues/633) (cannot nest or switch at runtime), [react-spectrum#6469](https://github.com/adobe/react-spectrum/issues/6469) and
[react-spectrum#10954](https://github.com/adobe/react-spectrum/issues/10954) (direction only derivable from locale; override declined once, requested again),
[ant-design#26692](https://github.com/ant-design/ant-design/issues/26692), [ant-design#37059](https://github.com/ant-design/ant-design/issues/37059), [moment-hijri#31](https://github.com/xsoh/moment-hijri/issues/31) (importing a calendar plug-in switches the global locale).
Physical names in public APIs are the other half: [ant-design#52942](https://github.com/ant-design/ant-design/issues/52942) (`fixed: 'right'` appears on the left),
[ant-design#59751](https://github.com/ant-design/ant-design/issues/59751) (`labelAlign="left"` aligns right), [ant-design#24441](https://github.com/ant-design/ant-design/issues/24441), [mui-x#23888](https://github.com/mui/mui-x/issues/23888) (renamed before stable).
**Rule.** One declaration. Engines require a `direction` input; the adapter resolves it as: explicit prop → nearest
provider → nearest `dir` ancestor in the DOM (observed for changes) → `ltr`. No component writes a `dir` it was not
given. Direction, language, numbering system and calendar are four independent fields of the locale context, each
with a default derived from the locale. Public names are `start`/`end`; a physical name, where accepted, stays
physical.

### 4.2 Overlay positioning (`overlay-position`)

**Pattern.** Placement vocabulary mixes physical and logical terms, and mirroring is applied at the wrong stage:
either a physical side is mirrored ([mantine#2104](https://github.com/mantinedev/mantine/issues/2104): "right" renders left), or computed coordinates pass through a
flipping step afterwards ([material-ui#15994](https://github.com/mui/material-ui/issues/15994), [material-ui#27858](https://github.com/mui/material-ui/issues/27858)), or only alignment is logical while side is physical
([base-ui#951](https://github.com/mui/base-ui/issues/951), [floating-ui#1530](https://github.com/floating-ui/floating-ui/issues/1530)). Geometry assumes the scrollbar is on the right ([floating-ui#976](https://github.com/floating-ui/floating-ui/issues/976), [floating-ui#3200](https://github.com/floating-ui/floating-ui/issues/3200),
[material-ui#22540](https://github.com/mui/material-ui/issues/22540)) or that an unpositioned popup may sit at the left origin ([shadcn-ui#9233](https://github.com/shadcn-ui/ui/issues/9233)). Submenus hard-code a side
([ant-design#47488](https://github.com/ant-design/ant-design/issues/47488), [fluentui#19754](https://github.com/microsoft/fluentui/issues/19754), [mui-x#23895](https://github.com/mui/mui-x/issues/23895)).
**Rule.** Placement = logical side + logical alignment. Resolve to physical sides from the anchor's direction first;
run collision detection, flip and shift on physical rectangles; write the result with physical `left`/`top` or a
transform from a fixed physical origin. Arrow offsets are physical too ([fluentui#20622](https://github.com/microsoft/fluentui/issues/20622), [floating-ui#2374](https://github.com/floating-ui/floating-ui/issues/2374),
[chakra-ui#10471](https://github.com/chakra-ui/chakra-ui/issues/10471)). Popups start hidden inside the viewport until measured.

### 4.3 Sliders, progress, carousels, switches, ratings (`value-direction`)

**Pattern.** A component with a value axis has three parts that must agree — pointer mapping, key mapping, visuals —
and each is flipped by a different mechanism or not at all: transforms are not touched by a CSS-flipping plugin
([material-ui#15955](https://github.com/mui/material-ui/issues/15955), [shadcn-ui#10274](https://github.com/shadcn-ui/ui/issues/10274), [headlessui#1756](https://github.com/tailwindlabs/headlessui/issues/1756)), a wrapped third-party engine is not told the direction
([ant-design#22635](https://github.com/ant-design/ant-design/issues/22635), which took 6.3 years to close; [mantine#2442](https://github.com/mantinedev/mantine/issues/2442)), fractional hit-testing measures from the left
([ant-design#22296](https://github.com/ant-design/ant-design/issues/22296), [chakra-ui#9982](https://github.com/chakra-ui/chakra-ui/issues/9982), [material-ui#20954](https://github.com/mui/material-ui/issues/20954)). Separately, whether the axis should mirror is a product
decision that libraries do not let authors make: media timelines stay LTR ([material-ui#28326](https://github.com/mui/material-ui/issues/28326) open for 5.2 years,
[react-spectrum#10112](https://github.com/adobe/react-spectrum/issues/10112), [react-spectrum#2315](https://github.com/adobe/react-spectrum/issues/2315), [fluentui#10900](https://github.com/microsoft/fluentui/issues/10900)).
**Rule.** One value-to-position function per engine with `direction` as an argument, used by pointer, keys, marks
and fill. Every value-axis component takes a `direction` override independent of text direction, with a recorded
default (progress, slider, rating, carousel, switch mirror; media timeline does not). No recipe encodes travel as an
unsigned physical translate.

### 4.4 Keyboard arrows (`keyboard`)

**Pattern.** Visuals are mirrored by CSS for free, key handling is not, so "the arrows point away from where focus
moves" ([mantine#9285](https://github.com/mantinedev/mantine/issues/9285), [mantine#9300](https://github.com/mantinedev/mantine/issues/9300), [mantine#9329](https://github.com/mantinedev/mantine/issues/9329) — three components fixed one by one in 2026; [mui-x#4990](https://github.com/mui/mui-x/issues/4990);
[react-day-picker#837](https://github.com/gpbl/react-day-picker/issues/837) and [react-day-picker#1289](https://github.com/gpbl/react-day-picker/issues/1289), the same defect twice across a rewrite; [react-datepicker#1663](https://github.com/Hacker0x01/react-datepicker/issues/1663) closed
as won't fix; [fluentui#28935](https://github.com/microsoft/fluentui/issues/28935) and [recharts#4214](https://github.com/recharts/recharts/issues/4214) still open). When the swap exists it is applied too broadly:
[react-spectrum#4896](https://github.com/adobe/react-spectrum/issues/4896) swapped keys in vertical orientation as well and took three years to close. Grids and trees need
their own mapping ([floating-ui#3115](https://github.com/floating-ui/floating-ui/issues/3115), [material-ui#18853](https://github.com/mui/material-ui/issues/18853)), as do Home/End ([react-spectrum#2921](https://github.com/adobe/react-spectrum/issues/2921)).
**Rule.** One key-resolution table, a pure function of (key, orientation, direction), shared by every engine; the
swap applies to the left/right pair only. "Into"/"out of" a nested level (submenu, tree node, cascader column) binds
to the inline-end/inline-start arrow. Pattern data carries the RTL variant and the tests are generated from it, so a
rewrite cannot drop them.

### 4.5 Icons and glyphs (`mirroring`)

**Pattern.** Whether a glyph mirrors is decided ad hoc per component, or left to the author. [material-ui#22726](https://github.com/mui/material-ui/issues/22726) was
closed after 4.2 years as not worth the effort; [fluentui#2285](https://github.com/microsoft/fluentui/issues/2285), [fluentui#11352](https://github.com/microsoft/fluentui/issues/11352) and [fluentui#25624](https://github.com/microsoft/fluentui/issues/25624) asked for
automatic mirroring three times over five years. Where components do mirror, icon and position are swapped
independently and end up disagreeing ([mui-x#9989](https://github.com/mui/mui-x/issues/9989), [react-day-picker#1288](https://github.com/gpbl/react-day-picker/issues/1288) where the label says "next" and the action is
previous, [ant-design#52882](https://github.com/ant-design/ant-design/issues/52882), [mui-x#8665](https://github.com/mui/mui-x/issues/8665)), or custom icons are ignored in RTL ([material-ui#39296](https://github.com/mui/material-ui/issues/39296)). Maintainers had to ask
what a breadcrumb separator or a spinner should do ([ant-design#24085](https://github.com/ant-design/ant-design/issues/24085), [ant-design#26958](https://github.com/ant-design/ant-design/issues/26958)).
**Rule.** Mirroring is data: each icon is `mirror`, `keep` or `swap:<counterpart>`, and each motion likewise. The icon
component applies it from the resolved direction. Previous/next pairs come from one helper that returns position,
glyph, label and action together.

### 4.6 Portals (`portal-direction`)

**Pattern.** Content rendered in `document.body` leaves the subtree that carries `dir`, so it follows the document,
not its trigger. Six libraries, the same defect: [material-ui#32022](https://github.com/mui/material-ui/issues/32022) (closed by editing the guide), [mui-x#23906](https://github.com/mui/mui-x/issues/23906) and
[react-spectrum#8583](https://github.com/adobe/react-spectrum/issues/8583) (declined), [base-ui#3041](https://github.com/mui/base-ui/issues/3041), [shadcn-ui#8454](https://github.com/shadcn-ui/ui/issues/8454) (open), [ant-design#31727](https://github.com/ant-design/ant-design/issues/31727) (imperative API missed the
configuration).
**Rule.** The overlay layer sets `dir` and `lang` on every portal root from the direction context of the element that
opened it. Imperative entry points that bypass context are not offered.

### 4.7 Scrollbars, sticky and pinned columns, virtualisation (`scroll`)

**Pattern.** Three independent assumptions. (a) `scrollLeft` has a sign convention: [ag-grid#4045](https://github.com/ag-grid/ag-grid/issues/4045) broke overnight with
a browser release; [mui-x#3435](https://github.com/mui/mui-x/issues/3435), [mui-x#12438](https://github.com/mui/mui-x/issues/12438), [mui-x#19578](https://github.com/mui/mui-x/issues/19578), [mui-x#23980](https://github.com/mui/mui-x/issues/23980) and [ag-grid#6779](https://github.com/ag-grid/ag-grid/issues/6779) are the same root cause in
header sync, virtualisation, auto-scroll and aligned grids. (b) The scrollbar is on the right: scroll lock adds
`padding-right` ([material-ui#23489](https://github.com/mui/material-ui/issues/23489) open for 6.0 years, [material-ui#16670](https://github.com/mui/material-ui/issues/16670), [radix-primitives#3182](https://github.com/radix-ui/primitives/issues/3182)). (c) "Off-screen to
the left" is harmless: hidden form inputs and focus guards placed with physical offsets become scrollable overflow in
RTL ([radix-primitives#3216](https://github.com/radix-ui/primitives/issues/3216), [radix-primitives#4041](https://github.com/radix-ui/primitives/issues/4041), [base-ui#5635](https://github.com/mui/base-ui/issues/5635), [base-ui#5717](https://github.com/mui/base-ui/issues/5717)). Pinned columns regress repeatedly:
[mui-x#5063](https://github.com/mui/mui-x/issues/5063), [mui-x#14245](https://github.com/mui/mui-x/issues/14245), [mui-x#14953](https://github.com/mui/mui-x/issues/14953), [mui-x#20724](https://github.com/mui/mui-x/issues/20724); [ant-design#21815](https://github.com/ant-design/ant-design/issues/21815), [ant-design#35478](https://github.com/ant-design/ant-design/issues/35478); [tanstack-table#5986](https://github.com/TanStack/table/issues/5986);
[ag-grid#10240](https://github.com/ag-grid/ag-grid/issues/10240).
**Rule.** One scroll adapter returns a normalised inline offset (0 at inline-start) and is the only code that touches
`scrollLeft`; virtualisers, sync and auto-scroll consume it. Scroll lock uses `scrollbar-gutter` or measures the
side. Visually hidden elements stay inside their control's box. Pinning is `start`/`end`, computed in logical space.

### 4.8 Inputs (`input`) and mixed-direction text (`bidi`)

**Pattern.** A field's own direction can differ from the page's — phone, email, password, numbers in an RTL form —
and decorations follow the page instead of the field ([mantine#8903](https://github.com/mantinedev/mantine/issues/8903), [mantine#8935](https://github.com/mantinedev/mantine/issues/8935), [material-ui#24897](https://github.com/mui/material-ui/issues/24897), [mantine#6559](https://github.com/mantinedev/mantine/issues/6559)).
Pointer-driven resize ignores direction ([tanstack-table#4331](https://github.com/TanStack/table/issues/4331) for 19 months, [mui-x#4954](https://github.com/mui/mui-x/issues/4954), [fluentui#17389](https://github.com/microsoft/fluentui/issues/17389),
[ant-design#22659](https://github.com/ant-design/ant-design/issues/22659), [ag-grid#6677](https://github.com/ag-grid/ag-grid/issues/6677)). Numbers built from several elements are reordered by the container
([ant-design#22555](https://github.com/ant-design/ant-design/issues/22555) and again [ant-design#43971](https://github.com/ant-design/ant-design/issues/43971): 10 shown as 01; [mui-x#5561](https://github.com/mui/mui-x/issues/5561): minutes before hours). Text with numbers and
neutral separators is reordered by the bidi algorithm: "21–30 of 100" ([material-ui#35169](https://github.com/mui/material-ui/issues/35169), [mui-x#20125](https://github.com/mui/mui-x/issues/20125)), "2 / 10"
([ant-design#53528](https://github.com/ant-design/ant-design/issues/53528)), date fields ([mui-x#9317](https://github.com/mui/mui-x/issues/9317) open for 3.4 years; [react-spectrum#4711](https://github.com/adobe/react-spectrum/issues/4711), where the cause was that
segments were flex items). Digit sequences are laid out RTL ([shadcn-ui#11201](https://github.com/shadcn-ui/ui/issues/11201), [mantine#6382](https://github.com/mantinedev/mantine/issues/6382)). Control characters leak
into formatted output or break parsing ([dayjs#2977](https://github.com/iamkun/dayjs/issues/2977), [date-fns#1927](https://github.com/date-fns/date-fns/issues/1927)).
**Rule.** One field primitive lays out label, adornments and padding from the field's resolved direction. Composite
numbers and ranges go through one isolate primitive. Date/time segments are inline members of a single bidi paragraph
and must match the visual order of the locale's formatted string. OTP, PIN, card and similar inputs are LTR in every
locale. Output contains no bidi control characters; input tolerates them.

### 4.9 Numerals and number/date formatting (`numerals`)

**Pattern.** Digits are assumed ASCII somewhere in a round trip: `0NaN` in a year ([mui-x#11488](https://github.com/mui/mui-x/issues/11488), [mui-x#8985](https://github.com/mui/mui-x/issues/8985)), invalid
after stepping ([mui-x#14458](https://github.com/mui/mui-x/issues/14458), open), Persian keyboard digits rejected ([base-ui#4718](https://github.com/mui/base-ui/issues/4718)), a hand-picked list of digit
systems ([react-spectrum#6623](https://github.com/adobe/react-spectrum/issues/6623)). The opposite failure is guessing the numbering system from input: a lone comma, period
or space switches the field to Arabic digits ([react-spectrum#3862](https://github.com/adobe/react-spectrum/issues/3862) for 3.2 years, [react-spectrum#3114](https://github.com/adobe/react-spectrum/issues/3114),
[react-spectrum#10875](https://github.com/adobe/react-spectrum/issues/10875)), and parsing does not round-trip formatting ([react-spectrum#10936](https://github.com/adobe/react-spectrum/issues/10936)). Date libraries tie digits to
the locale or offer no choice ([date-fns#2203](https://github.com/date-fns/date-fns/issues/2203) and [date-fns#2700](https://github.com/date-fns/date-fns/issues/2700) open for five years, [dayjs#416](https://github.com/iamkun/dayjs/issues/416), [dayjs#1706](https://github.com/iamkun/dayjs/issues/1706),
[react-day-picker#246](https://github.com/gpbl/react-day-picker/issues/246), [recharts#7548](https://github.com/recharts/recharts/issues/7548)), and logic compares formatted strings ([dayjs#3234](https://github.com/iamkun/dayjs/issues/3234)).
**Rule.** Numbering system is an explicit field of the locale context with a region default. Fields keep numeric
models and format only for display. One digit table generated from Unicode data serves input filtering and parsing.
`parse(format(x)) = x` is a generated property test over every locale × numbering system. Punctuation never selects a
numbering system.

### 4.10 Calendars (`calendar`)

**Pattern.** Non-Gregorian calendars are plug-ins on a Gregorian core, tested less, and wrong at the edges: month
length inherited from Gregorian ([mui-x#22728](https://github.com/mui/mui-x/issues/22728)), Gregorian tokens inside Hijri formats ([mui-x#22964](https://github.com/mui/mui-x/issues/22964), [mui-x#22965](https://github.com/mui/mui-x/issues/22965)),
Gregorian month names in a Persian calendar ([react-day-picker#2612](https://github.com/gpbl/react-day-picker/issues/2612), [shadcn-ui#8305](https://github.com/shadcn-ui/ui/issues/8305)), Persian leap year 1403 wrong in
three places ([ant-design#53186](https://github.com/ant-design/ant-design/issues/53186), [dayjs#2840](https://github.com/iamkun/dayjs/issues/2840), [react-spectrum#5960](https://github.com/adobe/react-spectrum/issues/5960)), conversion errors ([react-spectrum#3757](https://github.com/adobe/react-spectrum/issues/3757)), an
Umm al-Qura table that disagrees with the official data in 760 of 1,740 months ([moment-hijri#105](https://github.com/xsoh/moment-hijri/issues/105)) and another that
departs from ICU in 2029 ([react-day-picker#3029](https://github.com/gpbl/react-day-picker/issues/3029)). Weekday labels are produced by truncation ([mui-x#10790](https://github.com/mui/mui-x/issues/10790), [mui-x#5330](https://github.com/mui/mui-x/issues/5330))
or overflow ([ant-design#54168](https://github.com/ant-design/ant-design/issues/54168)). Requests for Hijri or Jalali support itself wait for years ([date-fns#977](https://github.com/date-fns/date-fns/issues/977) open for 8.0
years, [date-fns#1740](https://github.com/date-fns/date-fns/issues/1740), [react-datepicker#1320](https://github.com/Hacker0x01/react-datepicker/issues/1320)).
**Rule.** Calendars are a parameter of the date core and of the calendar-grid engine, with one conformance suite run
for every calendar: month and year lengths, round trips, known hard years, agreement with ICU over the supported
range, and a documented range. Names are looked up by (calendar, locale, width) from CLDR; no truncation. A format
draws all fields from one calendar.

### 4.11 Charts (`chart`)

**Pattern.** A chart is drawn from computed coordinates, so CSS direction either does nothing ([recharts#682](https://github.com/recharts/recharts/issues/682): a
flipping plugin had no effect) or does damage by moving inherited SVG text ([mui-x#13613](https://github.com/mui/mui-x/issues/13613), [mui-x#12118](https://github.com/mui/mui-x/issues/12118), [mantine#5505](https://github.com/mantinedev/mantine/issues/5505),
[recharts#263](https://github.com/recharts/recharts/issues/263)). RTL arrives per part — legend and tooltip first, axes never ([chartjs#11937](https://github.com/chartjs/Chart.js/issues/11937) open, [chartjs#7199](https://github.com/chartjs/Chart.js/issues/7199)) — and
drawing and hit-testing disagree ([chartjs#9324](https://github.com/chartjs/Chart.js/issues/9324)).
**Rule.** Charts isolate themselves from inherited direction and take direction as a layout input: value axis side,
category order, legend order, text anchors, tooltip layout and keyboard order all derive from it, and drawing and
hit-testing share one layout result.

### 4.12 Animation (`animation`)

**Pattern.** Motion is authored for one physical direction: drawers slide from the wrong edge ([material-ui#33981](https://github.com/mui/material-ui/issues/33981),
[mantine#4917](https://github.com/mantinedev/mantine/issues/4917), [fluentui#30801](https://github.com/microsoft/fluentui/issues/30801), [shadcn-ui#9519](https://github.com/shadcn-ui/ui/issues/9519)), indicators start from the left or keep a stale offset
([material-ui#26450](https://github.com/mui/material-ui/issues/26450), [chakra-ui#5235](https://github.com/chakra-ui/chakra-ui/issues/5235), [ant-design#40128](https://github.com/ant-design/ant-design/issues/40128), [mantine#5002](https://github.com/mantinedev/mantine/issues/5002)), keyframes run LTR ([material-ui#40308](https://github.com/mui/material-ui/issues/40308) open,
[ant-design#43312](https://github.com/ant-design/ant-design/issues/43312)), swipe-to-dismiss is physical ([radix-primitives#2368](https://github.com/radix-ui/primitives/issues/2368)).
**Rule.** Sliding surfaces take their resolved physical side as the input of both position and motion. Indicators are
positioned from measured rectangles relative to the track and re-measured when direction changes. Inline-axis
keyframes are authored once with a direction multiplier.

### 4.13 Physical properties and flipping layers (`style-engine`)

**Pattern.** The dominant strategy of the 2010s — write physical CSS, flip it with a plugin — fails wherever the
plugin cannot see: inline styles and runtime values ([material-ui#40299](https://github.com/mui/material-ui/issues/40299)), transforms, nested selectors
([material-ui#24899](https://github.com/mui/material-ui/issues/24899)), a second engine ([material-ui#25336](https://github.com/mui/material-ui/issues/25336)), the escape hatch itself ([material-ui#33563](https://github.com/mui/material-ui/issues/33563)). It needs a
hand-maintained RTL stylesheet per component ([ant-design#22239](https://github.com/ant-design/ant-design/issues/22239)), delays styles under SSR ([mantine#4513](https://github.com/mantinedev/mantine/issues/4513)), and cannot
express a mixed-direction page ([material-ui#45193](https://github.com/mui/material-ui/issues/45193)). It is also irreversible: [material-ui#32198](https://github.com/mui/material-ui/issues/32198) has asked for logical
properties for 4.6 years and [material-ui#47368](https://github.com/mui/material-ui/issues/47368) was declined in 2025 because switching would break every existing app.
shadcn/ui declined logical properties ([shadcn-ui#6493](https://github.com/shadcn-ui/ui/issues/6493)) and ships an install-time class rewriter, which has its own
defects ([shadcn-ui#9734](https://github.com/shadcn-ui/ui/issues/9734), [shadcn-ui#10493](https://github.com/shadcn-ui/ui/issues/10493), [shadcn-ui#12475](https://github.com/shadcn-ui/ui/issues/12475)). The reverse transform fails too ([ant-design#47144](https://github.com/ant-design/ant-design/issues/47144)).
Margin-based spacing utilities are the same problem at small scale ([tailwindcss#2017](https://github.com/tailwindlabs/tailwindcss/issues/2017), [tailwindcss#7179](https://github.com/tailwindlabs/tailwindcss/issues/7179),
[fluentui#15795](https://github.com/microsoft/fluentui/issues/15795)). The one caution in the other direction: logical properties are wrong for geometry that is physical
by construction ([chakra-ui#10471](https://github.com/chakra-ui/chakra-ui/issues/10471)).
**Rule.** Recipes are written once with logical properties and `gap`; nothing transforms CSS at build, install or run
time. A lint rejects physical inline properties in recipes, examples and docs, with a short explicit exemption list:
positioning-engine output, rotated arrows, pointer coordinates, clip paths.

### 4.14 Built-in strings (`locale-strings`)

**Pattern.** Arabic is one optional pack among many, tied to a country ([ant-design#26687](https://github.com/ant-design/ant-design/issues/26687), [date-fns#2262](https://github.com/date-fns/date-fns/issues/2262),
[material-ui#31847](https://github.com/mui/material-ui/issues/31847) open for 4.7 years), missing for a whole package ([mui-x#15650](https://github.com/mui/mui-x/issues/15650) open), or wrong in ways nobody on the
team can see: Day.js had AM and PM swapped in Arabic because the source line looked right after bidi reordering
([dayjs#1941](https://github.com/iamkun/dayjs/issues/1941)), and noon is still formatted as AM ([dayjs#2711](https://github.com/iamkun/dayjs/issues/2711), [dayjs#2951](https://github.com/iamkun/dayjs/issues/2951)).
**Rule.** `ar` is the source locale and is complete by build check; regional data is layered separately. Arabic
strings live in data files, never inline next to operators in code.

### 4.15 Static layout (`layout`) and typography

Mostly instances of 4.13 found one component at a time: adornments and indicators ([chakra-ui#4701](https://github.com/chakra-ui/chakra-ui/issues/4701), [chakra-ui#3755](https://github.com/chakra-ui/chakra-ui/issues/3755),
[primereact#2167](https://github.com/primefaces/primereact/issues/2167)), corner radii of attached groups ([chakra-ui#4796](https://github.com/chakra-ui/chakra-ui/issues/4796), [fluentui#13708](https://github.com/microsoft/fluentui/issues/13708), [react-day-picker#1277](https://github.com/gpbl/react-day-picker/issues/1277)), close
buttons ([shadcn-ui#7978](https://github.com/shadcn-ui/ui/issues/7978), [fluentui#24984](https://github.com/microsoft/fluentui/issues/24984)), centring with a physical translate ([chakra-ui#9526](https://github.com/chakra-ui/chakra-ui/issues/9526)), mirroring applied to
the wrong axis ([ant-design#56101](https://github.com/ant-design/ant-design/issues/56101)). One typography report: Persian digits not optically centred in calendar cells
([shadcn-ui#7699](https://github.com/shadcn-ui/ui/issues/7699)).

## 5. Longest-lived issues

Capabilities users are still waiting for — Hayzo's clearest openings.

<!-- BEGIN generated:longest-open -->
46 of the 327 reports are open; 27 of them for two years or more, 12 for four years or more.

| Report | Opened | Years open | Reactions | Category | Title |
| --- | --- | --- | --- | --- | --- |
| [date-fns#977](https://github.com/date-fns/date-fns/issues/977) | 2018-11-07 | 8.0 | 8 | `calendar` | Jalali Calendar |
| [moment-hijri#47](https://github.com/xsoh/moment-hijri/issues/47) | 2019-02-18 | 7.7 | 0 | `locale-strings` | Format to iD/iM/iYYYY - gives arabic text not English |
| [date-fns#1927](https://github.com/date-fns/date-fns/issues/1927) | 2020-08-29 | 6.2 | 0 | `bidi` | Can't parse arabic localized dates |
| [material-ui#23489](https://github.com/mui/material-ui/issues/23489) | 2020-11-12 | 6.0 | 3 | `scroll` | [Modal] RTL - Scrollbar and padding issue |
| [date-fns#2203](https://github.com/date-fns/date-fns/issues/2203) | 2021-02-16 | 5.7 | 2 | `numerals` | Change dates to local numerals |
| [material-ui#28326](https://github.com/mui/material-ui/issues/28326) | 2021-09-14 | 5.2 | 1 | `value-direction` | LinearProgress and Switch should not be flipped in right-to-left themes |
| [date-fns#2700](https://github.com/date-fns/date-fns/issues/2700) | 2021-10-17 | 5.1 | 0 | `numerals` | Allow diff digits numerals based on locale |
| [material-ui#31847](https://github.com/mui/material-ui/issues/31847) | 2022-03-17 | 4.7 | 4 | `locale-strings` | [l10n] Unified Modern Standard Arabic localization |
| [material-ui#32198](https://github.com/mui/material-ui/issues/32198) | 2022-04-08 | 4.6 | 7 | `style-engine` | [system] Add support & usage of CSS logical properties |
| [moment-hijri#79](https://github.com/xsoh/moment-hijri/issues/79) | 2022-05-12 | 4.5 | 0 | `calendar` | Shawwal month not return from moment hijri (2022) |
| [primereact#3096](https://github.com/primefaces/primereact/issues/3096) | 2022-07-23 | 4.3 | 0 | `direction-api` | Core: Right To Left (RTL) Support |
| [chartjs#10771](https://github.com/chartjs/Chart.js/issues/10771) | 2022-10-09 | 4.1 | 0 | `chart` | boxPadding not working properly in RTL languages |
| [material-ui#35169](https://github.com/mui/material-ui/issues/35169) | 2022-11-16 | 4.0 | 0 | `bidi` | [Pagination] on table pagination row info is not in correct order on RTL |
| [date-fns#3380](https://github.com/date-fns/date-fns/issues/3380) | 2023-03-24 | 3.6 | 0 | `locale-strings` | Arabic time format is incorrect |
| [mui-x#9317](https://github.com/mui/mui-x/issues/9317) | 2023-06-09 | 3.4 | 3 | `bidi` | [pickers] Using mui-pickers keyboardatepicker/keyboardatetimepicker, if giving direction:… |
| [fluentui#28452](https://github.com/microsoft/fluentui/issues/28452) | 2023-07-06 | 3.3 | 0 | `style-engine` | [Bug]: fluent-accordion icons spacing broken in RTL |
| [material-ui#38004](https://github.com/mui/material-ui/issues/38004) | 2023-07-17 | 3.3 | 1 | `layout` | Tabs indicator's wrong position when using direction: rtl |
| [fluentui#28914](https://github.com/microsoft/fluentui/issues/28914) | 2023-08-20 | 3.2 | 0 | `value-direction` | [Bug]: fluent-slider does not flip in RTL |
| [fluentui#28935](https://github.com/microsoft/fluentui/issues/28935) | 2023-08-21 | 3.2 | 0 | `keyboard` | [Bug]: fluent-tabs keyboard navigation is not flipped in RTL |
| [material-ui#38909](https://github.com/mui/material-ui/issues/38909) | 2023-09-10 | 3.2 | 0 | `direction-api` | [List] ListItemText does not align according to the dir="ltr" value |
| [material-ui#39296](https://github.com/mui/material-ui/issues/39296) | 2023-10-03 | 3.1 | 0 | `mirroring` | [Tabs][material-ui] Scroll buttons in RTL mode not using slots component |
| [material-ui#40308](https://github.com/mui/material-ui/issues/40308) | 2023-12-25 | 2.9 | 8 | `animation` | [material-ui] Linear progress is not working as expected for RTL |
| [ant-design#47144](https://github.com/ant-design/ant-design/issues/47144) | 2024-01-24 | 2.8 | 0 | `style-engine` | Wrong RTL ssr style with legacyLogicalPropertiesTransformer |
| [recharts#4214](https://github.com/recharts/recharts/issues/4214) | 2024-02-21 | 2.7 | 0 | `keyboard` | Problem with accessibilityLayer in RTL |
| [dayjs#2711](https://github.com/iamkun/dayjs/issues/2711) | 2024-08-18 | 2.2 | 0 | `locale-strings` | 12:00 am is confused with 12:00 pm in Arabic local. |
| [mui-x#14458](https://github.com/mui/mui-x/issues/14458) | 2024-09-02 | 2.2 | 3 | `numerals` | [pickers] Keyboard editing date field with Eastern Arabic numbers fails parsing when usin… |
| [chartjs#11937](https://github.com/chartjs/Chart.js/issues/11937) | 2024-10-24 | 2.0 | 11 | `chart` | rtl options for axis and labels |
<!-- END generated:longest-open -->

Read as a list of openings:

1. **Calendars and numerals in the date layer** — Jalali (8.0 years), local numerals (5.7 and 5.1 years), Hijri
   formatting and month data (7.7, 4.5 years), parsing real Arabic dates (6.2 years). No general-purpose JavaScript
   date library in this set has closed these.
2. **Scroll lock without layout shift in RTL** (6.0 years) — one measured side.
3. **A direction override for value-axis components** (5.2 years).
4. **Logical properties throughout** (4.6 years, and declined again in 2025).
5. **A complete RTL-verified component set** — [primereact#3096](https://github.com/primefaces/primereact/issues/3096) has tracked "RTL support" for 4.3 years.
6. **A single `ar` locale** (4.7 years) and a complete Arabic message set for pickers (1.9 years).
7. **Charts with RTL axes** (4.1 and 2.0 years) and RTL keyboard order (2.7 years).
8. **Bidi-correct range text and date fields** (4.0 and 3.4 years).

Closed, but only after years:

<!-- BEGIN generated:longest-closed -->
52 closed reports took a year or more; 17 took two years or more.

| Report | Opened | Closed | Years | Outcome | Category | Title |
| --- | --- | --- | --- | --- | --- | --- |
| [moment-hijri#31](https://github.com/xsoh/moment-hijri/issues/31) | 2018-03-27 | 2025-11-01 | 7.6 | not planned | `direction-api` | Simply including moment-hijri into the project sets global locale for moment to ar-sa |
| [ant-design#22635](https://github.com/ant-design/ant-design/issues/22635) | 2020-03-26 | 2026-07-31 | 6.3 | completed | `value-direction` | Carousel RTL sliding direction |
| [material-ui#22726](https://github.com/mui/material-ui/issues/22726) | 2020-09-25 | 2024-12-12 | 4.2 | completed | `mirroring` | Arrow Icons are not flipped in RTL |
| [mui-x#8985](https://github.com/mui/mui-x/issues/8985) | 2023-05-14 | 2026-09-11 | 3.3 | completed | `numerals` | [pickers] Support jalali / jalaali adapters with persian digits |
| [react-spectrum#3862](https://github.com/adobe/react-spectrum/issues/3862) | 2022-12-19 | 2026-03-17 | 3.2 | fix linked | `numerals` | NumberField - Comma as the first character displays unreadable values |
| [ant-design#4051](https://github.com/ant-design/ant-design/issues/4051) | 2016-11-29 | 2020-01-02 | 3.1 | fix linked | `direction-api` | RTL support all pages and components? |
| [recharts#263](https://github.com/recharts/recharts/issues/263) | 2016-09-21 | 2019-10-16 | 3.1 | completed | `chart` | Fix direction: rtl problem |
| [react-spectrum#4896](https://github.com/adobe/react-spectrum/issues/4896) | 2023-08-10 | 2026-08-18 | 3.0 | fix linked | `keyboard` | ActionGroup's ArrowRight/Left focus navigation is incorrectly flipped in orientation="ver… |
| [react-datepicker#3738](https://github.com/Hacker0x01/react-datepicker/issues/3738) | 2022-08-28 | 2025-04-26 | 2.7 | not planned | `direction-api` | add rtl support |
| [ant-design#35478](https://github.com/ant-design/ant-design/issues/35478) | 2022-05-10 | 2024-12-30 | 2.6 | fix linked | `scroll` | Table sticky not working RTL |
| [react-spectrum#2315](https://github.com/adobe/react-spectrum/issues/2315) | 2021-09-10 | 2024-04-11 | 2.6 | completed | `value-direction` | @react-aria/slider: allow `direction` to be passed as a parameter in useSlider and useSli… |
| [recharts#682](https://github.com/recharts/recharts/issues/682) | 2017-05-09 | 2019-12-03 | 2.6 | completed | `chart` | Stacked bar chart RTL support |
| [ant-design#47488](https://github.com/ant-design/ant-design/issues/47488) | 2024-02-19 | 2026-09-10 | 2.6 | completed | `overlay-position` | support for menu's subMenu "rtl" positioning |
| [mui-x#230](https://github.com/mui/mui-x/issues/230) | 2020-08-29 | 2023-02-06 | 2.4 | fix linked | `direction-api` | [data grid] Support RTL |
| [fluentui#10900](https://github.com/microsoft/fluentui/issues/10900) | 2019-10-18 | 2022-02-04 | 2.3 | completed | `value-direction` | ColorPicker: full RTL support? |
| [dayjs#416](https://github.com/iamkun/dayjs/issues/416) | 2018-11-27 | 2021-01-03 | 2.1 | completed | `numerals` | Non-Arabic Numerals |
| [mui-x#14289](https://github.com/mui/mui-x/issues/14289) | 2024-08-22 | 2026-09-07 | 2.0 | fix linked | `scroll` | [data grid] Overlays aren't sticky in RTL mode |
<!-- END generated:longest-closed -->

Closed as not planned — declined by the maintainers or left to go stale. Each is a position Hayzo takes the other way:

<!-- BEGIN generated:declined -->
22 reports were closed as not planned.

| Report | Category | Days open | Title |
| --- | --- | --- | --- |
| [ant-design#53186](https://github.com/ant-design/ant-design/issues/53186) | `calendar` | 6 | Bug Report: Persian Calendar Leap Year Issue in Ant Design DatePicker |
| [floating-ui#2374](https://github.com/floating-ui/floating-ui/issues/2374) | `overlay-position` | 0 | arrow middleware does not return correct x and y on rtl |
| [floating-ui#3221](https://github.com/floating-ui/floating-ui/issues/3221) | `overlay-position` | 42 | Position is not correct when using native popover and RTL |
| [mantine#5002](https://github.com/mantinedev/mantine/issues/5002) | `animation` | 1 | Horizontal SegmentedControl is broken with right-to-left layout |
| [mantine#6559](https://github.com/mantinedev/mantine/issues/6559) | `input` | 18 | Issues with the PasswordInput component on mobile and in RTL |
| [mantine#6563](https://github.com/mantinedev/mantine/issues/6563) | `overlay-position` | 17 | Wrong notification position in rtl mode |
| [material-ui#47368](https://github.com/mui/material-ui/issues/47368) | `style-engine` | 7 | Switch physical direction props to logical ones (inline-start / inline-end) for better bi… |
| [moment-hijri#31](https://github.com/xsoh/moment-hijri/issues/31) | `direction-api` | 2776 | Simply including moment-hijri into the project sets global locale for moment to ar-sa |
| [mui-x#23493](https://github.com/mui/mui-x/issues/23493) | `bidi` | 26 | Issue with security scanning: Bidirectional characters in bundled MUI code are being flag… |
| [mui-x#23906](https://github.com/mui/mui-x/issues/23906) | `portal-direction` | 0 | [scheduler] Support a local `dir` in portaled content |
| [radix-primitives#2703](https://github.com/radix-ui/primitives/issues/2703) | `direction-api` | 22 | Detect page direction automatically on text direction primitives |
| [radix-primitives#3016](https://github.com/radix-ui/primitives/issues/3016) | `direction-api` | 693 | direction is not added in the html tag |
| [radix-primitives#3830](https://github.com/radix-ui/primitives/issues/3830) | `direction-api` | 86 | feat(direction): auto-detect RTL from HTML document when no DirectionProvider is present |
| [react-datepicker#3738](https://github.com/Hacker0x01/react-datepicker/issues/3738) | `direction-api` | 972 | add rtl support |
| [react-spectrum#6469](https://github.com/adobe/react-spectrum/issues/6469) | `direction-api` | 623 | Ability to manually set direction to RTL |
| [react-spectrum#8583](https://github.com/adobe/react-spectrum/issues/8583) | `portal-direction` | 33 | Popover doesn't respect dir document attribute |
| [shadcn-ui#6493](https://github.com/shadcn-ui/ui/issues/6493) | `style-engine` | 373 | [feat]: Use Logical Properties Instead of Left/Right for Better RTL Support |
| [shadcn-ui#7280](https://github.com/shadcn-ui/ui/issues/7280) | `layout` | 491 | [bug]: Side bar rightside on rtl layout margin |
| [shadcn-ui#7699](https://github.com/shadcn-ui/ui/issues/7699) | `typography` | 435 | [bug]: Text in Persian / Hijri / Jalali Calendar cells isn't centered |
| [shadcn-ui#7978](https://github.com/shadcn-ui/ui/issues/7978) | `layout` | 396 | [feat]: Dynamic Close Button Placement Based on Text Direction (dir) |
| [shadcn-ui#8198](https://github.com/shadcn-ui/ui/issues/8198) | `value-direction` | 388 | [bug]: the directions of the switch |
| [shadcn-ui#8305](https://github.com/shadcn-ui/ui/issues/8305) | `calendar` | 374 | [bug]: Month Dropdown Shows Gregorian Months in Persian / Jalali Calendar |
<!-- END generated:declined -->

## 6. Proposed regression fixtures

For the fixtures layer to adopt. Source of truth: `tools/extract/field-reports/fixtures-proposal.json` (ids are
proposals; `stats.mjs` fails if a cited report is not in the data).

<!-- BEGIN generated:fixtures -->
61 fixtures, citing 246 of the 327 reports.

| Fixture id | Scenario | Source reports |
| --- | --- | --- |
| `fr-overlay-logical-start-rtl` | Popup with placement inline-end/start under dir=rtl opens on the physical left and aligns to the trigger's right edge; physical `left`/`right` placements are not mirrored. | [mantine#2104](https://github.com/mantinedev/mantine/issues/2104), [floating-ui#1530](https://github.com/floating-ui/floating-ui/issues/1530), [ant-design#22580](https://github.com/ant-design/ant-design/issues/22580), [base-ui#951](https://github.com/mui/base-ui/issues/951) |
| `fr-overlay-flip-both-sides-rtl` | Anchor near each viewport edge in RTL: the popup flips to whichever physical side has room and stays inside the viewport. | [fluentui#9029](https://github.com/microsoft/fluentui/issues/9029), [ant-design#39195](https://github.com/ant-design/ant-design/issues/39195), [mui-x#23895](https://github.com/mui/mui-x/issues/23895) |
| `fr-overlay-arrow-rtl` | For every placement × direction the popup arrow is rendered, centred on the anchor and points at it. | [fluentui#20622](https://github.com/microsoft/fluentui/issues/20622), [material-ui#27858](https://github.com/mui/material-ui/issues/27858), [floating-ui#2374](https://github.com/floating-ui/floating-ui/issues/2374), [chakra-ui#10471](https://github.com/chakra-ui/chakra-ui/issues/10471) |
| `fr-overlay-scrollbar-left` | RTL document with a classic scrollbar on the left, absolute and fixed strategies: popup inline edge equals anchor inline edge (no offset by scrollbar width). | [floating-ui#976](https://github.com/floating-ui/floating-ui/issues/976), [floating-ui#3200](https://github.com/floating-ui/floating-ui/issues/3200), [material-ui#22540](https://github.com/mui/material-ui/issues/22540) |
| `fr-overlay-top-layer-rtl` | Popup shown in the top layer (native popover/dialog), direction switched at runtime: position stays correct. | [floating-ui#3221](https://github.com/floating-ui/floating-ui/issues/3221), [floating-ui#3418](https://github.com/floating-ui/floating-ui/issues/3418) |
| `fr-submenu-side-and-keys` | RTL nested menu: submenu opens toward the left, its chevron points left, ArrowLeft opens it and ArrowRight closes it. | [mantine#9300](https://github.com/mantinedev/mantine/issues/9300), [mantine#9285](https://github.com/mantinedev/mantine/issues/9285), [ant-design#47488](https://github.com/ant-design/ant-design/issues/47488), [ant-design#52882](https://github.com/ant-design/ant-design/issues/52882), [fluentui#19754](https://github.com/microsoft/fluentui/issues/19754) |
| `fr-portal-inherits-dir` | Trigger inside a dir=rtl container in an LTR document: dialog, popover, menu, tooltip and toast content rendered in a portal has dir=rtl and RTL layout. | [material-ui#32022](https://github.com/mui/material-ui/issues/32022), [mui-x#23906](https://github.com/mui/mui-x/issues/23906), [base-ui#3041](https://github.com/mui/base-ui/issues/3041), [react-spectrum#8583](https://github.com/adobe/react-spectrum/issues/8583), [shadcn-ui#8454](https://github.com/shadcn-ui/ui/issues/8454), [ant-design#31727](https://github.com/ant-design/ant-design/issues/31727) |
| `fr-direction-from-dom-no-provider` | Only <html dir=rtl>, no provider: tabs, slider, menu, scroll area behave and render RTL, and no component writes dir=ltr on itself. | [radix-primitives#3830](https://github.com/radix-ui/primitives/issues/3830), [radix-primitives#2378](https://github.com/radix-ui/primitives/issues/2378), [chakra-ui#9614](https://github.com/chakra-ui/chakra-ui/issues/9614), [shadcn-ui#1434](https://github.com/shadcn-ui/ui/issues/1434), [fluentui#7966](https://github.com/microsoft/fluentui/issues/7966), [radix-primitives#2703](https://github.com/radix-ui/primitives/issues/2703) |
| `fr-direction-nested-and-runtime` | An LTR island inside an RTL page and an RTL island inside an LTR page render correctly; toggling direction on a mounted tree equals a fresh mount. | [material-ui#28138](https://github.com/mui/material-ui/issues/28138), [material-ui#45193](https://github.com/mui/material-ui/issues/45193), [mantine#633](https://github.com/mantinedev/mantine/issues/633), [fluentui#3903](https://github.com/microsoft/fluentui/issues/3903), [ant-design#37059](https://github.com/ant-design/ant-design/issues/37059) |
| `fr-direction-not-from-language` | Locale ar with direction forced to ltr (and locale en with direction rtl): layout and keys follow the explicit direction, strings and numerals follow the locale. | [react-spectrum#6469](https://github.com/adobe/react-spectrum/issues/6469), [react-spectrum#10954](https://github.com/adobe/react-spectrum/issues/10954), [ant-design#26692](https://github.com/ant-design/ant-design/issues/26692) |
| `fr-slider-pointer-keys-rtl` | RTL slider: minimum at the right; pointer at 25% from the right edge gives 25%; ArrowLeft increases, Home goes to minimum; marks sit at their values. | [material-ui#13137](https://github.com/mui/material-ui/issues/13137), [mantine#8991](https://github.com/mantinedev/mantine/issues/8991), [mantine#5234](https://github.com/mantinedev/mantine/issues/5234), [fluentui#28914](https://github.com/microsoft/fluentui/issues/28914), [react-spectrum#2921](https://github.com/adobe/react-spectrum/issues/2921) |
| `fr-value-axis-direction-override` | Slider, progress, switch and rating accept direction=ltr inside an RTL page (media timeline) without changing locale. | [material-ui#28326](https://github.com/mui/material-ui/issues/28326), [react-spectrum#10112](https://github.com/adobe/react-spectrum/issues/10112), [react-spectrum#2315](https://github.com/adobe/react-spectrum/issues/2315), [material-ui#20954](https://github.com/mui/material-ui/issues/20954) |
| `fr-switch-thumb-rtl` | Switch in RTL: checked thumb at inline-end (left), thumb rect inside track rect in both states, also after a live direction change. | [shadcn-ui#10274](https://github.com/shadcn-ui/ui/issues/10274), [shadcn-ui#8198](https://github.com/shadcn-ui/ui/issues/8198), [mantine#1778](https://github.com/mantinedev/mantine/issues/1778), [chakra-ui#3638](https://github.com/chakra-ui/chakra-ui/issues/3638), [headlessui#1756](https://github.com/tailwindlabs/headlessui/issues/1756) |
| `fr-progress-direction-rtl` | Determinate, buffer and indeterminate progress fill and travel from right to left in RTL; the striped/active animation runs the same way. | [material-ui#15955](https://github.com/mui/material-ui/issues/15955), [material-ui#40308](https://github.com/mui/material-ui/issues/40308), [ant-design#43312](https://github.com/ant-design/ant-design/issues/43312) |
| `fr-rating-half-rtl` | Rating 3.5 in RTL fills the right half of the fourth star; hovering the right half of a star selects the half value. | [ant-design#22296](https://github.com/ant-design/ant-design/issues/22296), [chakra-ui#9982](https://github.com/chakra-ui/chakra-ui/issues/9982), [material-ui#20954](https://github.com/mui/material-ui/issues/20954) |
| `fr-carousel-rtl` | RTL carousel: all slides render, next moves content so that the following slide enters from the left, the next button is on the left and points left, dots follow the same order. | [ant-design#22635](https://github.com/ant-design/ant-design/issues/22635), [ant-design#54781](https://github.com/ant-design/ant-design/issues/54781), [mantine#2442](https://github.com/mantinedev/mantine/issues/2442), [mantine#3621](https://github.com/mantinedev/mantine/issues/3621), [primereact#3002](https://github.com/primefaces/primereact/issues/3002) |
| `fr-arrow-keys-orientation-matrix` | Roving focus for (horizontal, vertical, both) × (ltr, rtl): left/right swap only in RTL, up/down never; Home/End follow the same mapping. | [react-spectrum#4896](https://github.com/adobe/react-spectrum/issues/4896), [radix-primitives#468](https://github.com/radix-ui/primitives/issues/468), [floating-ui#3115](https://github.com/floating-ui/floating-ui/issues/3115), [fluentui#5438](https://github.com/microsoft/fluentui/issues/5438), [fluentui#28935](https://github.com/microsoft/fluentui/issues/28935), [headlessui#3020](https://github.com/tailwindlabs/headlessui/issues/3020) |
| `fr-grid-arrow-keys-rtl` | Data grid and calendar grid in RTL: ArrowLeft moves focus to the cell visually on the left. | [mui-x#4990](https://github.com/mui/mui-x/issues/4990), [mui-x#23894](https://github.com/mui/mui-x/issues/23894), [mantine#9329](https://github.com/mantinedev/mantine/issues/9329), [react-day-picker#1289](https://github.com/gpbl/react-day-picker/issues/1289), [react-day-picker#837](https://github.com/gpbl/react-day-picker/issues/837), [react-datepicker#1663](https://github.com/Hacker0x01/react-datepicker/issues/1663) |
| `fr-tree-arrow-keys-rtl` | Tree in RTL: ArrowLeft expands a collapsed node, ArrowRight collapses it; indentation and toggle are at inline-start. | [material-ui#18853](https://github.com/mui/material-ui/issues/18853), [ant-design#43918](https://github.com/ant-design/ant-design/issues/43918) |
| `fr-chart-keyboard-rtl` | Chart with a reversed category axis in RTL: ArrowLeft focuses the next data point. | [recharts#4214](https://github.com/recharts/recharts/issues/4214) |
| `fr-icon-mirroring-registry` | Back/forward, chevron and previous/next icons mirror in RTL; clocks, checkmarks, media controls and spinners do not; icons with a named counterpart swap to it. | [material-ui#22726](https://github.com/mui/material-ui/issues/22726), [fluentui#2285](https://github.com/microsoft/fluentui/issues/2285), [fluentui#11352](https://github.com/microsoft/fluentui/issues/11352), [fluentui#25624](https://github.com/microsoft/fluentui/issues/25624), [ant-design#26958](https://github.com/ant-design/ant-design/issues/26958), [ant-design#24085](https://github.com/ant-design/ant-design/issues/24085) |
| `fr-prev-next-pair-rtl` | Pagination, calendar header and image preview in RTL: previous is at inline-start pointing right, next at inline-end pointing left, and labels match actions. | [material-ui#20193](https://github.com/mui/material-ui/issues/20193), [mantine#3758](https://github.com/mantinedev/mantine/issues/3758), [mui-x#9989](https://github.com/mui/mui-x/issues/9989), [mui-x#8665](https://github.com/mui/mui-x/issues/8665), [react-day-picker#1288](https://github.com/gpbl/react-day-picker/issues/1288), [react-day-picker#1739](https://github.com/gpbl/react-day-picker/issues/1739), [ant-design#53523](https://github.com/ant-design/ant-design/issues/53523) |
| `fr-slots-honoured-rtl` | Custom start/end icons passed through slots are used in RTL as in LTR. | [material-ui#39296](https://github.com/mui/material-ui/issues/39296), [react-day-picker#2748](https://github.com/gpbl/react-day-picker/issues/2748) |
| `fr-scroll-normalised-rtl` | One scroll adapter: in RTL, scrolling to inline-end and back reports 0…max in every engine; tab scroll buttons, header/body sync and aligned containers use it. | [ag-grid#4045](https://github.com/ag-grid/ag-grid/issues/4045), [material-ui#30207](https://github.com/mui/material-ui/issues/30207), [mui-x#3435](https://github.com/mui/mui-x/issues/3435), [ag-grid#6779](https://github.com/ag-grid/ag-grid/issues/6779), [mui-x#23980](https://github.com/mui/mui-x/issues/23980) |
| `fr-virtual-columns-rtl` | Virtualised grid in RTL: at every horizontal offset (including both ends, and combined with vertical/infinite scrolling) the rendered column range covers the viewport. | [mui-x#12438](https://github.com/mui/mui-x/issues/12438), [mui-x#19578](https://github.com/mui/mui-x/issues/19578), [mui-x#18274](https://github.com/mui/mui-x/issues/18274), [ag-grid#2914](https://github.com/ag-grid/ag-grid/issues/2914) |
| `fr-pinned-columns-rtl` | Grid with start- and end-pinned columns in RTL: pinned cells stay at their edges while scrolling, are opaque, nothing is clipped, shadows are on the scrolled side, sticky rows compose. | [mui-x#14245](https://github.com/mui/mui-x/issues/14245), [mui-x#14953](https://github.com/mui/mui-x/issues/14953), [mui-x#20724](https://github.com/mui/mui-x/issues/20724), [mui-x#5063](https://github.com/mui/mui-x/issues/5063), [ant-design#21815](https://github.com/ant-design/ant-design/issues/21815), [ant-design#35478](https://github.com/ant-design/ant-design/issues/35478), [tanstack-table#5986](https://github.com/TanStack/table/issues/5986), [ag-grid#10240](https://github.com/ag-grid/ag-grid/issues/10240), [primereact#2189](https://github.com/primefaces/primereact/issues/2189) |
| `fr-pinning-api-logical` | Column pinned to `start` is on the right in RTL; a physical `left` (if accepted) is on the left in both directions. | [ant-design#52942](https://github.com/ant-design/ant-design/issues/52942), [mui-x#23888](https://github.com/mui/mui-x/issues/23888), [ant-design#59751](https://github.com/ant-design/ant-design/issues/59751) |
| `fr-column-resize-rtl` | RTL table: dragging a column's inline-end handle outward widens it; keyboard resize follows visual direction. | [tanstack-table#4331](https://github.com/TanStack/table/issues/4331), [mui-x#4954](https://github.com/mui/mui-x/issues/4954), [fluentui#17389](https://github.com/microsoft/fluentui/issues/17389), [ant-design#22659](https://github.com/ant-design/ant-design/issues/22659), [react-spectrum#3026](https://github.com/adobe/react-spectrum/issues/3026), [ag-grid#6677](https://github.com/ag-grid/ag-grid/issues/6677) |
| `fr-scroll-lock-no-shift-rtl` | Opening a modal on an RTL page with a classic scrollbar (on the left) shifts neither body content nor fixed elements. | [material-ui#23489](https://github.com/mui/material-ui/issues/23489), [material-ui#16670](https://github.com/mui/material-ui/issues/16670), [radix-primitives#3182](https://github.com/radix-ui/primitives/issues/3182), [shadcn-ui#9233](https://github.com/shadcn-ui/ui/issues/9233) |
| `fr-hidden-input-no-overflow-rtl` | RTL page with every form control and an open popup: document scrollWidth equals clientWidth (no overflow from visually hidden inputs or focus guards). | [radix-primitives#3216](https://github.com/radix-ui/primitives/issues/3216), [radix-primitives#4041](https://github.com/radix-ui/primitives/issues/4041), [base-ui#5635](https://github.com/mui/base-ui/issues/5635), [base-ui#5717](https://github.com/mui/base-ui/issues/5717) |
| `fr-ltr-field-in-rtl-form` | A dir=ltr email/phone/password/number field inside an RTL form: its text is LTR and its adornments, label notch, padding and radii are consistent with the field's own direction. | [mantine#8903](https://github.com/mantinedev/mantine/issues/8903), [mantine#8935](https://github.com/mantinedev/mantine/issues/8935), [material-ui#24897](https://github.com/mui/material-ui/issues/24897), [mantine#6559](https://github.com/mantinedev/mantine/issues/6559) |
| `fr-field-adornments-rtl` | RTL fields with start/end adornments, clear button, feedback icon and select indicator: none overlaps the text, widths do not change while typing. | [chakra-ui#4701](https://github.com/chakra-ui/chakra-ui/issues/4701), [chakra-ui#3755](https://github.com/chakra-ui/chakra-ui/issues/3755), [primereact#2167](https://github.com/primefaces/primereact/issues/2167), [ant-design#22420](https://github.com/ant-design/ant-design/issues/22420), [ant-design#23210](https://github.com/ant-design/ant-design/issues/23210), [react-datepicker#1531](https://github.com/Hacker0x01/react-datepicker/issues/1531) |
| `fr-digit-sequence-ltr` | OTP/PIN input under dir=rtl: the first typed digit lands in the leftmost slot and slots read left to right. | [shadcn-ui#11201](https://github.com/shadcn-ui/ui/issues/11201), [mantine#6382](https://github.com/mantinedev/mantine/issues/6382) |
| `fr-multi-element-number-isolated` | Animated badge counter 10 and 125 in RTL read 10 and 125; a hh:mm toolbar reads hours then minutes. | [ant-design#22555](https://github.com/ant-design/ant-design/issues/22555), [ant-design#43971](https://github.com/ant-design/ant-design/issues/43971), [mui-x#5561](https://github.com/mui/mui-x/issues/5561), [mui-x#11525](https://github.com/mui/mui-x/issues/11525) |
| `fr-range-text-bidi` | `1–5 of 5`, `2 / 10` and `21–30 of 100` inside an RTL paragraph, with Latin and with Arabic words, keep each number and range intact and in order. | [material-ui#35169](https://github.com/mui/material-ui/issues/35169), [mui-x#20125](https://github.com/mui/mui-x/issues/20125), [ant-design#53528](https://github.com/ant-design/ant-design/issues/53528) |
| `fr-date-segments-order` | Date and time fields for ar, he and fa: segment visual order equals the locale's formatted string, for slash, dash, dot and space patterns. | [react-spectrum#4711](https://github.com/adobe/react-spectrum/issues/4711), [mui-x#9317](https://github.com/mui/mui-x/issues/9317), [mui-x#8284](https://github.com/mui/mui-x/issues/8284), [mui-x#8727](https://github.com/mui/mui-x/issues/8727) |
| `fr-no-bidi-controls-in-output` | Formatted dates and field values contain no bidi control characters; parsing accepts and ignores them; shipped bundles contain none as literals. | [dayjs#2977](https://github.com/iamkun/dayjs/issues/2977), [date-fns#1927](https://github.com/date-fns/date-fns/issues/1927), [mui-x#23493](https://github.com/mui/mui-x/issues/23493) |
| `fr-digits-typing-all-systems` | Typing 123, ١٢٣ and ۱۲۳ into number and date fields yields 123; the display numbering system stays the configured one. | [base-ui#4718](https://github.com/mui/base-ui/issues/4718), [react-spectrum#6623](https://github.com/adobe/react-spectrum/issues/6623), [mui-x#14458](https://github.com/mui/mui-x/issues/14458) |
| `fr-number-parse-roundtrip` | parse(format(x)) = x for every CLDR locale × numbering system; punctuation-only or whitespace-only input never changes the numbering system. | [react-spectrum#10936](https://github.com/adobe/react-spectrum/issues/10936), [react-spectrum#3862](https://github.com/adobe/react-spectrum/issues/3862), [react-spectrum#10875](https://github.com/adobe/react-spectrum/issues/10875), [react-spectrum#3114](https://github.com/adobe/react-spectrum/issues/3114) |
| `fr-date-field-numerals` | Date field with arab and arabext digits: no NaN in any segment, stepping a segment keeps the value valid, for Gregorian, Hijri and Persian calendars. | [mui-x#11488](https://github.com/mui/mui-x/issues/11488), [mui-x#8985](https://github.com/mui/mui-x/issues/8985), [mui-x#14458](https://github.com/mui/mui-x/issues/14458) |
| `fr-date-format-numbering-system` | Formatting a date for ar with numbering system arab and with latn changes every numeric field and nothing else; predicates do not depend on digits. | [date-fns#2203](https://github.com/date-fns/date-fns/issues/2203), [date-fns#2700](https://github.com/date-fns/date-fns/issues/2700), [dayjs#1706](https://github.com/iamkun/dayjs/issues/1706), [dayjs#416](https://github.com/iamkun/dayjs/issues/416), [dayjs#3234](https://github.com/iamkun/dayjs/issues/3234), [react-day-picker#246](https://github.com/gpbl/react-day-picker/issues/246), [recharts#7548](https://github.com/recharts/recharts/issues/7548) |
| `fr-day-period-boundaries-ar` | Arabic day period: 00:00 and 11:59 give ص, 12:00 and 23:59 give م, in every Arabic regional locale. | [dayjs#1941](https://github.com/iamkun/dayjs/issues/1941), [dayjs#2711](https://github.com/iamkun/dayjs/issues/2711), [dayjs#2951](https://github.com/iamkun/dayjs/issues/2951) |
| `fr-hijri-umalqura-table` | Every Umm al-Qura month in the supported range has 29 or 30 days, years have 354 or 355, and conversion agrees with ICU islamic-umalqura day by day. | [moment-hijri#105](https://github.com/xsoh/moment-hijri/issues/105), [moment-hijri#79](https://github.com/xsoh/moment-hijri/issues/79), [react-day-picker#3029](https://github.com/gpbl/react-day-picker/issues/3029), [mui-x#22728](https://github.com/mui/mui-x/issues/22728) |
| `fr-persian-leap-years` | Persian calendar: Esfand 1403 has 30 days, every month of 1403–1405 starts on day 1, Gregorian↔Persian round-trips over several centuries, old years render with any time zone. | [ant-design#53186](https://github.com/ant-design/ant-design/issues/53186), [react-spectrum#5960](https://github.com/adobe/react-spectrum/issues/5960), [react-spectrum#3757](https://github.com/adobe/react-spectrum/issues/3757), [react-day-picker#2842](https://github.com/gpbl/react-day-picker/issues/2842), [dayjs#2840](https://github.com/iamkun/dayjs/issues/2840) |
| `fr-calendar-fields-one-calendar` | Full, medium and short dates and every caption layout in Hijri and Persian calendars draw day, month name and year from that calendar (no Gregorian day or month). | [mui-x#22965](https://github.com/mui/mui-x/issues/22965), [mui-x#22964](https://github.com/mui/mui-x/issues/22964), [react-day-picker#2612](https://github.com/gpbl/react-day-picker/issues/2612), [shadcn-ui#8305](https://github.com/shadcn-ui/ui/issues/8305) |
| `fr-calendar-month-navigation` | Hijri calendar: from the 30th of a month, next month lands in the following month (clamped), never skipping one. | [react-datepicker#3330](https://github.com/Hacker0x01/react-datepicker/issues/3330) |
| `fr-weekday-labels` | Weekday headers for ar, he and fa use CLDR narrow/short forms, are distinct, fit the cell, and match the column order of the day cells. | [mui-x#10790](https://github.com/mui/mui-x/issues/10790), [mui-x#5330](https://github.com/mui/mui-x/issues/5330), [ant-design#54168](https://github.com/ant-design/ant-design/issues/54168), [react-day-picker#1374](https://github.com/gpbl/react-day-picker/issues/1374) |
| `fr-calendar-numerals-centred` | Day cells with latn, arab and arabext digits are optically centred in each bundled font. | [shadcn-ui#7699](https://github.com/shadcn-ui/ui/issues/7699) |
| `fr-calendar-language-numerals-independent` | A Hijri date formats in English with Latin digits and in Arabic with either digit set; importing calendar support changes no global state. | [moment-hijri#47](https://github.com/xsoh/moment-hijri/issues/47), [moment-hijri#31](https://github.com/xsoh/moment-hijri/issues/31) |
| `fr-chart-rtl-layout` | Chart in RTL: value axis at the right, tick labels outside the plot, legend marks before labels, continuous legend reversed with its labels, tooltip box padding correct, highlights on the data points, legend click toggles the clicked series. | [mui-x#13613](https://github.com/mui/mui-x/issues/13613), [mui-x#12118](https://github.com/mui/mui-x/issues/12118), [mui-x#16094](https://github.com/mui/mui-x/issues/16094), [mui-x#16987](https://github.com/mui/mui-x/issues/16987), [mantine#5505](https://github.com/mantinedev/mantine/issues/5505), [chartjs#9194](https://github.com/chartjs/Chart.js/issues/9194), [chartjs#9324](https://github.com/chartjs/Chart.js/issues/9324), [chartjs#10771](https://github.com/chartjs/Chart.js/issues/10771), [chartjs#11937](https://github.com/chartjs/Chart.js/issues/11937), [recharts#682](https://github.com/recharts/recharts/issues/682), [fluentui#14352](https://github.com/microsoft/fluentui/issues/14352) |
| `fr-indicator-follows-selection-rtl` | Tabs and segmented control in RTL, including overflow and a direction change: after the transition the indicator rect equals the selected item's rect; it starts from the right. | [material-ui#26450](https://github.com/mui/material-ui/issues/26450), [material-ui#38004](https://github.com/mui/material-ui/issues/38004), [ant-design#40128](https://github.com/ant-design/ant-design/issues/40128), [mantine#5002](https://github.com/mantinedev/mantine/issues/5002), [chakra-ui#5235](https://github.com/chakra-ui/chakra-ui/issues/5235) |
| `fr-drawer-slide-side` | Drawer on start, end, left and right in RTL: placed on the resolved side, first animation frame adjacent to that edge, resize handle on the inner edge, close button at inline-end. | [material-ui#33981](https://github.com/mui/material-ui/issues/33981), [material-ui#25336](https://github.com/mui/material-ui/issues/25336), [mantine#4917](https://github.com/mantinedev/mantine/issues/4917), [mantine#4359](https://github.com/mantinedev/mantine/issues/4359), [fluentui#30801](https://github.com/microsoft/fluentui/issues/30801), [shadcn-ui#9519](https://github.com/shadcn-ui/ui/issues/9519), [ant-design#56692](https://github.com/ant-design/ant-design/issues/56692), [shadcn-ui#7978](https://github.com/shadcn-ui/ui/issues/7978) |
| `fr-toast-side-and-swipe` | Toast region at `end` is on the left in RTL and swipe-to-dismiss goes toward that edge; a physical `right` stays right. | [radix-primitives#2368](https://github.com/radix-ui/primitives/issues/2368), [material-ui#32794](https://github.com/mui/material-ui/issues/32794), [mantine#6563](https://github.com/mantinedev/mantine/issues/6563) |
| `fr-no-physical-inline-css` | Lint over recipes, examples and docs: no physical inline property or class (left/right margins, paddings, insets, radii, text-align) outside the listed physical-geometry exemptions. | [material-ui#32198](https://github.com/mui/material-ui/issues/32198), [material-ui#47368](https://github.com/mui/material-ui/issues/47368), [shadcn-ui#6493](https://github.com/shadcn-ui/ui/issues/6493), [shadcn-ui#1919](https://github.com/shadcn-ui/ui/issues/1919), [shadcn-ui#9515](https://github.com/shadcn-ui/ui/issues/9515), [fluentui#28452](https://github.com/microsoft/fluentui/issues/28452), [material-ui#40299](https://github.com/mui/material-ui/issues/40299), [tailwindcss#949](https://github.com/tailwindlabs/tailwindcss/issues/949) |
| `fr-gap-not-margins` | Stack/group with spacing and with dividers in RTL: equal gaps between all items, none at the edges, dividers between items. | [tailwindcss#2017](https://github.com/tailwindlabs/tailwindcss/issues/2017), [tailwindcss#7179](https://github.com/tailwindlabs/tailwindcss/issues/7179), [fluentui#15795](https://github.com/microsoft/fluentui/issues/15795) |
| `fr-attached-group-corners-rtl` | Attached button group, split button and date range ends in RTL: outer corners rounded, inner square, divider between. | [chakra-ui#4796](https://github.com/chakra-ui/chakra-ui/issues/4796), [fluentui#13708](https://github.com/microsoft/fluentui/issues/13708), [react-day-picker#1277](https://github.com/gpbl/react-day-picker/issues/1277) |
| `fr-centering-rtl` | Absolutely centred child and slider mark labels are centred in RTL. | [chakra-ui#9526](https://github.com/chakra-ui/chakra-ui/issues/9526), [ant-design#21585](https://github.com/ant-design/ant-design/issues/21585) |
| `fr-vertical-unaffected-by-rtl` | Vertically oriented splitter, slider, tabs and steps render identically along the block axis in LTR and RTL. | [ant-design#56101](https://github.com/ant-design/ant-design/issues/56101), [react-spectrum#4896](https://github.com/adobe/react-spectrum/issues/4896) |
| `fr-dir-auto-content` | Content inside dir=auto that resolves to RTL gets RTL styles and behaviour. | [tailwindcss#14305](https://github.com/tailwindlabs/tailwindcss/issues/14305) |
| `fr-arabic-strings-complete` | Build check: every message key of every component (visible and aria) has an Arabic value; base `ar` exists without a region. | [mui-x#15650](https://github.com/mui/mui-x/issues/15650), [material-ui#31847](https://github.com/mui/material-ui/issues/31847), [ant-design#26687](https://github.com/ant-design/ant-design/issues/26687), [date-fns#2262](https://github.com/date-fns/date-fns/issues/2262) |
| `fr-csv-export-arabic` | CSV export of Arabic cell text opens correctly in Excel (UTF-8 with BOM), compared byte for byte. | [mui-x#9545](https://github.com/mui/mui-x/issues/9545) |
<!-- END generated:fixtures -->

## 7. Findings that matter for an Arabic-first design

1. **The defects are structural, not accidental.** The same thirteen classes recur in every library regardless of age
   or architecture, and the largest class is not a rendering bug at all but how direction is declared.
2. **CSS gives mirroring of layout for free and nothing else.** Keys, pointer maths, scroll offsets, measured
   indicators, portals, charts and motion each need direction as an explicit input. Code that already uses logical
   properties still produces the behavioural classes ([chakra-ui#9614](https://github.com/chakra-ui/chakra-ui/issues/9614), [mui-x#23894](https://github.com/mui/mui-x/issues/23894), [mui-x#23906](https://github.com/mui/mui-x/issues/23906)).
3. **Flip-after-the-fact is a dead end** — as a CSS plugin, an install-time codemod or a reverse transform.
4. **RTL defects regress.** Pinned columns in MUI X were reported four times between 2022 and 2025, twice as
   regressions; the badge digit order in Ant Design twice; day-grid arrow keys in React DayPicker twice. Each needs a
   permanent fixture.
5. **Direction is not language.** Users need Arabic strings with LTR layout, RTL layout without Arabic, LTR fields in
   RTL forms, LTR media timelines in RTL pages, and Arabic with either digit set. Every inference from one dimension
   to another shows up as a report.
6. **Non-Gregorian calendar data in the ecosystem is unreliable** and largely unverified against official sources.
7. **Maintainers say why.** RTL is a small share of users ([material-ui#22726](https://github.com/mui/material-ui/issues/22726)), a feature to wait for votes on
   ([mui-x#230](https://github.com/mui/mui-x/issues/230)), not on the roadmap ([fluentui#10900](https://github.com/microsoft/fluentui/issues/10900)), a breaking change now ([material-ui#47368](https://github.com/mui/material-ui/issues/47368)). Most reports get
   closed; the capabilities in section 5 stay open because RTL is nobody's default case.

## 8. Gaps and open questions

Gaps:

- **Threads read for 22 of 327 reports.** The per-issue API was not reachable, so for the rest only the issue body,
  state, dates and (for 93) the linked fix were available. 84 reports carry `needs-review` for that reason, and
  `resolution` is present only where the outcome was actually read or follows from the linked fix.
- **`fixedBy` is a lower bound**: it finds a fix only when the pull request matched one of nine search terms and names
  the issue after a closing keyword.
- **Discussions are not covered.** Tailwind CSS, shadcn/ui and React Spectrum move many reports to GitHub
  Discussions, which the issue search does not return; Tailwind (5 reports) is under-represented for that reason.
- **Search depth**: best-match order, at most 500 results per term for `rtl` and 200 for `"right-to-left"` and
  `arabic`. Only Material UI's `"right-to-left"` (311 matches) exceeded a cap; `rtl` was read in full everywhere.
- **Not searched**: the packages underneath the big libraries where several defects actually live (rc-table,
  rc-picker and the slider behind Ant Design's carousel, Zag/Ark under Chakra, Embla under Mantine's carousel,
  the stylis RTL plugin), Vue/Angular/Svelte libraries, and native platforms.
- **Reactions** are those on the issue body only; **comments** counts are as of retrieval.
- Fluent UI (394 candidates) and Material UI (513) were sampled from the top of the ranking; more reports of the same
  classes exist there.

Open questions for design:

1. Default mirroring per value-axis component: progress and slider mirror, media does not — what about rating and
   switch? Users disagree ([material-ui#20954](https://github.com/mui/material-ui/issues/20954), [material-ui#28326](https://github.com/mui/material-ui/issues/28326), [shadcn-ui#11201](https://github.com/shadcn-ui/ui/issues/11201)).
2. Sign placement for Arabic-digit numbers: the reporter and the maintainers of [react-spectrum#1880](https://github.com/adobe/react-spectrum/issues/1880) expected opposite
   things. Follow CLDR and document it?
3. Chart mirroring policy: do time-series x-axes reverse in RTL, or only categorical ones?
4. Do we accept physical `left`/`right` values at all in public APIs (for migration), or reject them?
5. `dir="auto"` subtrees ([tailwindcss#14305](https://github.com/tailwindlabs/tailwindcss/issues/14305)): supported as a first-class case?
6. Range of Umm al-Qura support and behaviour beyond the officially published years ([react-day-picker#3029](https://github.com/gpbl/react-day-picker/issues/3029)).
7. Arabic narrow weekday labels: which CLDR width fits a 7-column grid at our densities ([ant-design#54168](https://github.com/ant-design/ant-design/issues/54168))?

## 9. Requests to other layers

- **fixtures** — adopt section 6. Highest value first: `fr-scroll-normalised-rtl`, `fr-pinned-columns-rtl`,
  `fr-hidden-input-no-overflow-rtl`, `fr-arrow-keys-orientation-matrix`, `fr-date-segments-order`,
  `fr-number-parse-roundtrip`, `fr-hijri-umalqura-table`, `fr-persian-leap-years`, `fr-portal-inherits-dir`.
- **rules** — add rules with checks for: no physical inline properties (with the exemption list of 4.13); no bidi
  control characters in output or published bundles; public names use start/end; a component never writes `dir`
  unasked; portal roots carry `dir`; visually hidden elements stay inside their control; `scrollLeft` only in the
  scroll adapter; no truncation of localised names; no comparison of formatted strings.
- **patterns** — every keyboard contract needs its RTL variant as data: the (key, orientation, direction) table,
  tree and submenu "into/out of" keys, grid navigation, Home/End, column resize by keyboard.
- **icons** — a mirroring rule per icon (`mirror` / `keep` / `swap:<name>`), and the same for motion (spinners keep,
  linear progress mirrors); separators: slash keeps, chevron mirrors.
- **calendar** — validate the Umm al-Qura table (29/30-day months, 354/355-day years), cross-check against ICU
  `islamic-umalqura`, record the supported range; Persian leap years with 1403 as a named case; month names per
  (calendar, locale).
- **language** — CLDR weekday names in narrow/short/abbreviated widths for ar, he, fa; Arabic day periods with the
  12:00 boundary; a base `ar` message set.
- **regions** — default numbering system per Arabic-speaking region (the data behind [dayjs#1706](https://github.com/iamkun/dayjs/issues/1706) and [date-fns#2203](https://github.com/date-fns/date-fns/issues/2203)).
- **catalog/universe** — mark value-axis components (slider, progress, rating, switch, carousel, stepper, media) as
  needing a `direction` override; mark digit-sequence inputs as LTR-always.
- **catalog/libraries** — where another library's API uses physical names with logical behaviour (`fixed: 'left'`,
  `labelAlign`, `anchorOrigin`, `side`), record it; migration codemods need that mapping.
- **fonts** — vertical metrics of arab and arabext digits per bundled face ([shadcn-ui#7699](https://github.com/shadcn-ui/ui/issues/7699)).

## 10. What L1 and L2 should build from this

L1 (core):

- A locale context type with independent `direction`, `language`, `numberingSystem`, `calendar`; `directionOf(locale)`
  as a pure function usable on the server ([react-spectrum#6985](https://github.com/adobe/react-spectrum/issues/6985)).
- Digit conversion generated from Unicode data; number parsing that round-trips formatting and never infers the
  numbering system from punctuation.
- Bidi utilities: an isolate helper for composite numbers and ranges, stripping of control characters on input,
  a guarantee of none on output.
- Calendars (Gregorian, Umm al-Qura, tabular Islamic, Persian) behind one interface and one conformance suite; no
  global state; civil-date conversion independent of time zone.

L2 (engines):

- `direction` is a required input of every engine with an inline axis; the key-resolution table is shared.
- A scroll adapter (normalised inline offset, scrollbar side, scroll lock) used by `virtual-list`, `table-model`,
  `tabs`, `carousel`, `drag-sort` auto-scroll.
- `anchored-position`: logical side and alignment, resolved before collision, physical output; scrollbar-aware.
- `overlay-layers`: portal roots inherit `dir`/`lang` from the opener.
- `slider` and other value-axis engines: one value↔position function, direction override.
- `carousel` and `resize` as our own direction-aware engines, not wrappers.
- `calendar-grid` and `segmented-input`: calendar and numbering system as parameters; segment order from the
  locale's formatted string.

## 11. Reproducing

```
S=<scratch dir outside the repository>
node tools/extract/field-reports/search.mjs $S                 # issues: every repository × term (cached)
node tools/extract/field-reports/search.mjs $S --prs --terms 'rtl,"right-to-left",arabic,hijri,bidi,persian,jalali,"dir=rtl","logical properties"'
node tools/extract/field-reports/shortlist.mjs $S mui/mui-x --min 6      # ranked titles to read
node tools/extract/field-reports/digest.mjs $S mui/mui-x 9317 14458      # bodies of chosen issues
node tools/extract/field-reports/build.mjs $S --date 2026-11-11          # notes + cache → data/field-reports
node tools/validate.mjs data/field-reports
node tools/extract/field-reports/stats.mjs --write docs/research/field-reports.md
```

Issue state changes over time; a later run will update states, dates and counts, and `daysOpen` of open issues grows
with `--date`.
