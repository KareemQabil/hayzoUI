# Data model

Every file under `data/` (except `data/schema/`) is one JSON document with the same envelope:

```json
{
  "kind": "region",
  "schemaVersion": 1,
  "id": "EG",
  "provenance": {
    "method": "extracted",
    "confidence": "verified",
    "sources": [{ "name": "Unicode CLDR", "url": "https://github.com/unicode-org/cldr-json", "version": "48.0.0", "license": "Unicode-3.0", "retrievedAt": "2026-11-11" }],
    "script": "tools/extract/regions/build.mjs"
  },
  "data": {}
}
```

`kind` selects the schema `data/schema/<kind>.schema.json`; `node tools/validate.mjs` checks every file.

## Kinds

| Kind | Path | One file is |
|---|---|---|
| `region` | `data/regions/<ISO2>.json` | A country: locales, numerals, week, calendars, time zones, currency |
| `currency` | `data/currencies/<ISO>.json` | A currency: names with Arabic plural forms, symbols, minor units, cash rounding |
| `language` | `data/language/<lang>/<dataset>[.<scope>].json` | One dataset: plural rules, spell-out, months, characters … |
| `calendar` | `data/calendar/<id>.json` | A calendar system |
| `phone` | `data/phone/<ISO2>.json` | A numbering plan |
| `finance` | `data/finance/<dataset>/<ISO2>.json` | VAT, e-invoicing, IBAN, national id, tax id … as sourced claims |
| `library-api` | `data/catalog/libraries/<id>.json` | The component API of one existing library |
| `component` | `data/catalog/universe/<id>.json` | One canonical component we intend to cover |
| `pattern` | `data/patterns/<id>.json` | Keyboard, focus and ARIA contract of an interaction pattern |
| `icon` | `data/icons/…` | A source catalog, the mirroring rules, or our core set |
| `font` | `data/fonts/<id>.json` | An open Arabic typeface with metrics |
| `token-reference` | `data/tokens/reference/<id>.json` | The scales another design system ships |
| `rule` | `data/rules/<ID>.json` | An interface rule with its checks |
| `fixture` | `data/fixtures/<id>.json` | A set of test inputs and expected results |
| `field-report` | `data/field-reports/<library>.json` | Real Arabic/RTL defects elsewhere, with the lesson of each |

## Conventions

- **Provenance is not optional.** `method`: `extracted` (copied by a committed script, which `script` names) ·
  `derived` (computed from extracted data) · `researched` (read and re-expressed) · `authored` (original).
- **Confidence means something.** `verified`: mechanical extraction from an authoritative source, or checked
  against a primary source. `needs-review`: cited but secondary, or written from model knowledge. `unverified`:
  no source yet. A file takes the lowest confidence of anything in it; facts that change (tax rates) are `claims`
  with their own source, date and confidence.
- **Unknown stays unknown.** Omit an optional field rather than guess it, and list it under gaps in the layer report.
- **Arabic text** comes from an authoritative Arabic source (CLDR, an official publication) or the file is
  `needs-review`.
- **Identifiers:** regions ISO 3166-1 alpha-2, currencies ISO 4217, locales BCP 47, calendars and numbering
  systems Unicode identifiers, time zones IANA, component and pattern ids kebab-case.
- **Money is integer minor units** wherever an amount appears.
- **Formatting:** UTF-8, two-space indentation, a trailing newline, keys in schema order, arrays in a stable order.
  No bidi control characters in data unless the datum is about them.
- **Schemas** are owned with their layer. Changes are additive within `schemaVersion: 1`; the envelope and
  `common.schema.json` do not change without changing every layer.
