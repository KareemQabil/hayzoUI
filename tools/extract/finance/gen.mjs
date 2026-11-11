// Assembles the researched finance files from the notes below. Hand-researched data, not an extraction:
// every value here was read from the cited source during the session (see dl/ in the scratch directory).
import fs from 'node:fs'
import path from 'node:path'
const ROOT = '/home/user/hayzo'
const TODAY = '2026-11-11'
const V = 'verified', N = 'needs-review'
const src = (name, url, license, extra = {}) => ({ name, url, ...(extra.version ? { version: extra.version } : {}), license, retrievedAt: TODAY, ...(extra.path ? { path: extra.path } : {}) })
const GOV = 'Government publication, facts only'
const PROP = 'Proprietary, facts only'

// ---------- sources ----------
const pwc = (slug, country, reviewed) => src(`PwC Worldwide Tax Summaries: ${country}, Corporate - Other taxes`, `https://taxsummaries.pwc.com/${slug}/corporate/other-taxes`, PROP, { version: `last reviewed ${reviewed}` })
const oecd = (slug, country, updated) => src(`OECD AEOI portal: Tax Identification Numbers, ${country} (sheet supplied by the jurisdiction)`, `https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/${slug}-tin.pdf`, 'OECD terms, facts only', updated ? { version: `last update ${updated}` } : {})
const S = {
  zatcaSec: src('ZATCA: Security Features Implementation Standards', 'https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf', GOV, { version: '1.2 (2023-05-19)', path: 'Section 4.1 Structure of the QR code' }),
  zatcaXml: src('ZATCA: Electronic Invoice XML Implementation Standard', 'https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_XML_Implementation_Standard_%20vF.pdf', GOV, { version: '1.2 (2023-05-19)', path: 'Business rules BR-KSA-08, BR-KSA-14, BR-KSA-40, BR-KSA-44' }),
  zatcaPhases: src('ZATCA: E-invoicing roll-out phases', 'https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/Roll-out-phases.aspx', GOV, { version: 'page last updated 2026-09-01' }),
  zatcaWhat: src('ZATCA: What is e-invoicing (Fatoorah)', 'https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/What-is-e-invoicing.aspx', GOV),
  zatcaVatAr: src('ZATCA: VAT page (Arabic)', 'https://zatca.gov.sa/ar/RulesRegulations/VAT/Pages/default.aspx', GOV),
  mofVat: src('UAE Ministry of Finance: Value Added Tax (VAT)', 'https://mof.gov.ae/en/public-finance/tax/vat/', GOV),
  ftaAr: src('UAE Federal Tax Authority: VAT page (Arabic)', 'https://tax.gov.ae/ar/taxes/Vat.aspx', GOV),
  ftaEn: src('UAE Federal Tax Authority: VAT registration page, TRN verification widget', 'https://tax.gov.ae/en/taxes/Vat/vat.topics/vat.registration.aspx', GOV),
  aeGuide: src('UAE Ministry of Finance: UAE Electronic Invoicing Guidelines', 'https://mof.gov.ae/wp-content/uploads/2026/10/UAE-Electronic-Invoicing-Guidelines_En.pdf', GOV, { version: 'published 2026-10' }),
  aeFields: src('UAE Ministry of Finance: UAE Electronic Invoice Mandatory Field Requirements', 'https://mof.gov.ae/wp-content/uploads/2026/10/UAE-Electronic-Invoice-Mandatory-Field-Requirements.pdf', GOV, { version: 'published 2026-10' }),
  ae244: src('UAE Ministerial Decision No. 244 of 2025 on the Implementation of the Electronic Invoicing System', 'https://mof.gov.ae/wp-content/uploads/2025/09/Ministerial-Decision-No.-244-of-2025-on-the-Implementation-of-the-Electronic-Invoicing-System.pdf', GOV, { path: 'Articles 3, 4, 5' }),
  ae66: src('UAE Ministerial Decision No. 66 of 2026 amending Ministerial Decision No. 244 of 2025', 'https://mof.gov.ae/wp-content/uploads/2026/05/Ministerial-Resolution-No.-66-of-2026-Amending-Certain-Provisions-of-Ministerial-Resolution-No.-244-of-2025-Regarding-the-Implementation-of-the-Electronic-Invoicing-System-En-20260514.pdf', GOV, { path: 'Article One' }),
  ae197: src('UAE Ministerial Decision No. 197 of 2026 amending Ministerial Decision No. 243 of 2025', 'https://mof.gov.ae/wp-content/uploads/2026/10/Ministerial-Decision-No.-197-of-2026-%E2%80%93-Amending-Certain-Provisions-of-Ministerial-Decision-No.-243-of-2025-on-the-Electronic-Invoicing-System_En.pdf', GOV, { path: 'Article Two' }),
  aeMof: src('UAE Ministry of Finance: eInvoicing portal', 'https://mof.gov.ae/en/about-us/initiatives/einvoicing/', GOV),
  etaHome: src('Egyptian Tax Authority: home page (Arabic)', 'https://www.eta.gov.eg/ar', GOV),
  etaSdk: src('Egyptian Tax Authority: eInvoicing & eReceipt SDK', 'https://sdk.invoicing.eta.gov.eg/start/', GOV, { version: 'last update 2022-12-08' }),
  etaRec: src('Egyptian Tax Authority: eInvoicing & eReceipt SDK, receipt v1.2 structure', 'https://sdk.invoicing.eta.gov.eg/documents/receipt-v1-2/', GOV),
  omAr: src('Oman Tax Authority: tax portal (Arabic)', 'https://tms.taxoman.gov.om/portal/ar/web/taxportal/vat-tax', GOV),
  omEinv: src('Oman Tax Authority: e-invoicing (Fawtara) page', 'https://tms.taxoman.gov.om/portal/web/taxportal/e-invoicing', GOV, { version: 'page dated 2026-10-07' }),
  istd: src('Jordan Income and Sales Tax Department: home page', 'https://www.istd.gov.jo/', GOV),
  maAr: src('Morocco Direction Générale des Impôts: portal (Arabic and French)', 'https://www.tax.gov.ma/wps/portal/DGI-Ar/Accueil', GOV),
  iqTax: src('Iraq General Commission of Taxes: home page', 'https://tax.mof.gov.iq/', GOV),
  kinDz: src('Kintsugi: Algeria VAT (TVA) guide', 'https://trykintsugi.com/sales-tax-guides/africa/algeria', PROP, { version: 'published 2026-09-22' }),
  kinBh: src('Kintsugi: Bahrain VAT guide', 'https://trykintsugi.com/sales-tax-guides/middle-east/bahrain', PROP, { version: 'published 2026-07-19' }),
  kinKw: src('Kintsugi: Kuwait VAT guide', 'https://trykintsugi.com/sales-tax-guides/middle-east/kuwait', PROP, { version: 'published 2026-07-19' }),
  stdnum: (p) => src('python-stdnum', 'https://github.com/arthurdejong/python-stdnum', 'LGPL-2.1-or-later, facts only', { version: '006192e59be8ed6e08fd680256868a6c31eb2ba9', path: p }),
  lf: (p) => src('django-localflavor', 'https://github.com/django/django-localflavor', 'BSD-3-Clause, facts only', { version: '5.1 (commit dab72528e36b5f3883783c083cf729eb72e3a2f1)', path: p }),
  vjs: src('validator.js', 'https://github.com/validatorjs/validator.js', 'MIT, facts only', { version: '9ff342479591ca5a43cb30000195bcf55c1bbed9', path: 'src/lib/isIdentityCard.js' }),
  egNpm: src('MohamedAAbdallah/Egyptian-ID-Validator-Npm', 'https://github.com/MohamedAAbdallah/Egyptian-ID-Validator-Npm', 'Custom MIT-style licence, facts only', { version: 'bce3c51238006b3f54cfd78f7e6bf0cf9620890a', path: 'src/index.js' }),
  luhncheck: src('dralshehri/saudi-id-validator (luhncheck)', 'https://github.com/dralshehri/saudi-id-validator', 'MIT, facts only', { version: '26c4f875beb01d841ff5ebe072bf872ef3e1a9c2', path: 'README.md; src/luhncheck/__init__.py' }),
  wikiNin: src('Wikipedia: National identification number', 'https://en.wikipedia.org/wiki/National_identification_number', 'CC-BY-SA-4.0, facts only', { version: 'revision 1383726986' }),
  wikiEg: src('Wikipedia: Egyptian National Identity Card', 'https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card', 'CC-BY-SA-4.0, facts only', { version: 'revision 1377865466', path: 'National Number' }),
  wikiIq: src('Wikipedia: Iraq National Card', 'https://en.wikipedia.org/wiki/Iraq_National_Card', 'CC-BY-SA-4.0, facts only', { version: 'revision 1368130530' }),
  kpmgTn: src('KPMG TaxNewsFlash: Tunisia, expanded e-invoicing mandate for services and goods', 'https://kpmg.com/us/en/taxnewsflash/news/2026/01/tunisia-expanded-e-invoicing-mandate-services-goods.html', PROP, { version: '2026-01 (read through web search summary, page not fetched)' }),
  comarchJo: src('Comarch: Jordan advances with phase 2 of e-invoicing implementation', 'https://www.comarch.com/trade-and-services/data-management/legal-regulation-changes/jordan-advances-with-phase-2-of-e-invoicing-implementation/', PROP, { version: 'read through web search summary, page not fetched' }),
}
const c = (key, value, confidence, sources, asOf, note) => ({ key, value, ...(asOf ? { asOf } : {}), confidence, sources, ...(note ? { note } : {}) })

