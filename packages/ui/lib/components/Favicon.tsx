import type { ComponentPropsWithoutRef } from 'react'

type FaviconProps = {
  pageUrl?: string
  size?: number
} & Pick<ComponentPropsWithoutRef<'img'>, 'alt' | 'className'>

export const Favicon = ({
  pageUrl,
  size = 32,
  ...imageProps
}: FaviconProps) => {
  const src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl || '')}&size=${size * 2}`

  return (
    <img
      src={src}
      alt="favicon"
      {...imageProps}
      style={{ ...(size ? { height: `${size}px`, width: `${size}px` } : {}) }}
    />
  )
}
