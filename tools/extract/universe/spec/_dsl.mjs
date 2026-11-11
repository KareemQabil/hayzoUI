// Compact authoring format for the universe. Everything in spec/ is judgement written by hand; build.mjs expands it,
// merges the harvested matrix (seed/antd-matrix.json) and the verification results (evidence/verification.json).
//
// C(id, en, ar, family, tier, priority, {
//   s: [summaryEn, summaryAr]      e: 'engine ids'        a: 'anatomy parts'       d: 'dependsOn ids'
//   al: { library: 'Name Name.Member' }   an: { 'library:Name': 'note' }   sc: { library: 'extra scope names for probes' }
//   seed: 'matrixId matrixId:slug,slug'   (owner's matrix components to take features from; ":" keeps only those slugs)
//   drop: 'slug'  (seeded features not carried, with the reason in `dec`)     notAntd: 'slug' (rows the matrix adds that AntD does not ship)
//   sp: { slug: 'propA|propB' }  probes for seeded features     so: { slug: 'libs asserted without a probe' }
//   sa: { slug: [kind, en, ar] }  curated Arabic note for a seeded feature (required when the matrix row has arabicEdge)
//   f: [[id, en, ar, priority, probe, assertedLibs, [kind, en, ar]]]   own features
//   req / risk: [[en, ar]]   dec: [[topic, note]]   n: notes
// })
export const components = []
const list = (s) => (s ? s.split(/\s+/).filter(Boolean) : [])
const KIND = { req: 'requirement', risk: 'risk', opp: 'opportunity' }
const note = (t) => (t ? { kind: KIND[t[0]] ?? t[0], note: { ar: t[2], en: t[1] } } : undefined)

export function C(id, en, ar, family, tier, priority, o = {}) {
  const aliases = {}
  for (const [lib, names] of Object.entries(o.al ?? {})) aliases[lib] = list(names).map((name) => ({ name, ...(o.an?.[`${lib}:${name}`] ? { note: o.an[`${lib}:${name}`] } : {}) }))
  components.push({
    id, name: { ar, en }, summary: o.s ? { ar: o.s[1], en: o.s[0] } : undefined, family, tier, priority,
    engines: list(o.e), anatomy: list(o.a), dependsOn: list(o.d), aliases,
    scope: Object.fromEntries(Object.entries(o.sc ?? {}).map(([k, v]) => [k, list(v)])),
    seed: list(o.seed).map((s) => { const [m, only] = s.split(':'); return { matrix: m, only: only ? only.split(',') : null } }),
    drop: list(o.drop), notAntd: list(o.notAntd), seedProbes: o.sp ?? {}, seedAsserted: Object.fromEntries(Object.entries(o.so ?? {}).map(([k, v]) => [k, list(v)])),
    seedArabic: Object.fromEntries(Object.entries(o.sa ?? {}).map(([k, v]) => [k, note(v)])),
    own: (o.f ?? []).map(([fid, fen, far, pri, probe, asserted, arabic]) => ({ id: fid, name: { ar: far, en: fen }, priority: pri ?? priority, probe: probe || undefined, asserted: list(asserted), arabic: note(arabic) })),
    arabic: { requirements: (o.req ?? []).map(([e, a]) => ({ ar: a, en: e })), risks: (o.risk ?? []).map(([e, a]) => ({ ar: a, en: e })) },
    decisions: (o.dec ?? []).map(([topic, text]) => ({ topic, note: text })), notes: o.n,
  })
}

