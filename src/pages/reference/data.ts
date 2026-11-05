/** Synthetic data. Names, phones and amounts are invented for demonstration. */
export type Method = 'cash' | 'transfer' | 'card'

export interface Customer {
  id: string
  name: string
  phone: string
  since: string
}

export interface Collection {
  id: string
  customerId: string
  minor: number
  method: Method
  reference: string | null
  at: string
}

export const METHOD_LABEL: Record<Method, string> = { cash: 'نقدًا', transfer: 'تحويل بنكي', card: 'بطاقة' }

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'CUS-0001', name: 'أحمد Khaled', phone: '+201012345678', since: '2024-02-11' },
  { id: 'CUS-0002', name: 'إيمان عبد الرحمن', phone: '+201112345670', since: '2023-09-03' },
  { id: 'CUS-0003', name: 'ايمان عبدالرحمن', phone: '+201598765432', since: '2025-06-21' },
  { id: 'CUS-0004', name: 'مُحَمَّد السيد', phone: '+201234567891', since: '2022-12-01' },
  { id: 'CUS-0005', name: 'عبد الرحمن بن عبد الله بن محمد بن إبراهيم الشمري', phone: '+201001112223', since: '2025-01-15' },
  { id: 'CUS-0006', name: 'شركة النور للتجارة والتوريدات العامة ذات المسؤولية المحدودة', phone: '+201223344556', since: '2021-05-30' },
  { id: 'CUS-0007', name: 'هالة مؤمن', phone: '+201099887766', since: '2024-11-08' },
  { id: 'CUS-0008', name: 'Sara Haddad', phone: '+201155566677', since: '2025-08-19' },
  { id: 'CUS-0009', name: 'يوسف الأمين', phone: '+201277788899', since: '2023-03-27' },
  { id: 'CUS-0010', name: 'آمنة عبد الله', phone: '+201566677788', since: '2024-07-02' },
]

export const SEED_COLLECTIONS: Collection[] = [
  { id: 'RCPT-2026-0037', customerId: 'CUS-0001', minor: 250000, method: 'transfer', reference: 'INV-2026-0131', at: '2026-03-02T11:20:00' },
  { id: 'RCPT-2026-0039', customerId: 'CUS-0001', minor: 87550, method: 'cash', reference: null, at: '2026-03-09T16:05:00' },
  { id: 'RCPT-2026-0040', customerId: 'CUS-0006', minor: 4250000, method: 'transfer', reference: 'INV-2026-0140', at: '2026-03-10T09:40:00' },
  { id: 'RCPT-2026-0041', customerId: 'CUS-0002', minor: 120000, method: 'card', reference: 'INV-2026-0144', at: '2026-03-12T13:15:00' },
]

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

/** Gregorian date in Arabic month names. The calendar is a separate concern from numerals. */
export function formatDate(iso: string, withTime = false): string {
  const [d, t] = iso.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const base = `${day} ${MONTHS[m - 1]} ${y}`
  return withTime && t ? `${base}، ${t.slice(0, 5)}` : base
}

/** Fixed demo clock: every new record advances by 7 minutes from 14 March 2026, 10:30. */
let tick = 0
export function demoNow(): string {
  const base = new Date(Date.UTC(2026, 2, 14, 10, 30 + tick * 7))
  tick++
  return base.toISOString().slice(0, 19)
}
