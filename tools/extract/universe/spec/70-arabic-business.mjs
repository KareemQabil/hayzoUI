import { C, N, P } from './_dsl.mjs'

// Components an Arabic-first business system needs. Most have no counterpart in the surveyed libraries.

C('number-text', 'Number text', 'نص رقمي', 'display', 'T1', 'p0', {
  s: ['Formats a number for reading in the numerals and separators of the scope.', 'ينسّق رقمًا للقراءة بنظام أرقام النطاق وفواصله.'],
  e: 'none', a: 'root',
  al: { mantine: 'NumberFormatter', chakra: 'FormatNumber FormatByte' },
  f: [
    ['numerals', 'Latin or Arabic-Indic digits from the scope, not from the language', 'أرقام لاتينية أو هندية من النطاق لا من اللغة', 'p0', '', '', ['req', 'Egypt writes Arabic with Latin digits in most business software while Saudi documents often use Arabic-Indic; the choice is a setting', 'مصر تكتب العربية بأرقام لاتينية في معظم برامج الأعمال بينما وثائق سعودية كثيرة تستخدم الهندية، فالاختيار إعداد']],
    ['separators', 'Grouping and decimal separators of the numeral system', 'فواصل الآلاف والكسور الخاصة بنظام الأرقام', 'p0', 'thousandSeparator|decimalSeparator|notation|style', '', ['risk', 'The Arabic thousands separator looks like the decimal separator in interface fonts; grouping with a narrow no-break space avoids the confusion', 'فاصل الآلاف العربي يشبه الفاصلة العشرية في خطوط الواجهات، والتجميع بمسافة ضيقة غير فاصلة يتجنب اللبس']],
    ['identifiers', 'Identifiers stay Latin', 'المعرّفات تبقى لاتينية', 'p0', '', '', ['req', 'Codes such as INV-2026-0148 keep the digits they were written with; only quantities, amounts, phones and dates follow the preference', 'الرموز مثل INV-2026-0148 تحتفظ بأرقامها كما كُتبت، والتفضيل يشمل الكميات والمبالغ والهواتف والتواريخ فقط']],
    ['tabular', 'Tabular digits in columns', 'أرقام متساوية العرض في الأعمدة', 'p1', '', '', ['risk', 'Not every Arabic face has tabular Arabic-Indic digits; the font layer records which do', 'ليست كل الخطوط العربية تحوي أرقامًا هندية متساوية العرض، وطبقة الخطوط تسجّل أيها يحويها']],
    ['sign', 'Sign and percent placement from locale data', 'موضع الإشارة وعلامة النسبة من بيانات اللغة', 'p1', 'prefix|suffix|style', '', ['risk', 'A minus after the digits or a percent on the wrong side comes from concatenating strings in RTL', 'علامة السالب بعد الأرقام أو علامة النسبة في الجهة الخاطئة تنتج عن ضم النصوص في RTL']],
    ['isolated', 'Rendered as one isolated run', 'يُرسم كمقطع معزول واحد', 'p0', '', '', N.ltrValue],
    ['compact-bytes', 'Compact and byte formats', 'صيغ مختصرة وصيغ البايت', 'p2', 'notation|unit|unitDisplay', ''],
  ],
  dec: [['naming', 'The owner\'s earlier code calls these Digits / NumberText; one entry covers both.']],
})

