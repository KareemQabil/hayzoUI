/**
 * Content layer — Arabic copy for validation and system messages.
 * L2 returns codes; this module turns them into sentences. Terms must match the glossary.
 */
import { CURRENCIES, formatAmount, toDisplayDigits, type AmountError, type CurrencyCode, type DisplayNumerals, type PhoneErrorCode } from '../arabic'

function digitsWord(n: number): string {
  if (n === 1) return 'رقمًا واحدًا'
  if (n === 2) return 'رقمين'
  if (n === 3) return 'ثلاثة أرقام'
  return `${n} أرقام`
}

export function amountErrorMessage(error: AmountError, currency: CurrencyCode, numerals: DisplayNumerals): string {
  const c = CURRENCIES[currency]
  const n = (s: string) => toDisplayDigits(s, numerals)
  switch (error.code) {
    case 'invalid-character':
      return `«${error.char}» ليس رقمًا ولا فاصلة مدعومة. اكتب المبلغ بالأرقام فقط؛ العملة محددة بجانب الحقل.`
    case 'ambiguous-comma':
      return `الفاصلة «${error.char}» قد تعني فاصلة عشرية أو فاصل آلاف، لذلك لم نفسّرها. استخدم «.» أو «٫» للكسور، أو اختر المعنى المقصود.`
    case 'multiple-decimal':
      return 'في المبلغ أكثر من فاصلة عشرية، فلا يمكن تحديد قيمته. أبقِ فاصلة واحدة فقط.'
    case 'invalid-grouping':
      return `فاصل الآلاف في غير موضعه. اكتب المبلغ دون فواصل، مثل ${n('1234.50')}.`
    case 'negative-not-allowed':
      return 'هذا الحقل لا يقبل المبالغ السالبة.'
    case 'sign-position':
      return 'ضع علامة السالب قبل الرقم، لا بعده.'
    case 'too-many-fraction-digits':
      return `يقبل ${c.nameAr} ${digitsWord(c.minorDigits)} بعد الفاصلة كحد أقصى. لم نقرّب المبلغ حتى لا تتغير قيمته.`
    case 'too-large':
      return `المبلغ أطول من الحد المدعوم (${n('12')} رقمًا قبل الفاصلة).`
    case 'no-digits':
      return 'أدخل رقمًا.'
    case 'below-min':
      return `أقل مبلغ مسموح به ${formatAmount(error.bound!, { currency, numerals, symbol: true })}.`
    case 'above-max':
      return `أعلى مبلغ مسموح به ${formatAmount(error.bound!, { currency, numerals, symbol: true })}.`
  }
}

export const requiredAmountMessage = 'أدخل المبلغ.'

export function phoneErrorMessage(code: PhoneErrorCode | 'required', char?: string): string {
  switch (code) {
    case 'required':
      return 'أدخل رقم المحمول.'
    case 'invalid-character':
      return `«${char}» ليس رقمًا. أدخل رقم المحمول بالأرقام فقط.`
    case 'too-short':
      return 'الرقم أقصر من رقم المحمول المصري (١١ رقمًا، مثل 010 1234 5678).'
    case 'too-long':
      return 'الرقم أطول من رقم المحمول المصري (١١ رقمًا، مثل 010 1234 5678).'
    case 'invalid-prefix':
      return 'يبدأ رقم المحمول المصري بـ 010 أو 011 أو 012 أو 015.'
  }
}

export const nameMessages = {
  required: 'أدخل اسم العميل.',
  tooShort: 'اكتب الاسم كاملًا كما يظهر في سجلات العميل.',
}

export const glossary = [
  { term: 'تحصيل', avoid: 'دفع، سداد', note: 'الفعل من جهة المتجر. العميل «يسدّد» والمتجر «يحصّل».' },
  { term: 'المبلغ', avoid: 'القيمة، السعر', note: 'القيمة النقدية المطلوب تحصيلها.' },
  { term: 'عميل', avoid: 'زبون، مستخدم', note: 'الشخص أو الجهة المسجلة في الدفتر.' },
  { term: 'إيصال', avoid: 'فاتورة', note: 'الإيصال يثبت التحصيل؛ الفاتورة تثبت المستحق.' },
  { term: 'محاكاة', avoid: 'تجريبي، وهمي', note: 'أي عملية لا تتصل بخادم حقيقي في هذا النموذج.' },
]
