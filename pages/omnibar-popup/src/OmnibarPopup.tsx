import { BrowserStoreProvider } from '@extension/chrome'
import { WiredOmnibar } from '@extension/omnibar'
import { useResolvedTheme, useThemeApplicator } from '@extension/shared'
import { Toaster } from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

const queryClient = new QueryClient()

const onDismiss = () => {
  window.close()
}

const OmnibarPopupContent = () => {
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

  return <WiredOmnibar onDismiss={onDismiss} className="h-screen w-screen" />
}

export const OmnibarPopup = () => {
  useThemeApplicator()
  const theme = useResolvedTheme()

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster theme={theme} />
      <BrowserStoreProvider>
        <OmnibarPopupContent />
      </BrowserStoreProvider>
    </QueryClientProvider>
  )
}
