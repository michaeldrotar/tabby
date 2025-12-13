export const getFaviconUrl = (
  pageUrl: string,
  { size = 32 }: { size?: number } = {},
): string => {
  const baseUrl = `chrome-extension://${chrome.runtime.id}`
  const encodedPageUrl = encodeURIComponent(pageUrl)
  return `${baseUrl}/_favicon/?pageUrl=${encodedPageUrl}&size=${size * 2}`
}
