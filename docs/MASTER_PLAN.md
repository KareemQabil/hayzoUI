# الخطة الرئيسية: منظومة واجهات عربية أولًا

> اسم المنتج لسه مؤقت. في الخطة دي `<name>` مكان الاسم، و`@<name>/…` مكان أسماء الحزم.
> المدد المذكورة تقديرات لشخص واحد شغال بالـAI بدوام شبه كامل. مش وعود، وهتتظبط بعد التجربة الأولى (المرحلة 4أ).

> **تعديل 2026-11-05: Figma Make خرج من الخطة.** تصدير Make الوحيد (الـExplorer) بقى أساس الكود، وكل الطبقات بتتعمل في الكود.
> - **المرحلة 1 بقت «الطبقة البصرية في الكود».** لوحة الحالات لكل عائلة بتتولّد أوتوماتيك من الـspec في صفحة المصفوفة، بكل حالة × RTL وLTR × light وdark × الكثافات × متغيرات المحتوى. صفحة المصفوفة دي هي نفسها هدف الاختبارات، يعني المراجعة البصرية والاختبار بقوا على نفس الصفحة.
> - **الموافقة البصرية:** صور baselines بتتراجع وتتقفل لكل عائلة.
> - **المرحلة 2 (الحصاد من Make) اتلغت.**
> - `figma-make-addendum.md` بقى مرجع تاريخي بس، وقائمة المكونات والمحتوى اللي فيه لسه صالحة.

---

## 0. الفكرة في سطر واحد

المكتبات التانية بتبيع **كود**. إحنا بنبيع **كود ومعاه ضمان سلوك مكتوب ومختبر في سياقات معلنة**، والعربي هو أقوى محور فيها.

والطريق لده:
- عقود الأول.
- بعدين طبقات معزولة، كل واحدة بتتختبر لوحدها.
- بعدين دمج بيبقى **تحقق** مش اختراع.

---

## 1. المبادئ اللي بتحكم كل قرار

1. **العقد قبل الكود.** مافيش مكوّن يتصمم ولا يتكتب قبل ما الـspec بتاعه يتوافق عليه.
2. **مصدر واحد للحقيقة.** الـspec بتتولد منه الحالات في Figma Make، والكود، والتوثيق، والاختبارات، ومعرفة الـagents.
3. **الطبقات مابتعرفش بعض إلا من خلال العقد.** الستايل مايعرفش React، وطبقة العربي ماتعرفش الـDOM.
4. **كل ادعاء له دليل.** حالة كل ادعاء واحدة من دول: مقترح، أو منفذ، أو مختبر يدويًا، أو مختبر أوتوماتيك، أو غير مختبر.
5. **ماتتربطش بحاجة مش بتاعتك.** أي اعتماد خارجي (الـprimitive أو الـframework أو محرك الستايل) يبقى ورا adapter بواجهة إحنا اللي حاططينها.
6. **عائلة واحدة في المرة.** ماننقلش للعائلة اللي بعدها قبل ما الحالية تعدي البوابات.
7. **Figma Make هو المظهر والمرجع البصري، مش الكود النهائي.**

---

## 2. المعمارية النهائية: الطبقات

```
L0  Contracts     specs + schemas: component, rule, pattern, token, locale, test
L1  Tokens        reference → semantic → component + locale tokens (separate from theme)
L2  Arabic core   pure functions: digits, amount, phone, search, bidi, plural, (tafqeet, iban, id…)
L3  Behavior      headless hooks: state, keyboard, focus, ARIA — on a primitive behind an adapter
L4  Style         plain CSS: CSS variables + logical properties + data-attributes. No runtime CSS-in-JS
L5  Components    L3 + L4 = React components (+ copy-paste registry items)
L6  Patterns      complete tasks + reference applications
L7  Product       docs/explorer, theme studio, evidence, knowledge export, (MCP later)
──  Harness       cross-cutting: property, metamorphic, model-based, e2e, visual, a11y, fuzz
──  Evidence      every run writes a Test record; docs read from it
```

