import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SEARCH, formatPhoneEG, matchText, nationalPhoneEG, normalizeDigits, toDisplayDigits, type SearchOptions } from '../../arabic'
import {
  AmountText,
  Digits,
  Badge,
  Button,
  CurrencyInput,
  DataTable,
  Dialog,
  EmptyState,
  Highlight,
  Icon,
  InlineMessage,
  LtrIsland,
  SearchField,
  Select,
  Switch,
  TextField,
  useLocale,
  useToast,
  type CurrencyInputHandle,
} from '../../system'
import { useMediaQuery } from '../../app/ui'
import { AddCustomerDrawer } from './AddCustomer'
import { demoNow, formatDate, METHOD_LABEL, SEED_COLLECTIONS, SEED_CUSTOMERS, type Collection, type Customer, type Method } from './data'

const MIN = 100
const MAX = 5000000

function phoneDigits(e164: string) {
  return '0' + e164.replace(/^\+20/, '')
}

function Initial({ name }: { name: string }) {
  const ch = Array.from(name.replace(/^(شركة|مؤسسة)\s+/, '').trim())[0] ?? '؟'
  return (
    <span aria-hidden="true" className="grid size-11 flex-none place-items-center rounded-full bg-soft text-[18px] font-semibold text-on-soft">
      {ch}
    </span>
  )
}

