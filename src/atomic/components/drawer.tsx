/**
 * F3 atom: Drawer — atomic.drawer@0.1.0. Contract: ./overlay-contracts.ts (DRAWER_CONTRACT).
 * A modal side panel with the exact focus / scroll / dismiss contract of Dialog (one modal core in ./dialog.tsx).
 * The side is logical: inline-end (default) is the left edge in RTL and the right edge in LTR — no dir prop.
 */
import { ModalOverlay, type ModalOverlayProps } from './dialog'

export type DrawerSide = 'inline-start' | 'inline-end' | 'block-end'

export interface DrawerProps extends ModalOverlayProps {
  side?: DrawerSide
}

export function Drawer({ side = 'inline-end', ...props }: DrawerProps) {
  return <ModalOverlay kind="drawer" variant={{ 'data-side': side }} {...props} />
}