**ليه CSS عادي بالـdata-attributes؟** لأنه بيشتغل مع الـServer Components ومع أي framework ومع Vue بعدين، ومابيتكسرش لما Tailwind أو Emotion يتغيروا. ده بيقفل أكبر باب للشكاوى عند الناس. وTailwind preset هيبقى اختياري فوقه.

### هيكل الريبو (monorepo)

```
packages/
  spec/        JSON Schemas + all specs (components/, rules/, patterns/, tokens/, locales/)
  tokens/      build → CSS variables, TS, DTCG JSON, Figma-variables JSON
  arabic/      L2 — zero dependencies
  react/       L3 + L5 — hooks and components
  styles/      L4 — one CSS file per component + base
  registry/    generated copy-paste items (react + styles)
  cli/         add / diff / upgrade / codemods
apps/
  docs/        the explorer (successor of the Figma Make prototype)
  matrix/      spec-driven state-matrix renderer (the test target)
  reference/   reference apps: customer-payment, invoice…
harness/
  properties/  metamorphic/  model/  fuzz/  e2e/  visual/  evidence/
design/
  make-exports/  frozen read-only snapshots of Figma Make code, by family and date
  baselines/     approved screenshots
```

الأدوات: pnpm workspaces، وTypeScript، وVite، وVitest، وfast-check، وPlaywright (Chromium وFirefox وWebKit)، وaxe-core، وchangesets، وStyle Dictionary أو Terrazzo للـtokens.

---

## 3. عقد الدمج: الاتفاقيات العامة

**الجزء ده هو اللي بيخلي الدمج تحصيل حاصل.** يتكتب ويتقفل في المرحلة 0 قبل أي تصميم.

### 3.1 أسماء الـprops

| المفهوم | الاسم الثابت |
|---|---|
| القيمة | `value` / `defaultValue` / `onValueChange(value, details)` |
| الفتح | `open` / `defaultOpen` / `onOpenChange(open, details)` |
| القيمة الفاضية | **دايمًا `null`**. مش `undefined` ولا `0` ولا `""` |
| الحالات | `disabled`, `readOnly`, `required`, `invalid`, `loading` |
| الحجم | `size: 'sm' \| 'md' \| 'lg'` |
| الكثافة | من الـprovider، ومعاها override اختياري `density` |
| النبرة | `tone: 'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'info'` |
| الشكل | `variant: 'solid' \| 'soft' \| 'outline' \| 'ghost'` |
| الاتجاه واللغة | من `LocaleProvider` بس، ومافيش `dir` على كل مكوّن |
| النصوص الداخلية | `labels` object، وقيمته الافتراضية من رسائل الـlocale. ده بيحل مشكلة "Close" اللي مش متعربة |
| التركيب | طريقة واحدة بس (`render` prop أو `asChild`)، تتحدد في المرحلة 0 ومتتغيرش |
| الـref | على العنصر الأساسي دايمًا |

### 3.2 الحالات كـdata-attributes

`data-disabled`, `data-readonly`, `data-invalid`, `data-required`, `data-loading`, `data-state="open|closed|checked|unchecked|indeterminate"`, `data-selected`, `data-highlighted`, `data-pressed`, `data-focus-visible`, `data-orientation`, `data-empty`, `data-dir`.

الستايل بيقرا الحاجات دي بس. وده اللي بيخلي L3 وL4 يشتغلوا من غير ما يعرفوا بعض.

### 3.3 قاموس الحالات المقفول

`default`, `hover`, `focus-visible`, `pressed`, `selected`, `checked`, `indeterminate`, `disabled`, `readonly`, `invalid`, `required`, `loading`, `empty`, `open`, `closed`, `highlighted`, `expanded`, `collapsed`, `dragging`.

مافيش حالة جديدة تتضاف من غير تعديل القاموس ده.

### 3.4 متغيرات المحتوى، وكل حالة بتترسم بيها

`short` · `long-arabic` (اسم عربي طويل جدًا) · `mixed` («أحمد Khaled») · `ltr-island` (`SKU-AB-001` و`INV-2026-0148` و`+20 10 1234 5678`) · `diacritics` («مُحَمَّد») · `arabic-digits` (`١٢٣٤٫٥٠`) · `overflow`.

