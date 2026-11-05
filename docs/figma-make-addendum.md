# Addendum to the Arabic Experience brief

Append after section 18. Where this addendum is more specific than the brief, follow the addendum.

---

## A. How to execute this in Figma Make

1. Keep the brief plus sections B, C, G and I of this addendum in the project's guidelines file so they persist across prompts. Send the milestone prompts in section H one at a time. Do not try to build every milestone from one prompt.
2. Required code structure. The explorer, the studio, the pattern pages and the reference app import the same components. Never copy a component into a screen.

```
src/tokens/            reference.ts, semantic.ts, component.ts, themes (light, dark), density.ts, locale.ts
src/arabic/            pure functions, no React: digits.ts, amount.ts, phone.ts, search.ts, bidi.ts, plural.ts
src/arabic/fixtures/   fixture tables: { id, input, options, expected }
src/components/        one folder per family; each exports the component and its spec metadata
src/knowledge/         rules.json, components.json, patterns.json, resources.json, tests.json (cross-referenced ids)
src/app/               shell, routes, explorer, studio, patterns, reference app, evidence
```

3. The evidence view runs the fixtures against `src/arabic` live in the browser and records the method ("in-browser fixture run"), the environment (user agent), the date and the result. This is the only status that may be labeled "automated check run". Everything else is "manually checked", "demonstration implemented", "proposed" or "not checked".

---

## B. Exact Arabic contracts (do not improvise)

### B1. Amount input (demo currency EGP, 2 minor digits)

Pipeline: trim, then map digits (0–9, Arabic-Indic U+0660–U+0669, extended Arabic-Indic U+06F0–U+06F9), then map the Arabic decimal separator ٫ (U+066B) to ".", then validate. Store an integer number of minor units. Display through `Intl.NumberFormat` with the active numeral preference.

| Input | Result | Arabic message |
|---|---|---|
| `1234.50` | ok, 123450 minor | — |
| `١٢٣٤٫٥٠` | ok, 123450 minor | — |
| `۱۲۳۴٫۵۰` | ok, 123450 minor | — |
| `  12 ` | ok, 1200 minor | — |
| `1234,50` / `1,234.50` / `١٬٢٣٤` | error `ambiguous_separator` | لا يمكن تحديد معنى الفاصلة. استخدم النقطة أو الفاصلة العشرية (٫) للكسور فقط، مثل 1234.50 |
| `1.2.3` | error `multiple_decimal` | يحتوي المبلغ على أكثر من فاصل عشري. |
| `12.345` | error `precision` | يُسمح بخانتين فقط بعد الفاصل العشري. |
| `-50` | error `negative` | لا يُقبل مبلغ سالب عند التحصيل. |
| `0` / `0.00` | error `min` | أدخل مبلغًا أكبر من صفر. |
| `> 1000000.00` | error `max` | الحد الأقصى للتحصيل في هذا العرض التجريبي هو 1,000,000.00 ج.م. |
| `12abc` / `+12` | error `invalid_char` | يحتوي المبلغ على رموز غير مدعومة. |
| empty | value `null` (not 0) | on submit only: أدخل المبلغ المطلوب تحصيله. |

Behavior rules:
- While focused, never rewrite what the user types. On blur, if the value is valid, reformat it to the canonical display. If it is invalid, keep the raw text and show the error.
- Validate on blur and on submit. Do not validate on every keystroke.
- Clearing the field stays cleared after blur. The old value never comes back.
- Thousands separators are not accepted in input in v1. This is a documented limitation, not a hidden behavior.
- The explorer shows three separate rows: raw input, canonical value (minor units), display string. The reference app shows only the display string.

### B2. Phone (demo: Egyptian mobile; other countries are planned and pending review)

- Normalize digits, then strip spaces, dashes, dots and parentheses.
- Accept `01[0125]XXXXXXXX`, `+201…`, `00201…` and `201…`.
- Store E.164 (`+201012345678`). Display `+20 10 1234 5678` inside an LTR isolate.
- Error message: رقم الهاتف غير صحيح. أدخل رقم محمول مصريًا من 11 رقمًا يبدأ بـ 010 أو 011 أو 012 أو 015.
- Other countries (SA, AE, KW, …) appear in the data model as `planned`. Do not ship their regexes as verified.

### B3. Search normalization (index keys only; never alter stored names)

