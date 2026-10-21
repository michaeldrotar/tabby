import { scanThemeCombinations } from '@extension/ui/theme-audit/measure'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ThemeReport } from '@extension/ui/theme-audit/measure'

type Audit = {
  report: ThemeReport | null
  progress: number | null
  durationMs: number | null
  error: string | null
}
const emptyAudit: Audit = {
  report: null,
  progress: 0,
  durationMs: null,
  error: null,
}
const isStylesheet = (node: Node): boolean =>
  node instanceof Element &&
  (node.matches('style, link[rel="stylesheet"]') ||
    !!node.querySelector('style, link[rel="stylesheet"]'))

export const useThemeAudit = () => {
  const scanner = useRef<HTMLDivElement>(null)
  const commands = useRef({ refresh: () => {}, cancel: () => {} })
  const [audit, setAudit] = useState<Audit>(emptyAudit)
  useEffect(() => {
    const surface =
      scanner.current?.querySelector<HTMLElement>('[data-surface]')
    if (!surface) return
    let disposed = false
    let active: AbortController | null = null
    let restart = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const run = async () => {
      if (disposed) return
      if (active) {
        restart = true
        active.abort()
        setAudit((previous) => ({ ...previous, progress: 0, error: null }))
        return
      }
      const controller = new AbortController()
      active = controller
      const started = performance.now()
      setAudit((previous) => ({ ...previous, progress: 0, error: null }))
      try {
        const report = await scanThemeCombinations(surface, {
          signal: controller.signal,
          onProgress: (progress) => {
            if (!disposed && !controller.signal.aborted)
              setAudit((previous) => ({ ...previous, progress }))
          },
        })
        if (!disposed && !controller.signal.aborted)
          setAudit({
            report,
            progress: null,
            durationMs: performance.now() - started,
            error: null,
          })
      } catch (error) {
        if (!disposed && !controller.signal.aborted)
          setAudit((previous) => ({
            ...previous,
            error:
              error instanceof Error
                ? error.message
                : 'Could not scan these colors. Try again.',
          }))
      } finally {
        active = null
        if (!disposed) {
          if (restart) {
            restart = false
            void run()
          } else if (timer === undefined)
            setAudit((previous) => ({ ...previous, progress: null }))
        }
      }
    }
    const refresh = () => {
      clearTimeout(timer)
      timer = undefined
      void run()
    }
    const cancel = () => {
      clearTimeout(timer)
      timer = undefined
      restart = false
      active?.abort()
      if (!disposed) setAudit((previous) => ({ ...previous, progress: null }))
    }
    const stylesChanged = () => {
      // A scan must read one consistent set of styles, even during hot reload.
      clearTimeout(timer)
      restart = false
      active?.abort()
      setAudit(emptyAudit)
      timer = setTimeout(refresh, 150)
    }
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            (record.target instanceof Element &&
              record.target.matches('style, link[rel="stylesheet"]')) ||
            !!record.target.parentElement?.closest('style') ||
            Array.from(record.addedNodes)
              .concat(Array.from(record.removedNodes))
              .some(isStylesheet),
        )
      )
        stylesChanged()
    })
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['href', 'rel', 'media', 'disabled'],
    })
    const stylesheetLoaded = (event: Event) => {
      if (
        event.target instanceof HTMLLinkElement &&
        event.target.rel === 'stylesheet'
      )
        stylesChanged()
    }
    document.head.addEventListener('load', stylesheetLoaded, true)
    commands.current = { refresh, cancel }
    void run()
    return () => {
      disposed = true
      cancel()
      observer.disconnect()
      document.head.removeEventListener('load', stylesheetLoaded, true)
    }
  }, [])
  const refresh = useCallback(() => commands.current.refresh(), [])
  const cancel = useCallback(() => commands.current.cancel(), [])
  return { ...audit, scanner, refresh, cancel }
}