// ---------- checksum helpers, used to build and self-test the synthetic examples ----------
const luhnValid = (s) => { let sum = 0; [...s].reverse().forEach((ch, i) => { let d = +ch; if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 } sum += d }); return sum % 10 === 0 }
const luhnComplete = (body) => { for (let d = 0; d < 10; d++) if (luhnValid(body + d)) return body + d }
const egCheck = (b) => { const w = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]; let k = 11 - ([...b].reduce((a, ch, i) => a + +ch * w[i], 0) % 11); return k === 10 ? 0 : k === 11 ? 1 : k }
const kwCheck = (b) => { const w = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]; return 11 - ([...b].reduce((a, ch, i) => a + +ch * w[i], 0) % 11) }
const mod97 = (s) => Number(BigInt(s) % 97n)
const iceComplete = (b13) => { const cd = (97 - mod97(b13 + '00')) % 97; return b13 + String(cd).padStart(2, '0') }
const omCheck = (digits9) => { const w = [1, 6, 3, 7, 9]; const k = (1 + [...digits9.slice(4)].reduce((a, ch, i) => a + w[i] * +ch, 0)) % 11; return k === 10 ? 'X' : String(k) }

const EX = {}
EX.sa1 = luhnComplete('100000000'); EX.sa2 = luhnComplete('200000000')
EX.eg = '29001010100031'.slice(0, 13); EX.eg += egCheck(EX.eg)
{ let serial = 1; for (;;) { const b = '2900101' + String(serial).padStart(4, '0'); const k = kwCheck(b); if (k < 10) { EX.kw = b + k; break } serial++ } }
EX.ice = iceComplete('0000000010000')
EX.om = 'OM' + '100000001' + omCheck('100000001')
if (!luhnValid(EX.sa1) || mod97(EX.ice) !== 0 || mod97('001561191000066') !== 0) throw new Error('self-test failed')

// ---------- datasets ----------
const files = []
const add = (dataset, region, data, notes) => files.push({ dataset, region, data, notes })

// ===== VAT =====
const vat = (region, claims, notes) => add('vat', region, { claims, ...(notes ? { notes } : {}) })
const P = {
  SA: pwc('saudi-arabia', 'Saudi Arabia', '2026-07-29'), AE: pwc('united-arab-emirates', 'United Arab Emirates', '2026-09-09'), EG: pwc('egypt', 'Egypt', '2026-08-17'),
  BH: pwc('bahrain', 'Bahrain', '2026-07-26'), OM: pwc('oman', 'Oman', '2026-07-07'), KW: pwc('kuwait', 'Kuwait', '2026-07-22'), QA: pwc('qatar', 'Qatar', '2026-09-17'),
  JO: pwc('jordan', 'Jordan', '2026-07-05'), MA: pwc('morocco', 'Morocco', '2026-04-30'), TN: pwc('tunisia', 'Tunisia', '2026-06-29'), LB: pwc('lebanon', 'Lebanon', '2026-07-01'),
  IQ: pwc('iraq', 'Iraq', '2026-06-24'), LY: pwc('libya', 'Libya', '2026-05-31'), MR: pwc('mauritania', 'Mauritania', '2026-08-07'), PS: pwc('palestinian-territories', 'Palestinian territories', '2026-08-12'),
}
const O = { SA: oecd('saudi-arabia', 'Saudi Arabia', '2018-05-02'), BH: oecd('bahrain', 'Bahrain'), KW: oecd('kuwait', 'Kuwait'), QA: oecd('qatar', 'Qatar'), OM: oecd('oman', 'Oman'), LB: oecd('lebanon', 'Lebanon') }

