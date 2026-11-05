/**
 * Fixtures — the same list drives the automated suite (vitest) and the live evidence view.
 * `run()` calls the implemented logic; nothing here is a recorded or hard-coded result.
 */
import { formatAmount, formatPhoneEG, matchText, nationalPhoneEG, parseAmount, parsePhoneEG, similarNames, toDisplayDigits, DEFAULT_SEARCH, STRICT_SEARCH, type CurrencyCode } from '../arabic'
import type { Fixture } from './types'

function amount(id: string, requirement: string, rule: string, input: string, expected: { status: 'valid' | 'invalid' | 'empty'; canonical?: string; code?: string; suggestion?: string }, currency: CurrencyCode = 'EGP'): Fixture {
  const expectedLabel = expected.status === 'valid' ? `صالح · ${expected.canonical}` : expected.status === 'empty' ? 'فارغ · null' : `مرفوض · ${expected.code}${expected.suggestion ? ` · اقتراح ${expected.suggestion}` : ''}`
  return {
    id,
    area: 'amount',
    requirement,
    rule,
    input: `${input}${currency !== 'EGP' ? ` (${currency})` : ''}`,
    expected: expectedLabel,
    run: () => {
      const r = parseAmount(input, { currency })
      const actual = r.status === 'valid' ? `صالح · ${r.canonical}` : r.status === 'empty' ? 'فارغ · null' : `مرفوض · ${r.error?.code}${r.suggestions[0] ? ` · اقتراح ${r.suggestions[0].canonical}` : ''}`
      const pass =
        r.status === expected.status &&
        (expected.canonical === undefined || r.canonical === expected.canonical) &&
        (expected.code === undefined || r.error?.code === expected.code) &&
        (expected.suggestion === undefined || r.suggestions.some((s) => s.canonical === expected.suggestion))
      return { actual, pass }
    },
  }
}

function phone(id: string, requirement: string, input: string, expected: string): Fixture {
  return {
    id,
    area: 'phone',
    requirement,
    rule: 'R-NUM-001',
    input,
    expected,
    run: () => {
      const r = parsePhoneEG(input)
      const actual = r.status === 'valid' ? r.e164! : `مرفوض · ${r.error?.code}`
      return { actual, pass: actual === expected }
    },
  }
}

