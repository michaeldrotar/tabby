import { useLayoutEffect } from 'react'

export const usePageAnchor = (enabled = true) => {
  useLayoutEffect(() => {
    if (!enabled) return
    let targetId: string
    try {
      targetId = decodeURIComponent(location.hash.slice(1))
    } catch {
      return
    }
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant' })
  }, [enabled])
}