vat('SA', [
  c('tax.exists', true, V, [S.zatcaVatAr], TODAY),
  c('tax.type', 'vat', V, [S.zatcaVatAr], TODAY),
  c('tax.localName', { ar: 'ضريبة القيمة المضافة', en: 'Value Added Tax (VAT)' }, V, [S.zatcaVatAr], TODAY),
  c('rate.standard', 15, N, [P.SA, S.zatcaXml], '2026-07-29', 'Percent. PwC states the rate; the ZATCA XML standard uses 15 as the rate of category S in every worked example but does not state it as a rule. The Royal Order that set the rate was not fetched.'),
  c('rate.standard.effectiveFrom', '2020-07-01', N, [P.SA], '2026-07-29', 'Previously 5% from 2018-01-01.'),
  c('rates.other', [{ rate: 0, scope: 'zero-rated supplies exist; the list was not verified' }], N, [P.SA], '2026-07-29', 'PwC only says "certain exceptions"; the zero-rated and exempt lists are a gap.'),
  c('authority.name', { ar: 'هيئة الزكاة والضريبة والجمارك', en: 'Zakat, Tax and Customs Authority (ZATCA)' }, V, [S.zatcaVatAr, S.zatcaPhases], TODAY),
  c('taxNumber.localName', { ar: 'رقم التسجيل الضريبي', en: 'VAT registration number' }, V, [S.zatcaVatAr, S.zatcaSec], TODAY, 'The same ZATCA Arabic page also uses رقم التعريف الضريبي for the supplier identifier on a simplified invoice; invoices in the market commonly print الرقم الضريبي.'),
  c('invoice.simplifiedThreshold', { note: 'ZATCA Arabic VAT page: on a simplified invoice below SAR 1,000 the supplier VAT registration number is not required', amountMinor: 100000, currency: 'SAR' }, N, [S.zatcaVatAr], TODAY, 'Read from a summary panel, not from the implementing regulations; confirm before relying on it.'),
])
vat('AE', [
  c('tax.exists', true, V, [S.mofVat], TODAY),
  c('tax.type', 'vat', V, [S.mofVat], TODAY),
  c('tax.localName', { ar: 'ضريبة القيمة المضافة', en: 'Value Added Tax (VAT)' }, V, [S.ftaAr, S.mofVat], TODAY),
  c('rate.standard', 5, V, [S.mofVat, S.ftaAr], TODAY, 'Percent.'),
  c('rate.standard.effectiveFrom', '2018-01-01', V, [S.mofVat], TODAY),
  c('rates.other', [{ rate: 0, scope: 'exports outside the VAT-implementing GCC states, international transport, crude oil and natural gas, first supply of residential real estate, specified health care and education' }, { rate: null, scope: 'exempt: certain financial services, subsequent supply of residential real estate, bare land, domestic passenger transport' }], N, [P.AE], '2026-09-09'),
  c('authority.name', { ar: 'الهيئة الاتحادية للضرائب', en: 'Federal Tax Authority (FTA)' }, V, [S.ftaAr, S.aeGuide], TODAY),
  c('taxNumber.localName', { ar: 'رقم التسجيل الضريبي', en: 'Tax Registration Number (TRN)' }, V, [S.ftaAr, S.aeGuide], TODAY),
])
vat('EG', [
  c('tax.exists', true, N, [P.EG], '2026-08-17'),
  c('tax.type', 'vat', N, [P.EG], '2026-08-17'),
  c('rate.standard', 14, N, [P.EG], '2026-08-17', 'Percent. VAT Law No. 67 of 2016.'),
  c('rate.standard.effectiveFrom', '2017-07-01', N, [P.EG], '2026-08-17', 'PwC: 14% from 1 July 2017, 13% before.'),
  c('rates.other', [{ rate: 5, scope: 'machinery and equipment for production lines (not buses or passenger cars)' }, { rate: 0, scope: 'exported goods and services, under conditions' }, { rate: null, scope: 'schedule tax at item-specific rates on listed goods and services, sometimes in addition to 14%' }], N, [P.EG], '2026-08-17'),
  c('authority.name', { ar: 'مصلحة الضرائب المصرية', en: 'Egyptian Tax Authority (ETA)' }, V, [S.etaHome, S.etaSdk], TODAY),
  c('taxNumber.localName', { ar: 'الرقم الضريبي', en: 'Tax Registration Number' }, N, [S.stdnum('stdnum/eg/tn.py')], TODAY, 'Arabic term taken from a library docstring; رقم التسجيل الضريبي is also common. Confirm with ETA forms.'),
])
vat('BH', [
  c('tax.exists', true, N, [P.BH], '2026-07-26'),
  c('tax.type', 'vat', N, [P.BH], '2026-07-26'),
  c('rate.standard', 10, N, [P.BH, S.kinBh], '2026-07-26', 'Percent. nbr.gov.bh refused automated requests (HTTP 403), so the primary source was not read.'),
  c('rate.standard.effectiveFrom', '2022-01-01', N, [S.kinBh], '2026-07-19', 'Raised from 5% (in force since 2019-01-01, per PwC). The secondary source says "January 2022"; the day is the commonly reported one and is not confirmed by a primary source.'),
  c('rates.other', [{ rate: 0, scope: 'exports, international transport, basic food, healthcare, education, new residential construction' }, { rate: null, scope: 'exempt: certain financial services, bare land' }], N, [S.kinBh], '2026-07-19'),
  c('authority.name', { en: 'National Bureau for Revenue (NBR)' }, V, [O.BH], TODAY, 'Arabic name not sourced; gap.'),
])
vat('OM', [
  c('tax.exists', true, V, [S.omAr], TODAY, 'The Oman Tax Authority portal has a VAT section; the rate itself was read from PwC.'),
  c('tax.type', 'vat', V, [S.omAr], TODAY),
  c('tax.localName', { ar: 'ضريبة القيمة المضافة', en: 'Value Added Tax (VAT)' }, V, [S.omAr], TODAY),
  c('rate.standard', 5, N, [P.OM], '2026-07-07', 'Percent. Royal Decree 121/2020.'),
  c('rate.standard.effectiveFrom', '2021-04-16', N, [P.OM], '2026-07-07'),
  c('rates.other', [{ rate: 0, scope: 'exports of goods and services, international transport, basic food items' }, { rate: null, scope: 'exempt: certain financial services, local passenger transport, education, residential rent' }], N, [P.OM], '2026-07-07'),
  c('authority.name', { ar: 'جهاز الضرائب', en: 'Oman Tax Authority' }, V, [S.omAr, O.OM], TODAY),
])
vat('KW', [
  c('tax.exists', false, N, [P.KW, S.kinKw], '2026-07-22', 'No VAT or general sales tax in force. Kuwait signed the GCC VAT framework agreement; no law has passed.'),
  c('tax.type', 'none', N, [P.KW, S.kinKw], '2026-07-22'),
  c('authority.name', { en: 'Tax Department, Ministry of Finance' }, V, [O.KW], TODAY, 'Arabic name not sourced; gap.'),
])
vat('QA', [
  c('tax.exists', false, N, [P.QA], '2026-09-17', 'No VAT or sales tax in force; PwC expects VAT under the GCC framework at an anticipated 5%, with no date.'),
  c('tax.type', 'none', N, [P.QA], '2026-09-17'),
  c('authority.name', { en: 'General Tax Authority (GTA)' }, V, [O.QA], TODAY, 'Arabic name not sourced; gap.'),
])
vat('JO', [
  c('tax.exists', true, N, [P.JO], '2026-07-05'),
  c('tax.type', 'sales-tax', N, [P.JO], '2026-07-05', 'General sales tax, operating like a VAT.'),
  c('tax.localName', { en: 'General Sales Tax (GST)' }, V, [S.istd], TODAY, 'The ISTD site lists "General Sales Tax Tables". Arabic term not captured; gap.'),
  c('rate.standard', 16, N, [P.JO], '2026-07-05', 'Percent. Effective date not sourced.'),
  c('rates.other', [{ rate: 0, scope: 'exports of goods and services, supplies to free zones, the Aqaba Special Economic Zone and development areas' }, { rate: null, scope: 'special (excise-like) sales tax on listed goods; exempt goods include bread, tea, sugar, electricity' }], N, [P.JO], '2026-07-05'),
  c('authority.name', { ar: 'دائرة ضريبة الدخل والمبيعات', en: 'Income and Sales Tax Department (ISTD)' }, V, [S.istd], TODAY),
])
vat('MA', [
  c('tax.exists', true, N, [P.MA], '2026-04-30'),
  c('tax.type', 'vat', N, [P.MA], '2026-04-30'),
  c('tax.localName', { en: 'Taxe sur la valeur ajoutée (TVA)' }, N, [P.MA], '2026-04-30'),
  c('rate.standard', 20, N, [P.MA], '2026-04-30', 'Percent. PwC does not use the words "standard rate"; it reports that the 2024 Finance Act moves all rates to 0%, 10% and 20% over 2024-2026, with 20% the top rate.'),
  c('rates.other', [{ rate: 10, scope: 'listed operations, e.g. urban and road transport, renewable electricity, refined sugar (FY 2026)' }, { rate: 0, scope: 'exemption with credit: exports, pharmaceutical products, listed others' }], N, [P.MA], '2026-04-30'),
  c('authority.name', { ar: 'المديرية العامة للضرائب', en: 'Direction Générale des Impôts (DGI)' }, V, [S.maAr], TODAY),
])
vat('TN', [
  c('tax.exists', true, N, [P.TN], '2026-06-29'),
  c('tax.type', 'vat', N, [P.TN], '2026-06-29'),
  c('rate.standard', 19, N, [P.TN], '2026-06-29', 'Percent.'),
  c('rate.standard.effectiveFrom', '2018-01-01', N, [P.TN], '2026-06-29', 'Previously 18%.'),
  c('rates.other', [{ rate: 13, scope: 'designated operations' }, { rate: 7, scope: 'designated operations' }], N, [P.TN], '2026-06-29'),
])
vat('DZ', [
  c('tax.exists', true, N, [S.kinDz], '2026-09-22'),
  c('tax.type', 'vat', N, [S.kinDz], '2026-09-22'),
  c('rate.standard', 19, N, [S.kinDz], '2026-09-22', 'Percent. Single commercial secondary source; mfdgi.gov.dz was unreachable and PwC no longer covers Algeria. Effective date not sourced.'),
  c('rates.other', [{ rate: 9, scope: 'basic foodstuffs and listed essentials' }, { rate: 0, scope: 'exports' }], N, [S.kinDz], '2026-09-22'),
  c('authority.name', { en: 'Direction Générale des Impôts (DGI)' }, N, [S.kinDz], '2026-09-22', 'Arabic name not sourced; gap.'),
])
vat('LB', [
  c('tax.exists', true, N, [P.LB], '2026-07-01'),
  c('tax.type', 'vat', N, [P.LB], '2026-07-01'),
  c('rate.standard', 11, N, [P.LB], '2026-07-01', 'Percent. Effective date not sourced.'),
  c('rates.other', [{ rate: 0, scope: 'exports of goods and services, international transport' }, { rate: null, scope: 'exempt: banking, financial services, insurance' }], N, [P.LB], '2026-07-01'),
  c('authority.name', { en: 'Ministry of Finance' }, V, [O.LB], TODAY, 'Arabic name not sourced; gap.'),
])
vat('IQ', [
  c('tax.exists', false, N, [P.IQ], '2026-06-24', 'No general VAT. A sales tax applies only to listed goods and services.'),
  c('tax.type', 'selective-sales-tax', N, [P.IQ], '2026-06-24'),
  c('rates.other', [{ rate: 300, scope: 'alcohol and cigarettes' }, { rate: 15, scope: 'travel tickets; cars' }, { rate: 20, scope: 'mobile recharge cards and internet' }, { rate: 10, scope: 'deluxe and first-class restaurants and hotels' }], N, [P.IQ], '2026-06-24'),
  c('authority.name', { ar: 'الهيئة العامة للضرائب', en: 'General Commission of Taxes' }, V, [S.iqTax], TODAY),
])
vat('LY', [c('tax.exists', false, N, [P.LY], '2026-05-31'), c('tax.type', 'none', N, [P.LY], '2026-05-31')])
vat('MR', [
  c('tax.exists', true, N, [P.MR], '2026-08-07'), c('tax.type', 'vat', N, [P.MR], '2026-08-07'),
  c('rate.standard', 16, N, [P.MR], '2026-08-07', 'Percent. Effective date not sourced.'),
  c('rates.other', [{ rate: 0, scope: 'exports of goods and services' }], N, [P.MR], '2026-08-07'),
])
vat('PS', [
  c('tax.exists', true, N, [P.PS], '2026-08-12'), c('tax.type', 'vat', N, [P.PS], '2026-08-12'),
  c('rate.standard', 16, N, [P.PS], '2026-08-12', 'Percent. Effective date not sourced.'),
])

