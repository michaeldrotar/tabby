import { BrowserWindows } from './BrowserWindows.js'
import { useMemo } from 'react'

/**
 * Provides actions that can affect browser windows.
 */
export const useBrowserWindowActions = () => {
  return useMemo(
    () => ({
      create: BrowserWindows.create,
      updateById: BrowserWindows.updateById,
      removeById: BrowserWindows.removeById,
    }),
    [],
  )
}
