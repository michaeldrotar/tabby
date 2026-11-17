import { normalizePreferences } from '@extension/core/preferences'
import { CHROME_PREFERENCES_STORAGE_KEY } from './createChromePreferences.js'

type WindowFocusApi = Pick<typeof chrome, 'windows'> & {
  storage?: { local?: Pick<typeof chrome.storage.local, 'get'> }
}

/** Capture before a transfer can close the focused source window. */
export const captureChromeWindowStack = async (
  api: WindowFocusApi,
): Promise<chrome.windows.Window | undefined> => {
  try {
    const stored = await api.storage?.local?.get(CHROME_PREFERENCES_STORAGE_KEY)
    if (
      !normalizePreferences(stored?.[CHROME_PREFERENCES_STORAGE_KEY])
        .stackWindows
    )
      return
    const source = await api.windows.getLastFocused()
    if (source.type === 'normal' && source.state !== 'minimized') return source
  } catch {
    /* Window placement must not prevent navigation. */
  }
  return undefined
}

export const stackChromeWindow = async (
  api: WindowFocusApi,
  windowId: number,
  source?: chrome.windows.Window,
): Promise<void> => {
  if (!source || source.id === windowId) return
  const { left, top, width, height } = source
  if (
    left === undefined ||
    top === undefined ||
    width === undefined ||
    height === undefined
  )
    return
  try {
    await api.windows.update(windowId, { state: 'normal' })
    await api.windows.update(windowId, { left, top, width, height })
    if (source.state === 'maximized' || source.state === 'fullscreen')
      await api.windows.update(windowId, { state: source.state })
  } catch {
    /* Keep navigation available if Chrome cannot apply the source geometry. */
  }
}

export const focusChromeWindow = async (
  api: WindowFocusApi,
  windowId: number,
  current: () => void = () => {},
): Promise<void> => {
  const source = await captureChromeWindowStack(api)
  current()
  await stackChromeWindow(api, windowId, source)
  current()
  await api.windows.update(windowId, { focused: true })
}
