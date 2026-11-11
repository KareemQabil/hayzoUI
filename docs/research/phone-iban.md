# Phone numbering plans and IBAN formats

Layer report, 2026-11-11. Data: `data/phone/`, `data/finance/iban/`. Scripts: `tools/extract/phone/build.mjs`,
`tools/extract/iban/build.mjs`. Both are zero-dependency Node 22 scripts (no XML parser was installed; the phone
script carries a small reader for the one XML file it needs). Both regenerate their files byte-for-byte (checked by
running twice and comparing SHA-256 of all 43 files).

## What was collected

### Phone — 22 of 22 regions

| | Count |
|---|---|
| Files | 22 (`AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE`), all `verified` |
| Number types | 83: fixedLine 22, mobile 22, tollFree 13, premiumRate 11, sharedCost 8, voip 2, pager 2, uan 2, personalNumber 1; voicemail 0 |
| Formatting rules | 54 |
| Operators | 88, with 403 prefixes; 3 have an Arabic name |
| Examples verified | 83 of 83 match their own pattern, their own lengths and the region's general pattern |
| Format round trips | 498 of 498 pass |

Each file carries: calling code, international prefix, national (trunk) prefix, whether numbers are portable, the
general pattern with possible lengths, every number type libphonenumber defines for the region (pattern, possible
lengths, local-only lengths, example), the formatting rules (pattern, format, leading digits, national-prefix rule,
whether the prefix is optional when formatting), and operators.

Verification is a small parser/formatter inside the script that reads only the produced documents. For every
example it formats nationally and internationally and parses back: national, national in Arabic-Indic digits,
national in Extended Arabic-Indic digits, E.164, international, international in Arabic-Indic digits. No failure;
nothing was patched. Four informational notes it printed:

- TN: the fixed-line example `30010123` also matches the mobile pattern (libphonenumber would answer
  "fixed line or mobile").
- Operator prefixes that did not complete to a valid number in a deterministic sample: BH Batelco `64`,
  JO Orange `4`, OM Ooredoo `1`. The carrier files are coarser than the number patterns; treat a carrier match as
  valid only after the number itself validates.

### IBAN — 21 files, 1 region without

| Status | Regions |
|---|---|
| Registered with SWIFT, `verified` (15) | AE BH EG IQ KW LB LY MR OM PS QA SA SD SO YE |
| Registered with SWIFT, `needs-review` (3) | DJ JO TN |
| Not registered with SWIFT, `needs-review` (3) | DZ KM MA |
| No IBAN format in any source read (1) | SY — no file |

Each file has total length, a full-IBAN pattern, charset, the check-digit algorithm (ISO 7064 MOD 97-10), segments
(country code, check digits, bank code, branch code, account number, national check digits where they exist) with
0-based start in the electronic-format IBAN, length and SWIFT character class, and for the 18 registered formats
the registry example. All 18 examples pass the script's own MOD 97-10, length and pattern checks.

Why the six are `needs-review`:

- **JO** — SWIFT registry release 96 gives the bank identifier at BBAN 5–8 (the same span as the branch);
  the current registry extract and Wikipedia give 1–4. File follows the current extract.
- **TN** — release 96 gives the bank identifier at BBAN 1–5 with a 2-digit pattern; current extract gives 1–2.
- **DJ** — schwifty's hand-maintained file splits the last 2 digits off as national check digits (as in MR, whose
  structure is identical); Wikipedia counts them as part of the account number. File follows schwifty.
- **DZ** — not registered, and sources disagree on the length: 26 (schwifty, ibantools, Wikipedia) against 24
  (iban.js, php-iban). No length, pattern or segments are written; both values are in `claims`.
- **KM** (27) and **MA** (28) — not registered; lengths agree across four sources, segment positions come from one
  hand-maintained file (MA) or are absent (KM). Unofficial examples are kept only as `claims`.

