# Finance and identity research (money rules and identity numbers)

Researched 2026-11-11. Covers `data/finance/` except `data/finance/iban/` (see `phone-iban.md`).

## What was collected

45 files, 153 claims: **70 verified, 83 needs-review, 0 unverified**. No file was written from memory alone;
facts that could not be sourced were left out and are listed under Gaps.

| Dataset | Files | Regions |
|---|---|---|
| `vat` | 16 | SA AE EG BH OM KW QA JO MA TN DZ LB IQ LY MR PS |
| `tax-id` | 11 | SA AE EG OM QA KW LB MA TN DZ BH |
| `national-id` | 10 | EG SA AE KW QA BH IQ MA TN LY |
| `e-invoicing` | 6 | SA AE EG OM JO TN |
| `commercial-register` | 2 | SA AE |
| `cash-rounding` | 0 | none: no citable rule found |

A file's confidence is the lowest confidence of any claim in it, so almost every file is `needs-review` even
when most of its claims are verified. Read claims individually.

### Region × dataset: confidence reached

`v` = verified claims, `r` = needs-review claims, `—` = no file.

| Region | vat | tax-id | national-id | e-invoicing | commercial-register | cash-rounding |
|---|---|---|---|---|---|---|
| SA | needs-review (5v/4r) | verified (2v/0r) | needs-review (1v/1r) | needs-review (10v/1r) | verified (1v/0r) | — |
| AE | needs-review (7v/1r) | verified (1v/0r) | needs-review (1v/1r) | verified (10v/0r) | verified (1v/0r) | — |
| EG | needs-review (1v/6r) | needs-review (0v/1r) | needs-review (0v/3r) | needs-review (4v/1r) | — | — |
| BH | needs-review (1v/5r) | verified (1v/0r) | needs-review (0v/1r) | — | — | — |
| OM | needs-review (4v/3r) | needs-review (2v/1r) | — | verified (4v/0r) | — | — |
| KW | needs-review (1v/2r) | verified (1v/0r) | needs-review (1v/2r) | — | — | — |
| QA | needs-review (1v/2r) | verified (2v/0r) | needs-review (0v/1r) | — | — | — |
| JO | needs-review (2v/4r) | — | — | needs-review (2v/2r) | — | — |
| MA | needs-review (1v/5r) | needs-review (0v/1r) | needs-review (0v/1r) | — | — | — |
| TN | needs-review (0v/5r) | needs-review (0v/1r) | needs-review (0v/1r) | needs-review (0v/3r) | — | — |
| DZ | needs-review (0v/5r) | needs-review (0v/1r) | — | — | — | — |
| LB | needs-review (1v/4r) | verified (1v/0r) | — | — | — | — |
| IQ | needs-review (1v/3r) | — | needs-review (0v/1r) | — | — | — |
| LY | needs-review (0v/2r) | — | needs-review (0v/1r) | — | — | — |
| MR | needs-review (0v/4r) | — | — | — | — | — |
| PS | needs-review (0v/3r) | — | — | — | — | — |
| SD, SY, YE, DJ, SO, KM | — | — | — | — | — | — |

VAT coverage is **16 of 22 regions**. Missing: SD, SY, YE, DJ, SO, KM. The only sources found for them were
rate aggregators that contradict each other (Comoros 10% vs 16%, Djibouti 10% vs 33%, Somalia 5% vs 14%), so
nothing was recorded.

"Verified" tax-id files (SA, AE, QA, KW, LB, BH) are verified for what the claim says, which for BH, KW and LB
is a description, not a validator.

## Sources

Primary (fetched and read):

- ZATCA, *Security Features Implementation Standards* v1.2 (2023-05-19) and *Electronic Invoice XML Implementation
  Standard* v1.2 (2023-05-19); ZATCA roll-out phases page (updated 2026-09-01); ZATCA Arabic VAT page.
- UAE Ministry of Finance: VAT page; eInvoicing portal; Ministerial Decisions 243/2025, 244/2025, 66/2026,
  197/2026; *UAE Electronic Invoicing Guidelines* and *Mandatory Field Requirements* (October 2026). UAE Federal
  Tax Authority Arabic and English VAT pages.
