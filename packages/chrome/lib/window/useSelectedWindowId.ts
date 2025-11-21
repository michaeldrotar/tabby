import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

export const useSelectedWindowId = (): BrowserWindowID | undefined => {
  return useBrowserStore((state) => state.selectedWindowId)
}
