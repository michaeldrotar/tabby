import { createMemoryPreferences } from '@extension/demo'
import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'

const MarketingAppearanceContext = createContext<
  ReturnType<typeof createMemoryPreferences> | undefined
>(undefined)

export const MarketingAppearanceProvider = ({
  children,
}: PropsWithChildren) => {
  const [preferences] = useState(() =>
    createMemoryPreferences({ theme: 'light', themePreset: 'tabby' }),
  )
  useEffect(() => () => preferences.dispose(), [preferences])
  return (
    <MarketingAppearanceContext.Provider value={preferences}>
      {children}
    </MarketingAppearanceContext.Provider>
  )
}

export const useMarketingAppearance = () =>
  useContext(MarketingAppearanceContext)