- Egyptian Tax Authority: home page and the eInvoicing & eReceipt SDK (last update 2022-12-08).
- Oman Tax Authority portal and its Fawtara page (2026-10-07).
- Jordan ISTD home page; Morocco DGI portal; Iraq General Commission of Taxes home page (names only).
- OECD AEOI portal TIN sheets, supplied by each jurisdiction: Saudi Arabia (2018-05-02), Bahrain, Kuwait, Qatar,
  Oman, Lebanon. No sheet exists for AE, MA, TN, JO, EG, DZ, IQ, MR at the URL pattern tried.

Secondary:

- PwC Worldwide Tax Summaries, "Other taxes" pages, each with its review date (15 regions). Proprietary; facts only.
- Kintsugi sales-tax guides (DZ, BH, KW). Commercial; facts only. Weakest source used.
- Wikipedia: *National identification number* (rev 1383726986), *Egyptian National Identity Card*
  (rev 1377865466), *Iraq National Card* (rev 1368130530). CC-BY-SA-4.0; facts only.
- KPMG TaxNewsFlash (Tunisia) and Comarch (Jordan): read only through web-search summaries, pages not fetched.

Open-source validators (the only source for most checksums; all `needs-review`):

- python-stdnum @ 006192e (LGPL-2.1+): `eg/tn.py`, `dz/nif.py`, `ma/ice.py`, `tn/mf.py`, `om/vat.py`.
- django-localflavor 5.1 @ dab7252 (BSD-3-Clause): `eg`, `kw`, `ae`, `qa`, `ma`.
- validator.js @ 9ff3424 (MIT): `isIdentityCard` for `ar-TN`, `ar-LY`.
- MohamedAAbdallah/Egyptian-ID-Validator-Npm @ bce3c51: Egyptian check digit.
- dralshehri/saudi-id-validator (luhncheck) @ 26c4f87 (MIT): Saudi ID Luhn check.

Not reachable: nbr.gov.bh (HTTP 403), mfdgi.gov.dz, finance.gov.lb VAT pages, gta.gov.qa, mof.gov.kw,
impots.finances.gov.tn (timeouts). The ZATCA VAT pages load their rate table by script, so the 15% rate could
not be read from ZATCA text.

The files were assembled by a generator kept in the scratch directory (`finance/gen.mjs`); it is hand-entered
research, not an extraction, so `method` is `researched` and no `script` is named. It also computes and
self-tests the synthetic examples.

## Schema changes (`finance.schema.json`, additive)

- `data.identifier`: `{ en, ar? }`, the identifier's name; Arabic only when sourced.
- `data.validation`: `{ origin: official | specification | reverse-engineered, normalize, steps[], testVectors[] }`.
- `data.derivable`: what can be read out of a valid number.
- `structure.segments[].description`: English description, for segments with no authoritative Arabic `meaning`.
- Claim keys must be dotted identifiers; for `dataset: vat` the key is an enum (`tax.exists`, `tax.type`,
  `tax.localName`, `rate.standard`, `rate.standard.effectiveFrom`, `rates.other`, `authority.name`,
  `taxNumber.localName`, `invoice.simplifiedThreshold`).

Conventions used: `rate.standard` is a percent number; `rates.other[].rate` is `null` for exempt or item-specific
scopes; segment `start` is zero-based; structural facts carry their evidence in a `structure.basis` claim.

## Findings that matter for an Arabic-first design

- **ZATCA QR** is recorded in full (`e-invoicing/SA.json`, `qr.encoding`): TLV, one tag byte, one length byte
  counting **UTF-8 bytes**, tags 1-5 for Phase 1, 6-9 added from 2023-01-01, whole array Base64-encoded, at most
  700 characters. An Arabic seller name is roughly two bytes per letter, and one length byte caps a value at 255
  bytes. A synthetic Phase 1 vector is included (computed here, not from ZATCA).
- **UAE e-invoices have no QR code** and are not PDFs: XML in PINT-AE over Peppol through accredited providers.
  A receipt component must not assume the Saudi model across the Gulf.
- **UAE dates moved after the original decisions**: the first group's provider-appointment deadline is now
  2026-10-30 (Decision 66/2026) and the issuing deadline is 14 *business* days (Decision 197/2026).
