/**
 * First proof of the atomic architecture (architecture §13): the same Button and TextField, unforked, in
 * 3 visual systems × 3 contexts × Arabic RTL / English LTR. Every cell is a real ExperienceScope resolved by the
 * token engine; nothing here styles the atoms.
 *
 * Query: #/proof?visual=quiet|editorial|soft (one section, for review and baselines).
 */
import { useEffect, useState } from 'react'
import { Button, Checkbox, Dialog, Drawer, ExperienceScope, Popover, RadioGroup, Switch, Tabs, TextField, Tooltip } from '../atomic/components'
import { CONTEXTS, LANGUAGES, VISUAL_SYSTEMS, resolveExperienceStyle, type ContextId, type LanguageId, type VisualSystemId } from '../atomic/styles/experience'
import { Digits, Literal } from '../system'

const COPY = {
  ar: { name: 'اسم العميل', nameValue: 'أحمد Khaled', email: 'البريد الإلكتروني', emailValue: 'ahmed@', emailError: 'أكمل عنوان البريد بعد علامة @.', hint: 'يظهر على الفاتورة.', save: 'حفظ العميل', cancel: 'إلغاء', remove: 'حذف', pending: 'تأكيد التحصيل', disabled: 'إرسال', notify: 'إرسال إشعار بالدفع', notifyHint: 'رسالة نصية للعميل.', terms: 'العميل وافق على الشروط', method: 'طريقة الدفع', cash: 'نقدًا', card: 'بطاقة', transfer: 'تحويل بنكي', tabs: 'بيانات العميل', tabInfo: 'البيانات', tabHistory: 'السجل', tabNotes: 'ملاحظات', info: 'بيانات العميل الأساسية.', history: 'آخر عمليات التحصيل.', notes: 'ملاحظات داخلية.', details: 'تفاصيل الرصيد', balance: 'الرصيد المستحق يُحدَّث بعد كل تحصيل.', help: 'مساعدة', helpTip: 'يحفظ البيانات دون إرسال إشعار.', remove2: 'حذف العميل', confirmTitle: 'حذف العميل نهائيًا؟', confirmBody: 'سيُحذف سجل العميل وكل ملاحظاته. لا يمكن التراجع.', confirm: 'حذف', filters: 'تصفية', filtersTitle: 'تصفية العملاء', filtersBody: 'اختر المنطقة وحالة السداد.' },
  en: { name: 'Customer name', nameValue: 'Sara Haddad', email: 'Email', emailValue: 'sara@', emailError: 'Complete the address after the @ sign.', hint: 'Shown on the invoice.', save: 'Save customer', cancel: 'Cancel', remove: 'Delete', pending: 'Confirm payment', disabled: 'Send', notify: 'Send payment notice', notifyHint: 'Text message to the customer.', terms: 'Customer accepted the terms', method: 'Payment method', cash: 'Cash', card: 'Card', transfer: 'Bank transfer', tabs: 'Customer details', tabInfo: 'Details', tabHistory: 'History', tabNotes: 'Notes', info: 'Basic customer details.', history: 'Latest collections.', notes: 'Internal notes.', details: 'Balance details', balance: 'The balance due updates after every collection.', help: 'Help', helpTip: 'Saves without sending a notice.', remove2: 'Delete customer', confirmTitle: 'Delete this customer?', confirmBody: 'The record and all its notes will be deleted. This cannot be undone.', confirm: 'Delete', filters: 'Filters', filtersTitle: 'Filter customers', filtersBody: 'Choose a region and payment status.' },
} as const

function Specimen({ language }: { language: LanguageId }) {
  const t = COPY[language]
  const [name, setName] = useState<string | null>(t.nameValue)
  // Completed saves, exposed for the browser checks (BR-AT-02): a double activation must count once.
  const [saves, setSaves] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [filtering, setFiltering] = useState(false)
  return (
    <div className="grid gap-4" data-saves={saves}>
      <TextField label={t.name} value={name} onValueChange={setName} description={t.hint} isRequired />
      <TextField label={t.email} defaultValue={t.emailValue} error={t.emailError} contentDirection="ltr" type="email" />
      <div className="flex flex-wrap gap-2">
        <Button onPress={() => { setSaves((n) => n + 1); return new Promise((r) => setTimeout(r, 1200)) }}>{t.save}</Button>
        <Button intent="neutral" emphasis="outline">{t.cancel}</Button>
        <Button intent="danger" emphasis="ghost">{t.remove}</Button>
      </div>
      <Switch label={t.notify} description={t.notifyHint} defaultChecked />
      <Checkbox label={t.terms} defaultChecked />
      <RadioGroup label={t.method} orientation="horizontal" defaultValue="cash" options={[{ value: 'cash', label: t.cash }, { value: 'card', label: t.card }, { value: 'transfer', label: t.transfer, disabled: true }]} />
      <Tabs label={t.tabs} items={[{ value: 'info', label: t.tabInfo, content: t.info }, { value: 'history', label: t.tabHistory, content: t.history }, { value: 'notes', label: t.tabNotes, content: t.notes, disabled: true }]} />
      <div className="flex flex-wrap gap-2" data-proof-overlays="">
        <Tooltip content={t.helpTip}><Button intent="neutral" emphasis="ghost" size="sm">{t.help}</Button></Tooltip>
        <Popover title={t.details} trigger={<Button intent="neutral" emphasis="outline" size="sm">{t.details}</Button>}>{t.balance}</Popover>
        <Button intent="danger" emphasis="outline" size="sm" onPress={() => setConfirming(true)}>{t.remove2}</Button>
        <Button intent="neutral" emphasis="outline" size="sm" onPress={() => setFiltering(true)}>{t.filters}</Button>
        <Dialog open={confirming} onOpenChange={setConfirming} title={t.confirmTitle} description={t.confirmBody} size="sm" footer={<><Button intent="neutral" emphasis="outline" onPress={() => setConfirming(false)}>{t.cancel}</Button><Button intent="danger" onPress={() => setConfirming(false)}>{t.confirm}</Button></>}>{null}</Dialog>
        <Drawer open={filtering} onOpenChange={setFiltering} title={t.filtersTitle} description={t.filtersBody}>
          <Checkbox label={t.terms} />
        </Drawer>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button isPending size="sm">{t.pending}</Button>
        <Button isDisabled size="sm" intent="neutral">{t.disabled}</Button>
      </div>
    </div>
  )
}

