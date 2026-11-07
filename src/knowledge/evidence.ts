/**
 * Test records. Status is derived, never typed by hand:
 *  - demo:       fixture executed live in this browser against the implemented logic
 *  - automated:  present in a recorded run file (unit-run.json / browser-run.json) with tool + environment
 *  - manual:     none recorded in this release
 *  - unchecked:  defined but not run
 */
import unitRun from './evidence/unit-run.json'
import browserRun from './evidence/browser-run.json'
import { FIXTURES } from './fixtures'

export interface RunFile {
  tool: string | null
  environment: string | null
  startedAt: string | null
  /** Short HEAD at run time (the run may include uncommitted changes). */
  commit?: string | null
  results: Array<{ id: string; name: string; file?: string; status: 'passed' | 'failed' | 'skipped'; durationMs?: number; detail?: string }>
}

export const UNIT_RUN = unitRun as RunFile
export const BROWSER_RUN = browserRun as RunFile

export interface BrowserCheck {
  id: string
  requirement: string
  rule?: string
  component: string
  method: string
  expected: string
}

export const BROWSER_CHECKS: BrowserCheck[] = [
  { id: 'BR-CI-01', requirement: 'المسح ثم مغادرة الحقل يبقيه فارغًا ويظهر «أدخل المبلغ»', rule: 'R-NUM-005', component: 'currency-input', method: 'Playwright: كتابة ← Tab ← مسح ← Tab', expected: 'value="" ورسالة الخطأ ظاهرة' },
  { id: 'BR-CI-02', requirement: 'أرقام عربية مكتوبة تُعرض بعد المغادرة حسب تفضيل العرض', rule: 'R-NUM-004', component: 'currency-input', method: 'Playwright: كتابة «١٢٣٤٫٥» ← Tab', expected: '«1,234.50»' },
  { id: 'BR-CI-03', requirement: 'الفاصلة الملتبسة تُرفض مع زر اقتراح يصحح القيمة عند اختياره', rule: 'R-NUM-002', component: 'currency-input', method: 'Playwright: كتابة «1234,50» ← Tab ← نقر الاقتراح', expected: 'خطأ ثم «1234.50» في الحقل' },
  { id: 'BR-CI-04', requirement: 'الدخول إلى حقل ممتلئ بلوحة المفاتيح ثم الكتابة يستبدل المبلغ ولا يُلحق به', rule: 'R-NUM-005', component: 'currency-input', method: 'Playwright: «1234.50» ← Tab ← Shift+Tab ← كتابة «77»', expected: 'value = «77»' },
  { id: 'BR-DLG-01', requirement: 'التركيز يدخل الحوار عند فتحه', rule: 'R-A11Y-002', component: 'dialog', method: 'Playwright: فتح البحث الشامل بـ Ctrl+K', expected: 'العنصر النشط داخل role=dialog' },
  { id: 'BR-DLG-02', requirement: 'Tab يبقى داخل الحوار', rule: 'R-A11Y-002', component: 'dialog', method: 'Playwright: 12 ضغطة Tab', expected: 'التركيز داخل الحوار بعد كل ضغطة' },
  { id: 'BR-DLG-03', requirement: 'Escape يغلق ويعيد التركيز إلى زر الفتح', rule: 'R-A11Y-002', component: 'dialog', method: 'Playwright: نقر زر البحث ← Escape', expected: 'الحوار مغلق والتركيز على زر البحث' },
  { id: 'BR-DLG-04', requirement: 'حوار داخل حوار: Escape يغلق الداخلي فقط والخلفية تبقى مقفلة', rule: 'R-A11Y-002', component: 'dialog', method: 'Playwright: فتح حوارين ← Escape ← 10 ضغطات Tab', expected: 'حوار واحد مفتوح، التركيز على زر الفتح، ولا خروج' },
  { id: 'BR-APP-01', requirement: 'النقر المزدوج على «تأكيد التحصيل» يسجل عملية واحدة', rule: 'R-FLOW-001', component: 'button', method: 'Playwright: dblclick على زر التأكيد', expected: 'صف واحد جديد في السجل' },
  { id: 'BR-APP-02', requirement: 'الفشل المحاكى يحفظ المبلغ، وإعادة المحاولة تنجح', rule: 'R-CNT-001', component: 'inline-message', method: 'Playwright: تفعيل الفشل ← تأكيد ← أعد المحاولة', expected: 'رسالة فشل، المبلغ باقٍ، ثم إيصال' },
  { id: 'BR-LAY-01', requirement: 'لا تمرير أفقي للصفحة على عرض 390px', rule: 'R-BIDI-001', component: 'data-table', method: 'Playwright: scrollWidth ≤ clientWidth لكل شاشة', expected: 'لا تجاوز' },
  { id: 'BR-CB-01', requirement: 'البحث المتسامح في منتقي العميل مع تمييز الجزء المطابق', rule: 'R-SRCH-001', component: 'combobox', method: 'Playwright: «احمد»، «محمد»، «khaled»', expected: 'خيار واحد صحيح لكل بحث، وmark ظاهر' },
  { id: 'BR-CB-02', requirement: 'البحث برقم الهاتف بأي أرقام', rule: 'R-SRCH-001', component: 'combobox', method: 'Playwright: «0101» و«٠١٠١»', expected: 'أحمد Khaled' },
  { id: 'BR-CB-03', requirement: 'Enter يختار، والمسح ثم المغادرة يبلّغ null', rule: 'R-NUM-005', component: 'combobox', method: 'Playwright: احمد ← ArrowDown ← Enter ← مسح ← Tab', expected: 'CUS-0001 ثم null' },
  { id: 'BR-CB-04', requirement: 'القائمة محاذية لبداية الحقل في RTL، وEscape يبقي التركيز', rule: 'R-BIDI-001', component: 'combobox', method: 'Playwright: قياس الحواف ثم Escape', expected: 'فرق ≤ 2px والتركيز في الحقل' },
  { id: 'BR-DP-01', requirement: 'الميلادي والهجري يعرضان نفس القيمة المخزنة', rule: 'R-NUM-004', component: 'date-picker', method: 'Playwright: قراءة المقاطع', expected: '«5/11/2026» = «25/5/1448» ← «2026-11-05»' },
  { id: 'BR-DP-02', requirement: 'مقاطع التاريخ تقبل نظام الأرقام الآخر', rule: 'R-NUM-001', component: 'date-picker', method: 'Playwright: «١٢» بأرقام لاتينية و«12» بأرقام مشرقية', expected: '«2026-11-12» في الحالتين' },
  { id: 'BR-DP-03', requirement: 'السهم الأيسر لليوم التالي في RTL، والاختيار يُخزَّن ميلاديًا', rule: 'R-BIDI-001', component: 'date-picker', method: 'Playwright: فتح الهجري ← ArrowLeft ← Enter', expected: '«2026-11-06»' },
  { id: 'BR-DP-04', requirement: 'التقويم الهجري بأسماء الشهور العربية', rule: 'R-NUM-004', component: 'date-picker', method: 'Playwright: عنوان الشهر', expected: '«جمادى الأولى 1448 هـ»' },
  { id: 'BR-MIX-01', requirement: 'الأسماء اللاتينية في قائمة عربية تتبع تفضيل المحاذاة', rule: 'R-BIDI-001', component: 'text-field', method: 'Playwright: قائمة العملاء بالتفضيلين', expected: 'مع الواجهة: نفس حافة الأسماء العربية · مع النص: اللاتيني يسارًا' },
  { id: 'BR-MIX-02', requirement: 'حقل نص فيه اسم لاتيني يتبع تفضيل المحاذاة', rule: 'R-BIDI-001', component: 'text-field', method: 'Playwright: text-align المحسوب في المصفوفة', expected: 'right مع الواجهة · start مع النص' },
  { id: 'BR-MIX-03', requirement: 'الاسم الذي يبدأ بلاتيني تبقى علامات ترقيمه في مكانها', rule: 'R-BIDI-001', component: 'combobox', method: 'Playwright: مواضع D وr و. في «Dr. سامي الحلبي»', expected: 'بالترتيب واتجاه ltr' },
  { id: 'BR-MX-01', requirement: 'كل حالة × متغير محتوى في الـspec لها خلية مرسومة في المصفوفة', component: 'currency-input', method: 'Playwright: كل spec × كل محتوى في #/matrix', expected: 'لا خلايا ناقصة ولا أخطاء console' },
]

