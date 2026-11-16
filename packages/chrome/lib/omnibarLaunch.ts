import type { OmnibarScope } from '@extension/core'

const launchKey = (windowId: number) => `tabby-search-launch-${windowId}`
const launchLifetime = 10_000

/** The next popup in this window consumes the launch context once. */
export const openWindowSearch = async (
  api: {
    action: Pick<typeof chrome.action, 'openPopup'>
    storage?: Pick<typeof chrome.storage, 'session'>
  },
  windowId?: number,
) => {
  if (windowId === undefined)
    throw new Error('Could not identify the current window.')
  if (!api.storage) throw new Error('Search launch storage is unavailable.')
  const key = launchKey(windowId)
  await api.storage.session.set({ [key]: Date.now() })
  try {
    await api.action.openPopup({ windowId })
  } catch (error) {
    await api.storage.session.remove(key)
    throw error
  }
}

export const takeSearchScope = async (
  session: Pick<typeof chrome.storage.session, 'get' | 'remove'> | undefined,
  windowId?: number,
): Promise<OmnibarScope | undefined> => {
  if (!session || windowId === undefined) return undefined
  const key = launchKey(windowId)
  const timestamp: unknown = (await session.get(key))[key]
  if (timestamp === undefined) return undefined
  await session.remove(key)
  return typeof timestamp === 'number' &&
    timestamp <= Date.now() &&
    Date.now() - timestamp < launchLifetime
    ? 'current-window'
    : undefined
}
