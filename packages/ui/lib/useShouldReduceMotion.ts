import { useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useState } from 'react'
import { useSurface } from './Surface'
import type { RefObject } from 'react'

const DATA_ATTR_NAME = 'data-force-reduced-motion'

/**
 * Resolves whether to reduce motion from system preference and/or DOM override.
 *
 * - Uses framer-motion's `useReducedMotion()` (respects `prefers-reduced-motion`).
 * - If `ref` is provided, checks the element and ancestors for
 *   `data-force-reduced-motion`. The **closest** ancestor with the attribute wins.
 *
 * Attribute handling:
 * - No value (`data-force-reduced-motion` or `=""`) → force reduce (true).
 * - `"true"` → force reduce.
 * - `"false"` → force off (don't reduce).
 * - Any other value → invalid, ignored (no override).
 *
 * Precedence: DOM override (closest ancestor) overrides system preference. If
 * there is no override, returns the system preference. If framer-motion returns
 * `null` (SSR / before media query init) and there is no DOM override, returns
 * `null` so callers can optionally delay motion-dependent UI.
 *
 * @param ref - Optional ref to the component root. Used to check ancestors for
 *   `data-force-reduced-motion`.
 * @returns `true` reduce motion, `false` don't reduce, `null` unknown (not yet resolved).
 */
export const useShouldReduceMotion = (
  ref?: RefObject<Element | null> | null,
): boolean | null => {
  const preferred = useReducedMotion()
  const surface = useSurface()
  const [domForce, setDomForce] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    const el = ref?.current ?? null
    const attrElement = el?.closest(`[${DATA_ATTR_NAME}]`) ?? null
    if (!attrElement) {
      queueMicrotask(() => setDomForce(null))
      return
    }
    const raw = attrElement.getAttribute(DATA_ATTR_NAME)
    let force: boolean | null = null
    if (raw === '' || raw === 'true') {
      force = true
    } else if (raw === 'false') {
      force = false
    }
    queueMicrotask(() => setDomForce(force))
  }, [ref])

  if (surface?.inputMode === 'static' || surface?.motion === 'reduced')
    return true
  if (surface?.motion === 'full') return false
  return domForce !== null ? domForce : preferred
}

/** Settled demo frames render their target state without timed visual interpolation. */
export const useShouldSettleMotion = (): boolean => {
  const surface = useSurface()
  return (
    surface?.inputMode === 'static' ||
    (surface?.inputMode === 'scripted' && surface.motion === 'reduced')
  )
}
