// @vitest-environment jsdom
import fs from 'node:fs'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState, type ComponentType, type ReactNode } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { generateCssVariables, resolveTokens } from '../tokens'
import { ExperienceScope } from '../platform/react/experience'
import { ALL_SELECTIONS, BASE_LAYERS, BRAND, CONTEXTS, VISUAL_SYSTEMS, type ExperienceSelection } from '../styles/experience'
import { semanticLayer, primitiveLayer } from '../styles/tokens'
import { componentOverlayLayer } from '../styles/tokens-overlay'
import { layerCount, scrollLockCount } from '../behavior/overlay'
import { Button } from './button'
import { Dialog, type DialogProps } from './dialog'
import { Drawer, type DrawerProps } from './drawer'
import { DIALOG_CONTRACT, DRAWER_CONTRACT, POPOVER_CONTRACT, TOOLTIP_CONTRACT } from './overlay-contracts'
import { Popover } from './popover'
import { Tooltip } from './tooltip'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  document.body.removeAttribute('style')
})

const AR: ExperienceSelection = { visual: 'soft', context: 'pos', language: 'ar' }
const EN: ExperienceSelection = { visual: 'quiet', context: 'saas', language: 'en' }
const inScope = (ui: ReactNode, selection: ExperienceSelection = AR) => render(<ExperienceScope selection={selection}>{ui}</ExperienceScope>)
const key = (k: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  act(() => void (document.activeElement ?? document.body).dispatchEvent(event))
  return event
}
const pointerDown = (el: Element, pointerType = 'mouse') => act(() => void el.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true, cancelable: true }), { pointerType, button: 0 })))
const flush = () => act(async () => {})

function DialogHarness({ onReason, opener = 'فتح', children, as: As = Dialog, ...props }: Partial<DialogProps & DrawerProps> & { onReason?: (r: string) => void; opener?: string; as?: ComponentType<DialogProps & DrawerProps> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>{opener}</button>
      <As
        title="حذف الفاتورة"
        {...props}
        open={open}
        onOpenChange={(next, details) => {
          onReason?.(details.reason)
          setOpen(next)
        }}
      >
        {children ?? (
          <>
            <input aria-label="السبب" />
            <button>تأكيد</button>
          </>
        )}
      </As>
    </>
  )
}

const openWith = (name: string) => {
  const opener = screen.getByRole('button', { name })
  opener.focus()
  fireEvent.click(opener)
  return opener
}

// ---------------------------------------------------------------------------------------------------------------