function Cell({ visual, context, language }: { visual: VisualSystemId; context: ContextId; language: LanguageId }) {
  const result = resolveExperienceStyle({ visual, context, language })
  const c = CONTEXTS[context]
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2" data-proof-cell={`${visual}/${context}/${language}`}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line bg-sunken px-4 py-2.5">
        <span className="t-label text-fg">{c.asset.name} · {LANGUAGES[language].locale}</span>
        <span className="t-caption text-fg-2">
          <Literal dir="ltr">{c.density} · {LANGUAGES[language].direction} · {LANGUAGES[language].numberingSystem}</Literal>
        </span>
      </figcaption>
      <ExperienceScope selection={{ visual, context, language }} className="flex flex-1 flex-col">
        <div className="flex-1 p-5" style={{ background: 'var(--hz-color-surface-raised)', color: 'var(--hz-color-text-primary)' }}>
          <Specimen language={language} />
        </div>
      </ExperienceScope>
      {result.ok ? (
        <details className="border-t border-line px-4 py-2">
          <summary className="t-caption cursor-pointer text-link">الطبقات وقيم المكوّن</summary>
          <p className="t-caption mt-2 text-fg-2"><Literal dir="ltr">{result.style.layers.join(' → ')}</Literal></p>
          <p className="t-caption mt-1 text-fg-2">
            <Literal dir="ltr">button-height-md {result.style.variables['--hz-component-button-height-md']} · button-radius {result.style.variables['--hz-component-button-radius']} · field-border {result.style.variables['--hz-component-field-border-width-inline']}/{result.style.variables['--hz-component-field-border-width-block-end']}</Literal>
          </p>
        </details>
      ) : null}
    </figure>
  )
}

export function ProofPage() {
  const query = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('visual')
  const [asked, setAsked] = useState(query)
  // The router keys on path segments only; a query-only change must still re-filter.
  useEffect(() => {
    const sync = () => setAsked(query())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const visuals = (Object.keys(VISUAL_SYSTEMS) as VisualSystemId[]).filter((v) => !asked || v === asked)
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-10 max-w-[72ch]">
        <p className="t-eyebrow mb-2">المعمارية الذرّية · الإثبات الأول</p>
        <h1 className="t-h1 text-fg">نفس الزر ونفس الحقل، في كل سياق</h1>
        <p className="t-body-lg mt-3 text-fg-2">
          <Digits>{'مكوّنان فقط، بلا نسخ ولا تفرعات: 3 أنظمة بصرية × 3 سياقات تشغيل × العربية من اليمين والإنجليزية من اليسار = 18 تركيبة. كل خلية تُحسب الآن بمحرك الـtokens من طبقات بإصدارات محددة، والسلوك نفسه في كل الخلايا (اختبار AT-INV-01).'}</Digits>
        </p>
        <ul className="t-body mt-4 flex flex-col gap-1 text-fg-2">
          <li><span className="font-medium text-fg">النظام البصري</span> يغيّر الشكل فقط: الزوايا، طريقة رسم الحقل، الخط، الظل.</li>
          <li><span className="font-medium text-fg">السياق</span> يغيّر المقاسات فقط: الارتفاع، الحشو، حجم الخط، مساحة اللمس.</li>
          <li><span className="font-medium text-fg">اللغة</span> تغيّر الاتجاه والنصوص الداخلية ونظام الأرقام، ولا تغيّر أي قيمة شكلية.</li>
        </ul>
      </header>
      {visuals.map((visual) => (
        <section key={visual} className="mb-14" aria-labelledby={`proof-${visual}`} data-proof-visual={visual}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="t-eyebrow mb-1"><Literal dir="ltr">visual.{visual}@0.1.0</Literal></p>
              <h2 id={`proof-${visual}`} className="t-h2 text-fg">{VISUAL_SYSTEMS[visual].asset.name}</h2>
            </div>
            <p className="t-caption max-w-[48ch] text-fg-2"><Literal dir="ltr">{VISUAL_SYSTEMS[visual].asset.principles.join(' · ')}</Literal></p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(Object.keys(CONTEXTS) as ContextId[]).flatMap((context) =>
              (Object.keys(LANGUAGES) as LanguageId[]).map((language) => <Cell key={`${context}-${language}`} visual={visual} context={context} language={language} />),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
