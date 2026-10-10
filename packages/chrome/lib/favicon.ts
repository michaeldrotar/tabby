export const getChromeFaviconUrl = (
  runtime: Pick<typeof chrome.runtime, 'getURL'>,
  pageUrl: string,
  size = 32,
) =>
  `${runtime.getURL('_favicon/')}?pageUrl=${encodeURIComponent(pageUrl)}&size=${size * 2}`
