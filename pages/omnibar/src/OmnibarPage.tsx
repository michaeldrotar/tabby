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
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
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

  const value = new URLSearchParams(window.location.search).get(
    'originalWindowId',
  )
  const originalWindowId =
    value && Number.isFinite(Number(value)) ? Number(value) : undefined

  return (
    <ChromeTabbyProvider surface="omnibar" originalWindowId={originalWindowId}>
      <TabbySurface className="h-full w-full">
        <OmnibarExperience onDismiss={onDismiss} className="h-full w-full" />
      </TabbySurface>
    </ChromeTabbyProvider>
  )
}
