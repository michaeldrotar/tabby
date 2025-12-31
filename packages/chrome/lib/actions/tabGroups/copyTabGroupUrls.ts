import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Copies all URLs from tabs in a group to the clipboard.
 */
export const copyTabGroupUrls = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  const tabs = await chrome.tabs.query({ groupId })
  const urls = tabs.map((tab) => tab.url).filter((url): url is string => !!url)
  await navigator.clipboard.writeText(urls.join('\n'))
}