export function ReferenceApp() {
  const { numerals } = useLocale()
  const toast = useToast()
  const wide = useMediaQuery('(min-width: 900px)')
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS)
  const [collections, setCollections] = useState<Collection[]>(SEED_COLLECTIONS)
  const [query, setQuery] = useState('')
  const [opts, setOpts] = useState<SearchOptions>(DEFAULT_SEARCH)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [addOpen, setAddOpen] = useState(false)
  const [failNext, setFailNext] = useState(false)

  // Collect form
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<Method>('cash')
  const [reference, setReference] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(false)
  const [success, setSuccess] = useState<Collection | null>(null)
  // A new key per transaction resets touched/validation state of the amount field.
  const [formKey, setFormKey] = useState(0)
  const submitting = useRef(false)
  const amountRef = useRef<CurrencyInputHandle>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const reviewBtn = useRef<HTMLButtonElement>(null)
  const editAfterClose = useRef(false)

  const selected = customers.find((c) => c.id === selectedId) ?? null

  const results = useMemo(() => {
    const q = query.trim()
    const qDigits = normalizeDigits(q).text.replace(/[\s\-+]/g, '')
    const isPhone = /^\d{3,}$/.test(qDigits)
    return customers
      .map((c) => {
        if (!q) return { c, ranges: [] as Array<[number, number]>, by: 'all' as const }
        if (isPhone && (phoneDigits(c.phone).includes(qDigits) || c.phone.includes(qDigits))) return { c, ranges: [], by: 'phone' as const }
        const m = matchText(q, c.name, opts)
        if (m.match) return { c, ranges: m.ranges, by: 'name' as const }
        if (c.id.toLowerCase().includes(q.toLowerCase())) return { c, ranges: [], by: 'id' as const }
        return null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [customers, query, opts])

  const history = collections.filter((c) => c.customerId === selectedId).sort((a, b) => b.at.localeCompare(a.at))

  const openCustomer = (id: string) => {
    if (id !== selectedId) {
      setAmount(null)
      setReference('')
      setSubmitAttempted(false)
      setSuccess(null)
      setFailure(false)
      setFormKey((k) => k + 1)
    }
    setSelectedId(id)
    setView('detail')
  }

  useEffect(() => {
    if (success) successRef.current?.focus()
  }, [success])

  const startReview = () => {
    setSubmitAttempted(true)
    const r = amountRef.current?.validate()
    if (!r || r.status !== 'valid' || amount == null) {
      amountRef.current?.focus()
      return
    }
    setFailure(false)
    setReviewOpen(true)
  }

  const confirm = () => {
    // Synchronous guard: a second click/Enter during the busy state does nothing.
    if (submitting.current || !selected || amount == null) return
    submitting.current = true
    setBusy(true)
    setFailure(false)
    const shouldFail = failNext
    window.setTimeout(() => {
      if (shouldFail) {
        setFailNext(false)
        setFailure(true)
        setBusy(false)
        submitting.current = false
        return
      }
      const seq = 42 + collections.length - SEED_COLLECTIONS.length
      const rec: Collection = { id: `RCPT-2026-${String(seq).padStart(4, '0')}`, customerId: selected.id, minor: amount, method, reference: reference.trim() || null, at: demoNow() }
      setCollections((xs) => [rec, ...xs])
      setBusy(false)
      submitting.current = false
      setReviewOpen(false)
      setAmount(null)
      setReference('')
      setSubmitAttempted(false)
      setFormKey((k) => k + 1)
      setSuccess(rec)
    }, 1100)
  }

  const resetDemo = () => {
    setCustomers(SEED_CUSTOMERS)
    setCollections(SEED_COLLECTIONS)
    setSelectedId(null)
    setView('list')
    setQuery('')
    setSuccess(null)
    setAmount(null)
    setReference('')
    toast({ tone: 'info', title: 'أُعيدت البيانات الاصطناعية إلى حالتها الأولى' })
  }

  const listPane = (
    <section aria-labelledby="customers-h" className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-5">
        <h2 id="customers-h" className="t-h3 text-fg">
          العملاء
        </h2>
        <Button size="sm" variant="soft" iconStart="user-plus" onClick={() => setAddOpen(true)}>
          إضافة عميل
        </Button>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3 md:px-5">
        <SearchField label="ابحث عن عميل بالاسم أو رقم الهاتف" hideLabel placeholder="اسم، أو رقم هاتف، أو CUS-0001" value={query} onValueChange={setQuery} status={`${results.length} عميل`} />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Switch label="متسامح مع الهمزة والتشكيل" checked={opts.hamza} onCheckedChange={(v) => setOpts((o) => ({ ...o, hamza: v }))} />
          <Switch label="تجاهل المسافة في الأسماء المركبة" checked={opts.ignoreSpaces} onCheckedChange={(v) => setOpts((o) => ({ ...o, ignoreSpaces: v }))} />
        </div>
      </div>
      <p className="border-b border-line px-4 pb-2 t-caption text-fg-2 md:px-5">
        {query.trim() ? `${toDisplayDigits(String(results.length), numerals)} نتيجة لـ «${query.trim()}»` : `كل العملاء · ${toDisplayDigits(String(customers.length), numerals)}`}
      </p>
      {results.length === 0 ? (
        <EmptyState
          icon="search"
          title="لا يوجد عميل بهذا الاسم أو الرقم"
          action={
            <Button variant="outline" iconStart="user-plus" onClick={() => setAddOpen(true)}>
              أضف «{query.trim()}» كعميل جديد
            </Button>
          }
        >
          تأكد من الإملاء{!opts.hamza ? '، أو فعّل المطابقة المتسامحة مع الهمزة' : ''}، أو أضفه كعميل جديد.
        </EmptyState>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="نتائج البحث">
          {results.map(({ c, ranges }) => {
            const on = c.id === selectedId
            return (
              <li key={c.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  aria-current={on ? 'true' : undefined}
                  onClick={() => openCustomer(c.id)}
                  className={['flex w-full items-center gap-3 px-4 py-3 text-start md:px-5', on ? 'bg-selection' : 'hover:bg-sunken', 'focus-visible:shadow-[inset_0_0_0_2px_var(--ax-focus-ring)] focus-visible:outline-none'].join(' ')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block t-label text-fg" dir="auto">
                      <Highlight text={c.name} ranges={ranges} />
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 t-caption text-fg-2">
                      <LtrIsland className="ax-num">{toDisplayDigits(nationalPhoneEG(c.phone), numerals)}</LtrIsland>
                      <LtrIsland mono className="text-fg-3">
                        {c.id}
                      </LtrIsland>
                    </span>
                  </span>
                  <Icon name="forward" size={16} className="text-fg-3" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )

  const detailPane = selected ? (
    <section aria-labelledby="cust-name" className="flex flex-col">
      {!wide ? (
        <div className="border-b border-line px-4 py-2">
          <Button variant="ghost" size="sm" iconStart="back" onClick={() => setView('list')}>
            العملاء
          </Button>
        </div>
      ) : null}
      <header className="flex items-start gap-4 border-b border-line px-4 py-5 md:px-8">
        <Initial name={selected.name} />
        <div className="min-w-0 flex-1">
          <h2 id="cust-name" className="t-h2 text-fg" dir="auto">
            {selected.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 t-caption text-fg-2">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="phone" size={14} />
              <LtrIsland className="ax-num">{toDisplayDigits(formatPhoneEG(selected.phone), numerals)}</LtrIsland>
            </span>
            <LtrIsland mono>{selected.id}</LtrIsland>
            <span>عميل منذ {toDisplayDigits(formatDate(selected.since), numerals)}</span>
          </p>
        </div>
      </header>

      {success && success.customerId === selected.id ? (
        <div className="px-4 pt-5 md:px-8">
          <div ref={successRef} tabIndex={-1} className="outline-none" data-testid="success">
            <InlineMessage
              tone="success"
              title="سُجّل التحصيل"
              actions={
                <Button size="sm" variant="ghost" onClick={() => setSuccess(null)}>
                  إخفاء
                </Button>
              }
            >
              <AmountText minor={success.minor} currency="EGP" /> {METHOD_LABEL[success.method]} · رقم الإيصال <LtrIsland mono>{success.id}</LtrIsland> · {toDisplayDigits(formatDate(success.at, true), numerals)}. السطر الجديد في السجل أدناه.
            </InlineMessage>
          </div>
        </div>
      ) : null}

      <form
        aria-labelledby="collect-h"
        className="grid gap-5 border-b border-line px-4 py-6 md:grid-cols-2 md:px-8"
        onSubmit={(e) => {
          e.preventDefault()
          startReview()
        }}
        noValidate
      >
        <div className="md:col-span-2">
          <h3 id="collect-h" className="t-h3 text-fg">
            تحصيل مبلغ
          </h3>
          <p className="t-caption text-fg-2">من <Digits>1</Digits> إلى <Digits>50 000</Digits> ج.م. التسجيل محاكاة محلية.</p>
        </div>
        <div className="md:col-span-2 md:max-w-[26rem]">
          <CurrencyInput key={formKey} ref={amountRef} label="المبلغ المستلم" size="lg" value={amount} onValueChange={(v) => setAmount(v)} min={MIN} max={MAX} showValidation={submitAttempted} />
        </div>
        <Select label="طريقة التحصيل" value={method} onValueChange={setMethod} options={(Object.keys(METHOD_LABEL) as Method[]).map((m) => ({ value: m, label: METHOD_LABEL[m] }))} />
        <TextField label="رقم الفاتورة" optional value={reference} onValueChange={setReference} contentDir="ltr" mono placeholder="INV-2026-0148" maxLength={32} helper="إن كان التحصيل عن فاتورة محددة." />
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button ref={reviewBtn} type="submit" size="lg" iconEnd="forward">
            مراجعة التحصيل
          </Button>
          <span className="t-caption text-fg-3">ستراجع المبلغ قبل تسجيله.</span>
        </div>
      </form>

      <section aria-labelledby="history-h" className="px-4 py-6 md:px-8">
        <h3 id="history-h" className="t-h3 mb-3 text-fg">
          سجل التحصيلات
        </h3>
        <DataTable
          label="سجل تحصيلات العميل"
          rows={history}
          rowKey={(r) => r.id}
          selectedKey={success?.customerId === selected.id ? success.id : null}
          minWidth={600}
          empty={<EmptyState icon="receipt" title="لا توجد تحصيلات بعد">أول تحصيل لهذا العميل سيظهر هنا.</EmptyState>}
          columns={[
            { key: 'at', header: 'التاريخ', nowrap: true, cell: (r) => toDisplayDigits(formatDate(r.at, true), numerals) },
            { key: 'id', header: 'رقم الإيصال', nowrap: true, cell: (r) => <LtrIsland mono>{r.id}</LtrIsland> },
            { key: 'm', header: 'الطريقة', cell: (r) => METHOD_LABEL[r.method] },
            { key: 'ref', header: 'الفاتورة', nowrap: true, cell: (r) => (r.reference ? <LtrIsland mono>{r.reference}</LtrIsland> : <span className="text-fg-3">—</span>) },
            { key: 'a', header: 'المبلغ', numeric: true, nowrap: true, cell: (r) => <AmountText minor={r.minor} currency="EGP" /> },
          ]}
        />
      </section>
    </section>
  ) : (
    <div className="grid h-full place-items-center p-8">
      <EmptyState icon="wallet" title="اختر عميلًا لتحصيل مبلغ منه">
        ابحث بالاسم أو رقم الهاتف. إن لم يكن مسجلًا، أضفه أولًا.
      </EmptyState>
    </div>
  )

  return (
    <div className="mx-auto flex max-w-[1520px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line bg-surface px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-col">
          <p className="t-caption text-fg-2">التطبيق المرجعي · نمط <a href="#/patterns/P-COLLECT-PAYMENT" className="text-link hover:underline"><bdi dir="ltr">P-COLLECT-PAYMENT</bdi></a></p>
          <h1 className="t-h3 text-fg">دفتر التحصيل — متجر النور، فرع مدينة نصر</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Badge tone="warning" dot>بيانات اصطناعية</Badge>
          <Badge tone="info" dot>محاكاة محلية — لا تحصيل حقيقي</Badge>
          <Switch label="افشل المحاولة التالية" checked={failNext} onCheckedChange={setFailNext} />
          <Button size="sm" variant="ghost" iconStart="reset" onClick={resetDemo}>
            إعادة البيانات
          </Button>
        </div>
      </div>

      {wide ? (
        <div className="grid h-[calc(100dvh-3.5rem-4.6rem)] min-h-[560px] grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col overflow-hidden border-e border-line bg-surface">{listPane}</div>
          <div className="min-h-0 overflow-y-auto bg-canvas">{detailPane}</div>
        </div>
      ) : view === 'list' || !selected ? (
        <div className="bg-surface">{listPane}</div>
      ) : (
        <div className="bg-canvas">{detailPane}</div>
      )}

      <Dialog
        open={reviewOpen}
        onOpenChange={(o) => {
          if (!o) setReviewOpen(false)
        }}
        returnFocus={reviewBtn}
        dismissible={!busy}
        title="تأكيد التحصيل"
        description="راجع البيانات قبل التسجيل."
        footer={
          <>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                editAfterClose.current = true
                setReviewOpen(false)
                setTimeout(() => amountRef.current?.focus(), 30)
              }}
            >
              {failure ? 'عدّل البيانات' : 'رجوع للتعديل'}
            </Button>
            <Button data-autofocus loading={busy} loadingLabel="جارٍ التسجيل…" onClick={confirm} data-testid="confirm">
              {failure ? 'أعد المحاولة' : 'تأكيد التحصيل'}
            </Button>
          </>
        }
      >
        {selected && amount != null ? (
          <div className="flex flex-col gap-5">
            {failure ? (
              <InlineMessage tone="danger" title="تعذّر تسجيل التحصيل" live="assertive">
                انتهت مهلة الاتصال بالخادم المحاكى. لم يُسجَّل أي مبلغ، وبياناتك ما زالت كما هي. أعد المحاولة أو عدّل البيانات.
              </InlineMessage>
            ) : null}
            <div className="rounded-[var(--ax-radius-surface)] bg-sunken px-5 py-4">
              <p className="t-caption text-fg-2">المبلغ</p>
              <p className="text-[30px] font-semibold leading-tight text-fg">
                <AmountText minor={amount} currency="EGP" />
              </p>
            </div>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-2.5 t-body">
              <dt className="text-fg-2">العميل</dt>
              <dd className="text-fg" dir="auto">{selected.name}</dd>
              <dt className="text-fg-2">الهاتف</dt>
              <dd><LtrIsland className="ax-num">{toDisplayDigits(formatPhoneEG(selected.phone), numerals)}</LtrIsland></dd>
              <dt className="text-fg-2">الطريقة</dt>
              <dd className="text-fg">{METHOD_LABEL[method]}</dd>
              <dt className="text-fg-2">الفاتورة</dt>
              <dd>{reference.trim() ? <LtrIsland mono>{reference.trim()}</LtrIsland> : <span className="text-fg-3">بلا</span>}</dd>
            </dl>
            <p className="flex items-start gap-2 t-caption text-fg-2">
              <Icon name="info" size={15} className="mt-0.5 flex-none" />
              محاكاة محلية: لن يُحصَّل أي مبلغ حقيقي ولن يُتصل بأي خادم.
            </p>
          </div>
        ) : null}
      </Dialog>

      <AddCustomerDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        customers={customers}
        initialQuery={query}
        onOpenExisting={(id) => {
          setAddOpen(false)
          openCustomer(id)
        }}
        onAdd={(c) => {
          setCustomers((xs) => [c, ...xs])
          setQuery('')
          setAddOpen(false)
          openCustomer(c.id)
          toast({ tone: 'success', title: 'أُضيف العميل', body: c.name })
        }}
      />
    </div>
  )
}