### 3.5 قواعد الستايل

- خصائص logical بس، مافيش `left` ولا `right` ولا `margin-left`.
- الألوان من الـtokens بس.
- ممنوع letter-spacing على العربي.
- كل أيقونة متسجلة بـ`mirror: auto | always | never`.
- الأرقام بتتعرض حسب تفضيل الـprovider، والإدخال بيقبل كل الأنواع.
- الحركة من الـtokens وبتحترم reduced motion.

---

## 4. شكل الـspec

```jsonc
{
  "id": "currency-input",
  "family": "numeric",
  "maturity": "draft",                 // draft → alpha → beta → stable
  "purpose": "…", "whenToUse": ["…"], "whenNotToUse": ["…"],
  "anatomy": ["root", "label", "control", "affix", "helper", "error"],
  "props": [{ "name": "value", "type": "number | null", "default": null, "doc": "minor units" }],
  "states": ["default", "hover", "focus-visible", "disabled", "readonly", "invalid", "required", "empty"],
  "content": ["short", "arabic-digits", "overflow"],
  "keyboard": [{ "key": "Tab", "action": "commit and normalize on blur" }],
  "aria": { "role": "textbox", "labelling": "label[for]", "describedBy": ["helper", "error"] },
  "tokens": { "control.height": "size.control.{density}", "border.invalid": "color.danger.border" },
  "locale": { "numeralsInput": "all", "numeralsDisplay": "provider", "ltrIslands": ["value"], "mirroredIcons": [] },
  "contracts": ["arabic.amount.v1"],
  "invariants": ["clear-then-blur-stays-empty", "same-value-any-numerals"],
  "contexts": { "supported": "…", "tested": "← generated from evidence", "unsupported": ["…"] },
  "primitive": { "source": "react-aria", "relationship": "integrated" },
  "rules": ["R-NUM-001"], "patterns": ["P-COLLECT-PAYMENT"]
}
```

في كل spec، خانة `contexts.tested` **مابتتكتبش باليد**. بتتولد من سجلات الـevidence.

---

## 5. مصفوفة السياقات (8 محاور)

| المحور | القيم |
|---|---|
| الاتجاه | rtl · ltr |
| اللغة والأرقام | ar-EG بأرقام لاتيني · ar-SA بأرقام عربي · en |
| الـframework | Vite SPA · Next App Router (RSC) · React 18.3 · React 19 |
| المتصفح | Chromium · Firefox · WebKit |
| الجهاز والإدخال | ديسكتوب بالماوس · 390px باللمس · الكيبورد بس |
| الثيم والكثافة | light/dark × compact/default/touch |
| التركيب | لوحده · جوه Dialog · جوه Drawer جوه Dialog · جوه form library |
| نموذج الحالة | controlled · uncontrolled |
| حجم الداتا (للقوائم والجداول) | 10 · 1,000 · 10,000 |

**طريقة التغطية:** pairwise (كل زوج قيم يتجرب مرة على الأقل) بأداة زي PICT. **ومحاور الاتجاه واللغة والأرقام بتتجرب كاملة** مع كل حاجة، لأن ده ملعبنا.

---

## 6. استراتيجية الاختبار لكل طبقة

