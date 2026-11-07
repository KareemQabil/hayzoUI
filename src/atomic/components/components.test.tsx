// @vitest-environment jsdom
import fs from 'node:fs'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { ALL_SELECTIONS, type ExperienceSelection } from '../styles/experience'
import { BUTTON_CONTRACT, Button, ExperienceScope, TEXT_FIELD_CONTRACT, TextField } from './index'

afterEach(cleanup)
const AR: ExperienceSelection = { visual: 'quiet', context: 'saas', language: 'ar' }
const inScope = (ui: React.ReactNode, selection: ExperienceSelection = AR) => render(<ExperienceScope selection={selection}>{ui}</ExperienceScope>)

describe('Button', () => {
  test('AT-BT-01 an async press is pending until it settles: a double click calls onPress once', async () => {
    let resolve!: () => void
    const onPress = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    inScope(<Button onPress={onPress}>حفظ</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect((button as HTMLButtonElement).disabled).toBe(false) // stays focusable while pending
    expect(button.textContent).toContain('جارٍ التنفيذ')
    await act(async () => resolve())
    expect(button.hasAttribute('data-pending')).toBe(false)
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  test('AT-BT-05 under StrictMode (effects run twice) an async press still settles back to idle', async () => {
    const { StrictMode } = await import('react')
    let resolve!: () => void
    const onPress = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    render(<StrictMode><ExperienceScope selection={AR}><Button onPress={onPress}>حفظ</Button></ExperienceScope></StrictMode>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(button.hasAttribute('data-pending')).toBe(true)
    await act(async () => resolve())
    expect(button.hasAttribute('data-pending')).toBe(false)
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  test('AT-BT-02 disabled uses the native attribute and never calls onPress', () => {
    const onPress = vi.fn()
    inScope(<Button isDisabled onPress={onPress}>حذف</Button>)
    const button = screen.getByRole('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  test('AT-BT-03 Enter or Space on a pending button is swallowed (no second form submission)', () => {
    inScope(<Button isPending>تأكيد</Button>)
    const button = screen.getByRole('button')
    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      button.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    }
  })

  test('AT-BT-04 internal strings follow the experience language, not a prop', () => {
    inScope(<Button isPending>Save</Button>, { ...AR, language: 'en' })
    expect(screen.getByRole('button').textContent).toContain('Working')
  })
})

describe('TextField', () => {
  test('AT-TF-01 empty is null, never an empty string; controlled and uncontrolled share one contract', () => {
    const onValueChange = vi.fn()
    inScope(<TextField label="اسم العميل" defaultValue="أحمد" onValueChange={onValueChange} />)
    const input = screen.getByLabelText('اسم العميل') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    fireEvent.change(input, { target: { value: 'سارة' } })
    expect(onValueChange).toHaveBeenLastCalledWith('سارة')
    expect(input.value).toBe('سارة')
  })

  test('AT-TF-02 label, error and description are wired; invalid only with a reason', () => {
    inScope(<TextField label="البريد" description="نرسل عليه الفاتورة" error="أدخل بريدًا صحيحًا" isRequired />)
    const input = screen.getByLabelText(/البريد/) as HTMLInputElement
    const [first, second] = (input.getAttribute('aria-describedby') ?? '').split(' ')
    expect(document.getElementById(first!)?.textContent).toContain('أدخل بريدًا صحيحًا')
    expect(document.getElementById(second!)?.textContent).toBe('نرسل عليه الفاتورة')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.required).toBe(true)
    cleanup()
    inScope(<TextField label="البريد" description="نرسل عليه الفاتورة" />)
    expect(screen.getByLabelText('البريد').hasAttribute('aria-invalid')).toBe(false)
  })

  test('AT-TF-03 content direction: inherited by default, explicit for always-LTR data', () => {
    inScope(
      <>
        <TextField label="الاسم" />
        <TextField label="البريد" contentDirection="ltr" type="email" />
      </>,
    )
    expect(screen.getByLabelText('الاسم').hasAttribute('dir')).toBe(false)
    expect(screen.getByLabelText('البريد').getAttribute('dir')).toBe('ltr')
  })
})

/** Behavior-relevant DOM: elements, roles, ARIA, data-hz/slot/variant/state hooks. Not style, dir, lang or copy. */
function behaviorShape(root: Element): string {
  const walk = (el: Element): string => {
    const attrs = [...el.attributes]
      .filter((a) => /^(aria-|data-(hz|slot|intent|emphasis|size|pending|invalid|disabled|readonly)$|role$|type$|disabled$|required$|readonly$|tabindex$)/.test(a.name))
      .filter((a) => a.name !== 'data-hz-experience' && a.name !== 'data-hz-layers')
      .map((a) => `${a.name}=${/^(aria-describedby|aria-labelledby)$/.test(a.name) ? '#' : a.value}`)
      .sort()
    return `<${el.tagName.toLowerCase()} ${attrs.join(' ')}>${[...el.children].map(walk).join('')}</>`
  }
  return walk(root)
}

const Sample = () => (
  <form>
    <TextField label="L" defaultValue="v" description="d" isRequired />
    <TextField label="L" error="e" />
    <TextField label="L" isDisabled />
    <Button>A</Button>
    <Button intent="neutral" emphasis="outline" size="sm">B</Button>
    <Button intent="danger" emphasis="ghost" size="lg" isPending>C</Button>
    <Button isDisabled>D</Button>
  </form>
)

describe('invariants across experiences', () => {
  test('AT-INV-01 the same Button and TextField produce identical behavior DOM in all 18 compositions', () => {
    const shapes = new Set<string>()
    for (const selection of ALL_SELECTIONS) {
      const { container } = inScope(<Sample />, selection)
      shapes.add(behaviorShape(container.querySelector('form')!))
      cleanup()
    }
    expect(shapes.size).toBe(1)
  })

  test('AT-INV-02 the scope, not the component, carries direction, language, numerals and density', () => {
    const { container } = inScope(<Sample />, { visual: 'soft', context: 'pos', language: 'ar' })
    const scope = container.firstElementChild as HTMLElement
    expect([scope.dir, scope.lang, scope.dataset.numerals, scope.dataset.density]).toEqual(['rtl', 'ar-EG', 'arab', 'touch'])
    expect(container.querySelectorAll('[dir]').length).toBe(1)
    expect(scope.style.getPropertyValue('--hz-component-button-height-md')).toBe('52px')
  })
})

describe('contracts', () => {
  // Project-root relative: under jsdom import.meta.url does not point at this file.
  const css = (file: string) => fs.readFileSync(`src/atomic/styles/recipes/${file}`, 'utf8')

  test('AT-CT-01 every slot in a contract is styled by its recipe, and every variant value has a selector', () => {
    const button = css('button.css')
    for (const slot of BUTTON_CONTRACT.anatomy.filter((s) => s !== 'root')) expect(button, slot).toContain(`[data-slot='${slot}']`)
    for (const [name, values] of Object.entries(BUTTON_CONTRACT.variants)) {
      for (const value of values) if (!(name === 'intent' && value === 'primary') && !(name === 'size' && value === 'md') && !(name === 'emphasis' && value === 'ghost')) expect(button, `${name}=${value}`).toContain(`[data-${name}='${value}']`)
    }
    const field = css('field.css')
    for (const slot of TEXT_FIELD_CONTRACT.anatomy.filter((s) => s !== 'root')) expect(field, slot).toContain(`[data-slot='${slot}']`)
  })

  test('AT-CT-02 rendered slots are exactly the contract anatomy', () => {
    const { container } = inScope(
      <>
        <Button iconStart={<i />} iconEnd={<i />}>A</Button>
        <Button isPending>B</Button>
        <TextField label="L" isRequired description="d" error="e" />
      </>,
    )
    const slots = (sel: string) => new Set([...container.querySelectorAll(`${sel} [data-slot]`)].map((e) => e.getAttribute('data-slot')))
    expect([...slots("[data-hz='button']")].every((s) => BUTTON_CONTRACT.anatomy.includes(s!))).toBe(true)
    expect([...slots("[data-hz='field']")].sort()).toEqual(TEXT_FIELD_CONTRACT.anatomy.filter((s) => s !== 'root').sort())
  })
})