- **Tax number vocabulary differs**: SA and AE both use رقم التسجيل الضريبي officially; SA's VAT number is 15
  digits starting and ending in 3, the UAE TRN is 15 digits whose first 10 are the TIN.
- Inputs must accept Arabic-Indic digits and separators (Egypt's tax number is written 3-3-3).
- Morocco's ICE is valid when divisible by 97 (remainder 0), not the IBAN-style remainder 1.
- Kuwait, Qatar and Iraq have no VAT field to show; Iraq has selective sales taxes only.

## Claims a local expert should confirm first

1. SA: standard rate 15% from 2020-07-01, and the SAR 1,000 simplified-invoice note (rate read from PwC only).
2. SA: national ID / iqama rule (10 digits, first digit 1 or 2, Luhn), from one open-source validator.
3. SA: ZATCA QR tag 6 value (raw 32 bytes vs Base64 text of the hash) and number formatting in tags 4 and 5.
4. EG: national-number check digit (weights 2,7,6,5,4,3,2,7,6,5,4,3,2) and whether it is enforced on all cards.
5. EG: 14% standard rate date, Arabic name of the tax number, and the e-invoice/e-receipt mandate dates.
6. KW: civil ID check digit weights; AE: meaning of the Emirates ID `YYYY` block and its check digit.
7. BH: 10% from 2022-01-01 (no primary source reached), CPR layout and check digit.
8. OM: VATIN layout and its partial checksum; whether Fawtara has dated phases yet.
9. MA: 20% as "standard" rate; ICE divisibility rule; CNIE pattern.
10. JO: JoFotara mandatory date (2025-04-01) and UBL 2.1; 16% GST effective date.
11. DZ: 19% / 9% rates and the NIF length rule (single weak source each).
12. TN: matricule fiscal control-key rule; El Fatoora scope from 2026-01-01.

## Gaps and open questions

- **VAT**: SD, SY, YE, DJ, SO, KM not covered. Effective date of the current rate missing for JO, MA, DZ, LB, MR,
  PS. Arabic authority names missing for BH, KW, QA, LB, DZ, TN; Arabic tax-number term missing for all but SA,
  AE, EG. Zero-rated and exempt lists are outlines only.
- **Tax id**: Jordan, Iraq, Bahrain VAT account number, Morocco IF, Saudi and UAE internal segments of the
  15-digit number, Saudi TIN and Qatar TIN check-digit algorithms (stated to exist, not published).
- **National id**: Oman, Jordan and Algeria have no file (no citable description found). Emirates ID and Bahrain
  CPR check digits not established. Iraq: length only. No official primary source was reached for any
  national-id structure except Kuwait's length (OECD sheet).
- **E-invoicing**: Bahrain and Morocco (reported as planned; nothing citable fetched). ZATCA Phase 2 wave
  thresholds (published as an image). Egypt QR rule and mandate dates. Oman format.
- **Cash rounding**: nothing recorded. No central-bank or tax-authority rounding rule was found in the time
  available; smallest-circulating-coin facts need central bank sources per currency.
- **Commercial register**: only the identifier scheme codes used in e-invoices (SA `CRN`/`700`, AE `TL`). The
  formats of the Saudi CR and unified 700 number, UAE licences and the Egyptian register were not sourced.

## Requests to other layers

- Currencies: record smallest circulating coin per currency from central banks; `cash-rounding` here depends on it.
- Regions: an ISO 3166-1 numeric code table is needed to validate the Qatar ID nationality segment.
- Fixtures: turn every `validation.testVectors` entry into a fixture; add the ZATCA QR vector.

## What L1/L2 should build from this

- Identity validators generated from `structure` + `validation`, returning `valid`, `invalid` or `unchecked`
  with the `origin`, so a reverse-engineered checksum can warn instead of block.
- A `zatcaQr.encode()` helper from `qr.encoding` (byte-length aware), and a VAT helper that reads `rate.standard`
  with its `asOf` and refuses silently stale data.
- An e-invoicing capability table per region (QR or not, format, mandatory dates) for the invoice and receipt patterns.
