import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

export const useSetSelectedWindowId = (): ((
  id: BrowserWindowID | undefined,
) => void) => {
  return useBrowserStore((state) => state.setSelectedWindowId)
}