- Remove tashkeel (U+064B–U+0652, U+0670) and tatweel (U+0640).
- Map أ إ آ ٱ to ا. Map ى to ي, ة to ه, ؤ to و and ئ to ي (each one a separate toggle, on by default for search).
- Normalize digits, fold Latin case and collapse whitespace.
- Highlight matches on the original string by mapping indices back from the normalized key.
- The explorer has a toggle labeled «بحث متسامح مع الهمزات» and shows the normalized key.
- Duplicates are never merged. When a new customer's normalized name matches an existing one, show a hint («يوجد عميل باسم مشابه») with "open existing" and "continue" actions. A phone match is a stronger warning.
- Planned, not in v1: Franco/Arabizi matching (`a7med` → أحمد) and wrong-keyboard-layout recovery (`hpl]` → احمد).

### B4. Bidi

- Phone, SKU, invoice number, email, URL and code are LTR isolates (`<bdi dir="ltr">` or `unicode-bidi: isolate`) and use the mono or tabular token.
- Name inputs use `dir="auto"` so that a value like `أحمد Khaled` stays readable.
- Icon mirroring table, to be decided per icon and documented in rules.json. Mirror: back/forward, navigation chevrons, pagination, progress direction, breadcrumb separators. Do not mirror: checkmarks, media playback, clocks, search magnifier, logos, digits. Charts are decided per chart and documented.
- Keep four concepts separate in docs and code: layout mirroring, text direction, reading order and icon direction.

### B5. Plurals and counted nouns

- Use `Intl.PluralRules('ar')` with all six categories (zero, one, two, few, many, other).
- Fixture: 0 → لا يوجد عملاء، 1 → عميل واحد، 2 → عميلان، 3 → 3 عملاء، 11 → 11 عميلًا، 100 → 100 عميل.

### B6. Addressing the user (gender-neutral copy)

- Arabic imperatives are gendered (أدخل / أدخلي). Prefer verbal nouns and neutral forms: «إدخال المبلغ»، «حفظ»، «يُرجى إدخال…».
- Button labels use the verbal noun (حفظ، إلغاء، تحصيل) consistently across the system. Document this in the content rules.

---

## C. Visual direction (concrete starting point; refine, don't replace with defaults)

- Arabic type: IBM Plex Sans Arabic for UI and body. Latin: IBM Plex Sans. Mono and LTR identifiers: IBM Plex Mono. One family, used deliberately.
- Arabic line heights are taller than Latin ones: body 16/1.75, label 14/1.5, table 14/1.5 with tabular numerals, display 40/1.3. Verify by rendering text with diacritics (e.g. «مُحَمَّد»).
- Palette: warm neutral paper and ink with one deep accent and controlled semantic tones. No pale blue wash, no gradients, no glass.
- Shape and density: radii 6/10/14. Control heights: compact 32, default 40, touch 48.
- Docs layout: navigation sidebar on the inline-start side, the article, and an "on this page" index on the inline-end side. On compact layouts the sidebar becomes a sheet, the index becomes a dropdown, and the preview moves above its controls.

---

## D. Master component inventory

Tiers: **M1** first milestone · **R1** first release · **R2** second release · **L** later. Every item lists its Arabic or bidi concern.

### D1. Parity families (what shadcn and Ant Design also cover)

| Family | Components | Tier | Arabic / bidi concern |
|---|---|---|---|
| Actions | Button, IconButton, ButtonGroup, Toggle, MenuButton/SplitButton, Link | M1–R1 | Arabic accessible names for icon-only buttons; verbal-noun labels |
| Text fields | TextField, Textarea, SearchField, PasswordField, Field/Label/Helper/Error, Fieldset | M1 | `dir="auto"`, error anatomy, placeholder vs label |
| Numeric | NumberInput, CurrencyInput, Slider, RangeSlider, Rating | M1–R2 | Digit normalization; slider and rating direction |
| Selection | Select, Combobox, MultiSelect/TagInput, Checkbox, Radio, Switch, Segmented | R1 | Tolerant filtering; switch thumb direction |
| Date & time | DatePicker, DateRangePicker, TimePicker, Calendar | R2 | Gregorian and Hijri (Umm al-Qura), week start, ص/م |
| Upload | FileUpload, Dropzone | R2 | Arabic file names and truncation |
| Navigation | AppShell, Sidebar, TopBar, Tabs, Breadcrumb, Pagination, Stepper, Menu, CommandPalette, BottomNav, TOC | M1–R2 | Mirrored arrows, compact navigation model |
| Feedback | Banner, Toast, InlineMessage, Progress, Spinner, Skeleton, EmptyState, ErrorState | M1–R1 | Message anatomy, progress direction |
| Overlays | Dialog, Drawer/Sheet, Popover, Tooltip, HoverCard, ContextMenu | R1 | Focus in/trap/Escape/restore; drawer side follows inline-end |
| Data display | DataTable, List, Card, Badge/Pill, Tag, Avatar, DescriptionList, Timeline, KPI/Stat, Tree | R1–R2 | Numeric alignment, sticky inline-start column, Arabic initials, numerals |
| Charts | Chart wrappers (bar, line, donut) | L | Axis direction per chart, numerals |
| Typography | Text, Heading, Code, Kbd, Quote | M1 | Line height, diacritics, no letter-spacing on Arabic |
| Layout | Stack, Grid, Container, Divider, ScrollArea, Resizable | M1 | Logical properties only |

