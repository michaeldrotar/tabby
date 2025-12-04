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
    window.addEventListener('blur', onDismiss)
    return () => window.removeEventListener('blur', onDismiss)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Omnibar onDismiss={onDismiss} className="h-screen w-screen" />
    </QueryClientProvider>
  )
}