// ===== TAX-ID =====
const id = (dataset, region, o) => add(dataset, region, o)
id('tax-id', 'SA', {
  identifier: { en: 'VAT registration number', ar: 'رقم التسجيل الضريبي' },
  structure: { length: 15, pattern: '^3[0-9]{13}3$', charset: 'digits', example: '300000000000003' },
  validation: { origin: 'specification', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 15 digits.', 'First digit must be 3.', 'Last digit must be 3.', 'No published checksum is applied by ZATCA business rules BR-KSA-40/44.'], testVectors: [{ input: '300000000000003', valid: true, note: 'synthetic' }, { input: '300000000000001', valid: false, note: 'last digit not 3' }, { input: '30000000000003', valid: false, note: '14 digits' }] },
  claims: [
    c('structure.basis', '15 digits, first and last digit 3 (seller BT-31 and buyer BT-48 in tax invoices)', V, [S.zatcaXml], TODAY),
    c('tin.structure', { length: 10, segments: [{ name: 'gccMemberState', start: 0, length: 1 }, { name: 'serial', start: 1, length: 8 }, { name: 'checkDigit', start: 9, length: 1 }] }, V, [O.SA], '2018-05-02', 'This is the 10-digit TIN, not the 15-digit VAT number. The check-digit algorithm is not published.'),
  ],
})
id('tax-id', 'AE', {
  identifier: { en: 'Tax Registration Number (TRN)', ar: 'رقم التسجيل الضريبي' },
  structure: { length: 15, pattern: '^[0-9]{15}$', charset: 'digits', segments: [{ name: 'tin', start: 0, length: 10, description: 'Tax Identification Number: the first 10 digits of the TRN; the participant identifier for e-invoicing' }, { name: 'suffix', start: 10, length: 5, description: 'not described in the sources read' }], example: '100000000000003' },
  validation: { origin: 'specification', normalize: 'Remove spaces and hyphens.', steps: ['Must be exactly 15 digits.', 'TIN = first 10 digits.', 'Peppol endpoint identifier for UAE e-invoicing = "0235" followed by the 10-digit TIN.', 'No checksum is published.'], testVectors: [{ input: '100000000000003', valid: true, note: 'synthetic; format only' }, { input: '10000000000000', valid: false, note: '14 digits' }] },
  claims: [
    c('structure.basis', 'TRN is 15 digits; TIN is a 10-digit identifier and the first 10 digits of the TRN; Peppol endpoint id is 0235 + TIN', V, [S.aeGuide, S.ftaEn], TODAY, 'The FTA TRN verification widget requires a value 15 characters long.'),
  ],
})
id('tax-id', 'EG', {
  identifier: { en: 'Tax Registration Number', ar: 'الرقم الضريبي' },
  structure: { length: 9, pattern: '^[0-9]{9}$', charset: 'digits', example: '100-000-009' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces, hyphens and slashes. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 9 digits.', 'Display grouped 3-3-3 with hyphens.', 'No checksum is known.'], testVectors: [{ input: '100-000-009', valid: true, note: 'synthetic; format only' }, { input: '١٠٠-٠٠٠-٠٠٩', valid: true, note: 'Arabic-Indic digits' }, { input: '12345', valid: false }] },
  claims: [c('structure.basis', '9 digits, usually written XXX-XXX-XXX', N, [S.stdnum('stdnum/eg/tn.py')], TODAY, 'From an open-source validator; no ETA document describing the format was fetched.')],
})
id('tax-id', 'OM', {
  identifier: { en: 'VAT identification number (VATIN)' },
  structure: { length: 12, pattern: '^OM[0-9]{9}[0-9X]$', charset: 'alphanumeric', segments: [{ name: 'prefix', start: 0, length: 2, description: 'literal OM' }, { name: 'number', start: 2, length: 9 }, { name: 'checkDigit', start: 11, length: 1, description: '0-9 or X' }], example: EX.om },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces and hyphens, upper-case.', steps: ['Must match OM + 9 digits + one of 0-9 or X.', 'Take the 9 digits after OM; ignore the first 4 (their weights are unknown).', 'Multiply the remaining 5 digits by the weights 1, 6, 3, 7, 9 and add them up.', 'k = (1 + sum) mod 11.', 'Check character = X when k is 10, otherwise the digit k.'], testVectors: [{ input: EX.om, valid: true, note: 'synthetic, built with the algorithm above' }] },
  claims: [
    c('structure.basis', 'VAT and excise TIN has 12 alphanumeric characters', V, [O.OM], TODAY),
    c('checksum.basis', 'OM prefix, ten trailing characters, partial weighted mod-11 check', N, [S.stdnum('stdnum/om/vat.py')], TODAY, 'Reverse-engineered: the implementation states that only the weights of the last five digits are known. Treat a checksum failure as a warning, not an error.'),
    c('tin.entity', 'Income-tax TIN for entities is numeric, currently up to seven digits', V, [O.OM], TODAY),
  ],
})
id('tax-id', 'QA', {
  identifier: { en: 'Tax Identification Number (TIN)' },
  structure: { length: 10, pattern: '^5[0-9]{9}$', charset: 'digits', segments: [{ name: 'gccMemberState', start: 0, length: 1, description: 'always 5 for Qatar' }, { name: 'body', start: 1, length: 9, description: 'generated by an unpublished algorithm; includes a check digit' }], example: '5000000000' },
  validation: { origin: 'official', normalize: 'Remove spaces.', steps: ['Must be exactly 10 digits.', 'First digit must be 5.', 'A check digit exists but its algorithm is not published.'], testVectors: [{ input: '5000000000', valid: true, note: 'synthetic; format only' }, { input: '3000000000', valid: false }] },
  claims: [
    c('structure.basis', '10 digits, begins with 5 (Qatar as GCC member), remaining 9 generated by an algorithm that includes a check digit', V, [O.QA], TODAY, 'General Tax Authority TINs only.'),
    c('qfc.tin', 'Qatar Financial Centre firms: T followed by the 5-digit QFC licence number, e.g. T00001', V, [O.QA], TODAY),
  ],
})
id('tax-id', 'KW', {
  identifier: { en: 'Tax identification number' },
  structure: { length: [6, 12], charset: 'digits' },
  claims: [
    c('structure.basis', 'Entities: 6-digit number issued by the Tax Department. Individuals: the 12-digit Civil ID number is used as TIN on request', V, [O.KW], TODAY),
  ],
})
id('tax-id', 'LB', {
  identifier: { en: 'Tax identification number (TIN)' },
  structure: { charset: 'other', pattern: '^[0-9]+(-(601|603|604))?$' },
  claims: [
    c('structure.basis', 'Numeric serial without letters; no length stated. VAT-registered entities append a dash and a code: 601 for taxpayers subject to VAT, 603 and 604 for refund purposes', V, [O.LB], TODAY, 'The OECD sheet ends the code list with an ellipsis, so other suffixes may exist; the pattern above accepts only the three named.'),
  ],
})
id('tax-id', 'MA', {
  identifier: { en: 'Identifiant Commun de l’Entreprise (ICE)', ar: 'التعريف الموحد للمقاولة' },
  structure: { length: 15, pattern: '^[0-9]{15}$', charset: 'digits', checksum: { algorithm: 'mod 97', description: 'The 15-digit number taken as an integer is divisible by 97 (remainder 0, unlike IBAN-style ISO 7064 MOD 97-10 which expects remainder 1).' }, segments: [{ name: 'enterprise', start: 0, length: 9 }, { name: 'establishment', start: 9, length: 4 }, { name: 'control', start: 13, length: 2 }], example: EX.ice },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces; left-pad with zeros to 15 digits.', steps: ['Must be exactly 15 digits.', 'Interpret all 15 digits as one integer.', 'Valid when integer mod 97 = 0.', 'To compute the control digits for a 13-digit body: control = (97 - ((body * 100) mod 97)) mod 97, written with two digits.'], testVectors: [{ input: EX.ice, valid: true, note: 'synthetic, built with the algorithm above' }, { input: EX.ice.slice(0, 14) + ((+EX.ice[14] + 1) % 10), valid: false, note: 'control digit changed' }] },
  claims: [
    c('structure.basis', '15 digits: 9 enterprise, 4 establishment, 2 control; whole number divisible by 97', N, [S.stdnum('stdnum/ma/ice.py')], TODAY, 'From an open-source validator that cites ice.gov.ma guides; the official guide was not fetched. The implementation calls the ISO 7064 MOD 97-10 routine but accepts remainder 0, which its own documented example 001561191000066 confirms. The separate Identifiant Fiscal (IF) format was not researched.'),
  ],
})
id('tax-id', 'TN', {
  identifier: { en: 'Matricule fiscal (MF)' },
  structure: { length: [8, 13], pattern: '^[0-9]{7}[A-HJ-NP-TV-Z]([APBDN][MPCNE][0-9]{3})?$', charset: 'alphanumeric', segments: [{ name: 'uniqueIdentifier', start: 0, length: 7 }, { name: 'controlKey', start: 7, length: 1, description: 'letter, never I, O or U' }, { name: 'vatCode', start: 8, length: 1, description: 'A, P, B, D or N' }, { name: 'categoryCode', start: 9, length: 1, description: 'M, P, C, N or E' }, { name: 'secondaryEstablishment', start: 10, length: 3, description: '000 for the head office; a non-zero value requires category E' }], example: '0000001/A/A/M/000' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces, slashes, dots and hyphens; upper-case; left-pad the leading digits to 7.', steps: ['Length is 8 (identifier + key) or 13 (full form).', 'First 7 characters are digits.', 'Character 8 is a letter other than I, O, U.', 'In the long form: character 9 in A/P/B/D/N, character 10 in M/P/C/N/E, last three are digits.', 'If the last three digits are not 000 the category code must be E.', 'The rule that derives the control key from the digits is not implemented by the source; treat the key as unchecked.'], testVectors: [{ input: '0000001/A/A/M/000', valid: true, note: 'synthetic; format only' }, { input: '0000001/A/A/M/001', valid: false, note: 'branch number without category E' }, { input: '0000001U', valid: false, note: 'U is not a control key' }] },
  claims: [c('structure.basis', 'identifiant fiscal (7 digits + control letter), VAT code, category code, 3-digit establishment number', N, [S.stdnum('stdnum/tn/mf.py')], TODAY, 'From an open-source validator citing a Tunisian accounting blog; no official text fetched.')],
})
id('tax-id', 'DZ', {
  identifier: { en: 'Numéro d’Identification Fiscale (NIF)' },
  structure: { length: [15, 20], pattern: '^([0-9]{15}|[0-9]{20})$', charset: 'digits', example: '000000000000001' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces.', steps: ['Digits only.', 'Length 15, or 20 when a branch or secondary establishment is identified.', 'No checksum is known.'], testVectors: [{ input: '000000000000001', valid: true, note: 'synthetic; format only' }, { input: '12345', valid: false }] },
  claims: [c('structure.basis', '15 digits, or 20 for branches/secondary establishments', N, [S.stdnum('stdnum/dz/nif.py')], TODAY, 'From an open-source validator; the DGI site was unreachable.')],
})
id('tax-id', 'BH', { claims: [c('tin.issued', 'Bahrain reports to the OECD that it issues no TIN for CRS purposes because it has no general income tax. The format of the VAT account number issued by the NBR was not sourced', V, [O.BH], TODAY)] })

// ===== NATIONAL-ID =====
id('national-id', 'EG', {
  identifier: { en: 'National number (national ID card)' },
  structure: { length: 14, pattern: '^[23][0-9]{13}$', charset: 'digits', checksum: { algorithm: 'weighted mod 11', description: 'Weights 2,7,6,5,4,3,2,7,6,5,4,3,2 on the first 13 digits; k = 11 - (sum mod 11); 10 becomes 0 and 11 becomes 1.' },
    segments: [
      { name: 'century', start: 0, length: 1, values: { 2: '1900-1999', 3: '2000-2099' } },
      { name: 'birthDate', start: 1, length: 6, description: 'YYMMDD' },
      { name: 'governorate', start: 7, length: 2, description: 'governorate of birth; 88 is used for births outside Egypt', values: { accepted: ['01', '02', '03', '04', '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '23', '24', '25', '26', '27', '28', '29', '31', '32', '33', '34', '35', '88'] } },
      { name: 'serial', start: 9, length: 4, description: 'sequence for births on that day in that governorate; its last digit (position 13 of the number) is odd for male, even for female' },
      { name: 'checkDigit', start: 13, length: 1 },
    ], example: EX.eg },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 14 digits.', 'Digit 1 must be 2 or 3; year = 1900 + YY for 2, 2000 + YY for 3.', 'Digits 2-7 must form a real calendar date that is not in the future.', 'Digits 8-9 must be an accepted governorate code.', 'Gender: digit 13 odd = male, even = female.', 'Check digit: multiply digits 1-13 by 2,7,6,5,4,3,2,7,6,5,4,3,2, add up, k = 11 - (sum mod 11); if k = 10 use 0, if k = 11 use 1; k must equal digit 14.', 'Because the check digit is described as optional and the algorithm is not official, report a mismatch as a warning unless the product owner decides otherwise.'], testVectors: [{ input: EX.eg, valid: true, note: 'synthetic: born 1990-01-01, governorate 01, male; built with the algorithm above' }, { input: '19001010100031', valid: false, note: 'century digit 1' }, { input: '29013010100031', valid: false, note: 'month 13' }] },
  derivable: ['birth date', 'governorate of birth', 'gender'],
  claims: [
    c('structure.basis', '14 digits: century, YYMMDD, 2-digit governorate, 4-digit serial whose last digit gives gender, check digit', N, [S.wikiEg, S.lf('localflavor/eg/forms.py')], TODAY, 'No official Civil Status Organization document was fetched. Wikipedia calls the last digit an optional check digit.'),
    c('governorate.codes', 'accepted code list as in structure.segments', N, [S.lf('localflavor/eg/forms.py')], TODAY, 'Code-to-name mapping is in Wikipedia and localflavor choices; not copied here.'),
    c('checksum.basis', 'weights 2,7,6,5,4,3,2,7,6,5,4,3,2, 11 - (sum mod 11), 10 to 0 and 11 to 1', N, [S.egNpm], TODAY, 'Reverse-engineered: known only from this open-source validator. django-localflavor deliberately does not check it.'),
  ],
})
id('national-id', 'SA', {
  identifier: { en: 'National ID number (citizens) and Iqama number (residents)' },
  structure: { length: 10, pattern: '^[12][0-9]{9}$', charset: 'digits', checksum: { algorithm: 'Luhn', description: 'Standard Luhn (mod 10) over all 10 digits.' }, segments: [{ name: 'type', start: 0, length: 1, values: { 1: 'Saudi citizen (national ID)', 2: 'resident (iqama)' } }, { name: 'serial', start: 1, length: 8 }, { name: 'checkDigit', start: 9, length: 1 }], example: EX.sa1 },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 10 digits.', 'First digit must be 1 (citizen) or 2 (resident).', 'Luhn: from the rightmost digit moving left, double every second digit; subtract 9 from any result above 9; add all digits; the total must be divisible by 10.'], testVectors: [{ input: EX.sa1, valid: true, note: 'synthetic citizen-type number' }, { input: EX.sa2, valid: true, note: 'synthetic resident-type number' }, { input: EX.sa1.slice(0, 9) + ((+EX.sa1[9] + 1) % 10), valid: false, note: 'check digit changed' }, { input: '3' + EX.sa1.slice(1), valid: false, note: 'first digit not 1 or 2' }] },
  derivable: ['holder type: citizen or resident'],
  claims: [
    c('structure.basis', '10 digits, first digit 1 or 2, Luhn check', N, [S.luhncheck], TODAY, 'Reverse-engineered: from an open-source validator by a Saudi author, not from the Ministry of Interior or Absher. ZATCA only confirms that "NAT" (national ID) and "IQA" (iqama) are accepted buyer identifier schemes, not their format. Other leading digits for other document classes are not covered.'),
    c('einvoice.schemeIds', { nationalId: 'NAT', iqama: 'IQA', gccId: 'GCC', passport: 'PAS' }, V, [S.zatcaXml], TODAY, 'Buyer identification scheme IDs (BT-46-1) in ZATCA invoices.'),
  ],
})
id('national-id', 'AE', {
  identifier: { en: 'Emirates ID number (identity number)', ar: 'رقم الهوية' },
  structure: { length: 15, pattern: '^784[0-9]{12}$', charset: 'digits', segments: [{ name: 'country', start: 0, length: 3, description: 'always 784, the ISO 3166-1 numeric code of the UAE' }, { name: 'block', start: 3, length: 4, description: 'Wikipedia: year of birth; django-localflavor: an identification block assigned by the authority. The sources disagree, so do not derive a birth year from it.' }, { name: 'serial', start: 7, length: 7 }, { name: 'checkDigit', start: 14, length: 1 }], example: '784-1990-0000001-0' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces and hyphens.', steps: ['Must be exactly 15 digits.', 'Must start with 784.', 'Display as 784-YYYY-NNNNNNN-C.', 'The check-digit algorithm is not established by the sources read (Luhn is often claimed); do not reject on it.'], testVectors: [{ input: '784-1990-0000001-0', valid: true, note: 'synthetic; format only, check digit not computed' }, { input: '785199000000010', valid: false }] },
  claims: [
    c('structure.basis', '15 digits, 784-YYYY-NNNNNNN-C', N, [S.wikiNin, S.lf('localflavor/ae/validators.py')], TODAY, 'No ICP (Federal Authority for Identity, Citizenship, Customs and Port Security) document was fetched. The Arabic term is from Wikipedia.'),
    c('einvoice.schemeId', 'EID', V, [S.aeFields], TODAY, 'Emirates ID is an accepted seller legal registration identifier type in UAE e-invoices.'),
  ],
})
id('national-id', 'KW', {
  identifier: { en: 'Civil ID number (civil number)', ar: 'الرقم المدني' },
  structure: { length: 12, pattern: '^[123][0-9]{11}$', charset: 'digits', checksum: { algorithm: 'weighted mod 11', description: 'Weights 2,1,6,3,7,9,10,5,8,4,2 on the first 11 digits; check = 11 - (sum mod 11).' },
    segments: [{ name: 'century', start: 0, length: 1, values: { 1: '1800-1899', 2: '1900-1999', 3: '2000-2099' } }, { name: 'birthDate', start: 1, length: 6, description: 'YYMMDD' }, { name: 'serial', start: 7, length: 4 }, { name: 'checkDigit', start: 11, length: 1 }], example: EX.kw },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 12 digits.', 'Digit 1 must be 1, 2 or 3 (century 18xx, 19xx, 20xx).', 'Digits 2-7 must form a real calendar date.', 'Multiply digits 1-11 by 2,1,6,3,7,9,10,5,8,4,2 and add up.', 'check = 11 - (sum mod 11); it must equal digit 12. A result of 10 or 11 can never match, so such serials are not issued.'], testVectors: [{ input: EX.kw, valid: true, note: 'synthetic: born 1990-01-01; built with the algorithm above' }, { input: EX.kw.slice(0, 11) + ((+EX.kw[11] + 1) % 10), valid: false, note: 'check digit changed' }, { input: '4' + EX.kw.slice(1), valid: false, note: 'century digit 4' }] },
  derivable: ['birth date'],
  claims: [
    c('length', '12 digits, contains the date of birth, issued by the Public Authority for Civil Information (PACI)', V, [O.KW], TODAY),
    c('structure.basis', 'century digit, YYMMDD, 4-digit serial, check digit', N, [S.wikiNin, S.lf('localflavor/kw/utils.py')], TODAY, 'The Arabic term is from Wikipedia.'),
    c('checksum.basis', 'weights 2,1,6,3,7,9,10,5,8,4,2; 11 - (sum mod 11)', N, [S.lf('localflavor/kw/utils.py')], TODAY, 'Reverse-engineered: known from open-source validators, not published by PACI.'),
  ],
})
id('national-id', 'QA', {
  identifier: { en: 'Qatar ID (QID) number' },
  structure: { length: 11, pattern: '^[23][0-9]{10}$', charset: 'digits', segments: [{ name: 'century', start: 0, length: 1, values: { 2: '1900-1999', 3: '2000-2099' } }, { name: 'birthYear', start: 1, length: 2 }, { name: 'nationality', start: 3, length: 3, description: 'ISO 3166-1 numeric country code of the holder’s nationality (634 for Qatar)' }, { name: 'serial', start: 6, length: 5 }], example: '29063400001' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 11 digits.', 'Digit 1 must be 2 or 3; birth year = (digit + 17) * 100 + next two digits.', 'Birth year must not be in the future.', 'Digits 4-6 must be a valid ISO 3166-1 numeric code.', 'No check digit is known.'], testVectors: [{ input: '29063400001', valid: true, note: 'synthetic: born 1990, nationality code 634' }, { input: '19063400001', valid: false, note: 'century digit 1' }, { input: '29099900001', valid: false, note: '999 is not an ISO 3166-1 numeric code' }] },
  derivable: ['birth year', 'nationality'],
  claims: [c('structure.basis', '11 digits: century, YY, ISO 3166-1 numeric nationality, 5-digit serial', N, [S.lf('localflavor/qa/validators.py')], TODAY, 'Reverse-engineered: from an open-source validator; no Ministry of Interior document was fetched. Qatar tells the OECD that citizens are identified by a personal identification number and residents by a residence permit number, without giving the format.')],
})
id('national-id', 'BH', {
  identifier: { en: 'Personal number (CPR number)', ar: 'الرقم الشخصي' },
  structure: { length: 9, pattern: '^[0-9]{9}$', charset: 'digits', segments: [{ name: 'birthYearMonth', start: 0, length: 4, description: 'YYMM; a minority of numbers do not follow this layout' }, { name: 'serial', start: 4, length: 4 }, { name: 'checkDigit', start: 8, length: 1 }], example: '900100000' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 9 digits.', 'Do not reject on the month part: some numbers do not follow YYMM.', 'The check-digit algorithm was not found in a citable source; do not check it.'], testVectors: [{ input: '900100000', valid: true, note: 'synthetic; format only, check digit not computed' }, { input: '90010000', valid: false, note: '8 digits' }] },
  claims: [c('structure.basis', '9 digits, generally YYMMNNNNC', N, [S.wikiNin], TODAY, 'Wikipedia only; Arabic term from Wikipedia. No Information & eGovernment Authority document was fetched.')],
})
id('national-id', 'IQ', {
  identifier: { en: 'National identification number (National Card)', ar: 'البطاقة الوطنية' },
  structure: { length: 12, pattern: '^[0-9]{12}$', charset: 'digits' },
  claims: [c('structure.basis', 'National Card (issued since 2016) carries a 12-digit national identification number; segment meaning and checksum unknown', N, [S.wikiIq, S.wikiNin], TODAY, 'The Arabic value is the name of the card, not of the number.')],
})
id('national-id', 'MA', {
  identifier: { en: 'CNIE number (Carte nationale d’identité électronique)' },
  structure: { length: [2, 3, 4, 5, 6, 7, 8, 9], pattern: '^[A-Z]{1,2}[1-9][0-9]{0,6}$', charset: 'alphanumeric', example: 'AB123456' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces, upper-case.', steps: ['One or two Latin letters, then 1 to 7 digits whose first digit is not 0.', 'No checksum is known.'], testVectors: [{ input: 'AB123456', valid: true, note: 'synthetic' }, { input: 'A012345', valid: false, note: 'digits start with 0' }, { input: 'ABC12345', valid: false, note: 'three letters' }] },
  claims: [c('structure.basis', 'one or two letters followed by digits, first digit non-zero', N, [S.lf('localflavor/ma/forms.py')], TODAY, 'From an open-source validator that says it mirrors cnie.ma. The validator describes the value as at most 8 characters but its pattern admits 9; the pattern is recorded as written.')],
})
id('national-id', 'TN', {
  identifier: { en: 'National identity card number (CIN)' },
  structure: { length: 8, pattern: '^[0-9]{8}$', charset: 'digits', example: '00000001' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces. Convert Arabic-Indic digits to ASCII.', steps: ['Must be exactly 8 digits.', 'No checksum is known.'], testVectors: [{ input: '00000001', valid: true, note: 'synthetic; format only' }, { input: '1234567', valid: false }] },
  claims: [c('structure.basis', '8 digits', N, [S.vjs], TODAY, 'From validator.js isIdentityCard("ar-TN"); no official source fetched.')],
})
id('national-id', 'LY', {
  identifier: { en: 'National identity number (NIN)' },
  structure: { length: 12, pattern: '^[12][0-9]{11}$', charset: 'digits', example: '100000000001' },
  validation: { origin: 'reverse-engineered', normalize: 'Remove spaces.', steps: ['Must be exactly 12 digits.', 'First digit must be 1 or 2.', 'No checksum is known.'], testVectors: [{ input: '100000000001', valid: true, note: 'synthetic; format only' }, { input: '300000000001', valid: false }] },
  claims: [c('structure.basis', '12 digits, first digit 1 or 2', N, [S.vjs], TODAY, 'From validator.js isIdentityCard("ar-LY"); the meaning of the first digit is not stated there.')],
})

// ===== E-INVOICING =====
id('e-invoicing', 'SA', {
  claims: [
    c('mandate.status', 'in-force', V, [S.zatcaPhases], '2026-09-01'),
    c('mandate.name', { en: 'E-invoicing (Fatoorah)' }, V, [S.zatcaWhat], TODAY, 'ZATCA writes FATOORAH in English; the Arabic name فاتورة was not captured from a fetched page.'),
    c('mandate.authority', 'Zakat, Tax and Customs Authority (ZATCA)', V, [S.zatcaPhases], TODAY),
    c('mandate.phases', [
      { phase: 1, name: 'Generation', from: '2021-12-04', scope: 'all taxpayers except non-residents, and third parties issuing tax invoices on their behalf', requirement: 'generate and store tax invoices and notes through a compliant electronic solution' },
      { phase: 2, name: 'Integration', from: '2023-01-01', scope: 'rolled out in waves by taxpayer group; ZATCA notifies each group at least six months ahead', requirement: 'integrate the solution with ZATCA systems and issue invoices in the required format' },
    ], V, [S.zatcaPhases, S.zatcaWhat], '2026-09-01', 'The wave table is an image on the ZATCA page and was not transcribed; current wave thresholds are a gap.'),
    c('document.format', { syntax: 'UBL 2.1 XML', semanticModel: 'EN 16931 with KSA rules; precedence KSA rules > EN 16931 > UBL', types: ['tax invoice (B2B)', 'simplified tax invoice (B2C)', 'credit note', 'debit note'] }, V, [S.zatcaXml, S.zatcaWhat], TODAY),
    c('identifiers.seller', { vatNumber: '15 digits, first and last digit 3 (BT-31)', otherId: { rule: 'exactly one, alphanumeric (BT-29)', schemeIds: { CRN: 'commercial registration number', MOM: 'MOMRAH licence', MLS: 'MHRSD licence', 700: '700 number', SAG: 'MISA licence', OTH: 'other ID' } } }, V, [S.zatcaXml], TODAY),
    c('identifiers.buyer', { vatNumber: '15 digits, first and last digit 3 when present and not an export (BT-48)', otherId: { schemeIds: { TIN: 'tax identification number', CRN: 'commercial registration number', MOM: 'MOMRAH licence', MLS: 'MHRSD licence', 700: '700 number', SAG: 'MISA licence', NAT: 'national ID', GCC: 'GCC ID', IQA: 'iqama number', PAS: 'passport ID', OTH: 'other ID' } } }, V, [S.zatcaXml], TODAY),
    c('qr.required', 'Mandatory on electronic tax invoices; printed as a QR image whose payload is a Base64 string of at most 700 characters', V, [S.zatcaSec], TODAY),
    c('qr.encoding', {
      container: 'TLV (tag-length-value), all fields concatenated in ascending tag order, then Base64-encoded; the QR image encodes the Base64 ASCII string',
      tag: 'one byte holding the tag number',
      length: 'one byte, unsigned, the number of bytes of the value (so a value cannot exceed 255 bytes)',
      value: 'tags 1-5: UTF-8 bytes of the field text. Tag 6: the 32 raw bytes of the SHA-256 hash, as the standard words it. Tags 7-9: the byte array of the value',
      order: ['start with an empty byte array', 'for each field append tag byte, length byte, value bytes', 'Base64-encode the whole array', 'render the Base64 string as a QR code'],
      tags: [
        { tag: 1, field: 'Seller name', from: '2021-12-04' },
        { tag: 2, field: 'VAT registration number of the seller', from: '2021-12-04' },
        { tag: 3, field: 'Time stamp of the invoice, ISO 8601 date and time, e.g. 2022-02-21T12:13:57Z', from: '2021-12-04' },
        { tag: 4, field: 'Invoice total with VAT', from: '2021-12-04' },
        { tag: 5, field: 'VAT total (business term BT-110 of the XML invoice)', from: '2021-12-04' },
        { tag: 6, field: 'Hash of the XML invoice (SHA-256)', from: '2023-01-01' },
        { tag: 7, field: 'ECDSA signature of the XML hash', from: '2023-01-01' },
        { tag: 8, field: 'ECDSA public key extracted from the signing private key', from: '2023-01-01' },
        { tag: 9, field: 'Simplified tax invoices and their notes only: ECDSA signature of the cryptographic stamp, issued by ZATCA’s technical CA (the wording in the standard is truncated; commonly read as the CA signature over the stamp’s public key)', from: '2023-01-01' },
      ],
    }, V, [S.zatcaSec], TODAY, 'Enforcement dates: the table prints "from 4th December 2021" against tags 1-5 and "from 1st January 2023" against tags 6-9; the row alignment in the PDF is loose, so the split at tag 5/6 follows the phase definitions. A Phase 1 receipt needs tags 1-5 only. Amount formatting (decimal places) in tags 4 and 5 is not specified in this section. In practice many implementations put the Base64 text of the hash in tag 6 rather than 32 raw bytes; test against the ZATCA SDK before shipping Phase 2 output.'),
    c('qr.example', { input: { 1: 'Hayzo Test Co', 2: '300000000000003', 3: '2026-01-01T12:00:00Z', 4: '115.00', 5: '15.00' }, base64: Buffer.concat([[1, 'Hayzo Test Co'], [2, '300000000000003'], [3, '2026-01-01T12:00:00Z'], [4, '115.00'], [5, '15.00']].map(([t, v]) => { const b = Buffer.from(v, 'utf8'); return Buffer.concat([Buffer.from([t, b.length]), b]) })).toString('base64') }, 'needs-review', [S.zatcaSec], TODAY, 'Synthetic Phase 1 vector computed for this file from the rules above, not taken from ZATCA. An Arabic seller name is longer in bytes than in characters: the length byte counts UTF-8 bytes.'),
    c('previousInvoiceHash', 'Each invoice carries the SHA-256 hash of the previous invoice, computed with the same transform as the cryptographic stamp', V, [S.zatcaSec], TODAY),
  ],
})
id('e-invoicing', 'AE', {
  claims: [
    c('mandate.status', 'announced; voluntary and pilot phase open since 2026-07-01, first mandatory date 2027-01-01', V, [S.ae244, S.ae66], TODAY),
    c('mandate.name', { en: 'Electronic Invoicing System (eInvoicing)' }, V, [S.aeMof], TODAY),
    c('mandate.authority', 'Ministry of Finance (policy and accreditation) and Federal Tax Authority (reporting)', V, [S.aeMof, S.aeGuide], TODAY),
    c('mandate.phases', [
      { phase: 'pilot', from: '2026-07-01', scope: 'Taxpayer Working Group selected by the Ministry' },
      { phase: 'voluntary', from: '2026-07-01', scope: 'any person' },
      { phase: 'mandatory-1', from: '2027-01-01', scope: 'persons with revenue of AED 50,000,000 or more', appointServiceProviderBy: '2026-10-30' },
      { phase: 'mandatory-2', from: '2027-07-01', scope: 'persons with revenue below AED 50,000,000', appointServiceProviderBy: '2027-03-31' },
      { phase: 'mandatory-government', from: '2027-10-01', scope: 'government entities', appointServiceProviderBy: '2027-03-31' },
    ], V, [S.ae244, S.ae66], TODAY, 'Decision 66 of 2026 moved the service-provider appointment deadline of the first group from 31 July 2026 to 30 October 2026; the implementation date did not move. The English copy of Decision 66 on the Ministry site still shows a placeholder issue date.'),
    c('scope.b2c', 'Business-to-consumer transactions are outside the mandate until the Minister decides otherwise', V, [S.ae244], TODAY),
    c('scope.exclusions', ['sovereign activities of government entities', 'international passenger air transport with an electronic ticket and its ancillary services', 'international air freight with an airway bill, for 24 months', 'financial services that are VAT-exempt or zero-rated', 'transactions inside one VAT tax group, for 24 months from 2027-01-01'], V, [S.ae197], TODAY, 'As replaced by Decision 197 of 2026.'),
    c('issuance.deadline', 'Issue and transmit within 14 business days of the date of the business transaction', V, [S.ae197], TODAY, 'Decision 243 of 2025 said 14 days; Decision 197 of 2026 changed this to 14 business days.'),
    c('document.format', { syntax: 'XML', specification: 'PINT-AE (Peppol International invoice, UAE specialisation)', network: 'Peppol, five-corner model through Accredited Service Providers (ASPs)', notAnEInvoice: ['PDF', 'word-processor files', 'images', 'scans', 'emails'] }, V, [S.aeGuide, S.aeFields, S.aeMof], TODAY),
    c('identifiers', { participant: 'TIN = first 10 digits of the 15-digit TRN, also inside a tax group', peppolEndpoint: '0235 followed by the 10-digit TIN', sellerLegalRegistrationTypes: { TL: 'commercial/trade licence', EID: 'Emirates ID', PAS: 'passport' } }, V, [S.aeGuide, S.aeFields], TODAY, 'The field list names further legal registration types that were not transcribed.'),
    c('qr.required', false, V, [S.aeGuide], TODAY, 'The guidelines state that electronic invoices are XML and will not feature a QR code or barcode.'),
  ],
})
id('e-invoicing', 'EG', {
  claims: [
    c('mandate.status', 'in-force', N, [S.etaSdk, S.etaHome], TODAY, 'ETA operates the e-invoice and e-receipt platforms and publishes their SDK; the dates and decrees that made each taxpayer group mandatory were not sourced.'),
    c('mandate.name', { ar: 'منظومة الفاتورة الإلكترونية', en: 'eInvoicing and eReceipt' }, V, [S.etaHome, S.etaSdk], TODAY),
    c('mandate.authority', 'Egyptian Tax Authority (ETA)', V, [S.etaSdk], TODAY),
    c('document.format', { syntax: 'JSON or XML documents submitted over REST APIs (JSON request and response)', signature: 'documents are digitally signed by the issuer with an e-seal X.509 certificate', versions: 'invoice, credit note, debit note and export variants v1.0; receipts v1.2 by sector' }, V, [S.etaSdk, S.etaRec], TODAY),
    c('receipt.uuid', 'Each e-receipt carries a UUID that the issuer computes as a SHA-256 over the receipt content, plus the UUID of the previous receipt from the same POS (empty for the first)', V, [S.etaRec], TODAY),
  ],
})
id('e-invoicing', 'OM', {
  claims: [
    c('mandate.status', 'announced, phased', V, [S.omEinv], '2026-10-07'),
    c('mandate.name', { ar: 'الفوترة الإلكترونية', en: 'Fawtara' }, V, [S.omEinv, S.omAr], '2026-10-07'),
    c('mandate.authority', 'Oman Tax Authority', V, [S.omEinv], '2026-10-07'),
    c('mandate.phases', [{ phase: 1, name: 'Pilot', scope: 'selected large taxpayers' }, { phase: 2, name: 'Expansion', scope: 'more medium and large companies' }, { phase: 3, name: 'SMEs onboarding', scope: 'gradual adoption by SMEs' }, { phase: 4, name: 'Full rollout', scope: 'all VAT-registered entities' }], V, [S.omEinv], '2026-10-07', 'The official page gives no dates for the phases. Format and QR requirements were not found on it.'),
  ],
})
id('e-invoicing', 'JO', {
  claims: [
    c('mandate.name', { ar: 'نظام الفوترة الوطني الالكتروني', en: 'JoFotara (national electronic invoicing system)' }, V, [S.istd], TODAY, 'The ISTD home page links to portal.jofotara.gov.jo.'),
    c('mandate.authority', 'Income and Sales Tax Department (ISTD)', V, [S.istd], TODAY),
    c('mandate.status', 'in-force', N, [S.comarchJo], TODAY, 'Secondary sources: system launched December 2022; phase 2 made B2B, B2G and B2C e-invoicing through JoFotara mandatory from 2025-04-01. Sources disagree on earlier dates and none is official.'),
    c('document.format', { syntax: 'UBL 2.1 XML', model: 'clearance: the platform validates the invoice and returns a QR code to print' }, N, [S.comarchJo], TODAY, 'From vendor summaries only.'),
  ],
})
id('e-invoicing', 'TN', {
  claims: [
    c('mandate.name', { en: 'El Fatoora, operated by Tunisie TradeNet (TTN)' }, N, [S.kpmgTn], TODAY),
    c('mandate.status', 'in-force', N, [S.kpmgTn], '2026-01-01', 'Finance Law for 2026 (enacted 2025-12-12) extends the mandate from goods to services from 2026-01-01. Platform running since 2016.'),
    c('document.format', { syntax: 'TEIF (Tunisian Electronic Invoice Format), XML', qr: 'reported: a signed visible electronic seal as QR code' }, N, [S.kpmgTn], TODAY, 'Format details come from vendor pages found in the same search; not verified.'),
  ],
})

// ===== COMMERCIAL REGISTER =====
id('commercial-register', 'SA', {
  identifier: { en: 'Commercial registration number (CR) and unified "700" number' },
  claims: [
    c('einvoice.schemeIds', { CRN: 'commercial registration number', 700: '700 number' }, V, [S.zatcaXml], TODAY, 'Both are accepted as seller and buyer identifiers in ZATCA invoices and must be alphanumeric; with several registrations the branch’s own CR is used.'),
  ],
})
id('commercial-register', 'AE', {
  identifier: { en: 'Commercial/trade licence number' },
  claims: [c('einvoice.schemeId', 'TL', V, [S.aeFields], TODAY, 'Trade licence is a seller legal registration identifier type in UAE e-invoices. Licences are issued per emirate and free zone; no common format was found.')],
})

// ---------- write ----------
const rank = { verified: 2, 'needs-review': 1, unverified: 0 }
const order = ['region', 'dataset', 'identifier', 'structure', 'validation', 'derivable', 'claims', 'notes']
let stats = { files: 0, verified: 0, 'needs-review': 0, unverified: 0 }
for (const f of files) {
  const claims = f.data.claims
  const seen = new Map()
  for (const cl of claims) for (const s of cl.sources) seen.set(s.name + '|' + (s.path ?? ''), s)
  const conf = claims.reduce((m, cl) => (rank[cl.confidence] < rank[m] ? cl.confidence : m), 'verified')
  for (const cl of claims) stats[cl.confidence]++
  const data = { region: f.region, dataset: f.dataset, ...f.data }
  const sorted = Object.fromEntries(order.filter((k) => k in data).map((k) => [k, data[k]]))
  const doc = {
    kind: 'finance', schemaVersion: 1, id: `${f.dataset}-${f.region}`,
    provenance: { method: 'researched', confidence: conf, sources: [...seen.values()], notes: 'File confidence is the lowest confidence of any claim in it; read the claims individually.' },
    data: sorted,
  }
  const dir = path.join(ROOT, 'data', 'finance', f.dataset)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${f.region}.json`), JSON.stringify(doc, null, 2) + '\n')
  stats.files++
}
console.log(JSON.stringify(stats), JSON.stringify(EX))
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'matrix.json'), JSON.stringify(files.map((f) => ({ d: f.dataset, r: f.region, c: f.data.claims.map((x) => x.confidence) }))))
