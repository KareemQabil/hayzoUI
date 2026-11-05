/**
 * Primitive spike (MASTER_PLAN phase 0). The same scenario on three behavior libraries:
 *   1. a Dialog that contains our CurrencyInput (L2 parsing, own Escape contract) and a text field,
 *   2. a Combobox of customer names filtered by our hamza-tolerant matchText (L2 search).
 * Query: ?lib=react-aria|base-ui|radix&dir=rtl|ltr. Checks run from scripts/spike-primitives.mjs.
 * Styling is deliberately minimal and shared; only behavior is compared.
 */
import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { DEFAULT_SEARCH, matchText } from '../../src/arabic'
import { CurrencyInput, LocaleProvider, SettingsProvider } from '../../src/system'
import '../../src/index.css'
import './spike.css'

import * as RA from 'react-aria-components'
import { Dialog as BDialog } from '@base-ui/react/dialog'
import { Combobox as BCombobox } from '@base-ui/react/combobox'
import { DirectionProvider as BDirection } from '@base-ui/react/direction-provider'
import { Dialog as RDialog, Direction as RDirection } from 'radix-ui'

const params = new URLSearchParams(location.search)
const lib = (params.get('lib') ?? 'react-aria') as 'react-aria' | 'base-ui' | 'radix'
const dir = (params.get('dir') ?? 'rtl') as 'rtl' | 'ltr'
document.documentElement.dir = dir

const CUSTOMERS = ['أحمد Khaled', 'إيمان عبد الرحمن', 'مُحَمَّد السيد', 'هالة مؤمن', 'سارة الشريف', 'Omar Hassan']
const tolerant = (text: string, query: string) => query.trim() === '' || matchText(query, text, DEFAULT_SEARCH).match

/** Dialog body shared by all libraries: the integration under test is our field inside their focus scope. */
function DialogBody() {
  return (
    <div className="spike-body">
      <CurrencyInput label="المبلغ المستلم" defaultValue={null} />
      <label className="spike-label">
        ملاحظة
        <input className="spike-input" data-testid="note" />
      </label>
    </div>
  )
}

function ReactAriaSpike() {
  return (
    <RA.I18nProvider locale={dir === 'rtl' ? 'ar-EG' : 'en-US'}>
      <RA.DialogTrigger>
        <RA.Button className="spike-btn" data-testid="open">تحصيل مبلغ</RA.Button>
        <RA.ModalOverlay className="spike-overlay" isDismissable>
          <RA.Modal className="spike-modal">
            <RA.Dialog className="spike-dialog" data-testid="dialog">
              <RA.Heading slot="title">تحصيل مبلغ</RA.Heading>
              <DialogBody />
              <RA.Button slot="close" className="spike-btn" data-testid="close">إغلاق</RA.Button>
            </RA.Dialog>
          </RA.Modal>
        </RA.ModalOverlay>
      </RA.DialogTrigger>

      <RA.ComboBox className="spike-combo" defaultFilter={tolerant} menuTrigger="input" data-testid="combo">
        <RA.Label>العميل</RA.Label>
        <RA.Input className="spike-input" data-testid="combo-input" />
        <RA.Popover className="spike-popover" data-testid="popup">
          <RA.ListBox className="spike-list">
            {CUSTOMERS.map((c) => (
              <RA.ListBoxItem key={c} id={c} textValue={c} className="spike-option">
                {c}
              </RA.ListBoxItem>
            ))}
          </RA.ListBox>
        </RA.Popover>
      </RA.ComboBox>
    </RA.I18nProvider>
  )
}

function BaseUiSpike() {
  return (
    <BDirection direction={dir}>
      <BDialog.Root>
        <BDialog.Trigger className="spike-btn" data-testid="open">تحصيل مبلغ</BDialog.Trigger>
        <BDialog.Portal>
          <BDialog.Backdrop className="spike-overlay" />
          <BDialog.Popup className="spike-modal spike-dialog" data-testid="dialog">
            <BDialog.Title>تحصيل مبلغ</BDialog.Title>
            <DialogBody />
            <BDialog.Close className="spike-btn" data-testid="close">إغلاق</BDialog.Close>
          </BDialog.Popup>
        </BDialog.Portal>
      </BDialog.Root>

      <BCombobox.Root items={CUSTOMERS} filter={(item: string, query: string) => tolerant(item, query)}>
        <div className="spike-combo" data-testid="combo">
          <label htmlFor="b-combo">العميل</label>
          <BCombobox.Input id="b-combo" className="spike-input" data-testid="combo-input" />
        </div>
        <BCombobox.Portal>
          <BCombobox.Positioner sideOffset={4}>
            <BCombobox.Popup className="spike-popover" data-testid="popup">
              <BCombobox.List className="spike-list">
                {(item: string) => (
                  <BCombobox.Item key={item} value={item} className="spike-option">
                    {item}
                  </BCombobox.Item>
                )}
              </BCombobox.List>
            </BCombobox.Popup>
          </BCombobox.Positioner>
        </BCombobox.Portal>
      </BCombobox.Root>
    </BDirection>
  )
}

function RadixSpike() {
  return (
    <RDirection.Provider dir={dir}>
      <RDialog.Root>
        <RDialog.Trigger className="spike-btn" data-testid="open">تحصيل مبلغ</RDialog.Trigger>
        <RDialog.Portal>
          <RDialog.Overlay className="spike-overlay" />
          <RDialog.Content className="spike-modal spike-dialog" data-testid="dialog" aria-describedby={undefined}>
            <RDialog.Title>تحصيل مبلغ</RDialog.Title>
            <DialogBody />
            <RDialog.Close className="spike-btn" data-testid="close">إغلاق</RDialog.Close>
          </RDialog.Content>
        </RDialog.Portal>
      </RDialog.Root>
      {/* Radix has no Combobox primitive. Recorded as a gap, not reimplemented here. */}
      <p className="spike-note" data-testid="no-combo">لا يوجد Combobox في Radix</p>
    </RDirection.Provider>
  )
}

function App() {
  const [ready] = useState(true)
  return (
    <SettingsProvider>
      <LocaleProvider dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'} numerals="latn" className="spike-page">
        <h1 className="spike-title" data-testid="lib">{lib}</h1>
        {ready && (lib === 'react-aria' ? <ReactAriaSpike /> : lib === 'base-ui' ? <BaseUiSpike /> : <RadixSpike />)}
        <div style={{ height: '200vh' }} aria-hidden="true" />
      </LocaleProvider>
    </SettingsProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