| الطبقة | نوع الاختبار | المرجع اللي بيحكم على الصح والغلط |
|---|---|---|
| L1 Tokens | schema + تباين محسوب لكل الأزواج المعلنة | الحدود اللي في القواعد |
| L2 Arabic | unit و**property** (fast-check) و**metamorphic** | `parse(١٢٣)==parse(123)`، الـnormalize لو اتكرر مايغيرش حاجة، التسامح بيزوّد النتايج ومابيقللهاش |
| L3 Behavior | **model-based**: آلة حالة للمكوّن، وسلاسل أفعال عشوائية بتتقارن بالموديل | الموديل والـinvariants |
| L4 Style | **computed-style assertions**: كل جزء من الـanatomy قيمه = الـtokens. ومافيش overflow. وlint للخصائص الفيزيائية | الـspec والـtokens |
| L5 Components | Playwright بمصفوفة السياقات، وaxe، وسكريبت كيبورد متولد من الـspec | الـspec والـinvariants |
| التكامل | **fuzz للتركيب**: شجرة مكونات عشوائية وأفعال عشوائية | invariants عامة (تحت) |
| المقارنات | RTL ضد LTR، وأرقام عربي ضد لاتيني، وSSR ضد client، وReact 18 ضد 19 | أي فرق bug محتمل |
| يدوي | NVDA وVoiceOver وTalkBack وأجهزة لمس حقيقية، قبل كل release | بيتسجل "مختبر يدويًا" بس |

**الـinvariants العامة للتكامل:**
- مافيش focus على الـbody بعد أي فعل.
- بعد ما كل الـoverlays تقفل، مافيش scroll lock ولا `pointer-events: none` ولا `aria-hidden` فاضلة.
- Escape بترجّع الـfocus للعنصر اللي فتح.
- صفر أخطاء في الـconsole، وصفر hydration warnings، وaxe صفر.
- مافيش overflow أفقي في أي عرض.
- القيمة اللي اتخزنت متتغيرش من غير فعل صريح من المستخدم.

**قواعد الحتمية عشان الاختبارات ماتطلعش فشل وهمي:**
- ساعة ثابتة.
- كل fuzz بيسجل الـseed بتاعه.
- reduced motion شغال في الاختبارات.
- أي اختبار flaky يتعزل في قايمة quarantine ومايعطلش البوابة، بس لازم يتراجع خلال أسبوع.

**الحلقة اللي بتكبر مع الوقت:** fuzz يلاقي فشل، يتصغّر لأقل خطوات، الـseed يتسجل، يتحول لـfixture ثابتة، ويتحول لقاعدة ودليل منشور.

---

## 7. ترتيب بناء المكونات حسب الاعتمادية

| المستوى | المكونات |
|---|---|
| T0 أساس | tokens، LocaleProvider، Direction، Portal، FocusScope، VisuallyHidden، LtrIsland، Icon (مع سجل الـmirroring)، Text وHeading |
| T1 | Button، IconButton، Field anatomy (Label وHelper وError)، TextField، Textarea، Checkbox، Radio، Switch، CountText |
| T2 | NumberInput ثم CurrencyInput، PhoneInput، NameField، SearchField، Select، Combobox ثم CustomerPicker، Tabs، Segmented، Badge، Avatar (بالحروف الأولى من الاسم العربي)، Tooltip، Popover، Menu |
| T3 | Dialog، Drawer وSheet، Toast، Banner، EmptyState، Skeleton، Progress، Breadcrumb، Pagination، Stepper، AppShell وSidebar |
| T4 | DataTable (مع virtualization)، DatePicker بالتقويمين، DateRange، TagInput وMultiSelect، FileUpload، CommandPalette، Tree |
| T5 | AmountInWords (تفقيط)، IBANField، NationalIdField، تصحيح الكيبورد، الفرانكو، AddressForm حسب الدولة، Charts، Receipt وInvoice |

---

## 8. المراحل

### المرحلة 0: القرارات والعقود (أسبوع تقريبًا)

**المخرجات:**
- `CONTRACTS.md` فيه القسم 3 مقفول.
- JSON Schemas للـspec والـrule والـpattern والـtest والـtoken.
- قاموس الحالات ومتغيرات المحتوى.
- قواعد المحتوى: الصوت، والمصدر بدل فعل الأمر في الأزرار، والصياغة المحايدة جندريًا.
- مصفوفة السياقات ومستوى الدعم الرسمي (أنهي React وأنهي متصفحات).

**Spike لاختيار الـprimitive (يومين):** تبني CurrencyInput وCombobox وDialog على React Aria وBase UI وRadix، في RTL وبأرقام عربي، وتشغّل عليهم invariants التكامل. **القرار يتاخد بالدليل.** الفرضية المبدئية React Aria، لأن عنده locale parsing وتقاويم جاهزة، والـaudit بتاعك أثبت إنه بيقبل الأرقام العربية مع `ar-EG`.