C('money-text', 'Money text', 'نص مبلغ', 'display', 'T1', 'p0', {
  s: ['Shows an amount stored in minor units with its currency.', 'يعرض مبلغًا مخزنًا بالوحدات الصغرى مع عملته.'],
  e: 'none', a: 'root amount currency', d: 'number-text',
  al: { 'antd-pro': 'FieldMoney' },
  f: [
    ['minor-units', 'Input is integer minor units and an ISO currency', 'المُدخل وحدات صغرى صحيحة وعملة ISO', 'p0', '', '', ['req', 'Decimals come from the currency (2, 3 or 0), never from the number', 'الخانات العشرية تأتي من العملة (٢ أو ٣ أو ٠) لا من الرقم']],
    ['currency-form', 'Symbol, code or Arabic name with plural agreement', 'رمز أو كود أو اسم عربي متوافق مع العدد', 'p0', 'moneySymbol|locale', '', ['req', '"٣ جنيهات", "١١ جنيهًا", "١٠٠ جنيه": the currency noun changes with the number', '«٣ جنيهات» و«١١ جنيهًا» و«١٠٠ جنيه»: اسم العملة يتغير مع العدد']],
    ['side', 'Currency side from locale data', 'جهة العملة من بيانات اللغة', 'p0', '', '', ['risk', 'A symbol placed with CSS order ends up on the wrong side in one of the two directions', 'الرمز الموضوع بترتيب CSS ينتهي في الجهة الخاطئة في أحد الاتجاهين']],
    ['negative', 'Negative amounts: minus or brackets', 'المبالغ السالبة: إشارة أو أقواس', 'p1', '', '', ['risk', 'Brackets mirror in RTL and a trailing minus is a common rendering defect', 'الأقواس تنعكس في RTL وعلامة السالب في آخر الرقم عيب شائع']],
    ['new-symbols', 'New currency symbols with a fallback', 'رموز العملات الجديدة مع بديل', 'p1', '', '', ['risk', 'The Saudi riyal symbol was added to Unicode recently and most fonts lack it; the fallback is the code or the Arabic abbreviation', 'رمز الريال السعودي أُضيف إلى يونيكود حديثًا ومعظم الخطوط لا تحويه، والبديل هو الكود أو الاختصار العربي']],
  ],
})

C('count-text', 'Count text', 'نص عدد', 'display', 'T1', 'p1', {
  s: ['A number with the noun it counts, in the right Arabic plural form.', 'رقم مع المعدود بصيغة الجمع العربية الصحيحة.'],
  e: 'none', a: 'root', d: 'number-text',
  f: [
    ['six-forms', 'Six plural categories', 'ست فئات للجمع', 'p0', '', '', ['req', 'zero, one, two, few (3–10), many (11–99) and other; "one" and "two" usually drop the digit ("عميل واحد", "عميلان")', 'صفر ومفرد ومثنى وقليل (٣–١٠) وكثير (١١–٩٩) وغير ذلك، والمفرد والمثنى يُكتبان غالبًا بلا رقم («عميل واحد»، «عميلان»)']],
    ['gender', 'Number–noun gender agreement', 'توافق العدد والمعدود في الجنس', 'p1', '', '', ['risk', 'Numbers 3–10 take the opposite gender of the noun when spelled out; digits avoid the problem, words do not', 'الأعداد من ٣ إلى ١٠ تخالف المعدود في الجنس عند كتابتها بالحروف، والأرقام تتجنب المشكلة بخلاف الكلمات']],
    ['zero', 'Zero has its own sentence', 'للصفر جملته الخاصة', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone; listed as CountText in the owner\'s T1.']],
})

C('amount-in-words', 'Amount in words', 'تفقيط', 'display', 'T5', 'p0', {
  s: ['Spells an amount out in Arabic words for invoices, cheques and receipts.', 'يكتب المبلغ بالحروف العربية للفواتير والشيكات والإيصالات.'],
  e: 'none', a: 'root', d: 'money-text',
  f: [
    ['grammar', 'Gender, case and dual forms', 'التذكير والتأنيث والإعراب والمثنى', 'p0', '', '', ['req', 'The currency noun and its subunit have genders; tens and units are joined with و and ordered units-first', 'لاسم العملة ولجزئها جنس، والآحاد والعشرات تُعطف بالواو مع تقديم الآحاد']],
    ['subunit', 'Major and minor unit names per currency', 'اسما الوحدة وجزئها لكل عملة', 'p0', '', '', ['req', 'جنيه/قرش, ريال/هللة, دينار/فلس with 100 or 1000 subunits, from currency data', 'جنيه وقرش، ريال وهللة، دينار وفلس، بمئة أو ألف جزء من بيانات العملات']],
    ['closing', 'Closing phrase ("فقط … لا غير")', 'عبارة الختام («فقط … لا غير»)', 'p1', '', '', ['req', 'The framing phrase used on cheques and invoices is a setting per document type', 'عبارة الإطار المستخدمة في الشيكات والفواتير إعداد لكل نوع مستند']],
    ['english', 'English words for bilingual documents', 'الكتابة بالإنجليزية للمستندات ثنائية اللغة', 'p1', '', ''],
    ['range', 'Stated maximum; larger amounts are an error, not a wrong sentence', 'حد أقصى معلن، وما فوقه خطأ لا جملة مغلوطة', 'p0', '', ''],
  ],
  dec: [['scope', 'Ours alone; T5 in the owner\'s plan.']],
})

