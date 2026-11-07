/** Direction-sensitive keyboard intents without React, DOM or events. */
export type Dir = 'ltr' | 'rtl'
export interface KeyInput { key: string; shift?: boolean; ctrl?: boolean; meta?: boolean; alt?: boolean }
export type ListMove = 'next' | 'prev' | 'first' | 'last' | 'pageNext' | 'pagePrev' | null

/** Translate physical arrow keys into logical navigation; RTL mirrors horizontal only. */
export function listKeyAction(e: KeyInput, o: { orientation: 'vertical' | 'horizontal'; dir: Dir }): ListMove {
  if (e.alt || e.ctrl || e.meta) return null
  switch (e.key) {
    case 'Home': return 'first'
    case 'End': return 'last'
    case 'PageDown': return 'pageNext'
    case 'PageUp': return 'pagePrev'
    case 'ArrowDown': return o.orientation === 'vertical' ? 'next' : null
    case 'ArrowUp': return o.orientation === 'vertical' ? 'prev' : null
    case 'ArrowRight': return o.orientation === 'horizontal' ? (o.dir === 'rtl' ? 'prev' : 'next') : null
    case 'ArrowLeft': return o.orientation === 'horizontal' ? (o.dir === 'rtl' ? 'next' : 'prev') : null
    default: return null
  }
}

export interface GridPos { row: number; col: number }

/**
 * Grid navigation coordinates are logical columns: column zero is the start
 * (rightmost in RTL). Row/column bounds are clamped; unsupported keys return null.
 */
export function gridKeyAction(e: KeyInput,
  o: { dir: Dir; rows: number; cols: number; pos: GridPos; pageSize: number }): GridPos | null {
  if (!Number.isSafeInteger(o.rows) ||¶»§q«^