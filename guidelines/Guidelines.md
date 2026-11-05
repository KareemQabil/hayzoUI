# Guidelines for building with this system

Use these when generating or editing UI in this project.

## Always

- Product copy is natural professional Arabic. English only for code, identifiers, source titles, and deliberate LTR comparisons.
- Import components from `@/system`. Do not restyle them with ad-hoc colors; use the token utilities (`bg-surface`, `text-fg-2`, `border-line`, `bg-soft`, …) defined in `src/index.css`.
- Money: `CurrencyInput` for entry (value in minor units, `null` when empty) and `AmountText` for display. Never parse amounts with `parseFloat`.
- Phones, codes (`SKU-AB-001`, `INV-2026-0148`), e-mail, URLs: wrap in `LtrIsland`. Mixed names use `dir="auto"`.
- Numbers shown to people follow the numeral preference (`useLocale().numerals`, `toDisplayDigits`, `Num`). Identifiers stay Latin.
- Icon-only buttons: `IconButton` with an Arabic `label`. Directional icons: `forward`, `back`, `next` (mirror automatically); never flip search, phone, check.
- Overlays: `Dialog` / `Drawer` only. Pass `dismissible={false}` during a busy submit.
- Busy actions: `Button loading` plus a synchronous ref guard against double submission.
- Errors say what failed, what did not happen, that inputs are kept, and offer only actions that work.
- Simulated backends are labeled «محاكاة محلية». Synthetic data is labeled «بيانات اصطناعية».

## Never

- `letter-spacing` on Arabic, physical `left/right` CSS, silent rounding, silent removal of separators, merging similar customer names, invented scores, licenses, endorsements or test results.

## Terms

تحصيل (not دفع) · المبلغ · عميل · إيصال (proof of collection) vs فاتورة (amount due) · محاكاة.

## Figma

This is code in Figma Make. No native Figma Variables/Components exist; Copy design produces a snapshot. A Make kit has not been created or published. See the mapping table on the «خارطة المنظومة» screen.
