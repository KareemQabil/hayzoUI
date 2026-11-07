/**
 * Combobox — spec: combobox (maturity: alpha). Behavior: React Aria ComboBox through the adapter.
 * Our contract on top: value/defaultValue/onValueChange with null for empty, Arabic-tolerant matching
 * from L2 (hamza, alef maqsura, taa marbuta, diacritics, spaces) with highlighted match ranges,
 * the shared Field anatomy, Arabic internal strings in `labels`, and only our data-attributes for styling.
 */
import { useState, type ReactNode } from 'react'
import { ComboBox as AriaComboBox, Button as AriaButton, Group, Input, ListBox, ListBoxItem, Popover } from 'react-aria-components'
import { DEFAULT_SEARCH, matchDigits, matchText, numericSpaces, toDisplayDigits, type SearchOptions } from '../../arabic'
import { AriaLocale } from '../adapter/react-aria'
import { Icon } from '../icons'
import { mixedAlignValue, useLocale } from '../locale'
import { useControllable } from '../use-controllable'
import type { Size } from './button'
import { describedBy, Field, useFieldIds } from './field'
import { AutoText, Highlight } from './text'

export interface ComboboxItem {
  value: string
  /** Text shown and matched. */
  label: string
  /** Secondary line (phone, code), matched as text and by digits («010…» finds «+20 10 …»). */
  description?: string
}

export interface ComboboxLabels {
  open: string
  empty: string
}
const DEFAULT_LABELS: ComboboxLabels = { open: 'عرض الخيارات', empty: 'لا توجد نتائج مطابقة.' }

export interface ComboboxProps {
  label: ReactNode
  items: ComboboxItem[]
  /** Controlled selected value, or null for none. Omit to use defaultValue. */
  value?: string | null
  defaultValue?: string | null
  /** details.item is the selected item, or null when cleared. */
  onValueChange?: (value: string | null, details: { item: ComboboxItem | null }) => void
  /** Matching rules. Default: Arabic-tolerant (L2 DEFAULT_SEARCH). */
  search?: SearchOptions
  placeholder?: string
  helper?: ReactNode
  error?: ReactNode
  optional?: boolean
  disabled?: boolean
  readOnly?: boolean
  size?: Size
  hideLabel?: boolean
  /** Internal strings, Arabic by default. */
  labels?: Partial<ComboboxLabels>
  id?: string
}

export function Combobox(props: ComboboxProps) {
  const { label, items, value: valueProp, defaultValue = null, onValueChange, search = DEFAULT_SEARCH, placeholder, helper, error, optional, disabled, readOnly, size = 'md', hideLabel, id } = props
  const labels = { ...DEFAULT_LABELS, ...props.labels }
  const ids = useFieldIds(id)
  const { dir, mixedAlign } = useLocale()
  const [value, setValue] = useControllable<string | null, { item: ComboboxItem | null }>(valueProp, defaultValue, onValueChange)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const matches = (item: ComboboxItem, q: string) => q.trim() === '' || matchText(q, item.label, search).match || (!!item.description && (matchText(q, item.description, search).match || matchDigits(q, item.description)))

  return (
    <AriaLocale>
      <Field ids={ids} label={label} hideLabel={hideLabel} helper={helper} error={error} optional={optional} size={size} disabled={disabled} readOnly={readOnly} className="ax-combobox">
        <AriaComboBox
          aria-labelledby={ids.label}
          aria-describedby={describedBy(ids, !!helper, !!error)}
          // defaultItems: React Aria filters with defaultFilter only for an uncontrolled collection.
          defaultItems={items}
          selectedKey={value}
          onSelectionChange={(key) => {
            const next = key == null ? null : String(key)
            setValue(next, { item: items.find((i) => i.value === next) ?? null })
          }}
          onInputChange={setQuery}
          onOpenChange={setOpen}
          defaultFilter={(text, q) => {
            const item = items.find((i) => i.label === text)
            return item ? matches(item, q) : q.trim() === '' || matchText(q, text, search).match
          }}
          isDisabled={disabled}
          isReadOnly={readOnly}
          isInvalid={!!error}
          isRequired={!optional}
          menuTrigger="input"
          allowsEmptyCollection
          className="ax-combobox__root"
        >
          {/* Group: React Aria sizes and anchors the popover to the whole control, not just the input. */}
          <Group
            className="ax-control"
            data-size={size}
            data-invalid={error ? '' : undefined}
            data-disabled={disabled ? '' : undefined}
            data-readonly={readOnly ? '' : undefined}
            data-state={open ? 'open' : 'closed'}
            data-dir={dir}
          >
            <Input id={ids.input} className="ax-control__input" placeholder={placeholder} dir={query === '' ? dir : 'auto'} />
            <AriaButton className="ax-control__affix ax-combobox__trigger" aria-label={labels.open}>
              <Icon name="chevron-down" size={16} />
            </AriaButton>
          </Group>
          {/* The popover is portaled out of the provider: carry direction and mixed-text alignment explicitly. */}
          <Popover className="ax-combobox__popover" offset={4} dir={dir} style={{ '--ax-mixed-align': mixedAlignValue(dir, mixedAlign) } as React.CSSProperties}>
            {/* dependencies: items are cached by React Aria; the highlight depends on the query. */}
            <ListBox<ComboboxItem> className="ax-combobox__list" dependencies={[query]} renderEmptyState={() => <p className="ax-combobox__empty">{labels.empty}</p>}>
              {(item) => <ComboboxOption item={item} query={query} search={search} />}
            </ListBox>
          </Popover>
        </AriaComboBox>
      </Field>
    </AriaLocale>
  )
}

function ComboboxOption({ item, query, search }: { item: ComboboxItem; query: string; search: SearchOptions }) {
  const { numerals } = useLocale()
  return (
    <ListBoxItem id={item.value} textValue={item.label} className="ax-combobox__option">
      {({ isFocused, isSelected }) => (
        <span className="ax-combobox__option-inner" data-highlighted={isFocused ? '' : undefined} data-selected={isSelected ? '' : undefined}>
          <AutoText className="ax-combobox__option-label">
            <Highlight text={item.label} ranges={query ? matchText(query, item.label, search).ranges : []} />
          </AutoText>
          {item.description ? (
            <bdi dir="ltr" className="ax-combobox__option-desc ax-num">
              {/* Provider's numerals, and U+00A0 between phone groups (as the phone contract) so they keep their order (R-BIDI-003). Both mappings are
                  one character for one, so the match ranges stay valid. */}
              <Highlight text={numericSpaces(toDisplayDigits(item.description, numerals))} ranges={query ? matchText(query, item.description, search).ranges : []} />
            </bdi>
          ) : null}
          {isSelected ? <Icon name="check" size={16} className="ax-combobox__check" /> : null}
        </span>
      )}
    </ListBoxItem>
  )
}

/** State sheets only: the open popup's list drawn in place, with the same options and highlighting. */
export function ComboboxListPreview({ items, query = '', selected = null, label = 'الخيارات' }: { items: ComboboxItem[]; query?: string; selected?: string | null; label?: string }) {
  return (
    <AriaLocale>
      <div className="ax-combobox__popover ax-combobox__popover--inline">
        <ListBox<ComboboxItem> aria-label={label} items={items} selectionMode="single" defaultSelectedKeys={selected ? [selected] : []} className="ax-combobox__list">
          {(item) => <ComboboxOption item={item} query={query} search={DEFAULT_SEARCH} />}
        </ListBox>
      </div>
    </AriaLocale>
  )
}