describe('Popover', () => {
  test('PO-01 trigger ARIA; opens into a labelled non-modal dialog, portaled with the experience scope', () => {
    inScope(<Popover trigger={<button>تفاصيل</button>} title="الضريبة"><button>نسخ</button></Popover>)
    const trigger = screen.getByRole('button', { name: 'تفاصيل' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    trigger.focus()
    fireEvent.click(trigger)
    const panel = screen.getByRole('dialog', { name: 'الضريبة' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.hasAttribute('aria-modal')).toBe(false)
    expect(panel.getAttribute('data-state')).toBe('open')
    expect(document.activeElement?.textContent).toBe('نسخ')
    const wrapper = panel.closest<HTMLElement>('[data-hz-portal]')!
    expect(wrapper.parentElement).toBe(document.body)
    expect([wrapper.dir, wrapper.lang, wrapper.dataset.numerals, wrapper.dataset.density]).toEqual(['rtl', 'ar-EG', 'arab', 'touch'])
    expect(wrapper.style.getPropertyValue('--hz-component-button-height-md')).toBe('52px')
  })

  test('PO-02 Escape closes and returns focus to the trigger', () => {
    const onOpenChange = vi.fn()
    inScope(<Popover trigger={<button>تفاصيل</button>} aria-label="تفاصيل الضريبة" onOpenChange={onOpenChange}><button>نسخ</button></Popover>)
    openWith('تفاصيل')
    expect(screen.getByRole('dialog', { name: 'تفاصيل الضريبة' })).toBeTruthy()
    key('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
    expect(document.activeElement?.textContent).toBe('تفاصيل')
  })

  test('PO-03 outside press closes; pressing the trigger toggles instead of close-then-reopen', () => {
    inScope(
      <>
        <Popover trigger={<button>تفاصيل</button>} title="ت"><p>محتوى</p></Popover>
        <p>الصفحة</p>
      </>,
    )
    const trigger = openWith('تفاصيل')
    pointerDown(screen.getByText('محتوى'))
    expect(screen.queryByRole('dialog')).not.toBeNull()
    pointerDown(screen.getByText('الصفحة'))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(trigger)
    expect(screen.queryByRole('dialog')).not.toBeNull()
    pointerDown(trigger)
    fireEvent.click(trigger)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(layerCount()).toBe(0)
  })

  test('PO-04 non-modal: no scroll lock or inert; Tab past the edges closes and continues in document order', () => {
    inScope(
      <>
        <Popover trigger={<button>تفاصيل</button>} title="ت"><button>أ</button><button>ب</button></Popover>
        <button>التالي</button>
      </>,
    )
    openWith('تفاصيل')
    expect(scrollLockCount()).toBe(0)
    expect(document.querySelectorAll('[inert]').length).toBe(0)
    screen.getByRole('button', { name: 'ب' }).focus()
    expect(key('Tab').defaultPrevented).toBe(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement?.textContent).toBe('التالي')
    openWith('تفاصيل')
    expect(document.activeElement?.textContent).toBe('أ')
    key('Tab', { shiftKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement?.textContent).toBe('تفاصيل')
  })

  test('PO-05 works with the atomic Button as trigger (its press still fires) and in controlled mode', () => {
    const onPress = vi.fn()
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <span data-testid="state">{String(open)}</span>
          <Popover open={open} onOpenChange={setOpen} trigger={<Button onPress={onPress}>خيارات</Button>} title="خيارات">
            <p>x</p>
          </Popover>
        </>
      )
    }
    inScope(<Controlled />)
    const trigger = screen.getByRole('button', { name: 'خيارات' })
    expect(trigger.getAttribute('data-hz')).toBe('button')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(trigger)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('state').textContent).toBe('false')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('Tooltip', () => {
  test('TT-01 hover shows after the delay with role tooltip + aria-describedby; leaving hides after closeDelay', () => {
    vi.useFakeTimers()
    inScope(<Tooltip content="حفظ المسودة" delay={400}><button>حفظ</button></Tooltip>)
    const trigger = screen.getByRole('button', { name: 'حفظ' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => void vi.advanceTimersByTime(400))
    const tip = screen.getByRole('tooltip')
    expect(tip.textContent).toBe('حفظ المسودة')
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id)
    expect(tip.closest('[data-hz-portal]')?.getAttribute('dir')).toBe('rtl')
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    act(() => void vi.advanceTimersByTime(100))
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(trigger.hasAttribute('aria-describedby')).toBe(false)
  })

  test('TT-02 keyboard focus shows immediately; blur hides; Escape hides the tooltip only, not the dialog beneath', async () => {
    inScope(<DialogHarness><Tooltip content="يحذف نهائيًا"><button>حذف</button></Tooltip></DialogHarness>)
    openWith('فتح')
    const trigger = screen.getByRole('button', { name: 'حذف' })
    act(() => trigger.focus())
    expect(screen.getByRole('tooltip').textContent).toBe('يحذف نهائيًا')
    key('Escape')
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeNull()
    act(() => trigger.blur())
    act(() => trigger.focus())
    expect(screen.queryByRole('tooltip')).not.toBeNull()
    act(() => trigger.blur())
    expect(screen.queryByRole('tooltip')).toBeNull()
    key('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    await flush()
  })

  test('TT-03 touch: no hover dependence; a press then focus does not show it', () => {
    vi.useFakeTimers()
    inScope(<Tooltip content="معلومة"><button>زر</button></Tooltip>)
    const trigger = screen.getByRole('button', { name: 'زر' })
    fireEvent.pointerEnter(trigger, { pointerType: 'touch' })
    act(() => void vi.advanceTimersByTime(2000))
    expect(screen.queryByRole('tooltip')).toBeNull()
    pointerDown(trigger, 'touch')
    act(() => trigger.focus())
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('TT-04 interactive content is rejected in development (warning); the tooltip is never focusable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    inScope(<Tooltip content={<a href="#x">رابط</a>} defaultOpen><button>زر</button></Tooltip>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('must not be interactive'))
    expect(screen.getByRole('tooltip').hasAttribute('tabindex')).toBe(false)
    warn.mockRestore()
  })
})

describe('Dialog', () => {
  test('DL-01 modal dialog semantics; labelled and described; portaled carrying dir, lang, numerals, density, motion and tokens', () => {
    inScope(<DialogHarness description="لا يمكن التراجع" />)
    openWith('فتح')
    const dialog = screen.getByRole('dialog', { name: 'حذف الفاتورة' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe('لا يمكن التراجع')
    const wrapper = dialog.closest<HTMLElement>('[data-hz-portal]')!
    expect(wrapper.parentElement).toBe(document.body)
    expect([wrapper.dir, wrapper.lang, wrapper.dataset.numerals, wrapper.dataset.density, wrapper.dataset.motion]).toEqual(['rtl', 'ar-EG', 'arab', 'touch', 'full'])
    expect(wrapper.getAttribute('data-hz-experience')).toBe('soft · pos-touch · ar-EG')
    expect(wrapper.style.getPropertyValue('--hz-component-button-height-md')).toBe('52px')
    expect(screen.getByRole('button', { name: 'إغلاق' }).getAttribute('data-slot')).toBe('close')
  })

  test('DL-02 focus enters the body (not the close button) and Tab / Shift+Tab are trapped', async () => {
    inScope(<DialogHarness />)
    openWith('فتح')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('السبب')
    screen.getByRole('button', { name: 'تأكيد' }).focus()
    expect(key('Tab').defaultPrevented).toBe(true)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('إغلاق')
    key('Tab', { shiftKey: true })
    expect(document.activeElement?.textContent).toBe('تأكيد')
    await flush()
  })

  test('DL-03 Escape, backdrop and the close button close it with their reasons; dismissible=false blocks all three', async () => {
    const reasons: string[] = []
    const { unmount } = inScope(<DialogHarness onReason={(r) => reasons.push(r)} />)
    openWith('فتح')
    key('Escape')
    openWith('فتح')
    pointerDown(document.querySelector("[data-hz='dialog'] [data-slot='backdrop']")!)
    openWith('فتح')
    fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }))
    expect(reasons).toEqual(['escape', 'outside', 'close-button'])
    expect(screen.queryByRole('dialog')).toBeNull()
    await flush()
    unmount()

    inScope(<DialogHarness dismissible={false} onReason={(r) => reasons.push(r)} />)
    openWith('فتح')
    key('Escape')
    pointerDown(document.querySelector("[data-hz='dialog'] [data-slot='backdrop']")!)
    expect((screen.getByRole('button', { name: 'إغلاق' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeNull()
    expect(reasons).toHaveLength(3)
  })

  test('DL-04 focus returns to the opener on close', async () => {
    inScope(<DialogHarness />)
    const opener = openWith('فتح')
    key('Escape')
    await flush()
    expect(document.activeElement).toBe(opener)
  })

  test('DL-05 scroll lock and inert outside while open; both restored on close', async () => {
    const { container } = inScope(<DialogHarness />)
    openWith('فتح')
    expect(scrollLockCount()).toBe(1)
    expect(document.body.style.overflow).toBe('hidden')
    expect(container.hasAttribute('inert')).toBe(true)
    key('Escape')
    await flush()
    expect(scrollLockCount()).toBe(0)
    expect(document.body.style.overflow).toBe('')
    expect(container.hasAttribute('inert')).toBe(false)
  })

  test('DL-06 nested dialogs: Escape closes only the top one; focus and scope return to the outer one', async () => {
    inScope(
      <DialogHarness opener="الخارجي" title="الخارجي">
        <DialogHarness opener="الداخلي" title="الداخلي" />
      </DialogHarness>,
    )
    openWith('الخارجي')
    const inner = openWith('الداخلي')
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(2)
    expect(scrollLockCount()).toBe(2)
    const innerDialog = document.querySelectorAll<HTMLElement>("[data-slot='panel']")[1]!
    expect(innerDialog.closest('[data-hz-portal]')?.getAttribute('dir')).toBe('rtl') // scope carried through two portals
    expect(innerDialog.closest('[data-hz-portal]')?.getAttribute('style')).toContain('--hz-component-button-height-md: 52px')
    expect(screen.getByText('الخارجي', { selector: 'h2' }).closest('[data-hz-portal]')?.hasAttribute('inert')).toBe(true)
    key('Escape')
    await flush()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.activeElement).toBe(inner)
    expect(scrollLockCount()).toBe(1)
    key('Escape')
    await flush()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(scrollLockCount()).toBe(0)
  })

  test('DL-07 internal strings follow the experience language; labels override them', () => {
    inScope(<DialogHarness opener="open" title="Delete" />, EN)
    openWith('open')
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    cleanup()
    inScope(<DialogHarness opener="open" labels={{ close: 'إغلاق النافذة' }} />)
    openWith('open')
    expect(screen.getByRole('button', { name: 'إغلاق النافذة' })).toBeTruthy()
  })
})

test('DL-08 under StrictMode (effects run twice) the stack, lock and focus settle to exactly one dialog and back', async () => {
  const { StrictMode } = await import('react')
  render(<StrictMode><ExperienceScope selection={AR}><DialogHarness /></ExperienceScope></StrictMode>)
  const opener = openWith('فتح')
  expect(layerCount()).toBe(1)
  expect(scrollLockCount()).toBe(1)
  expect(document.activeElement?.getAttribute('aria-label')).toBe('السبب')
  key('Escape')
  await flush()
  expect(layerCount()).toBe(0)
  expect(scrollLockCount()).toBe(0)
  expect(document.activeElement).toBe(opener)
})

describe('Drawer', () => {
  test('DR-01 defaults to the inline-end side, as a modal dialog carrying the RTL scope', () => {
    inScope(<DialogHarness as={Drawer} title="الفلاتر" />)
    openWith('فتح')
    const panel = screen.getByRole('dialog', { name: 'الفلاتر' })
    const root = panel.closest<HTMLElement>("[data-hz='drawer']")!
    expect(root.dataset.side).toBe('inline-end')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(root.closest('[data-hz-portal]')?.getAttribute('dir')).toBe('rtl')
  })

  test('DR-02 same focus / scroll / dismiss contract as Dialog', async () => {
    const reasons: string[] = []
    inScope(<DialogHarness as={Drawer} onReason={(r) => reasons.push(r)} />)
    const opener = openWith('فتح')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('السبب')
    expect(scrollLockCount()).toBe(1)
    screen.getByRole('button', { name: 'تأكيد' }).focus()
    key('Tab')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('إغلاق')
    pointerDown(document.querySelector("[data-hz='drawer'] [data-slot='backdrop']")!)
    await flush()
    expect(reasons).toEqual(['outside'])
    expect(scrollLockCount()).toBe(0)
    expect(document.activeElement).toBe(opener)
  })

  test('DR-03 side prop: inline-start and block-end', () => {
    inScope(
      <>
        <DialogHarness as={Drawer} opener="a" side="inline-start" />
      </>,
    )
    openWith('a')
    expect(document.querySelector("[data-hz='drawer']")?.getAttribute('data-side')).toBe('inline-start')
    cleanup()
    inScope(<DialogHarness as={Drawer} opener="b" side="block-end" />, EN)
    openWith('b')
    expect(document.querySelector("[data-hz='drawer']")?.getAttribute('data-side')).toBe('block-end')
    expect(document.querySelector('[data-hz-portal]')?.getAttribute('dir')).toBe('ltr')
  })
})

// ---------------------------------------------------------------------------------------------------------------

/** Behavior-relevant DOM (as AT-INV-01): elements, roles, ARIA, data-hz/slot/state/variant hooks. Not style, dir, lang or copy. */
function behaviorShape(root: Element): string {
  const walk = (el: Element): string => {
    const attrs = [...el.attributes]
      .filter((a) => /^(aria-|data-(hz|slot|state|size|side|placement|positioned)$|role$|type$|disabled$|tabindex$|hidden$)/.test(a.name))
      // ids are generated; aria-label is copy (it follows the language, like text content) — presence is what counts.
      .map((a) => `${a.name}=${/^(aria-describedby|aria-labelledby|aria-controls)$/.test(a.name) ? '#' : a.name === 'aria-label' ? '$' : a.value}`)
      .sort()
    return `<${el.tagName.toLowerCase()} ${attrs.join(' ')}>${[...el.children].map(walk).join('')}</>`
  }
  return walk(root)
}

describe('invariants across experiences', () => {
  test('OV-INV-01 an open Dialog and Popover produce identical behavior DOM in all 18 compositions', () => {
    const shapes = new Set<string>()
    for (const selection of ALL_SELECTIONS) {
      const { container } = inScope(
        <>
          <Popover defaultOpen trigger={<button>T</button>} title="P"><button>x</button></Popover>
          <Dialog open onOpenChange={() => {}} title="D" description="d" footer={<button>ok</button>}><input aria-label="i" /></Dialog>
        </>,
        selection,
      )
      const portals = [...document.body.querySelectorAll(':scope > [data-hz-portal]')]
      expect(portals).toHaveLength(2)
      shapes.add([behaviorShape(container.firstElementChild!), ...portals.map(behaviorShape)].join('\n'))
      cleanup()
    }
    expect(shapes.size).toBe(1)
  })
})

describe('tokens and contracts', () => {
  const css = fs.readFileSync('src/atomic/styles/recipes/overlay.css', 'utf8')
  const used = [...new Set([...css.matchAll(/var\((--hz-[a-z0-9-]+)/g)].map((m) => m[1]!))].sort()

  test('OV-ST-01 overlay.css reads only overlay component tokens, and each resolves for every visual system × context', () => {
    expect(used.length).toBeGreaterThan(40)
    expect(used.filter((v) => !/^--hz-component-(popover|tooltip|dialog|drawer)-/.test(v))).toEqual([])
    for (const visual of Object.values(VISUAL_SYSTEMS)) {
      for (const context of Object.values(CONTEXTS)) {
        const resolution = resolveTokens([...BASE_LAYERS.filter((l) => l.id !== componentOverlayLayer.id), componentOverlayLayer, BRAND.layer, visual.layer, context.layer])
        expect(resolution.issues, `${visual.layer.id} × ${context.layer.id}`).toEqual([])
        const vars = generateCssVariables(resolution).variables
        expect(used.filter((v) => !(v in vars)), `${visual.layer.id} × ${context.layer.id}`).toEqual([])
      }
    }
  })

  test('OV-ST-02 overlay component tokens are pure aliases of semantic tokens (visual systems change them only through semantics)', () => {
    const semantic = new Set(semanticLayer.tokens.map((t) => t.path))
    const primitive = new Set(primitiveLayer.tokens.map((t) => t.path))
    for (const token of componentOverlayLayer.tokens) {
      expect(token.overridableBy, token.path).toEqual([])
      const target = (token.value as { $ref?: string }).$ref
      expect(target && semantic.has(target) ? 'semantic' : target && primitive.has(target) ? 'primitive' : 'literal', token.path).toBe(token.path.endsWith('disabled-opacity') || token.path.endsWith('transition-duration') || token.path.endsWith('transition-easing') ? 'primitive' : 'semantic')
    }
    const soft = resolveTokens([...BASE_LAYERS.filter((l) => l.id !== componentOverlayLayer.id), componentOverlayLayer, BRAND.layer, VISUAL_SYSTEMS.soft.layer, CONTEXTS.saas.layer])
    const editorial = resolveTokens([...BASE_LAYERS.filter((l) => l.id !== componentOverlayLayer.id), componentOverlayLayer, BRAND.layer, VISUAL_SYSTEMS.editorial.layer, CONTEXTS.saas.layer])
    expect(soft.tokens['component.dialog.font-family']?.value).not.toEqual(editorial.tokens['component.dialog.font-family']?.value)
  })

  test('OV-CT-01 every contract slot is styled by overlay.css and every variant value has a selector', () => {
    for (const contract of [POPOVER_CONTRACT, DIALOG_CONTRACT, DRAWER_CONTRACT]) {
      for (const slot of contract.anatomy.filter((s) => s !== 'root')) expect(css, `${contract.id} ${slot}`).toContain(`[data-slot='${slot}']`)
    }
    for (const size of ['sm', 'lg']) expect(css).toContain(`[data-size='${size}']`)
    for (const side of DRAWER_CONTRACT.variants.side!) expect(css).toContain(`[data-side='${side}']`)
    expect(css).toContain("[data-hz='tooltip']")
    expect(TOOLTIP_CONTRACT.anatomy).toEqual(['root', 'trigger'])
  })

  test('OV-CT-02 rendered slots are within the contract anatomy', () => {
    inScope(
      <>
        <Popover defaultOpen trigger={<button>T</button>} title="P"><p>x</p></Popover>
        <Dialog open onOpenChange={() => {}} title="D" description="d" footer={<button>ok</button>}><p>b</p></Dialog>
      </>,
    )
    const slots = (sel: string) => [...document.querySelectorAll(`${sel} [data-slot]`)].map((e) => e.getAttribute('data-slot')!)
    expect(slots("[data-hz='popover']").every((s) => POPOVER_CONTRACT.anatomy.includes(s))).toBe(true)
    expect(document.querySelector("[data-hz-anchor='popover']")?.getAttribute('data-slot')).toBe('trigger')
    expect([...new Set(slots("[data-hz='dialog']"))].sort()).toEqual(DIALOG_CONTRACT.anatomy.filter((s) => s !== 'root').sort())
  })
})