C('phone-input', 'Phone input', 'حقل هاتف', 'text-input', 'T2', 'p0', {
  s: ['Phone entry with country, national formatting and E.164 output.', 'إدخال هاتف بالدولة والتنسيق المحلي ومُخرج بصيغة E.164.'],
  e: 'text-input field', a: 'root country-trigger control', d: 'text-field country-select ltr-island',
  al: { mantine: 'PhoneInput' },
  seed: 'input:phone',
  sa: { phone: ['req', 'Accepts Arabic-Indic digits and rejects look-alike Latin letters; AntD has no phone input', 'يقبل الأرقام الهندية ويرفض الأحرف اللاتينية الشبيهة بالأرقام، و AntD لا يملك حقل هاتف'] },
  f: [
    ['e164', 'Stores E.164, shows the national form', 'يخزّن E.164 ويعرض الصيغة المحلية', 'p0', '', ''],
    ['ltr', 'The number is LTR in an RTL form', 'الرقم LTR داخل نموذج RTL', 'p0', '', '', N.ltrValue],
    ['grouping', 'Digit groups joined with no-break spaces', 'مجموعات الأرقام تُربط بمسافات غير فاصلة', 'p0', '', '', ['risk', 'An ASCII space between Arabic-Indic digit groups makes the bidi algorithm reverse the group order even inside an LTR field', 'المسافة العادية بين مجموعات الأرقام الهندية تجعل خوارزمية الاتجاه تعكس ترتيب المجموعات حتى داخل حقل LTR']],
    ['local-prefix', 'Local trunk prefix accepted (010… and +20 10…)', 'قبول البادئة المحلية (010… و +20 10…)', 'p0', '', ''],
    ['country', 'Country selector with Arabic names and tolerant search', 'اختيار الدولة بأسماء عربية وبحث متسامح', 'p1', 'countries|defaultCountry|country|onCountryChange|initialCountryCode', '', N.search],
    ['kind', 'Mobile or landline check from the numbering plan', 'التحقق من نوع الخط من خطة الترقيم', 'p1', '', ''],
    ['paste', 'Paste with spaces, dashes, brackets and bidi marks', 'اللصق مع مسافات وشرطات وأقواس وعلامات اتجاه', 'p0', '', ''],
  ],
  dec: [['scope', 'Not ours alone after all: Mantine 9 publishes PhoneInput. The Arabic rows have no counterpart there.']],
})

C('country-select', 'Country select', 'اختيار الدولة', 'selection', 'T2', 'p1', {
  s: ['Select over countries with Arabic names, dial codes and flags.', 'قائمة منسدلة للدول بأسمائها العربية ومفاتيح الاتصال والأعلام.'],
  e: 'combobox listbox collection selection overlay-layers anchored-position field', a: 'root trigger popup option flag dial-code', d: 'combobox',
  f: [
    ['names', 'Arabic and English names from CLDR', 'أسماء عربية وإنجليزية من CLDR', 'p0', '', '', N.search],
    ['order', 'Arab countries or recent choices first', 'الدول العربية أو الاختيارات الأخيرة أولًا', 'p1', '', ''],
    ['collation', 'Sorted with the Arabic collator', 'ترتيب بمُرتِّب اللغة العربية', 'p1', '', '', ['req', 'Names starting with the definite article sort by the letter after it only if the collator says so; the order is the collator\'s, not code-point order', 'الأسماء المبدوءة بـ«ال» تُرتَّب بالحرف التالي فقط إن قرر المُرتِّب ذلك، والترتيب ترتيب المُرتِّب لا ترتيب رموز المحارف']],
    ['dial-code', 'Dial code as an LTR island', 'مفتاح الاتصال كجزيرة LTR', 'p1', '', '', N.ltrValue],
  ],
  dec: [['scope', 'Ours alone. Named in ARCHITECTURE.md (regions feed the country picker).']],
})

