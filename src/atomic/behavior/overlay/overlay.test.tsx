// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'
import { activateFocusScope, focusScopeDepth, getTabbables, layerCount, lockScroll, pushLayer, readExperienceScope, scrollLockCount } from './index'

function mount(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)
  return host
}

const tab = (shift = false) => {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true })
  ;(document.activeElement ?? document.body).dispatchEvent(event)
  return event
}
const escape = () => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  ;(document.activeElement ?? document.body).dispatchEvent(event)
  return event
}
const pointerDown = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }))

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
})

describe('focus scope', () => {
  test('OV-10 initial focus goes to the first tabbable; Tab and Shift+Tab wrap inside a contained scope', () => {
    const host = mount('<button id="out">out</button><div id="scope"><button id="a">a</button><input id="b" disabled><a id="c" href="#">c</a><span tabindex="-1" id="d"></span></div>')
    document.getElementById('out')!.focus()
    const handle = activateFocusScope(host.querySelector('#scope')!, { contain: true })
    expect(document.activeElement?.id).toBe('a')
    expect(getTabbables(host.querySelector('#scope')!).map((e) => e.id)).toEqual(['a', 'c'])
    expect(tab(true).defaultPrevented).toBe(true)
    expect(document.activeElement?.id).toBe('c')
    expect(tab().defaultPrevented).toBe(true)
    expect(document.activeElement?.id).toBe('a')
    handle.release()
    expect(document.activeElement?.id).toBe('out')
  })

  test('OV-11 initial focus options: explicit element, then [data-autofocus], then the container itself', () => {
    const host = mount('<div id="s1"><button>x</button><button id="auto" data-autofocus>y</button></div><div id="s2"><p>no tabbables</p></div>')
    const h1 = activateFocusScope(host.querySelector('#s1')!, {})
    expect(document.activeElement?.id).toBe('auto')
    h1.release(false)
    const s2 = host.querySelector<HTMLElement>('#s2')!
    const h2 = activateFocusScope(s2, { contain: true })
    expect(document.activeElement).toBe(s2)
    expect(s2.tabIndex).toBe(-1)
    expect(tab().defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(s2)
    h2.release(false)
    const target = host.querySelector<HTMLElement>('#s1 button')!
    const h3 = activateFocusScope(host.querySelector('#s1')!, { initialFocus: () => target })
    expect(document.activeElement).toBe(target)
    h3.release(false)
  })

  test('OV-12 nested scopes: only the top one traps; releasing it resumes the lower one and restores focus', () => {
    const host = mount('<button id="opener">o</button><div id="outer"><button id="o1">1</button><button id="o2">2</button></div><div id="inner"><button id="i1">i</button></div>')
    document.getElementById('opener')!.focus()
    const outer = activateFocusScope(host.querySelector('#outer')!, { contain: true })
    document.getElementById('o2')!.focus()
    const inner = activateFocusScope(host.querySelector('#inner')!, { contain: true })
    expect(focusScopeDepth()).toBe(2)
    expect(document.activeElement?.id).toBe('i1')
    tab()
    expect(document.activeElement?.id).toBe('i1') // wraps inside the inner scope
    // Focus escaping the top scope is brought back.
    document.getElementById('o1')!.focus()
    expect(document.activeElement?.id).toBe('i1')
    inner.release()
    expect(document.activeElement?.id).toBe('o2')
    expect(inner.isTop()).toBe(false)
    expect(outer.isTop()).toBe(true)
    outer.release()
    expect(document.activeElement?.id).toBe('opener')
    expect(focusScopeDepth()).toBe(0)
  })

  test('OV-13 restore never steals focus the user moved elsewhere; falls back to returnFocus when the opener is gone', () => {
    const host = mount('<button id="opener">o</button><button id="elsewhere">e</button><div id="s"><button>in</button></div><button id="fallback">f</button>')
    document.getElementById('opener')!.focus()
    const h = activateFocusScope(host.querySelector('#s')!, { contain: false })
    document.getElementById('elsewhere')!.focus()
    h.release()
    expect(document.activeElement?.id).toBe('elsewhere')

    document.getElementById('opener')!.focus()
    const h2 = activateFocusScope(host.querySelector('#s')!, { returnFocus: () => document.getElementById('fallback') })
    document.getElementById('opener')!.remove()
    h2.release()
    expect(document.activeElement?.id).toBe('fallback')
  })
})

describe('layer stack', () => {
  test('OV-20 Escape dismisses only the top layer, and is consumed even when the top is not dismissible', () => {
    const host = mount('<div id="l1"></div><div id="l2"></div>')
    const e1 = vi.fn()
    const e2 = vi.fn()
    const l1 = pushLayer({ element: () => host.querySelector('#l1'), onEscape: e1 })
    const l2 = pushLayer({ element: () => host.querySelector('#l2'), onEscape: e2 })
    expect(escape().defaultPrevented).toBe(true)
    expect(e2).toHaveBeenCalledTimes(1)
    expect(e1).not.toHaveBeenCalled()
    l2.remove()
    escape()
    expect(e1).toHaveBeenCalledTimes(1)
    l1.remove()
    expect(layerCount()).toBe(0)
    expect(escape().defaultPrevented).toBe(false)
  })

  test('OV-21 an Escape handled by a descendant (defaultPrevented) never reaches the layer', () => {
    const host = mount('<div id="l"><input id="i"></div>')
    const onEscape = vi.fn()
    const l = pushLayer({ element: () => host.querySelector('#l'), onEscape })
    const input = host.querySelector('#i')!
    input.addEventListener('keydown', (e) => e.preventDefault())
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    expect(onEscape).not.toHaveBeenCalled()
    l.remove()
  })

  test('OV-22 outside press dismisses only the top layer; inside and ignored elements are not outside; transient layers pass it down', () => {
    const host = mount('<button id="trigger"></button><div id="l1"><span id="in1"></span></div><div id="l2"><span id="in2"></span></div><div id="tip"></div><p id="page"></p>')
    const o1 = vi.fn()
    const o2 = vi.fn()
    const ot = vi.fn()
    const l1 = pushLayer({ element: () => host.querySelector('#l1'), onOutsidePress: o1 })
    const l2 = pushLayer({ element: () => host.querySelector('#l2'), ignore: () => [host.querySelector('#trigger')], onOutsidePress: o2 })
    pointerDown(host.querySelector('#in2')!)
    pointerDown(host.querySelector('#trigger')!)
    expect(o2).not.toHaveBeenCalled()
    pointerDown(host.querySelector('#in1')!) // inside the lower layer, outside the top one
    expect(o2).toHaveBeenCalledTimes(1)
    expect(o1).not.toHaveBeenCalled()
    const tip = pushLayer({ transient: true, element: () => host.querySelector('#tip'), onOutsidePress: ot })
    pointerDown(host.querySelector('#page')!)
    expect(ot).toHaveBeenCalledTimes(1)
    expect(o2).toHaveBeenCalledTimes(2) // passed through the transient tooltip
    expect(o1).not.toHaveBeenCalled()
    tip.remove()
    l2.remove()
    l1.remove()
  })

  test('OV-23 scroll lock is counted across nested modal layers and restores the exact previous styles', () => {
    document.body.style.setProperty('overflow', 'scroll')
    document.body.style.setProperty('padding-inline-end', '3px')
    const m1 = pushLayer({ modal: true, element: () => null })
    const m2 = pushLayer({ modal: true, element: () => null })
    const popover = pushLayer({ element: () => null })
    expect(scrollLockCount()).toBe(2)
    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden')
    m2.remove()
    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden')
    popover.remove()
    m1.remove()
    expect(scrollLockCount()).toBe(0)
    expect(document.body.style.getPropertyValue('overflow')).toBe('scroll')
    expect(document.body.style.getPropertyValue('padding-inline-end')).toBe('3px')
    const unlock = lockScroll()
    unlock()
    unlock() // idempotent
    expect(scrollLockCount()).toBe(0)
  })

  test('OV-24 scrollbar width is compensated with padding-inline-end while locked', () => {
    const inner = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const client = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1009)
    const unlock = lockScroll()
    expect(document.body.style.getPropertyValue('padding-inline-end')).toBe('15px')
    unlock()
    expect(document.body.style.getPropertyValue('padding-inline-end')).toBe('')
    inner.mockRestore()
    client.mockRestore()
  })

  test('OV-25 a modal layer makes everything outside it (and the layers above it) inert, and undoes only its own inert', () => {
    const app = mount('<button id="opener"></button>')
    const foreign = mount('')
    foreign.setAttribute('inert', '')
    const d1 = mount('<div id="d1"></div>')
    const m1 = pushLayer({ modal: true, element: () => d1.firstElementChild })
    expect(app.hasAttribute('inert')).toBe(true)
    expect(d1.hasAttribute('inert')).toBe(false)
    const d2 = mount('<div id="d2"></div>')
    const m2 = pushLayer({ modal: true, element: () => d2.firstElementChild })
    const pop = mount('<div id="pop"></div>')
    const p = pushLayer({ element: () => pop.firstElementChild })
    expect(d1.hasAttribute('inert')).toBe(true)
    expect(d2.hasAttribute('inert')).toBe(false)
    expect(pop.hasAttribute('inert')).toBe(false)
    p.remove()
    m2.remove()
    expect(d1.hasAttribute('inert')).toBe(false)
    m1.remove()
    expect(app.hasAttribute('inert')).toBe(false)
    expect(foreign.hasAttribute('inert')).toBe(true)
  })

  test('OV-26 readExperienceScope copies scope attributes and CSS variables from the nearest scope', () => {
    const host = mount('<div data-hz-experience="soft" dir="rtl" lang="ar-EG" data-numerals="arab" data-density="touch" data-motion="full" style="--hz-component-dialog-radius: 14px; color: red"><span id="point"></span></div>')
    const snap = readExperienceScope(host.querySelector('#point'))
    expect(snap?.attributes).toEqual({ dir: 'rtl', lang: 'ar-EG', 'data-numerals': 'arab', 'data-density': 'touch', 'data-motion': 'full', 'data-hz-experience': 'soft' })
    expect(snap?.variables).toEqual({ '--hz-component-dialog-radius': '14px' })
    expect(readExperienceScope(document.body)).toBeNull()
  })
})
