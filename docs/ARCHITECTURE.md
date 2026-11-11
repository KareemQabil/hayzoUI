# Architecture

Hayzo is built data-first. Facts are collected once, in one model, with their sources; code is generated from
them or written against them. A layer may depend only on layers above it in this table.

| Layer | What it is | Depends on | Status |
|---|---|---|---|
| L0 Knowledge | `data/` — regions, currencies, language, calendars, phone, finance, component universe, behaviour patterns, icons, fonts, token references, rules, fixtures, field reports | — | **this phase** |
| L1 Core | Pure TypeScript, zero dependencies, no DOM: locale, numerals, number, money, date, phone, text (bidi, search, names), identity (IBAN, ids). Lookup tables generated from L0 | L0 | next |
| L2 Engines | Headless state machines, pure TypeScript: one engine serves many components | L1 | next |
| L3 Tokens and recipes | Typed tokens resolved to CSS variables; recipes compiled to plain CSS with logical properties and `data-*` state hooks | L0 | later |
| L4 Components | Framework adapters (React first) that bind an engine to a recipe; no component owns a colour, a size or a direction | L2, L3 | later |
| L5 Patterns | Complete tasks: invoice, receipt, checkout, pro table, pro form, address by country | L4 | later |
| L6 Distribution | npm packages, copy-paste registry and CLI, knowledge export for agents, documentation in Arabic first | all | later |

Cross-cutting: icons (own set with a mirroring rule per icon), typography (self-hosted Arabic faces with measured
line heights), evidence (every claim of support is a recorded test run).

## How each dataset is used

| Dataset | Feeds |
|---|---|
| regions, currencies | L1 locale and money tables; currency and country pickers; default numerals, week and calendar per region |
| language | L1 plural selection, amount in words, month and weekday names, relative time, search normalisation |
| calendar | L1 date conversion and the calendar-grid engine |
| phone | L1 phone parsing and formatting; phone field |
| finance | L1 identity validators, VAT and rounding helpers; invoice and receipt patterns |
| catalog/libraries | The measured feature universe; migration guides and codemods from each library |
| catalog/universe | The build plan: every component, its engine, its tier, its Arabic requirements |
| patterns | L2 engine contracts and generated keyboard tests, including the RTL variants |
| icons | The icon set and its RTL mirroring registry |
| fonts | Typography tokens: families, weights, line heights that clear tashkeel |
| tokens/reference | Our density, spacing, radius and type scales, decided against what others ship |
| rules, fixtures, field-reports | The test harness: each rule has checks, each defect seen elsewhere becomes a fixture |

## Engine ids

The universe (`data/catalog/universe`) names engines from this closed list. Add to it here before using a new id.

`press` · `toggle` · `field` · `text-input` · `numeric-input` · `segmented-input` · `roving-focus` · `collection` ·
`selection` · `listbox` · `typeahead` · `menu` · `combobox` · `disclosure` · `tabs` · `overlay-layers` ·
`focus-scope` · `anchored-position` · `dialog` · `tooltip` · `toast-queue` · `calendar-grid` · `date-range` ·
`time` · `form` · `table-model` · `grid-navigation` · `tree-model` · `virtual-list` · `pagination` · `stepper` ·
`slider` · `drag-sort` · `resize` · `scroll-spy` · `upload-queue` · `carousel` · `color` · `none`

## Principles

1. Arabic is the default case, not a translation: direction, numerals, calendar and currency are separate, explicit
   dimensions of a locale, never inferred from one string.
2. No runtime dependency beyond the framework adapter's own framework.
3. Behaviour and appearance never know each other: engines emit state, recipes read `data-*` attributes.
4. Every claim has evidence, every datum has a source, and unknown is written as unknown.
5. Other libraries are studied as specifications (their API surface, their defects), never copied as code.
