import { useThemeApplicator } from '@extension/shared'
import { Omnibar } from '@extension/ui'
import { useEffect } from 'react'

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

  return <Omnibar onDismiss={onDismiss} className="h-screen w-screen" />
}
