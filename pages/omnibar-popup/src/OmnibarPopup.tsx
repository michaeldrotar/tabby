import { useThemeApplicator } from '@extension/shared'
import { Omnibar } from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

const queryClient = new QueryClient()

export const OmnibarPopup = () => {
  useThemeApplicator()

  const onDismiss = () => {
    window.close()
  }

  // Close window on blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        e.stopPropagation()
        window.close()
      }
    }

    window.addEventListener('blur', onDismiss)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('blur', onDismiss)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Omnibar onDismiss={onDismiss} className="h-screen w-screen" />
    </QueryClientProvider>
  )
}