C('currency-select', 'Currency select', 'اختيار العملة', 'selection', 'T2', 'p1', {
  s: ['Select over currencies with Arabic names, codes and symbols.', 'قائمة منسدلة للعملات بأسمائها العربية وأكوادها ورموزها.'],
  e: 'combobox listbox collection selection overlay-layers anchored-position field', a: 'root trigger popup option code symbol', d: 'combobox',
  f: [
    ['names', 'Arabic name, ISO code and symbol in each option', 'الاسم العربي وكود ISO والرمز في كل خيار', 'p0', '', '', N.mixed],
    ['search', 'Search by name in either language or by code', 'البحث بالاسم بأي من اللغتين أو بالكود', 'p1', '', '', N.search],
    ['regional-first', 'Region currency first', 'عملة المنطقة أولًا', 'p2', '', ''],
  ],
  dec: [['scope', 'Ours alone. Named in ARCHITECTURE.md (currencies feed the currency picker).']],
})

C('name-field', 'Name field', 'حقل الاسم', 'text-input', 'T2', 'p0', {
  s: ['Multi-part personal name entry in Arabic and Latin script.', 'إدخال اسم شخصي متعدد الأجزاء بالعربية واللاتينية.'],
  e: 'text-input field form', a: 'root part label control latin-control', d: 'text-field fieldset',
  f: [
    ['parts', 'Parts by country: first, father, grandfather, family', 'الأجزاء بحسب الدولة: الأول، الأب، الجد، العائلة', 'p0', '', '', ['req', 'Official names in Egypt and the Gulf are four-part; a first/last pair loses data and breaks matching with identity documents', 'الأسماء الرسمية في مصر والخليج رباعية، وثنائية الاسم الأول والأخير تفقد بيانات وتُفشل المطابقة مع وثائق الهوية']],
    ['two-scripts', 'Arabic and Latin spellings side by side', 'الكتابة العربية واللاتينية جنبًا إلى جنب', 'p0', '', '', ['req', 'Passports carry both spellings and they are entered, not transliterated silently; each control has its own direction', 'جوازات السفر تحمل الكتابتين وتُدخلان ولا تُنقلان حرفيًا بصمت، ولكل حقل اتجاهه']],
    ['compound', 'Compound names kept whole', 'الأسماء المركبة تبقى كاملة', 'p0', '', '', ['risk', '"عبد الله", "أبو بكر" and "نور الدين" are one given name; splitting on spaces is wrong', '«عبد الله» و«أبو بكر» و«نور الدين» اسم واحد، والفصل عند المسافات خطأ']],
    ['normalise', 'Search key without diacritics, stored text unchanged', 'مفتاح بحث بلا تشكيل مع بقاء النص المخزن', 'p1', '', '', N.search],
    ['script-check', 'Warns when the script does not match the control', 'تنبيه عندما لا يطابق الخط نوع الحقل', 'p1', '', '', ['opp', 'Latin typed in the Arabic control is usually a keyboard-layout slip and can be offered back corrected', 'كتابة اللاتينية في الحقل العربي غالبًا زلة تخطيط لوحة مفاتيح ويمكن عرض تصحيحها']],
    ['display', 'Display name and initials rules', 'قواعد اسم العرض والأحرف الأولى', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone; T2 in the owner\'s plan.']],
})

