import { OmnibarExperience, TabbySurface } from '@extension/app'
import { ChromeTabbyProvider } from '@extension/providers/chrome'
import { useEffect } from 'react'

const onDismiss = () => {
  window.close()
}

export const OmnibarPage = () => {
  // Close window on blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === 'w'
      ) {
        e.preventDefault()
        e.stopPropagation()
        onDismiss()
      }
    }

    window.addEventListener('blur', onDismiss)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('blur', onDismiss)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  const parameters = new URLSearchParams(window.location.search)
  const value = parameters.get('originalWindowId')
  const originalWindowId =
    value && Number.isFinite(Number(value)) ? Number(value) : undefined

  return (
    <ChromeTabbyProvider surface="omnibar" originalWindowId={originalWindowId}>
      <TabbySurface className="size-full">
        <OmnibarExperience onDismiss={onDismiss} className="size-full" />
      </TabbySurface>
    </ChromeTabbyProvider>
  )
}