export const FIXTURES: Fixture[] = [
  amount('CI-F01', 'أرقام لاتينية بفاصلة عشرية نقطة', 'R-NUM-001', '1234.50', { status: 'valid', canonical: '1234.50' }),
  amount('CI-F02', 'أرقام عربية مشرقية وفاصلة عشرية عربية', 'R-NUM-001', '١٢٣٤٫٥٠', { status: 'valid', canonical: '1234.50' }),
  amount('CI-F03', 'أرقام فارسية (عربية ممتدة)', 'R-NUM-001', '۱۲۳۴٫۵۰', { status: 'valid', canonical: '1234.50' }),
  amount('CI-F04', 'الفاصلة الملتبسة لا تُفسَّر بصمت ويُقترح المعنى', 'R-NUM-002', '1234,50', { status: 'invalid', code: 'ambiguous-comma', suggestion: '1234.50' }),
  amount('CI-F05', 'أكثر من فاصلة عشرية مرفوض', 'R-NUM-002', '1.2.3', { status: 'invalid', code: 'multiple-decimal' }),
  amount('CI-F06', 'الحقل الفارغ قيمته null وليس صفرًا', 'R-NUM-005', '', { status: 'empty' }),
  amount('CI-F07', 'كسور أكثر من وحدة العملة الصغرى مرفوضة دون تقريب', 'R-NUM-003', '12.345', { status: 'invalid', code: 'too-many-fraction-digits' }),
  amount('CI-F08', 'الدينار الكويتي يقبل ثلاثة أرقام عشرية', 'R-NUM-003', '12.345', { status: 'valid', canonical: '12.345' }, 'KWD'),
  amount('CI-F09', 'فاصل آلاف لاتيني مع نقطة عشرية يبقى ملتبسًا مع اقتراح', 'R-NUM-002', '1,234.50', { status: 'invalid', code: 'ambiguous-comma', suggestion: '1234.50' }),
  amount('CI-F10', 'فاصل الآلاف العربي «٬» في موضع صحيح', 'R-NUM-001', '١٬٢٣٤٫٥٠', { status: 'valid', canonical: '1234.50' }),
  amount('CI-F11', 'فاصل آلاف في غير موضعه مرفوض', 'R-NUM-002', '12٬34', { status: 'invalid', code: 'invalid-grouping' }),
  amount('CI-F12', 'السالب مرفوض حين لا يسمح به الحقل', 'R-NUM-003', '-50', { status: 'invalid', code: 'negative-not-allowed' }),
  amount('CI-F13', 'رمز العملة داخل الحقل لا يُحذف بصمت', 'R-NUM-002', '50 ج.م', { status: 'invalid', code: 'invalid-character' }),
  amount('CI-F14', 'علامات الاتجاه الخفية الملصوقة لا تغيّر القيمة', 'R-BIDI-001', '\u200f1234.50', { status: 'valid', canonical: '1234.50' }),
  amount('CI-F15', 'تحويل دقيق للوحدات الصغرى دون عمليات عشرية عائمة', 'R-NUM-003', '19.99', { status: 'valid', canonical: '19.99' }),
  amount('CI-F16', 'فاصلة عشرية في البداية', 'R-NUM-001', '.5', { status: 'valid', canonical: '0.50' }),
  amount('CI-F17', 'أكثر من ١٢ رقمًا قبل الفاصلة مرفوض', 'R-NUM-003', '1234567890123', { status: 'invalid', code: 'too-large' }),
  amount('CI-F18', 'علامة السالب بعد الرقم (كتابة من اليمين) مرفوضة بوضوح', 'R-NUM-002', '50-', { status: 'invalid', code: 'sign-position' }),
  {
    id: 'FM-F01',
    area: 'format',
    requirement: 'العرض بأرقام لاتينية لا يغيّر القيمة المخزنة',
    rule: 'R-NUM-004',
    input: '123450 (minor)',
    expected: '1,234.50',
    run: () => {
      const actual = formatAmount(123450, { currency: 'EGP', numerals: 'latn' })
      return { actual, pass: actual === '1,234.50' }
    },
  },
  {
    id: 'FM-F02',
    area: 'format',
    requirement: 'العرض بأرقام عربية: الفاصلة العشرية «٫» هي العلامة الوحيدة الشبيهة بالفاصلة، والآلاف بمسافة رفيعة',
    rule: 'R-BIDI-003',
    input: '123450 (minor)',
    expected: '١ ٢٣٤٫٥٠',
    run: () => {
      const actual = formatAmount(123450, { currency: 'EGP', numerals: 'arab' })
      return { actual, pass: actual === '١ ٢٣٤٫٥٠' }
    },
  },
  {
    id: 'FM-F03',
    area: 'format',
    requirement: 'رقم الهاتف بأرقام عربية لا يحتوي مسافة عادية تقلب ترتيب المجموعات',
    rule: 'R-BIDI-003',
    input: '+201012345678 (arab)',
    expected: '٠١٠ ١٢٣٤ ٥٦٧٨',
    run: () => {
      const actual = toDisplayDigits(nationalPhoneEG('+201012345678'), 'arab')
      return { actual, pass: actual === '٠١٠ ١٢٣٤ ٥٦٧٨' && !actual.includes(' ') }
    },
  },
  {
    id: 'FM-F04',
    area: 'format',
    requirement: 'الصيغة الدولية للهاتف بأرقام عربية بلا مسافات عادية',
    rule: 'R-BIDI-003',
    input: '+201012345678 (arab, intl)',
    expected: '+٢٠ ١٠ ١٢٣٤ ٥٦٧٨',
    run: () => {
      const actual = toDisplayDigits(formatPhoneEG('+201012345678'), 'arab')
      return { actual, pass: actual === '+٢٠ ١٠ ١٢٣٤ ٥٦٧٨' }
    },
  },
  phone('PH-F01', 'رقم محمول مصري محلي', '01012345678', '+201012345678'),
  phone('PH-F02', 'رقم محمول بأرقام عربية', '٠١٠١٢٣٤٥٦٧٨', '+201012345678'),
  phone('PH-F03', 'رقم دولي بمسافات', '+20 10 1234 5678', '+201012345678'),
  phone('PH-F04', 'رقم ناقص', '0101234567', 'مرفوض · too-short'),
  phone('PH-F05', 'بادئة غير مدعومة', '01312345678', 'مرفوض · invalid-prefix'),
  phone('PH-F06', 'حرف لاتيني يشبه الرقم ١', '010l2345678', 'مرفوض · invalid-character'),
  {
    id: 'SR-F01',
    area: 'search',
    requirement: 'البحث المتسامح: «احمد» يجد «أحمد Khaled»',
    rule: 'R-SRCH-001',
    input: 'احمد → أحمد Khaled',
    expected: 'مطابق',
    run: () => {
      const m = matchText('احمد', 'أحمد Khaled', DEFAULT_SEARCH).match
      return { actual: m ? 'مطابق' : 'غير مطابق', pass: m }
    },
  },
  {
    id: 'SR-F02',
    area: 'search',
    requirement: 'الوضع الصارم يميّز الهمزة',
    rule: 'R-SRCH-001',
    input: 'احمد → أحمد Khaled (صارم)',
    expected: 'غير مطابق',
    run: () => {
      const m = matchText('احمد', 'أحمد Khaled', STRICT_SEARCH).match
      return { actual: m ? 'مطابق' : 'غير مطابق', pass: !m }
    },
  },
  {
    id: 'SR-F03',
    area: 'search',
    requirement: 'الجزء اللاتيني من الاسم المختلط لا يتأثر بحالة الأحرف',
    rule: 'R-SRCH-001',
    input: 'khaled → أحمد Khaled',
    expected: 'مطابق · [5,11)',
    run: () => {
      const r = matchText('khaled', 'أحمد Khaled', DEFAULT_SEARCH)
      const actual = r.match ? `مطابق · [${r.ranges[0]?.join(',')})` : 'غير مطابق'
      return { actual, pass: actual === 'مطابق · [5,11)' }
    },
  },
  {
    id: 'SR-F04',
    area: 'search',
    requirement: 'التشكيل لا يمنع المطابقة ويبقى معروضًا',
    rule: 'R-SRCH-001',
    input: 'محمد → مُحَمَّد السيد',
    expected: 'مطابق · [0,8)',
    run: () => {
      const r = matchText('محمد', 'مُحَمَّد السيد', DEFAULT_SEARCH)
      const actual = r.match ? `مطابق · [${r.ranges[0]?.join(',')})` : 'غير مطابق'
      return { actual, pass: actual === 'مطابق · [0,8)' }
    },
  },
  {
    id: 'SR-F05',
    area: 'search',
    requirement: 'الأسماء المتشابهة تُعرض كتنبيه ولا تُدمج',
    rule: 'R-SRCH-002',
    input: 'ايمان عبدالرحمن ↔ إيمان عبد الرحمن',
    expected: 'تنبيه · ١ سجل مشابه',
    run: () => {
      const found = similarNames('ايمان عبدالرحمن', [{ n: 'إيمان عبد الرحمن' }, { n: 'إيناس عبد الرحيم' }], (r) => r.n)
      const actual = found.length ? `تنبيه · ${found.length === 1 ? '١ سجل مشابه' : found.length + ' سجلات'}` : 'لا تنبيه'
      return { actual, pass: found.length === 1 }
    },
  },
]
