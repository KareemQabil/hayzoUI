/** Demos for components built on React Aria; loaded lazily by GenericComponentPage. */
import { useState } from 'react'
import { Combobox, DatePicker } from '../../system/aria'

const DEMO_CUSTOMERS = [
  { value: 'CUS-0001', label: 'أحمد Khaled', description: '+20 10 1234 5678' },
  { value: 'CUS-0002', label: 'إيمان عبد الرحمن', description: '+20 11 2345 6789' },
  { value: 'CUS-0003', label: 'مُحَمَّد السيد', description: '+20 12 3456 7890' },
  { value: 'CUS-0004', label: 'هالة مؤمن', description: '+20 15 4567 8901' },
  { value: 'CUS-0005', label: 'سارة الشريف', description: '+20 10 5678 9012' },
  { value: 'CUS-0006', label: 'Omar Hassan', description: '+20 11 6789 0123' },
]

export function ComboboxDemo() {
  const [v, setV] = useState<string | null>(null)
  return (
    <div className="flex max-w-[420px] flex-col gap-2" data-testid="combobox-demo">
      <Combobox label="العميل" items={DEMO_CUSTOMERS} value={v} onValueChange={setV} placeholder="اكتب الاسم أو رقم الهاتف" helper="جرّب «احمد» أو «محمد» أو «0101»." />
      <p className="t-caption text-fg-2">
        القيمة المخزنة: <bdi dir="ltr" className="ax-mono" data-verbatim="" data-testid="combobox-value">{String(v)}</bdi>
      </p>
    </div>
  )
}

export function DateDemo() {
  const [v, setV] = useState<string | null>('2026-11-05')
  return (
    <div className="grid max-w-[640px] gap-4 sm:grid-cols-2" data-testid="date-demo">
      <DatePicker label="تاريخ الاستحقاق (ميلادي)" value={v} onValueChange={setV} />
      <DatePicker label="تاريخ الاستحقاق (هجري)" calendar="islamic-umalqura" value={v} onValueChange={setV} />
      <p className="t-caption text-fg-2 sm:col-span-2">
        القيمة المخزنة واحدة للحقلين، ميلادية بصيغة ISO: <bdi dir="ltr" className="ax-mono" data-verbatim="" data-testid="date-value">{String(v)}</bdi>
      </p>
    </div>
  )
}