export type AutomatedState = { state: 'passed' | 'failed' | 'not-run'; run?: RunFile; detail?: string }

export function automatedFor(id: string): AutomatedState {
  for (const run of [UNIT_RUN, BROWSER_RUN]) {
    const hits = run.results.filter((r) => r.id === id)
    if (hits.length) {
      const failed = hits.find((h) => h.status === 'failed')
      return { state: failed ? 'failed' : 'passed', run, detail: failed?.detail ?? hits[0].detail }
    }
  }
  return { state: 'not-run' }
}

export function liveFixtureResults() {
  return FIXTURES.map((f) => ({ fixture: f, ...f.run(), automated: automatedFor(f.id) }))
}

export const NOT_CHECKED = [
  'قارئات الشاشة: NVDA وJAWS وVoiceOver وTalkBack — لم يُجرَ أي فحص يدوي.',
  'Firefox وSafari/WebKit — الفحوص الآلية شُغّلت على Chromium فقط.',
  'أجهزة لمس حقيقية — لم تُختبر.',
  'React 18 وNext.js App Router وSSR — لم تُختبر.',
  'فحص axe الآلي — غير مثبّت في هذا الإصدار.',
  'تباين الألوان المخصصة في كل الحالات — محسوب للأزواج المعلنة فقط.',
]
