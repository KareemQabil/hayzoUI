// @vitest-environment jsdom
import fs from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { rovingKeyDown, rovingMove, rovingTargetIndex } from '../behavior/roving'
import { ExperienceScope } from '../platform/react/experience'
import { ALL_SELECTIONS, BASE_LAYERS, BRAND, CONTEXTS, VISUAL_SYSTEMS, type ContextId, type ExperienceSelection, type VisualSystemId } from '../styles/experience'
import { componentChoiceLayer } from '../styles/tokens-choice'
import { generateCssVariables, resolveTokens } from '../tokens'
import { Checkbox } from './checkbox'
import { CHECKBOX_CONTRACT, RADIO_GROUP_CONTRACT, SWITCH_CONTRACT, TABS_CONTRACT } from './choice-contracts'
import { RadioGroup } from './radio-group'
import { Switch } from './switch'
import { Tabs, type TabItem } from './tabs'

afterEach(cleanup)
const AR: ExperienceSelection = { visual: 'quiet', context: 'saas', language: 'ar' }
const EN: ExperienceSelection = { ...AR, language: 'en' }
const inScope = (ui: React.ReactNode, selection: ExperienceSelection = AR) => render(<ExperienceScope selection={selection}>{ui}</ExperienceScope>)
const key = (el: Element, k: string) => fireEvent.keyDown(el, { key: k })

describe('roving (behavior/roving.ts)', () => {
  test('RV-01 rovingMove: direction-aware horizontal arrows, vertical arrows, Home/End, other keys null', () => {
    const h = { orientation: 'horizontal', dir: 'ltr' } as const
    const hr = { orientation: 'horizontal', dir: 'rtl' } as const
    const v = { orientation: 'vertical', dir: 'rtl' } as const
    expect([rovingMove('ArrowRight', h), rovingMove('ArrowLeft', h)]).toEqual(['next', 'prev'])
    expect([rovingMove('ArrowLeft', hr), rovingMove('ArrowRight', hr)]).toEqual(['next', 'prev'])
    expect([rovingMove('ArrowUp', h), rovingMove('ArrowDown', h)]).toEqual([null, null])
    expect([rovingMove('ArrowDown', v), rovingMove('ArrowUp', v), rovingMove('ArrowLeft', v)]).toEqual(['next', 'prev', null])
    expect([rovingMove('Home', hr), rovingMove('End', v), rovingMove('Enter', h), rovingMove('a', h)]).toEqual(['first', 'last', null, null])
  })

  test('RV-02 rovingTargetIndex skips disabled items, wraps by default, stops at the ends without wrap', () => {
    const d = [true, false, true, false, false, true]
    expect(rovingTargetIndex(d, 1, 'next')).toBe(3)
    expect(rovingTargetIndex(d, 4, 'next')).toBe(1) // wraps over the disabled last item
    expect(rovingTargetIndex(d, 1, 'prev')).toBe(4)
    expect(rovingTargetIndex(d, 4, 'next', false)).toBe(4)
    expect(rovingTargetIndex(d, 1, 'prev', false)).toBe(1)
    expect([rovingTargetIndex(d, 3, 'first'), rovingTargetIndex(d, 3, 'last')]).toEqual([1, 4])
    expect(rovingTargetIndex(d, -1, 'next')).toBe(1)
    expect(rovingTargetIndex([true, true], 0, 'next')).toBe(-1)
  })

  test('RV-03 rovingKeyDown moves DOM focus, keeps one tab stop, and ignores foreign or modified keys', () => {
    const { container } = render(
      <div id="g">
        <button data-item tabIndex={0}>a</button>
        <button data-item tabIndex={-1} disabled>b</button>
        <button data-item tabIndex={-1}>c</button>
      </div>,
    )
    const group = container.querySelector<HTMLElement>('#g')!
    const [a, , c] = [...group.querySelectorAll<HTMLButtonElement>('button')]
    const opts = { itemSelector: '[data-item]', orientation: 'horizontal', dir: 'rtl' } as const
    group.addEventListener('keydown', (e) => rovingKeyDown(e, group, opts))
    a!.focus()
    const ev = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    a!.dispatchEvent(ev)
    expect(document.activeElement).toBe(c)
    expect(ev.defaultPrevented).toBe(true)
    expect([a!.tabIndex, c!.tabIndex]).toEqual([-1, 0])
    const other = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true })
    c!.dispatchEvent(other)
    expect(other.defaultPrevented).toBe(false)
    c!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', ctrlKey: true, bubbles: true }))
    expect(document.activeElement).toBe(c)
  })
})

