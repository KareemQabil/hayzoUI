/**
 * DatePicker — spec: date-picker (maturity: alpha). Behavior: React Aria DatePicker through the adapter.
 *
 * Three separate contracts, like CurrencyInput:
 *  - storage: `value` is an ISO 8601 Gregorian date ('2026-11-05') or null. It never depends on the display calendar.
 *  - display: `calendar` (gregory | islamic-umalqura) and the provider's numerals only change what is drawn.
 *  - input:   segments accept Latin, Arabic-Indic and Extended Arabic-Indic digits whatever the display numerals.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog as AriaDialog,
  Group,
  Heading,
  Popover,
} from 'react-aria-components'
import { GregorianCalendar, parseDate, toCalendar, type CalendarDate, type DateValue } from '@internationalized/date'
import { normalizeDigits } from '../../arabic'
import { AriaLocale, type CalendarSystem } from '../adapter/react-aria'
import { Icon } from '../icons'
import { useLocale } from '../locale'
import { useControllable } from '../use-controllable'
import type { Size } from './button'
import { describedBy, Field, useFieldIds } from './field'

export interface DatePickerLabels {
  open: string
  previous: string
  next: string
}
const DEFAULT_LABELS: DatePickerLabels = { open: 'فتح التقويم', previous: 'الشهر السابق', next: 'الشهر التالي' }

export interface DatePickerProps {
  label: ReactNode
  /** ISO 8601 Gregorian date ('YYYY-MM-DD'), or null. Omit to use defaultValue. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** Display calendar. Storage stays Gregorian ISO. */
  calendar?: CalendarSystem
  /** Earliest allowed date, ISO. */
  min?: string | null
  /** Latest allowed date, ISO. */
  max?: string | null
  helper?: ReactNode
  error?: ReactNode
  optional?: boolean
  disabled?: boolean
  readOnly?: boolean
  size?: Size
  /** Internal strings, Arabic by default. */
  labels?: Partial<DatePickerLabels>
  id?: string
}

const toIso = (d: DateValue | null): string | null => (d ? toCalendar(d as CalendarDate, new GregorianCalendar()).toString().slice(0, 10) : null)
const fromIso = (s: string | null | undefined): CalendarDate | null => (s ? parseDate(s) : null)

/**
 * React Aria reads typed segment digits from `beforeinput` and parses them with a NumberParser bound to the
 * locale's numbering system, so Arabic-Indic digits under latn (or Latin under arab) are dropped silently:
 * the same class of bug the audit found in the Stockaat amount field. We catch `beforeinput` in the capture
 * phase on the group, before it reaches the segment, and re-dispatch it with the digits the segment expects.
 */
function useAnyDigits(ref: React.RefObject<HTMLElement | null>, numerals: 'latn' | 'arab') {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onBeforeInput = (e: Event) => {
      const ev = e as InputEvent
      if (!ev.data || !/[0-9٠-٩۰-۹]/.test(ev.data)) return
      const latin = normalizeDigits(ev.data).text
      const wanted = numerals === 'arab' ? latin.replace(/[0-9]/g, (d) => String.fromCodePoint(0x0660 + Number(d))) : latin
      if (wanted === ev.data) return
      ev.preventDefault()
      ev.stopImmediatePropagation()
      ev.target?.dispatchEvent(new InputEvent('beforeinput', { data: wanted, inputType: ev.inputType, bubbles: true, cancelable: true }))
    }
    el.addEventListener('beforeinput', onBeforeInput, { capture: true })
    return () => el.removeEventListener('beforeinput', onBeforeInput, { capture: true })
  }, [ref, numerals])
}