**تقرر كمان:** الرخصة (MIT للـcore هي المقترحة)، وطريقة التركيب (`render` أو `asChild`)، وتوقيت الاسم النهائي.

**بوابة الخروج:** schemas بتعدي validation، وفيه spec تجريبي لـCurrencyInput بيعدي الـschema.

### المرحلة 1: الطبقة البصرية في Figma Make (3 لـ5 أسابيع، بالتوازي مع المرحلة 3)

**1أ. الأساسات:**
- Tokens.
- عينة الخط العربي في كل المقاسات ومع التشكيل.
- Theme studio.
- Field anatomy وFocus ring وسطوح العرض.

لو Make kits متاحة في خطتك، تتعمل الأساسات دي كـkit واحد وكل الملفات التانية تستخدمه.

**1ب. لوحات الحالات، عائلة عائلة بترتيب القسم 7:**
- لكل عائلة صفحة فيها كل حالة × RTL وLTR × light وdark × الـ3 كثافات × متغيرات المحتوى.
- **كل prompt بياخد الـspec حرفيًا.**

**1ج. الصفحات الرئيسية من الـbrief:**
- صفحة مرجع Currency Input.
- Pattern إضافة عميل وتحصيل مبلغ.
- التطبيق المرجعي.

**قالب الـprompt لكل عائلة:**
```
Follow the project guidelines and the attached foundations.
Scope: the <family> family only. Do not modify foundations or other families.
Spec (source of truth — render exactly these states, props and content variants):
<paste spec JSON>
Deliver one state-sheet page: every state × rtl/ltr × light/dark × compact/default/touch,
using the content variants listed. Use only existing tokens and the shared Field anatomy.
If a decision is not covered by the spec, choose, then list it under "Decisions to confirm".
End with an inventory: implemented, partial, planned, unchecked.
```

**التجميد بعد ما توافق على كل عائلة:**
- تنزّل الكود (download، أو GitHub لو متاح في خطتك) في `design/make-exports/<family>@<date>/`.
- تصوّر لوحة الحالات وتحطها في `design/baselines/`.
- أي "Decisions to confirm" وافقت عليها ترجع تتكتب في الـspec والـtokens.

**بوابة الخروج:** لوحات حالات T0 لـT3 متوافق عليها، والقرارات كلها راجعة للـspecs.

### المرحلة 2: الحصاد من Make (أسبوع تقريبًا، بيتكرر بعد كل دفعة)

كود Make **مابيتشحنش كما هو.** بيتعمل منه 3 حاجات:
1. **استخراج القرارات:** قيم الـtokens، ومسافات الـanatomy، والتراكيب، والنصوص، تتحول لـtokens وspecs.
2. **مرجع للـCSS:** طبقة L4 بتتكتب مستلهمة منه، بس بقواعدنا: logical properties وdata-attributes.
3. **مرجع بصري:** الـbaselines بتتحول لـcomputed-style assertions، يعني المسافة والزاوية واللون لكل جزء تساوي الـtoken. ومش بنعمل pixel diff بين Make والـfactory لأنهم تطبيقين مختلفين. الـpixel diff بنستخدمه بس للـregression جوه نفس التطبيق.

### المرحلة 3: طبقة العربي والـharness (2 لـ3 أسابيع، بالتوازي مع المرحلة 1)

- `@<name>/arabic`: digits وamount وphone (مصر في v1) وsearch normalize مع highlight mapping وbidi وplural. وكل دالة عليها properties وmetamorphic tests.
- **أول عميل حقيقي:** تشغّل الطبقة على كود Stockaat الأصلي وتصلّح APP-01 وAPP-02 وAPP-03.
- **الـharness:**
  - `apps/matrix` بيعرض أي مكوّن بكل حالاته وسياقاته من الـspec أوتوماتيك.
  - Playwright بمصفوفة pairwise.
  - axe.
  - مولّد سكريبت كيبورد من الـspec.
  - fuzz runner مع seed وshrinking.
  - **evidence writer** بيكتب سجلات Test.