describe('Checkbox', () => {
  test('CK-01 checked/defaultChecked/onCheckedChange: uncontrolled toggles, controlled follows the owner only', () => {
    const onCheckedChange = vi.fn()
    inScope(<Checkbox label="أوافق" onCheckedChange={onCheckedChange} />)
    const box = screen.getByLabelText('أوافق') as HTMLInputElement
    expect(box.checked).toBe(false)
    fireEvent.click(box)
    expect(box.checked).toBe(true)
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    cleanup()
    const onControlled = vi.fn()
    inScope(<Checkbox label="أوافق" checked={false} onCheckedChange={onControlled} />)
    const controlled = screen.getByLabelText('أوافق') as HTMLInputElement
    fireEvent.click(controlled)
    expect(onControlled).toHaveBeenLastCalledWith(true)
    expect(controlled.checked).toBe(false)
  })

  test('CK-02 indeterminate sets the native DOM property (exposed as mixed), survives a click while asked for, clears when not', () => {
    function Parent() {
      const [mixed, setMixed] = useState(true)
      return (
        <>
          <Checkbox label="الكل" indeterminate={mixed} />
          <button onClick={() => setMixed(false)}>clear</button>
        </>
      )
    }
    inScope(<Parent />)
    const box = screen.getByLabelText('الكل') as HTMLInputElement
    expect(box.indeterminate).toBe(true)
    expect(box.hasAttribute('aria-checked')).toBe(false) // native state, no conflicting ARIA
    fireEvent.click(box)
    expect(box.checked).toBe(true)
    expect(box.indeterminate).toBe(true)
    fireEvent.click(screen.getByText('clear'))
    expect(box.indeterminate).toBe(false)
  })

  test('CK-03 field ARIA: label for, describedby = error then description, invalid only with a reason, native required', () => {
    inScope(<Checkbox label="الشروط" description="اقرأها أولًا" error="يجب الموافقة" isRequired />)
    const box = screen.getByLabelText(/الشروط/) as HTMLInputElement
    const [first, second] = (box.getAttribute('aria-describedby') ?? '').split(' ')
    expect(document.getElementById(first!)?.textContent).toBe('يجب الموافقة')
    expect(document.getElementById(second!)?.textContent).toBe('اقرأها أولًا')
    expect(box.getAttribute('aria-invalid')).toBe('true')
    expect(box.required).toBe(true)
    expect(screen.getByText(/مطلوب/)).toBeTruthy()
    cleanup()
    inScope(<Checkbox label="Terms" description="Read first" isRequired />, EN)
    const en = screen.getByLabelText(/Terms/)
    expect(en.hasAttribute('aria-invalid')).toBe(false)
    expect(screen.getByText(/required/)).toBeTruthy()
  })

  test('CK-04 disabled uses the native attribute and never reports a change', () => {
    const onCheckedChange = vi.fn()
    inScope(<Checkbox label="معطل" isDisabled onCheckedChange={onCheckedChange} />)
    const box = screen.getByLabelText('معطل') as HTMLInputElement
    expect(box.disabled).toBe(true)
    fireEvent.click(box)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})

const PAY = [
  { value: 'cash', label: 'نقدًا' },
  { value: 'card', label: 'بطاقة', description: 'مدى أو فيزا' },
  { value: 'credit', label: 'آجل', disabled: true },
] as const

describe('RadioGroup', () => {
  test('RG-01 null means none: nothing checked by default; a choice reports its value; controlled null stays empty', () => {
    const onValueChange = vi.fn()
    inScope(<RadioGroup label="الدفع" options={PAY} onValueChange={onValueChange} />)
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.some((r) => r.checked)).toBe(false)
    fireEvent.click(screen.getByLabelText('بطاقة'))
    expect(onValueChange).toHaveBeenLastCalledWith('card')
    expect((screen.getByLabelText('بطاقة') as HTMLInputElement).checked).toBe(true)
    cleanup()
    const onControlled = vi.fn()
    inScope(<RadioGroup label="الدفع" options={PAY} value={null} onValueChange={onControlled} />)
    fireEvent.click(screen.getByLabelText('نقدًا'))
    expect(onControlled).toHaveBeenLastCalledWith('cash')
    expect((screen.getAllByRole('radio') as HTMLInputElement[]).some((r) => r.checked)).toBe(false)
    cleanup()
    inScope(<RadioGroup label="الدفع" options={PAY} defaultValue="cash" />)
    expect((screen.getByLabelText('نقدًا') as HTMLInputElement).checked).toBe(true)
  })

  test('RG-02 fieldset role=radiogroup named by the legend; group and option descriptions; invalid and required', () => {
    inScope(<RadioGroup label="الدفع" options={PAY} description="اختر طريقة" error="مطلوب الاختيار" isRequired />)
    const group = screen.getByRole('radiogroup', { name: /الدفع/ })
    expect(group.tagName).toBe('FIELDSET')
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.tagName).toBe('LEGEND')
    const [first, second] = (group.getAttribute('aria-describedby') ?? '').split(' ')
    expect(document.getElementById(first!)?.textContent).toBe('مطلوب الاختيار')
    expect(document.getElementById(second!)?.textContent).toBe('اختر طريقة')
    expect(group.getAttribute('aria-invalid')).toBe('true')
    expect(group.getAttribute('aria-required')).toBe('true')
    const card = screen.getByLabelText('بطاقة')
    expect(document.getElementById(card.getAttribute('aria-describedby')!)?.textContent).toBe('مدى أو فيزا')
    expect((screen.getAllByRole('radio') as HTMLInputElement[]).every((r) => r.required)).toBe(true)
  })

  test('RG-03 a disabled option is native-disabled; a disabled group disables every radio', () => {
    const onValueChange = vi.fn()
    inScope(<RadioGroup label="الدفع" options={PAY} onValueChange={onValueChange} />)
    const credit = screen.getByLabelText('آجل') as HTMLInputElement
    expect(credit.disabled).toBe(true)
    fireEvent.click(credit)
    expect(onValueChange).not.toHaveBeenCalled()
    cleanup()
    inScope(<RadioGroup label="الدفع" options={PAY} isDisabled />)
    expect((screen.getByRole('radiogroup') as HTMLFieldSetElement).disabled).toBe(true)
    expect((screen.getAllByRole('radio') as HTMLInputElement[]).every((r) => r.matches(':disabled'))).toBe(true)
  })

  test('RG-04 radios share one name (native arrow-key group); orientation is a data hook; no dir on the atom', () => {
    const { container } = inScope(<RadioGroup label="الدفع" options={PAY} orientation="horizontal" />)
    const names = new Set((screen.getAllByRole('radio') as HTMLInputElement[]).map((r) => r.name))
    expect(names.size).toBe(1)
    expect([...names][0]).toBeTruthy()
    expect(container.querySelector("[data-hz='radio-group']")!.getAttribute('data-orientation')).toBe('horizontal')
    expect(container.querySelectorAll('[dir]').length).toBe(1) // only the scope
  })
})