// Probe fragments used many times (alternatives are property names as the libraries declare them).
export const P = {
  disabled: 'disabled|isDisabled', readOnly: 'readOnly|isReadOnly', open: 'open|isOpen|opened', onOpen: 'onOpenChange|onOpen|onClose|afterOpenChange',
  placement: 'placement|side|position|anchorOrigin', loading: 'loading|isPending|isLoading', orientation: 'orientation|vertical',
  invalid: 'invalid|isInvalid|error|status', multiple: 'multiple|selectionMode|mode', size: 'size', variant: 'variant|variants', clear: 'allowClear|clearable|isClearable|onClear|clearButtonProps',
  virtual: 'virtual|virtualized|virtualizer|virtualScroll|listHeight', value: 'value|defaultValue', arrow: 'arrow|withArrow|showArrow|Arrow|OverlayArrow',
}
// Arabic notes used many times. [kind, en, ar]
export const N = {
  placement: ['risk', 'Start/end placement must mirror with direction; physical left/right only when asked for explicitly', 'مواضع البداية والنهاية تنعكس مع الاتجاه، ولا يُستخدم اليسار واليمين الفيزيائيان إلا بطلب صريح'],
  arrows: ['req', 'Arrow keys follow the visual direction: in RTL ArrowLeft moves to the next item', 'مفاتيح الأسهم تتبع الاتجاه البصري: في RTL السهم الأيسر ينتقل إلى العنصر التالي'],
  numerals: ['req', 'Numbers render in the numerals of the locale scope (Latin or Arabic-Indic), independent of language', 'الأرقام تُعرض بنظام أرقام النطاق (لاتينية أو هندية) بمعزل عن اللغة'],
  strings: ['req', 'Built-in strings come from the locale scope, with the six Arabic plural forms where a count is spoken', 'النصوص الداخلية تأتي من نطاق اللغة، مع صيغ الجمع العربية الست حيث يُنطق عدد'],
  mirrorIcon: ['risk', 'Directional icons (chevrons, arrows) must mirror in RTL; non-directional ones must not', 'الأيقونات الاتجاهية (الأسهم) يجب أن تنعكس في RTL، وغير الاتجاهية لا تنعكس'],
  search: ['opp', 'Arabic-tolerant matching: hamza forms, alef maqsura, taa marbuta and diacritics ignored; digits match in any numeral system', 'مطابقة متسامحة مع العربية: تجاهل أشكال الهمزة والألف المقصورة والتاء المربوطة والتشكيل، ومطابقة الأرقام بأي نظام أرقام'],
  mixed: ['req', 'Mixed-script content takes its direction from the content, with foreign runs isolated', 'النص المختلط يأخذ اتجاهه من محتواه مع عزل المقاطع المكتوبة بخط آخر'],
  digitsIn: ['req', 'Typing accepts Latin, Arabic-Indic and Persian digits whatever the display numerals', 'الإدخال يقبل الأرقام اللاتينية والهندية والفارسية أيًّا كان نظام أرقام العرض'],
  logical: ['req', 'Laid out with logical properties so the inline start is the right edge in Arabic', 'يُبنى بالخصائص المنطقية فتكون بداية السطر هي الحافة اليمنى في العربية'],
  fill: ['risk', 'The fill grows from the inline start; a left-anchored fill reads backwards in RTL', 'التعبئة تبدأ من بداية السطر، والتعبئة المثبتة يسارًا تُقرأ معكوسة في RTL'],
  ltrValue: ['req', 'The value is a left-to-right island inside an RTL form: digits and Latin codes never reorder', 'القيمة جزيرة من اليسار إلى اليمين داخل نموذج RTL، فلا يتغير ترتيب الأرقام والرموز اللاتينية'],
  calendar: ['req', 'The calendar system (Gregorian, Hijri Umm al-Qura) is chosen separately from language and numerals; storage stays ISO Gregorian', 'نظام التقويم (ميلادي أو هجري أم القرى) يُختار بمعزل عن اللغة والأرقام، والتخزين يبقى ميلاديًا بصيغة ISO'],
  tashkeel: ['risk', 'Line height must clear stacked diacritics; Arabic text takes no letter-spacing', 'ارتفاع السطر يجب أن يتسع للتشكيل المتراكب، ولا يُطبَّق تباعد الحروف على العربية'],
  truncate: ['risk', 'Truncation cuts at the inline end of the text direction, and a mixed-script string can lose its meaningful part', 'الاقتطاع يحدث عند نهاية السطر بحسب اتجاه النص، وقد يفقد النص المختلط جزءه المهم'],
}