### D2. Arabic-native components (the differentiator; neither shadcn nor Ant Design ships these)

| Component | Tier | What it does |
|---|---|---|
| LocaleProvider | M1 | Separate settings for direction, numerals (latn/arab), calendar, region and week start. Independent from theme. |
| LtrIsland / BidiText | M1 | Keeps phone, SKU, invoice number, URL and code readable inside Arabic text |
| CurrencyInput | M1 | Contract B1 |
| CountText | R1 | Plural-aware counted nouns (B5) |
| CustomerPicker / ArabicSearch | R1 | Contract B3, highlighting on the original text, duplicate hints |
| PhoneInput | R1 | Contract B2; country-aware in R2 |
| NameField | R1 | Arabic name plus optional Latin transliteration, `dir="auto"` |
| AmountInWords (تفقيط) | R2 | «ألف ومئتان وأربعة وثلاثون جنيهًا وخمسون قرشًا» for invoices and cheques |
| DualCalendarPicker | R2 | Gregorian and Hijri side by side through `Intl` calendars |
| IBANField | R2 | Country prefix and mod-97 checksum (synthetic data only) |
| NationalIdField | R2 | Format and checksum rules per country, pending review (synthetic data only) |
| Keyboard-layout recovery | R2 | Suggests احمد when the user types `hpl]` |
| Franco/Arabizi matching | R2 | `a7med`, `3ali` |
| AddressForm by country | L | EG governorate/area, KSA national short address, KW block/street — pending review |
| Receipt and invoice preview | L | 58/80 mm thermal and A4, shaping that survives text extraction, e-invoice QR placeholder |
| DiacriticsToggle | L | For education and religious content |

---

## E. Pattern inventory

| Pattern | Tier | Notes |
|---|---|---|
| Find or add a customer, then collect a payment | M3–M4 | Flagship (brief §11–12) |
| Correct a form and recover from failure | R1 | Keep all input; retry the same operation id |
| Duplicate detection | R1 | Hint, never auto-merge |
| Empty vs no results | R1 | Two different states, two different copies |
| Filter inventory with saved views | R1 | Search plus one quick filter; the rest in a popover |
| Confirm a destructive action | R1 | — |
| Offline or unknown outcome with idempotent retry | R2 | Block duplicate submission |
| Create and print an invoice | R2 | AmountInWords, LTR islands, print layout |
| Sign in with phone and OTP | R2 | OTP digits are an LTR island; accept Arabic digits |
| Import and export CSV/Excel | R2 | UTF-8 with BOM so Arabic does not break in Excel |
| Multi-step government service application | R2 | Save draft, resume, attachments |
| Regional settings (numerals, calendar, week start) | R2 | — |

---

## F. Content and localization inventory

- Terminology glossary: term, preferred form, forms to avoid, context. Examples: عميل vs زبون, تحصيل vs دفع, حفظ vs احفظ.
- Voice: professional Modern Standard Arabic. Dialect variants (Egyptian, Gulf, Levantine, Maghrebi) are planned.
- Error anatomy: what happened, why, and what to do next, offering only actions the demo actually supports.
- Regional data table: currency symbol and position (ج.م، ر.س، د.إ، د.ك، …), numeral preference, week start, weekend, calendar. Every row carries a status (`verified` or `pending review`).
- Plurals and counted nouns (B5) and gender-neutral addressing (B6).

---

## G. Token inventory

- Reference: palettes, type families, spacing scale, radii, durations.
- Semantic: text (primary/secondary/disabled/on-accent), surface (base/raised/sunken/overlay), action, border, focus, selection, success/warning/danger/info with soft and ink pairs.
- Component: only where justified, derived from semantic tokens.
- Typography: Arabic-specific line heights, tabular numerals, a mono token for LTR islands, and no letter-spacing on Arabic text.
- Density: compact, default and touch.
- Motion: durations and easings plus a reduced-motion variant. No bounce on financial or data-entry actions.
- Locale (separate from theme): direction, numerals, calendar, region, week start.

---

## H. Milestone prompts (send one at a time)

Each prompt ends with: "Follow the guidelines. Limit scope to this milestone. Finish with an inventory: implemented, partial, planned, unchecked."

