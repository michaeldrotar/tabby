import { willTransferCloseAnyWindow } from '@extension/core/commands'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSurfaceInputOwner } from '../../Surface'
import { toTabManagerSnapshot } from '../tabManagerSnapshot'
import type { TabManagerViewModel } from '../TabManager'
import type { RefObject } from 'react'

export const useShiftHeld = (
  root: RefObject<HTMLElement | null>,
  ready: boolean,
) => {
  const [held, setHeld] = useState(false)
  const { canFocusInput } = useSurfaceInputOwner()
  useEffect(() => {
    if (!ready) return
    const document = root.current?.ownerDocument
    const window = document?.defaultView
    if (!document || !window) return
    const update = (event: KeyboardEvent | PointerEvent | DragEvent) =>
      setHeld(canFocusInput() && event.shiftKey)
    const clear = () => setHeld(false)
    window.addEventListener('keydown', update, true)
    window.addEventListener('keyup', update, true)
    document.addEventListener('pointermove', update, true)
    document.addEventListener('dragover', update, true)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', update, true)
      window.removeEventListener('keyup', update, true)
      document.removeEventListener('pointermove', update, true)
      document.removeEventListener('dragover', update, true)
      window.removeEventListener('blur', clear)
    }
  }, [root, canFocusInput, ready])
  return held
}

export const isCrossWindowMove = (
  model: TabManagerViewModel,
  windowId: number | undefined,
  tabIds: readonly number[] = model.selectedTabIds,
) =>
  model.windows.some(
    (window) =>
      window.id !== windowId &&
      window.tabs.some((tab) => tabIds.includes(tab.id)),
  )

export const followsMoveWithShift = (
  model: TabManagerViewModel,
  windowId: number | undefined,
  tabIds: readonly number[] = model.selectedTabIds,
) => {
  return (
    model.windowClickBehavior !== 'switch' ||
    willTransferCloseAnyWindow(
      { type: 'move-tabs', tabIds, windowId },
      toTabManagerSnapshot(model.windows),
    )
  )
}

export const WindowFocusIndicator = ({ follow }: { follow: boolean }) => {
  const Icon = follow ? ArrowUpRight : ArrowDownLeft
  return (
    <span
      role="img"
      aria-label={follow ? 'Switch windows' : 'Stay in this window'}
      data-window-modifier-action={follow ? 'switch' : 'stay'}
      className="inline-flex shrink-0 items-center text-muted"
    >
      <Icon size={16} aria-hidden="true" />
    </span>
  )
}