describe('Switch', () => {
  test('SWT-01 checked/defaultChecked/onCheckedChange: uncontrolled toggles, controlled follows the owner only', () => {
    const onCheckedChange = vi.fn()
    inScope(<Switch label="الإشعارات" defaultChecked onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole('switch', { name: 'الإشعارات' })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(sw) // what Space and Enter produce on a native button
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    cleanup()
    const onControlled = vi.fn()
    inScope(<Switch label="الإشعارات" checked={false} onCheckedChange={onControlled} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onControlled).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
  })

  test('SWT-02 a native button role=switch, named by the visible label (aria-labelledby), described, label click toggles', () => {
    inScope(<Switch label="الوضع الليلي" description="يطبق فورًا" />)
    const sw = screen.getByRole('switch')
    expect(sw.tagName).toBe('BUTTON')
    expect(sw.getAttribute('type')).toBe('button')
    expect(document.getElementById(sw.getAttribute('aria-labelledby')!)?.textContent).toBe('الوضع الليلي')
    expect(document.getElementById(sw.getAttribute('aria-describedby')!)?.textContent).toBe('يطبق فورًا')
    fireEvent.click(screen.getByText('الوضع الليلي'))
    expect(sw.getAttribute('aria-checked')).toBe('true')
  })

  test('SWT-03 disabled uses the native attribute and never reports a change', () => {
    const onCheckedChange = vi.fn()
    inScope(<Switch label="معطل" isDisabled onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole('switch') as HTMLButtonElement
    expect(sw.disabled).toBe(true)
    fireEvent.click(sw)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})

const TABS: TabItem[] = [
  { value: 'orders', label: 'الطلبات', content: 'p-orders' },
  { value: 'returns', label: 'المرتجعات', content: 'p-returns', disabled: true },
  { value: 'customers', label: 'العملاء', content: 'p-customers' },
  { value: 'reports', label: 'التقارير', content: 'p-reports' },
]
const tab = (name: string) => screen.getByRole('tab', { name })
const selectedTab = () => screen.getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true')?.textContent

describe('Tabs', () => {
  test('TBS-01 ARIA wiring: tablist named, tabs ↔ panels via aria-controls/aria-labelledby, only the selected panel visible', () => {
    inScope(<Tabs label="أقسام" items={TABS} />)
    const list = screen.getByRole('tablist', { name: 'أقسام' })
    expect(list.getAttribute('aria-orientation')).toBe('horizontal')
    for (const t of screen.getAllByRole('tab')) {
      const panel = document.getElementById(t.getAttribute('aria-controls')!)!
      expect(panel.getAttribute('role')).toBe('tabpanel')
      expect(panel.getAttribute('aria-labelledby')).toBe(t.id)
      expect(panel.hidden).toBe(t.getAttribute('aria-selected') !== 'true')
    }
    expect(tab('الطلبات').hasAttribute('data-selected')).toBe(true)
    expect(screen.getByRole('tabpanel').textContent).toBe('p-orders')
  })

  test('TBS-02 value contract: first enabled tab by default; click selects; controlled follows the owner only', () => {
    const onValueChange = vi.fn()
    inScope(<Tabs label="أقسام" items={[{ ...TABS[1]! }, ...TABS.filter((t) => !t.disabled)]} onValueChange={onValueChange} />)
    expect(selectedTab()).toBe('الطلبات') // the disabled first tab is not the default
    fireEvent.click(tab('العملاء'))
    expect(onValueChange).toHaveBeenLastCalledWith('customers')
    expect(selectedTab()).toBe('العملاء')
    expect(screen.getByRole('tabpanel').textContent).toBe('p-customers')
    cleanup()
    const onControlled = vi.fn()
    inScope(<Tabs label="أقسام" items={TABS} value="reports" onValueChange={onControlled} />)
    fireEvent.click(tab('العملاء'))
    expect(onControlled).toHaveBeenLastCalledWith('customers')
    expect(selectedTab()).toBe('التقارير')
  })

  test('TBS-03 automatic activation (LTR): ArrowRight moves focus and selects, Home/End go to the ends, one tab stop', () => {
    const items = TABS.filter((t) => !t.disabled)
    inScope(<Tabs label="Sections" items={items} />, EN)
    tab('الطلبات').focus()
    key(tab('الطلبات'), 'ArrowRight')
    expect(document.activeElement).toBe(tab('العملاء'))
    expect(selectedTab()).toBe('العملاء')
    key(document.activeElement!, 'End')
    expect(selectedTab()).toBe('التقارير')
    key(document.activeElement!, 'Home')
    expect(document.activeElement).toBe(tab('الطلبات'))
    expect(selectedTab()).toBe('الطلبات')
    expect(screen.getAllByRole('tab').filter((t) => t.tabIndex === 0).map((t) => t.textContent)).toEqual(['الطلبات'])
  })

  test('TBS-04 RTL follows the experience direction: ArrowLeft = next, ArrowRight = previous', () => {
    const items = TABS.filter((t) => !t.disabled)
    inScope(<Tabs label="أقسام" items={items} />, AR)
    tab('الطلبات').focus()
    key(tab('الطلبات'), 'ArrowLeft')
    expect(selectedTab()).toBe('العملاء')
    key(document.activeElement!, 'ArrowRight')
    expect(selectedTab()).toBe('الطلبات')
    cleanup()
    inScope(<Tabs label="Sections" items={items} />, EN)
    tab('الطلبات').focus()
    key(tab('الطلبات'), 'ArrowLeft') // LTR: previous, wrapping to the last
    expect(selectedTab()).toBe('التقارير')
  })

  test('TBS-05 disabled tabs are skipped by arrows (native disabled), and focus wraps around', () => {
    inScope(<Tabs label="Sections" items={TABS} />, EN)
    expect((tab('المرتجعات') as HTMLButtonElement).disabled).toBe(true)
    tab('الطلبات').focus()
    key(tab('الطلبات'), 'ArrowRight')
    expect(selectedTab()).toBe('العملاء')
    key(document.activeElement!, 'ArrowRight')
    key(document.activeElement!, 'ArrowRight')
    expect(selectedTab()).toBe('الطلبات')
    key(document.activeElement!, 'ArrowLeft')
    expect(selectedTab()).toBe('التقارير')
  })

  test('TBS-06 manual activation: arrows move focus only; Enter/Space (native button click) selects; tab stop stays on the selection', () => {
    const onValueChange = vi.fn()
    inScope(<Tabs label="Sections" items={TABS} activation="manual" onValueChange={onValueChange} />, EN)
    tab('الطلبات').focus()
    key(tab('الطلبات'), 'ArrowRight')
    expect(document.activeElement).toBe(tab('العملاء'))
    expect(selectedTab()).toBe('الطلبات')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(tab('الطلبات').tabIndex).toBe(0)
    expect(tab('العملاء').tabIndex).toBe(-1)
    fireEvent.click(document.activeElement!)
    expect(onValueChange).toHaveBeenLastCalledWith('customers')
    expect(selectedTab()).toBe('العملاء')
    expect(tab('العملاء').tabIndex).toBe(0)
  })

  test('TBS-07 selecting the selected tab reports nothing; a value matching no enabled tab leaves the first enabled tab as the tab stop', () => {
    const onValueChange = vi.fn()
    inScope(<Tabs label="أقسام" items={TABS} value="returns" onValueChange={onValueChange} />)
    expect(screen.getAllByRole('tab').filter((t) => t.tabIndex === 0).map((t) => t.textContent)).toEqual(['الطلبات'])
    cleanup()
    inScope(<Tabs label="أقسام" items={TABS} onValueChange={onValueChange} />)
    fireEvent.click(tab('الطلبات'))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

/** Behavior-relevant DOM: elements, roles, ARIA, data-hz/slot/state hooks. Not style, dir, lang or copy (as AT-INV-01). */
function behaviorShape(root: Element): string {
  const walk = (el: Element): string => {
    const attrs = [...el.attributes]
      .filter((a) => /^(aria-|data-(hz|slot|mark|orientation|activation|selected|invalid|disabled|index)$|role$|type$|disabled$|required$|tabindex$|hidden$|checked$)/.test(a.name))
      .filter((a) => a.name !== 'data-hz-experience' && a.name !== 'data-hz-layers')
      .map((a) => `${a.name}=${/^(aria-describedby|aria-labelledby|aria-controls)$/.test(a.name) ? '#' : a.value}`)
      .sort()
    const state = el instanceof HTMLInputElement ? ` checked=${el.checked} indeterminate=${el.indeterminate}` : ''
    return `<${el.tagName.toLowerCase()} ${attrs.join(' ')}${state}>${[...el.children].map(walk).join('')}</>`
  }
  return walk(root)
}

const Sample = () => (
  <form>
    <Checkbox label="L" description="d" isRequired defaultChecked />
    <Checkbox label="L" error="e" indeterminate />
    <Checkbox label="L" isDisabled />
    <RadioGroup label="G" options={PAY} defaultValue="card" description="d" error="e" isRequired />
    <RadioGroup label="G" options={PAY} orientation="horizontal" isDisabled />
    <Switch label="S" description="d" defaultChecked />
    <Switch label="S" isDisabled />
    <Tabs label="T" items={TABS} defaultValue="customers" />
    <Tabs label="T" items={TABS} activation="manual" />
  </form>
)

describe('invariants across experiences', () => {
  test('CHT-INV-01 the same choice atoms and Tabs produce identical behavior DOM in all 18 compositions', () => {
    const shapes = new Set<string>()
    for (const selection of ALL_SELECTIONS) {
      const { container } = inScope(<Sample />, selection)
      shapes.add(behaviorShape(container.querySelector('form')!))
      cleanup()
    }
    expect(ALL_SELECTIONS).toHaveLength(18)
    expect(shapes.size).toBe(1)
  })
})

describe('choice tokens and recipe', () => {
  const visuals = Object.keys(VISUAL_SYSTEMS) as VisualSystemId[]
  const contexts = Object.keys(CONTEXTS) as ContextId[]
  const variables = (visual: VisualSystemId, context: ContextId) => {
    const resolution = resolveTokens([...BASE_LAYERS.filter((l) => l.id !== componentChoiceLayer.id), componentChoiceLayer, BRAND.layer, VISUAL_SYSTEMS[visual].layer, CONTEXTS[context].layer])
    expect(resolution.issues, `${visual} × ${context}`).toEqual([])
    const css = generateCssVariables(resolution)
    expect(css.issues, `${visual} × ${context}`).toEqual([])
    return css.variables
  }
  // Project-root relative: under jsdom import.meta.url does not point at this file.
  const recipe = fs.readFileSync('src/atomic/styles/recipes/choice.css', 'utf8')
  const used = [...new Set([...recipe.matchAll(/var\((--hz-[a-z0-9-]+)/g)].map((m) => m[1]!))].sort()

  test('CHT-01 the layer is pure aliases and resolves with no issues for every visual system × context', () => {
    expect(componentChoiceLayer.type).toBe('component')
    for (const t of componentChoiceLayer.tokens) {
      expect(t.overridableBy, t.path).toEqual([])
      expect(typeof t.value === 'object' && t.value !== null && '$ref' in t.value, t.path).toBe(true)
      expect(t.path.startsWith('component.'), t.path).toBe(true)
    }
    for (const v of visuals) for (const c of contexts) expect(Object.keys(variables(v, c)).length).toBeGreaterThan(100)
  })

  test('CHT-02 choice.css reads only checkbox/radio/switch/tabs component tokens, and every one exists in every composition', () => {
    expect(used.length).toBeGreaterThan(60)
    expect(used.filter((name) => !/^--hz-component-(checkbox|radio|switch|tabs)-/.test(name))).toEqual([])
    for (const v of visuals) for (const c of contexts) {
      const vars = variables(v, c)
      expect(used.filter((name) => !(name in vars)), `${v} × ${c}`).toEqual([])
    }
  })

  test('CHT-03 contexts resize the atoms: POS targets and tab height ≥ 44px; ERP denser than SaaS denser than POS', () => {
    for (const v of visuals) {
      const pos = variables(v, 'pos')
      for (const name of ['checkbox-target-min', 'radio-target-min', 'switch-target-min', 'tabs-target-min', 'tabs-height']) {
        expect(parseFloat(pos[`--hz-component-${name}`]!), `${v} ${name}`).toBeGreaterThanOrEqual(44)
      }
      const size = (c: ContextId, name: string) => parseFloat(variables(v, c)[`--hz-component-${name}`]!)
      for (const name of ['checkbox-size', 'radio-size', 'switch-thumb-size', 'tabs-height']) {
        expect(size('erp', name), name).toBeLessThan(size('saas', name))
        expect(size('saas', name), name).toBeLessThan(size('pos', name))
      }
    }
  })

  test('CHT-04 naming rule: context-varying tokens are named as sizes; visual-system-varying tokens never are (AT-ST-03 ready)', () => {
    const names = componentChoiceLayer.tokens.map((t) => `--hz-${t.path.replace(/\./g, '-')}`)
    const diff = (a: Readonly<Record<string, string>>, b: Readonly<Record<string, string>>) => names.filter((n) => a[n] !== b[n])
    const base = variables('quiet', 'saas')
    const pos = diff(base, variables('quiet', 'pos'))
    expect(pos.length).toBeGreaterThan(10)
    expect(pos.filter((k) => !/height|padding|font-size|gap|target-min|label-size|help-size|size$/.test(k))).toEqual([])
    for (const v of ['editorial', 'soft'] as const) {
      const changed = diff(base, variables(v, 'saas'))
      expect(changed.length, v).toBeGreaterThan(0)
      expect(changed.filter((k) => /height|font-size|padding-inline$|gap/.test(k)), v).toEqual([])
    }
  })

  test('CHT-05 contracts match the recipe and the rendered anatomy', () => {
    const contracts = { checkbox: CHECKBOX_CONTRACT, 'radio-group': RADIO_GROUP_CONTRACT, switch: SWITCH_CONTRACT, tabs: TABS_CONTRACT }
    for (const [hz, contract] of Object.entries(contracts)) {
      expect(recipe, hz).toContain(`[data-hz='${hz}']`)
      for (const slot of contract.anatomy.filter((s) => s !== 'root')) expect(recipe, `${hz} ${slot}`).toContain(`[data-slot='${slot}']`)
      for (const [name, values] of Object.entries(contract.variants)) for (const value of values) {
        if (name === 'orientation' && value === 'vertical') continue // the default layout
        if (name === 'activation') continue // behavior-only variant
        expect(recipe, `${name}=${value}`).toContain(`[data-${name}='${value}']`)
      }
    }
    const { container } = inScope(<Sample />)
    for (const [hz, contract] of Object.entries(contracts)) {
      const rendered = new Set([...container.querySelectorAll(`[data-hz='${hz}'] [data-slot]`)].map((e) => e.getAttribute('data-slot')!))
      expect([...rendered].filter((s) => !contract.anatomy.includes(s)), hz).toEqual([])
      expect(contract.tests.every((id) => /^(CK|RG|SWT|TBS|RV|CHT)-/.test(id)), hz).toBe(true)
    }
  })
})