- **M1.** Product shell, the token foundation, `src/arabic/digits` and `src/arabic/amount` with fixtures, and the Currency Input reference page (brief §9), including the in-browser fixture panel and a composed compact layout.
- **M2.** Theme and typography studio (brief §10) driving the same components, with JSON export.
- **M3.** CustomerPicker, PhoneInput, NameField, and the pattern catalog plus the flagship pattern detail (brief §11).
- **M4.** Reference application (brief §12).
- **M5.** Knowledge JSON export, the rule-based selection assistant (brief §14), resources with the four relationship types, and the evidence view, including the Stockaat audit files if uploaded (section I).

---

## I. Positioning and evidence

- Product principle: we aim for full component breadth, matching and exceeding general-purpose libraries. Breadth comes from a spec-driven component factory (section J), not from hand-building screens. Every component, standard or Arabic-native, must pass the same contracts and gates. No component ships on appearance alone. The prototype shows the factory's output and method; it does not fake breadth with shallow samples.
- Primitive layer: choose one accessible primitive system. If package installation is available, prefer React Aria: its locale-aware number parsing, calendar systems and RTL handling match our contracts. Document it as an integrated dependency, not original work.
- Planned distribution (not in the prototype): an npm package plus a copy-paste registry format, so teams can adopt individual components without leaving their current stack.
- Stockaat audit evidence: if `findings.json`, `test-matrix.csv`, `evidence/adjudicated-matrix.json`, `evidence/summary.json` and `REPORT_AR.md` are uploaded, show them as "external audit, run on 2026-11-05, not executed in this app", with its stated limits (Chromium only, no real touch devices, no screen reader, no claim of exhaustiveness). Show each library's results exactly as recorded. Do not derive scores or rankings from them.

---

## J. Component factory (how breadth is produced)

Generating component code is cheap. Verifying it is the expensive part. The factory makes verification the default, so breadth does not cost quality.

### J1. One spec per component is the source of truth

Every component starts as a machine-readable spec in `src/knowledge/components/<id>.json`. The code, docs, examples, tests and agent knowledge are all generated from the spec or checked against it.

```
id, family, maturity (draft | beta | stable)
purpose, whenToUse, whenNotToUse
anatomy: [parts]
props: [{ name, type, default, description }]          // shared naming conventions across all components
states: [default, hover, focus-visible, active, disabled, readonly, invalid, loading, empty, ...]
keyboard: [{ key, action }]                            // e.g. ArrowRight in RTL moves to the PREVIOUS item visually
aria: { role, labelling, liveRegions, focusManagement }
tokens: [component roles -> semantic tokens]
locale: { direction, numerals, mirroredIcons, ltrIslands, pluralization, copyKeys }
density: [compact, default, touch]
fixtures: [ids in src/arabic/fixtures or component fixtures]
rules: [rule ids]   patterns: [pattern ids]   primitive: { source, relationship }
```

### J2. The pipeline per component

1. **Spec.** A human or an AI drafts it; a human approves the API (names, props, events). This is the one step that stays human-owned, because API consistency across 60+ components cannot be repaired later.
2. **Generate.** AI produces the implementation on the chosen primitive, the docs page, examples for every state, and the tests.
3. **Gates (automated, must all pass):**
   - Type check, lint and the shared API naming rules.
   - Every state in the spec renders in LTR and RTL, light and dark, all three densities.
   - axe scan with zero violations on each state.
   - Keyboard script generated from `keyboard` in the spec, run in both directions.
   - Focus behavior: entry, trap where specified, Escape, restoration.
   - Arabic fixtures: digits, mixed text, long names, diacritics, LTR islands.
   - Visual regression snapshots per state and direction.
   - No literal colors or physical CSS properties (`left`, `margin-right`, …).
4. **Review.** A human looks at the diff of snapshots and the API, not the whole implementation.
5. **Publish.** Maturity is set from what actually passed. The evidence page lists which gates ran, where and when.

### J3. What AI does not replace (plan for it explicitly)

- API design decisions and naming consistency.
- Checks with real screen readers (NVDA, VoiceOver, TalkBack) and real touch devices. These stay manual and are labeled manual.
- Arabic copy review by a native editor.
- Maintenance: every shipped component multiplies issues, upgrades and breaking-change decisions. The gates exist so that maintenance stays cheap.

### J4. Where this lives

The factory runs in a real repository with CI (for example Claude Code plus Playwright). Figma Make is the showcase and the design workbench: it consumes components that came out of the factory and displays their specs, states and evidence. Do not try to run the factory inside Make.

### J5. Order of production

1. Foundations, LocaleProvider, LtrIsland, Field anatomy (everything else depends on these).
2. The M1–R1 families from section D1 plus the Arabic-native M1–R1 items from D2.
3. Then breadth in batches of one family at a time, each batch passing all gates before the next starts.
