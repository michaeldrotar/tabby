import type { BrowserTab } from '../../tab/BrowserTab.js'

/**
 * Copies all URLs from tabs in a window to the clipboard.
 */
export const copyAllUrlsInWindow = async (
  tabs: readonly BrowserTab[],
): Promise<void> => {
  const urls = tabs.map((tab) => tab.url).filter((url): url is string => !!url)
  await navigator.clipboard.writeText(urls.join('\n'))
}
