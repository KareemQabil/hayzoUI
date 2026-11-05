import { useEffect, useRef, useState } from 'react'
import { normalizeDigits, parsePhoneEG, similarNames, toDisplayDigits, formatPhoneEG } from '../../arabic'
import { nameMessages } from '../../content/messages'
import { AutoText, Button, Drawer, InlineMessage, LtrIsland, PhoneInput, TextField, useLocale } from '../../system'
import type { Customer } from './data'

export function AddCustomerDrawer({
  open,
  onOpenChange,
  customers,
  initialQuery,
  onAdd,
  onOpenExisting,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  customers: Customer[]
  initialQuery: string
  onAdd: (c: Customer) => void
  onOpenExisting: (id: string) => void
}) {
  const { numerals } = useLocale()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const q = initialQuery.trim()
    const digits = normalizeDigits(q).text.replace(/\s/g, '')
    const parsed = parsePhoneEG(digits)
    setName(/^\+?\d+$/.test(digits) ? '' : q)
    setPhone(parsed.status === 'valid' ? parsed.e164 : null)
    setAttempted(false)
  }, [open, initialQuery])

  const trimmed = name.trim()
  const nameError = attempted ? (!trimmed ? nameMessages.required : trimmed.length < 2 ? nameMessages.tooShort : null) : null
  const similar = similarNames(trimmed, customers, (c) => c.name)
  const samePhone = phone ? customers.filter((c) => c.phone === phone) : []
  const flagged = [...similar, ...samePhone.filter((c) => !similar.includes(c))]

  const submit = () => {
    setAttempted(true)
    if (busyRef.current) return
    if (!trimmed || trimmed.length < 2) {
      nameRef.current?.focus()
      return
    }
    if (!phone) return
    busyRef.current = true
    setBusy(true)
    window.setTimeout(() => {
      const n = customers.length + 1
      // Stored exactly as typed (trimmed). No hamza or spacing normalization is applied to names.
      onAdd({ id: `CUS-${String(n).padStart(4, '0')}`, name: trimmed, phone, since: '2026-03-14' })
      busyRef.current = false
      setBusy(false)
    }, 600)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!busy}
      title="إضافة عميل"
      description="يُحفظ الاسم كما تكتبه تمامًا. محاكاة محلية."
      labels={{ close: 'إغلاق نموذج إضافة عميل' }}
      footer={
        <>
          <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button loading={busy} loadingLabel="جارٍ الإضافة…" onClick={submit}>
            {flagged.length ? 'أضف كعميل جديد' : 'إضافة العميل'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <TextField ref={nameRef} label="اسم العميل" value={name} onValueChange={(v) => setName(v ?? '')} error={nameError} helper="الاسم الكامل كما يظهر في سجلاته. يمكن أن يجمع العربية واللاتينية." autoComplete="off" />
        <PhoneInput label="رقم المحمول" value={phone} onValueChange={(v) => setPhone(v)} showValidation={attempted} helper="محمول مصري. يقبل الأرقام العربية واللاتينية." />
        {flagged.length ? (
          <InlineMessage tone="warning" title={samePhone.length && !similar.length ? 'هذا الرقم مسجّل لعميل آخر' : 'يوجد عميل باسم مشابه'}>
            <p>افتحه إن كان الشخص نفسه، أو أضف عميلًا جديدًا إن كان شخصًا آخر. لن ندمج السجلات.</p>
            <ul className="mt-2 flex flex-col divide-y divide-line border-y border-line">
              {flagged.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <AutoText className="t-label text-fg">{c.name}</AutoText>
                    <span className="t-caption text-fg-2">
                      <LtrIsland className="ax-num">{toDisplayDigits(formatPhoneEG(c.phone), numerals)}</LtrIsland> · <LtrIsland mono>{c.id}</LtrIsland>
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onOpenExisting(c.id)}>
                    افتح هذا العميل
                  </Button>
                </li>
              ))}
            </ul>
          </InlineMessage>
        ) : null}
        <button type="submit" hidden />
      </form>
    </Drawer>
  )
}
