/** Keep virtual keyboard selection visible within its own search viewport. */
export const scrollOmnibarItemIntoView = (item: HTMLElement | null) => {
  const viewport = item?.closest<HTMLElement>(
    '[data-omnibar-scope-popup], [data-radix-scroll-area-viewport]',
  )
  if (!item || !viewport) return
  const bounds = item.getBoundingClientRect()
  const visible = viewport.getBoundingClientRect()
  const scale = visible.height / viewport.offsetHeight || 1
  const top = visible.top + viewport.clientTop * scale
  const bottom = top + viewport.clientHeight * scale
  if (bounds.top < top) viewport.scrollTop += (bounds.top - top) / scale
  else if (bounds.bottom > bottom)
    viewport.scrollTop += (bounds.bottom - bottom) / scale
}
