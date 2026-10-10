import type { ComponentPropsWithoutRef } from 'react'

type FaviconProps = {
  pageUrl?: string
  faviconUrl?: string
  size?: number
} & Pick<ComponentPropsWithoutRef<'img'>, 'alt' | 'className' | 'title'>

export const Favicon = ({
  pageUrl: _pageUrl,
  faviconUrl,
  size = 32,
  ...imageProps
}: FaviconProps) => {
  if (!faviconUrl) return null

  return (
    <img
      src={faviconUrl}
      alt="favicon"
      {...imageProps}
      style={{ ...(size ? { height: `${size}px`, width: `${size}px` } : {}) }}
    />
  )
}