export function DatePicker(props: DatePickerProps) {
  const { label, value: valueProp, defaultValue = null, onValueChange, calendar = 'gregory', min, max, helper, error, optional, disabled, readOnly, size = 'md', id } = props
  const labels = { ...DEFAULT_LABELS, ...props.labels }
  const ids = useFieldIds(id)
  const { dir, numerals } = useLocale()
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onValueChange)
  const groupRef = useRef<HTMLDivElement>(null)
  useAnyDigits(groupRef, numerals)

  return (
    <AriaLocale calendar={calendar}>
      <Field ids={ids} label={label} helper={helper} error={error} optional={optional} size={size} disabled={disabled} readOnly={readOnly} className="ax-date">
        <AriaDatePicker
          aria-labelledby={ids.label}
          aria-describedby={describedBy(ids, !!helper, !!error)}
          value={fromIso(value)}
          onChange={(d) => setValue(toIso(d), undefined)}
          minValue={fromIso(min) ?? undefined}
          maxValue={fromIso(max) ?? undefined}
          isDisabled={disabled}
          isReadOnly={readOnly}
          isInvalid={!!error}
          isRequired={!optional}
          className="ax-date__root"
        >
          <Group ref={groupRef} className="ax-control ax-date__group" data-size={size} data-invalid={error ? '' : undefined} data-disabled={disabled ? '' : undefined} data-readonly={readOnly ? '' : undefined} data-dir={dir}>
            <DateInput className="ax-date__input">
              {(segment) => (
                <DateSegment segment={segment} className={segment.type === 'literal' ? 'ax-date__literal' : 'ax-date__segment'}>
                  {({ text, isPlaceholder }) => <span data-empty={isPlaceholder ? '' : undefined}>{text}</span>}
                </DateSegment>
              )}
            </DateInput>
            <AriaButton className="ax-control__affix ax-date__trigger" aria-label={labels.open}>
              <Icon name="calendar" size={16} />
            </AriaButton>
          </Group>
          <Popover className="ax-date__popover" offset={4} placement="bottom end">
            <AriaDialog className="ax-date__dialog">
              <CalendarBody labels={labels} />
            </AriaDialog>
          </Popover>
        </AriaDatePicker>
      </Field>
    </AriaLocale>
  )
}

/** The month grid; inside DatePicker it reads the picker's value from context. */
function CalendarBody({ labels, value }: { labels: DatePickerLabels; value?: CalendarDate | null }) {
  return (
    <Calendar className="ax-calendar" {...(value !== undefined ? { defaultValue: value } : {})}>
      <header className="ax-calendar__header">
        <AriaButton slot="previous" className="ax-calendar__nav" aria-label={labels.previous}>
          <Icon name="chevron-back" size={16} />
        </AriaButton>
        <Heading className="ax-calendar__title" />
        <AriaButton slot="next" className="ax-calendar__nav" aria-label={labels.next}>
          <Icon name="forward" size={16} />
        </AriaButton>
      </header>
      <CalendarGrid className="ax-calendar__grid">
        {(date) => (
          <CalendarCell date={date} className="ax-calendar__cell">
            {({ formattedDate, isSelected, isOutsideMonth, isDisabled, isUnavailable }) =>
              // An empty element, not null: React Aria falls back to the default day number for null children.
              isOutsideMonth ? (
                <span className="ax-calendar__day" aria-hidden="true" />
              ) : (
                <span className="ax-calendar__day" data-selected={isSelected ? '' : undefined} data-disabled={isDisabled || isUnavailable ? '' : undefined}>
                  {formattedDate}
                </span>
              )
            }
          </CalendarCell>
        )}
      </CalendarGrid>
    </Calendar>
  )
}

/** State sheets only: the open calendar drawn in place for a given ISO date and display calendar. */
export function CalendarPreview({ value, calendar = 'gregory' }: { value: string; calendar?: CalendarSystem }) {
  return (
    <AriaLocale calendar={calendar}>
      <div className="ax-date__popover ax-date__popover--inline">
        <div className="ax-date__dialog">
          <CalendarBody labels={DEFAULT_LABELS} value={fromIso(value)} />
        </div>
      </div>
    </AriaLocale>
  )
}