Disagreements found only in the hand-maintained libraries (recorded in each file's `notes`, not followed):
iban.js gives IQ and JO different character classes; php-iban gives QA a branch code and `4!a4!n17!c`, and EG, MA
different bank/branch offsets. ibantools' bank/branch/account positions mix BBAN-relative and IBAN-relative
offsets (and JO's bank position repeats the branch), so only its lengths and character classes were compared.

## Sources

| Source | Version | License | Used for |
|---|---|---|---|
| [Google libphonenumber](https://github.com/google/libphonenumber) | v9.0.43, released 2026-11-04, commit `86ea33cee5c22ab7e23b3de368e7cc7fa439a2b7` | Apache-2.0 | `resources/PhoneNumberMetadata.xml`, `resources/carrier/en/*.txt`, `resources/carrier/ar/965.txt` |
| [schwifty](https://github.com/mdomke/schwifty) `iban_registry/` | commit `d407f23eae5eac2e0acd9a9db53d13ab8c78916f` (2026-11-10) | MIT | IBAN primary: `generated.json` is produced mechanically from the SWIFT registry TXT; `overwrite.json` is hand-maintained |
| SWIFT IBAN Registry release 96 (Feb 2024), verbatim TXT in [jschaedl/iban-validation](https://github.com/jschaedl/iban-validation) | commit `af9987299645a8f85c703e36b6e7fed409a7fe84` | SWIFT publication, read as facts; repository MIT | Cross-check and examples (17 regions; YE is newer than release 96) |
| [Wikipedia, International Bank Account Number](https://en.wikipedia.org/wiki/International_Bank_Account_Number) | revision 1383718960 (2026-11-04); its table cites registry release 99 | CC BY-SA 4.0, read as facts | Cross-check of length, classes and segment layout |
| [ibantools](https://github.com/Simplify/ibantools) | 4.5.4 (npm) | MIT OR MPL-2.0 | Tertiary cross-check |
| [iban.js](https://github.com/arhs/iban.js) | 0.0.14 (npm) | MIT | Tertiary cross-check (12 of our regions; last release predates LY, SD, SO, DJ, OM, YE) |
| [php-iban](https://github.com/globalcitizen/php-iban) `registry.txt` | commit `9dd1884d9b62235eceed0918e9538753ec5988cb` | LGPL-3.0, read as facts | Tertiary cross-check; YE example |

All retrieved 2026-11-11. The SWIFT site itself could not be read: `https://www.swift.com/swift-resource/11971/download`
answered 403 with a "site off-line" page, and web.archive.org was not reachable. So "verified" for IBAN means:
the mechanical extract of the current registry (schwifty) agrees with an older verbatim registry copy and with
Wikipedia on length, character classes and segment boundaries, and the example passes MOD 97-10. YE is verified
against schwifty, Wikipedia, ibantools and php-iban only.

Regenerating:

```
git clone --depth 1 --branch v9.0.43 --filter=blob:none --sparse https://github.com/google/libphonenumber $LPN
git -C $LPN sparse-checkout set --no-cone /resources/PhoneNumberMetadata.xml /resources/carrier/en/ /resources/carrier/ar/ /LICENSE /release_notes.txt
node tools/extract/phone/build.mjs $LPN

node tools/extract/iban/build.mjs --schwifty <schwifty clone> \
  --swift <iban-validation clone>/Resource/iban_registry_202402r96.txt \
  --wikipedia <wikitext from index.php?title=International_Bank_Account_Number&action=raw> \
  --ibantools <npm pack ibantools, untarred>/package/jsnext/ibantools.js \
  --ibanjs <npm pack iban, untarred>/package/iban.js --phpiban <php-iban>/registry.txt
```

The phone script refuses a checkout whose release notes or commit do not match the pinned release unless
`--tag/--commit/--retrieved` are given. The IBAN script pins versions as constants; Wikipedia and the two
repositories read at `HEAD` will drift, so byte-for-byte regeneration needs the same revisions (SHA-256 of the
inputs used: wikitext `d62152e5…65c2`, php-iban registry `8f0900ad…a83e`, SWIFT r96 TXT `8d461c33…c2c6`).

## Schema changes

`data/schema/phone.schema.json`, all additive and optional except the last:

- `data`: `preferredInternationalPrefix`, `nationalPrefixForParsing`, `nationalPrefixTransformRule`,
  `mainCountryForCode`, `sharesCallingCodeWith`, `leadingDigits`, `mobileNumberPortable`,
  `general` (pattern + lengths), `noInternationalDialling`.
- number type: `possibleLengthsLocalOnly`.
- format: `nationalPrefixOptionalWhenFormatting`, `domesticCarrierCodeFormattingRule`, `nationalOnly`
  (upstream `intlFormat` "NA").
- `operators[].name` no longer references `common#/localized`: `en` is required, **`ar` is optional**, because
  libphonenumber has Arabic names for one calling code only. This is a loosening, made as the brief allowed.

Conventions: `nationalPrefixFormattingRule` is stored resolved (`0$1`, not `$NP$FG`); operator prefixes are
prefixes of the national significant number, longest match wins; `general.possibleLengths` is the union over the
types (as libphonenumber derives it).

`finance.schema.json` was used unchanged.

## Gaps and open questions

- **Arabic operator names: 3 of 88.** Only `carrier/ar/965.txt` exists. Kuwait: VIVA «فيفا», Ooredoo «أوريدو»,
  Zain «زين». Its entries for Virgin mobile and STC are in Latin script and were not taken as Arabic. The other
  85 operators (all operators of the remaining 21 regions) have `name.en` only; nothing was translated. They need
  names from the regulators or the operators' own Arabic sites.
- Carrier data is the original allocation. BH, EG, JO, KW, MA, OM, QA, SA are marked portable, so an operator
  shown from a prefix can be wrong.
- `numberTypes.*.prefixes` is not populated (derivable from the patterns; no source lists them).
- Not extracted: short and emergency numbers (`ShortNumberMetadata.xml`), geocoding (area names), alternate
  formats, time zones. No region here uses `nationalPrefixForParsing`, a transform rule, carrier-code rules,
  `intlFormat` or `noInternationalDialling`, so those schema fields are defined but unused.
- EH (Western Sahara) shares +212 with MA and has no file; it is outside the 22.
- IBAN: the current SWIFT registry was not read directly. DJ, JO, TN, DZ, KM, MA need a check against it or the
  central banks. IBAN `meaning` (Arabic segment labels) is omitted: no authoritative Arabic source was read.
- IBAN print format (groups of four) is the same for all and is not stored per file.

## What an Arabic-first phone field must handle

- **Trunk prefix.** 14 regions use «0» (AE DZ EG IQ JO LB LY MA PS SA SD SO SY YE): `010 0123 4567` in Egypt is
  `+20 10 0123 4567`. Users type `+20 010…` and `0020 010…`; the field should drop the 0 after the calling code.
  For all 54 examples in these regions, dropping it recovers the number. 8 regions have no trunk prefix
  (BH DJ KM KW MR OM QA TN): never strip a leading 0 there.
- **Digits.** Accept ٠١٢٣٤٥٦٧٨٩ (U+0660–0669) and ۰۱۲۳۴۵۶۷۸۹ (U+06F0–06F9) and normalise to ASCII before
  matching; store E.164 in ASCII. All round trips pass in both sets. Whether to display Arabic-Indic digits is a
  locale decision, separate from parsing.
- **Direction.** A phone number is a left-to-right run even in an RTL field: `+966 50 123 4567` must not be
  reordered and the «+» must stay on the left. Use `dir="ltr"` (or isolation) on the input and on displayed
  numbers. This is a rule for the rules layer; no bidi characters are stored in the data.
- **Shared calling code.** Only +212 is shared (MA with EH); MA is the main region and owns the formats. No other
  Arab League region shares its code, so calling code → region is otherwise one-to-one.
- **International prefix** is `00` in all 22; accept `00` as well as `+`.
- **Variable length.** Mobile length is fixed per region except LB (7 or 8) and SO (7, 8 or 9), so those two
  cannot auto-advance on length. Fixed lines vary in most regions and have local-only lengths.
- **SY** formats may omit the national prefix (`nationalPrefixOptionalWhenFormatting`).
- **IBAN field.** Upper-case and strip spaces before checking; Arabic-Indic digits should be normalised the same
  way. Display in groups of four, left-to-right. Lengths range from 18 (SD) to 30 (JO, KW, YE). MR and TN always
  have the same check digits (13 and 59) according to Wikipedia, because the BBAN carries its own key.

## Requests to other layers

- **Finance schema owner:** (1) a `characterClass` (`n`/`a`/`c`) on `structure.segments[]` — it is currently
  stored in the free-form `values` object as `{ "characterClass": "n" }`; (2) a statement of what `start` is
  relative to (we use 0-based offset in the whole IBAN); (3) an optional `registered`/status field, now expressed
  as the claim `swiftRegistered`; (4) `meaning` requires Arabic, so segment labels are omitted until someone
  supplies sourced Arabic terms.
- **Regions layer:** `sharesCallingCodeWith: ["EH"]` on MA assumes EH is not a region file.
- **Rules/fixtures layers:** LTR isolation of phone numbers and IBANs in RTL text; the 83 examples and 18 IBAN
  examples are ready-made fixtures.
- **Common schema:** a localized type with optional Arabic would avoid per-schema copies.

## What L1/L2 should build from this

- `phone`: generate a table per region from `general`, `numberTypes` and `formats`; parse (digit normalisation →
  strip `+`/`00` and calling code → strip trunk prefix when the rest still matches `general`) and format (choose
  the first format whose last `leadingDigits` matches the start and whose `pattern` matches fully; apply
  `nationalPrefixFormattingRule` to the first group for national output). The checker in
  `tools/extract/phone/build.mjs` is a 60-line reference of exactly this.
- Number type detection by testing type patterns; report "fixed line or mobile" when both match (TN).
- `identity/iban`: generic MOD 97-10 plus the per-country length and pattern for the 18 registered formats;
  treat DZ, KM, MA as checksum-only with a soft warning; reject nothing for SY.
- Phone field engine (`segmented-input`/`text-input`): country picker defaults from the region, as-you-type
  formatting from `formats`, LTR isolation, both Arabic digit sets on input.
