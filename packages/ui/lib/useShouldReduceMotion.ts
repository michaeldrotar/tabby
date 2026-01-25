import { useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

const DATA_ATTR = '[data-force-reduced-motion="true"]'

/**
 * Resolves whether to reduce motion from system preference and/or DOM override.
 *
 * - Uses framer-motion's `useReducedMotion()` (respects `prefers-reduced-motion`).
 * - If `ref` is provided, also returns `true` when the element or any ancestor
 *   has `data-force-reduced-motion="true"` (e.g. for Storybook demos).
 *
 * Precedence: either source saying "reduce" yields `true`. If framer-motion
 * returns `null` (SSR / before media query init) and there is no DOM override,
 * returns `null` so callers can optionally delay motion-dependent UI.
 *
 * @param ref - Optional ref to the component root. Used to check ancestors for
 *   `data-force-reduced-motion="true"`.
 * @returns `true` reduce motion, `false` don't reduce, `null` unknown (not yet resolved).
 */
export const useShouldReduceMotion = (
  ref?: RefObject<Element | null> | null,
): boolean | null => {
  const preferred = useReducedMotion()
  const [domForce, setDomForce] = useState(false)

  useLayoutEffect(() => {
    const el = ref?.current ?? null
    const next = el ? !!el.closest(DATA_ATTR) : false
    queueMicrotask(() => setDomForce(next))
  }, [ref])

  return preferred || domForce ? true : preferred
}
