import { useEffect, useRef, useState } from 'react'
import { useSurface, useSurfaceInputOwner } from '../Surface'

/** Local input behavior only; hosts supply persistence through controlled props. */
export const useOmnibarQuery = (
  inputRef: React.RefObject<HTMLInputElement | null>,
  initialQuery = '',
  autofocus = true,
) => {
  const [query, setQuery] = useState(initialQuery)
  const hasFocusedInitialInput = useRef(false)
  const surface = useSurface()
  const { canFocusInput } = useSurfaceInputOwner()

  useEffect(() => {
    if (
      !autofocus ||
      hasFocusedInitialInput.current ||
      (surface && (surface.inputMode !== 'live' || !surface.root)) ||
      !inputRef.current
    )
      return
    hasFocusedInitialInput.current = true
    if (!canFocusInput()) return
    inputRef.current?.focus()
    if (initialQuery) inputRef.current?.select()
  }, [autofocus, initialQuery, inputRef, surface, canFocusInput])

  return { query, setQuery }
}