C('iban-field', 'IBAN field', 'حقل آيبان', 'text-input', 'T5', 'p0', {
  s: ['IBAN entry with country length, check digits and grouped display.', 'إدخال آيبان مع طول الدولة وأرقام التحقق وعرض مجمَّع.'],
  e: 'segmented-input text-input field', a: 'root control bank-hint', d: 'mask-input ltr-island',
  f: [
    ['checksum', 'Mod-97 check and country length', 'تحقق mod-97 وطول الدولة', 'p0', '', ''],
    ['ltr', 'Always LTR, Latin letters and digits', 'دائمًا LTR بأحرف وأرقام لاتينية', 'p0', '', '', N.ltrValue],
    ['any-digits', 'Arabic-Indic digits accepted and converted', 'قبول الأرقام الهندية وتحويلها', 'p0', '', '', N.digitsIn],
    ['grouping', 'Groups of four that survive copy and paste', 'مجموعات رباعية لا تتأثر بالنسخ واللصق', 'p1', '', '', ['risk', 'Display spaces must not enter the stored value, and pasted IBANs arrive with spaces and bidi marks', 'مسافات العرض يجب ألا تدخل القيمة المخزنة، والآيبان الملصق يصل بمسافات وعلامات اتجاه']],
    ['bank', 'Bank name from the bank code', 'اسم البنك من رمز البنك', 'p2', '', ''],
  ],
  dec: [['scope', 'Ours alone; T5 in the owner\'s plan.']],
})

C('national-id-field', 'National ID field', 'حقل الرقم القومي', 'text-input', 'T5', 'p0', {
  s: ['National identity number entry validated by the rules of its country.', 'إدخال رقم الهوية الوطنية مع التحقق بقواعد دولته.'],
  e: 'segmented-input text-input field', a: 'root control derived-hint', d: 'mask-input ltr-island',
  f: [
    ['rules', 'Length, structure and check digit per country', 'الطول والبنية ورقم التحقق لكل دولة', 'p0', '', '', ['req', 'The Egyptian 14-digit number encodes century, birth date, governorate and gender; the Saudi 10-digit number starts with 1 or 2 and has a Luhn-style check', 'الرقم المصري من ١٤ خانة يرمّز القرن وتاريخ الميلاد والمحافظة والنوع، والسعودي من ١٠ خانات يبدأ بـ١ أو ٢ وله رقم تحقق']],
    ['derived', 'Derived birth date and gender offered, not forced', 'عرض تاريخ الميلاد والنوع المستنتجين دون فرضهما', 'p1', '', ''],
    ['any-digits', 'Any digit system in, Latin digits stored', 'أي نظام أرقام عند الإدخال ولاتينية عند التخزين', 'p0', '', '', N.digitsIn],
    ['ltr', 'LTR island', 'جزيرة LTR', 'p0', '', '', N.ltrValue],
    ['resident', 'Resident and passport variants', 'صيغ الإقامة وجواز السفر', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone; T5 in the owner\'s plan.']],
})