**بوابة الخروج:** CI بيشغّل كل ده على مكوّن تجريبي واحد ويطلع سجلات evidence صحيحة.

### المرحلة 4: المصنع (مستمرة، على دفعات)

**4أ. تجربة المصنع على 3 عائلات:** Field وTextField، وButton، وDialog.
- تقيس: الوقت لكل مكوّن، ونسبة الفشل في البوابات، وفين الـAI بيغلط بانتظام.
- **تصلّح المصنع نفسه** قبل ما تكبّر: القوالب، والـprompts، والـgenerators.

**4ب. الإنتاج بالدفعات:** T1 بعدين T2 بعدين T3 بعدين T4. كل دفعة بتمشي كده:
1. spec متوافق عليه.
2. لوحة Make متوافق عليها.
3. توليد.
4. البوابات.
5. مراجعة الـAPI وفرق الصور.
6. تحديد الـmaturity.

**تعريف "خلص" لأي مكوّن (Definition of Done):**
- [ ] spec متوافق عليه وبيعدي الـschema.
- [ ] لوحة الحالات من Make متوافق عليها.
- [ ] typecheck وlint وقواعد الأسماء.
- [ ] كل الحالات × مصفوفة السياقات بتترسم، والـcomputed styles = الـtokens.
- [ ] axe صفر في كل حالة.
- [ ] سكريبت الكيبورد بيعدي في الاتجاهين.
- [ ] الـfocus: الدخول، والحبس لو مطلوب، وEscape، والرجوع.
- [ ] الـfixtures العربية والـinvariants بتعدي.
- [ ] صفحة توثيق، وأمثلة، وregistry item.
- [ ] الـevidence منشور وخانة `contexts.tested` متولدة.

**درجات النضج:**

| الدرجة | معناها |
|---|---|
| alpha | متنفذ، والبوابات جزئية |
| beta | كل البوابات الأوتوماتيك عدّت |
| stable | beta، وفوقيها اختبار يدوي بقارئ شاشة وجهاز حقيقي، واستخدام في تطبيق مرجعي، وأسبوعين من غير تغيير في الـAPI |

### المرحلة 5: الدمج والـfuzz (بتبدأ بعد T3)

- fuzz التركيب بالـinvariants العامة.
- المقارنات: RTL وLTR، والأرقام، وSSR وclient، وReact 18 و19، وNext وVite.
- كل فشل بيتحول لـfixture ثابتة.

### المرحلة 6: الـpatterns والتطبيقات المرجعية

- إضافة عميل وتحصيل، بعدين الفاتورة، بعدين المرتجعات.
- **دي أحسن اختبار دمج**: استخدام حقيقي بيطلع اللي المصفوفة ماشافتهوش.

### المرحلة 7: المنتج (الـdocs والـexplorer)

- نموذج Make بيتعاد بناؤه **بمكوناتنا الحقيقية**، فبنستخدم المكتبة في منتجنا نفسه.
- Theme studio حقيقي، وصفحة evidence بتقرا من السجلات.
- تصدير المعرفة JSON. والـMCP يتأجل لحد ما يتنفذ ويتختبر.

### المرحلة 8: التوزيع والإطلاق

- حزم npm بـchangesets و semver.
- Registry للنسخ واللصق، وCLI فيه `add` و`diff` و`upgrade` مع codemods. كده المستخدم يملك الكود ويفضل يجيله تحديثات.
- توثيق بالعربي الأول، ودليل مساهمة، وعملية RFC للقواعد.
- **التقرير العام:** نفس الـharness يشتغل على MUI وantd وshadcn وMantine والمكتبات العربية. **تبلّغ أصحابها الأول**، وبعدين تنشر بأمانة الـaudit: النطاق والحدود وطريقة إعادة الإنتاج.
- **datasets من المجتمع:** أسماء، وعناوين، وحالات أرقام، تبقى fixtures مفتوحة.

