import type { KeyboardEvent } from 'react'

export const moveControlFocus = (event: KeyboardEvent, container: Element) => {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
  )
    return
  const controls = Array.from(
    container.querySelectorAll<HTMLElement>('button:not(:disabled)'),
  )
  const target = (event.target as HTMLElement).closest('button')
  const index = controls.indexOf(target!)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? controls.length - 1
        : (index + (event.key === 'ArrowLeft' ? -1 : 1) + controls.length) %
          controls.length
  if (!controls[next]) return
  event.preventDefault()
  controls[next].focus({ preventScroll: true })
}