C('tax-number-field', 'Tax number field', 'حقل الرقم الضريبي', 'text-input', 'T5', 'p0', {
  s: ['Tax registration number entry validated per country.', 'إدخال رقم التسجيل الضريبي مع التحقق لكل دولة.'],
  e: 'segmented-input text-input field', a: 'root control', d: 'mask-input ltr-island',
  f: [
    ['rules', 'Length and structure per authority', 'الطول والبنية لكل جهة ضريبية', 'p0', '', '', ['req', 'Saudi VAT numbers are 15 digits beginning and ending with 3; Egyptian registration numbers are 9 digits; the UAE TRN is 15', 'الرقم الضريبي السعودي ١٥ خانة يبدأ وينتهي بـ٣، والمصري ٩ خانات، والإماراتي ١٥ خانة']],
    ['any-digits', 'Any digit system in, Latin digits stored', 'أي نظام أرقام عند الإدخال ولاتينية عند التخزين', 'p0', '', '', N.digitsIn],
    ['ltr', 'LTR island with grouping', 'جزيرة LTR مع تجميع', 'p0', '', '', N.ltrValue],
    ['related', 'Commercial registration number variant', 'صيغة رقم السجل التجاري', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone. Rule values quoted in notes are examples to be confirmed against data/finance, which is the source of truth.']],
})

C('address-form', 'Address form', 'نموذج العنوان', 'pattern', 'T5', 'p1', {
  s: ['Address fields arranged and validated by country.', 'حقول العنوان مرتبة ومتحقَّق منها بحسب الدولة.'],
  e: 'form field combobox', a: 'root country field', d: 'form country-select combobox text-field',
  f: [
    ['by-country', 'Fields and order per country', 'الحقول وترتيبها لكل دولة', 'p0', '', '', ['req', 'Egypt: governorate, city/district, street, building, floor, flat. Saudi national address: building number, street, district, city, postal code, additional number', 'مصر: محافظة ثم مدينة أو حي ثم شارع فمبنى فدور فشقة. العنوان الوطني السعودي: رقم المبنى والشارع والحي والمدينة والرمز البريدي والرقم الإضافي']],
    ['admin-lists', 'Administrative divisions with Arabic names', 'التقسيمات الإدارية بأسمائها العربية', 'p0', '', '', N.search],
    ['short-code', 'Short address code', 'الرمز المختصر للعنوان', 'p2', '', '', N.ltrValue],
    ['landmark', 'Landmark line', 'سطر أقرب معلم', 'p1', '', '', ['opp', 'Deliveries in the region rely on a landmark description; the form gives it a field instead of overloading "address line 2"', 'التوصيل في المنطقة يعتمد على وصف أقرب معلم، والنموذج يخصص له حقلًا بدل تحميله على «سطر العنوان ٢»']],
    ['format', 'One-line and multi-line output by country', 'مُخرج بسطر واحد أو عدة أسطر بحسب الدولة', 'p1', '', '', ['req', 'Arabic addresses run from the larger unit to the smaller or the reverse depending on the country and the document', 'العناوين العربية تبدأ بالوحدة الأكبر أو الأصغر بحسب الدولة ونوع المستند']],
    ['bilingual', 'Arabic and Latin versions for shipping labels', 'نسختان عربية ولاتينية لملصقات الشحن', 'p2', '', ''],
  ],
  dec: [['scope', 'Ours alone; L5 pattern in ARCHITECTURE.md.']],
})

C('invoice', 'Invoice', 'فاتورة', 'pattern', 'T5', 'p0', {
  s: ['A tax invoice document: parties, line items, tax breakdown, totals, QR and print layout.', 'مستند فاتورة ضريبية: الأطراف والبنود وتفصيل الضريبة والإجماليات ورمز QR وتخطيط الطباعة.'],
  e: 'table-model', a: 'root header seller buyer meta lines tax-summary totals amount-in-words qr footer', d: 'data-table money-text tax-summary amount-in-words qr-code date-text description-list',
  f: [
    ['mandatory-fields', 'Mandatory fields by country and invoice type', 'الحقول الإلزامية بحسب الدولة ونوع الفاتورة', 'p0', '', '', ['req', 'Simplified and standard tax invoices carry different mandatory fields; the list comes from data/finance, never hard-coded', 'الفاتورة الضريبية المبسطة والقياسية تختلفان في الحقول الإلزامية، والقائمة من بيانات المالية لا من الشيفرة']],
    ['bilingual', 'Arabic with a second language side by side', 'العربية مع لغة ثانية جنبًا إلى جنب', 'p0', '', '', ['req', 'Arabic is mandatory on Saudi tax invoices; a bilingual layout pairs each label, with Arabic on the right', 'العربية إلزامية في الفواتير الضريبية السعودية، والتخطيط ثنائي اللغة يقرن كل عنوان مع وضع العربية يمينًا']],
    ['rounding', 'Line and document rounding rule', 'قاعدة تقريب البند والمستند', 'p0', '', '', ['req', 'Tax is computed in minor units; whether rounding is per line or per document is a rule of the authority and is shown', 'الضريبة تُحسب بالوحدات الصغرى، والتقريب لكل بند أو لكل مستند قاعدة للجهة الضريبية ويُبيَّن']],
    ['qr', 'Regulatory QR code', 'رمز QR النظامي', 'p0', '', '', ['req', 'The QR payload format is set by the tax authority and generated from the same totals that are printed', 'صيغة حمولة QR تحددها الجهة الضريبية وتُولَّد من الإجماليات المطبوعة نفسها']],
    ['print', 'A4 print with repeated header and page numbers', 'طباعة A4 برأس مكرر وأرقام صفحات', 'p0', '', '', ['risk', 'Print engines differ on RTL tables that break across pages; column order and repeated headers need a test per browser', 'محركات الطباعة تختلف في جداول RTL المنقسمة بين الصفحات، فترتيب الأعمدة والرأس المكرر يحتاجان اختبارًا لكل متصفح']],
    ['dates', 'Issue and supply dates, optionally in both calendars', 'تاريخا الإصدار والتوريد وبالتقويمين عند الطلب', 'p1', '', '', N.calendar],
    ['credit-note', 'Credit and debit note variants', 'صيغتا الإشعار الدائن والمدين', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone; L5 pattern in ARCHITECTURE.md.']],
})

C('receipt', 'Receipt', 'إيصال', 'pattern', 'T5', 'p0', {
  s: ['A point-of-sale receipt laid out for 58 mm and 80 mm thermal printers.', 'إيصال نقطة بيع مصمم لطابعات حرارية بعرض ٥٨ و٨٠ ملم.'],
  e: 'none', a: 'root header lines totals payment qr footer', d: 'money-text tax-summary qr-code date-text',
  f: [
    ['paper', 'Fixed paper widths with character columns', 'عروض ورق ثابتة بأعمدة محارف', 'p0', '', '', ['risk', 'Thermal printers in raster mode print whatever the browser shapes; in text mode many cannot shape Arabic at all, so the receipt is rendered as an image or HTML', 'الطابعات الحرارية في نمط الصورة تطبع ما يشكّله المتصفح، وفي نمط النص لا يستطيع كثير منها تشكيل العربية، فيُرسم الإيصال صورة أو HTML']],
    ['columns', 'Item on the right, amount on the left', 'الصنف يمينًا والمبلغ يسارًا', 'p0', '', '', N.logical],
    ['font', 'A face that stays legible at receipt size', 'خط يبقى مقروءًا بحجم الإيصال', 'p0', '', '', ['risk', 'Thin Arabic strokes and dots drop out at 203 dpi; weight and size come from the font layer', 'الخطوط العربية الرفيعة ونقاطها تختفي عند دقة ٢٠٣ نقطة في البوصة، والوزن والحجم من طبقة الخطوط']],
    ['totals', 'Totals, tax and payment method', 'الإجماليات والضريبة وطريقة الدفع', 'p0', '', '', N.numerals],
    ['qr', 'QR for the simplified tax invoice', 'رمز QR للفاتورة الضريبية المبسطة', 'p0', '', ''],
    ['cut', 'No page margins, automatic length', 'بلا هوامش صفحة وبطول تلقائي', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone; L5 pattern in ARCHITECTURE.md.']],
})

C('tax-summary', 'Tax summary', 'ملخص الضريبة والزكاة', 'pattern', 'T5', 'p1', {
  s: ['Breakdown of taxable amounts, VAT by rate, and zakat where it applies.', 'تفصيل المبالغ الخاضعة للضريبة وضريبة القيمة المضافة لكل نسبة والزكاة حيث تنطبق.'],
  e: 'none', a: 'root row rate taxable tax total', d: 'money-text description-list',
  f: [
    ['by-rate', 'One row per rate and category (standard, zero, exempt)', 'صف لكل نسبة وفئة (أساسية، صفرية، معفاة)', 'p0', '', '', ['req', 'Rates are dated claims in data/finance; the summary shows the rate that applied on the supply date', 'النسب بيانات مؤرخة في بيانات المالية، والملخص يعرض النسبة السارية في تاريخ التوريد']],
    ['exact', 'Totals reconcile to the minor unit', 'الإجماليات تتطابق حتى الوحدة الصغرى', 'p0', '', ''],
    ['percent', 'Rate written with the locale percent sign', 'النسبة مكتوبة بعلامة النسبة الخاصة باللغة', 'p1', '', '', N.numerals],
    ['zakat', 'Zakat line where the entity is subject to it', 'سطر الزكاة حين تخضع لها المنشأة', 'p2', '', '', ['req', 'Zakat is assessed on the entity, not per invoice; the line appears in period summaries and reports only', 'الزكاة تُحتسب على المنشأة لا على الفاتورة، فيظهر السطر في ملخصات الفترات والتقارير فقط']],
    ['inclusive', 'Tax-inclusive and tax-exclusive presentation', 'عرض شامل الضريبة وغير شامل', 'p1', '', ''],
  ],
  dec: [['naming', 'tax-summary covers the "zakat/VAT summary" of the brief.']],
})

C('pro-form', 'Pro form', 'نموذج احترافي', 'pattern', 'T5', 'p1', {
  s: ['Forms generated from a schema of typed fields, with layouts, steps and modal or drawer shells.', 'نماذج تُولَّد من مخطط حقول ذات أنواع، مع تخطيطات وخطوات وأغلفة حوار أو درج.'],
  e: 'form field stepper dialog', a: 'root group field submitter', d: 'form field dialog drawer stepper',
  al: { 'antd-pro': 'ProForm BetaSchemaForm StepsForm ModalForm DrawerForm QueryFilter LightFilter LoginForm ProField Submitter' },
  f: [
    ['schema', 'Fields from a schema with value types', 'حقول من مخطط بأنواع قيم', 'p1', 'valueType|columns', '', ['req', 'Value types include the Arabic-first fields (money, phone, dual-calendar date, national id), so a schema gets them without custom renderers', 'أنواع القيم تشمل الحقول العربية أولًا (مبلغ، هاتف، تاريخ بتقويمين، رقم قومي) فيحصل عليها المخطط دون عارضات مخصصة']],
    ['grid', 'Responsive grid layout', 'تخطيط شبكي متجاوب', 'p1', 'grid|colProps|rowProps', '', N.logical],
    ['submitter', 'Submit bar with reset and loading', 'شريط إرسال مع إعادة الضبط والتحميل', 'p1', 'submitter', ''],
    ['steps', 'Multi-step form', 'نموذج متعدد الخطوات', 'p1', 'StepsForm|stepsProps', ''],
    ['read-mode', 'Read mode that renders values as text', 'نمط قراءة يعرض القيم كنص', 'p1', 'readonly|mode', ''],
    ['dependency', 'Dependent fields', 'حقول معتمدة على غيرها', 'p2', 'dependencies|ProFormDependency', ''],
  ],
})

C('numeric-keypad', 'Numeric keypad', 'لوحة أرقام', 'numeric-input', 'T5', 'p2', {
  s: ['On-screen digit pad for point-of-sale and kiosk amounts.', 'لوحة أرقام على الشاشة لمبالغ نقاط البيع والأكشاك.'],
  e: 'press numeric-input grid-navigation', a: 'root key display', d: 'button currency-input',
  f: [
    ['layout', 'Key layout is not mirrored', 'تخطيط المفاتيح لا ينعكس', 'p0', '', '', ['req', 'The 1-2-3 row reads left to right on every phone and calculator, in Arabic too; only the labels change to Arabic-Indic digits', 'صف ١-٢-٣ يُقرأ من اليسار إلى اليمين في كل هاتف وآلة حاسبة حتى في العربية، وتتغير العناوين فقط إلى الأرقام الهندية']],
    ['decimal', 'Decimal key by currency', 'مفتاح الفاصلة العشرية بحسب العملة', 'p1', '', ''],
    ['touch', '44 px touch targets', 'مساحات لمس ٤٤ بكسل', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone; added for the point-of-sale context the owner\'s tokens already describe.']],
})

C('floating-panel', 'Floating panel', 'لوح عائم', 'overlay', 'T5', 'p2', {
  s: ['A non-modal window that can be dragged, resized and minimised.', 'نافذة غير حاجبة يمكن سحبها وتغيير حجمها وتصغيرها.'],
  e: 'overlay-layers resize', a: 'root header drag-handle resize-handle body controls',
  al: { mantine: 'FloatingWindow', chakra: 'FloatingPanel' },
  f: [['drag', 'Drag within bounds', 'السحب داخل الحدود', 'p2', 'draggable|constrainToViewport|allowOverflow|constrainOffset', ''], ['resize', 'Resize from edges', 'تغيير الحجم من الحواف', 'p2', 'resizable|minSize|maxSize', ''], ['controls-side', 'Window controls at the inline end', 'عناصر النافذة عند نهاية السطر', 'p2', '', '', N.logical]],
})