### المرحلة 9: النسخة المدفوعة (بعدين)

- فواتير وإيصالات PDF وحراري بتشكيل سليم وبنص يتقري صح لما حد يستخرجه.
- الفوترة الإلكترونية (ZATCA ومصر).
- Data grid للمؤسسات.
- دعم وشهادة "Arabic-ready" للمكتبات والمنتجات.

---

## 9. الخط الزمني التقريبي (خطوط شغل متوازية)

```
أسبوع:        1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16
المرحلة 0     ███
Make (1)           ████████████████████████
عربي+harness (3)   ███████████████
الحصاد (2)                   ██        ██        ██
المصنع (4)                        ████(4أ)████████████████████████████████
الدمج (5)                                                 ██████████████████
Patterns (6)                                                   ████████████
المنتج (7)                                                           ████████████
الإطلاق R1 (8)                                                                  ██
```

**الإصدار الأول R1، حوالي الأسبوع 16:**
- المستويات T0 لـT3 على درجة beta على الأقل.
- طبقة العربي على stable.
- Pattern واحد كامل وتطبيق مرجعي واحد.
- الـdocs والـevidence.

**R2:** المستويات T4 وT5، والتقرير العام، والـCLI كامل.

---

## 10. المخاطر وإزاي نتعامل معاها

| الخطر | التخفيف |
|---|---|
| Make بيطلع حاجات مش متسقة أو بيضيف حالات | الـspec في كل prompt، وعائلة واحدة في المرة، والتجميد، وقسم "Decisions to confirm" |
| حدود سياق Make مع المشروع الكبير | ملف أساسات أو kit، وملف لكل دفعة عائلات |
| الاعتماد على primitive صيانته بتبطأ | adapter بواجهتنا، وspike قبل القرار، وإمكانية التبديل بعدين |
| النطاق يتفرع ويكبر | البوابات، وعائلة في المرة، وتعريف "خلص" |
| الصيانة على شخص واحد | الأتمتة، والـAPI الصارم، والـcodemods |
| ادعاءات عن دول تانية مش متأكد منها | حالة "pending review"، ومراجعين من المجتمع |
| الاختبارات المتقطعة | الحتمية والـquarantine |
| مشاكل التراخيص والاسم | تسجيل مصدر كل خط وكل اعتماد. ومافيش أي إيحاء بعلاقة مع Google |
| "النتايج المرعبة" ترتد علينا | تبليغ أصحاب المكتبات الأول، ونشر الحدود، ومافيش scores مخترعة |

---

## 11. المقاييس اللي نتابعها (بالأرقام الحقيقية بس)

- عدد المكونات في كل درجة نضج.
- الوقت لكل مكوّن، ونسبة النجاح من أول مرة في البوابات.
- عدد الـbugs اللي بيلاقيها الـfuzz في كل ساعة تشغيل، وكم واحد منهم اتحول لـfixture.
- تغطية مصفوفة السياقات لكل مكوّن.
- بعد الإطلاق: التحميلات، والـissues، والمساهمات. من المصادر الفعلية بس.

---

## 12. أول أسبوعين بالتفصيل

**الأسبوع 1 (المرحلة 0):**
1. اكتب `CONTRACTS.md` من القسم 3 واقفل أي قرار مفتوح فيه.
2. الـJSON Schemas، والـspec الأول (CurrencyInput) بيعدي الـschema.
3. Spike الـprimitive لمدة يومين، والقرار مكتوب بالدليل.
4. Specs للمستويين T0 وT1، بمسودة من الـAI ومراجعة منك.
5. حدّث guidelines بتاعة Figma Make بالعقود ومتغيرات المحتوى.

**الأسبوع 2:**
1. Make: الأساسات (1أ).
2. الريبو: الهيكل، والـtokens build، و`@<name>/arabic` (digits وamount) بالـproperties.
3. تشغيل طبقة العربي على كود Stockaat وتسجيل النتايج كأول evidence.
4. Make: لوحة حالات Field وButton من الـspecs.
5. أول تجميد وحصاد.
