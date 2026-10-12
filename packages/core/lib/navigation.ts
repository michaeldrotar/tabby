const navigationProtocols = new Set([
  'http:',
  'https:',
  'file:',
  'ftp:',
  'chrome:',
  'chrome-extension:',
  'about:',
  'mailto:',
  'tel:',
])

/** Browser destinations are data; executable and embedded-document URLs are excluded. */
export const isNavigableUrl = (value: string): boolean => {
  const protocol = value
    .trim()
    .replace(/[\t\r\n]/g, '')
    .match(/^[a-z][a-z\d+.-]*:/i)?.[0]
    ?.toLowerCase()
  return protocol !== undefined && navigationProtocols.has(protocol)
}
