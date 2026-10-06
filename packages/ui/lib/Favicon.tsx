import { getFaviconUrl } from './getFaviconUrl'
import type { ComponentPropsWithoutRef } from 'react'

type FaviconProps = {
  pageUrl?: string
  size?: number
} & Pick<ComponentPropsWithoutRef<'img'>, 'alt' | 'className' | 'title'>

export const Favicon = ({
  pageUrl,
  size = 32,
  ...imageProps
}: FaviconProps) => {
  if (!pageUrl) return null

  const src = getFaviconUrl(pageUrl, { size })

  return (
    <img
      src={src}
      alt="favicon"
      {...imageProps}
      style={{ ...(size ? { height: `${size}px`, width: `${size}px` } : {}) }}
    />
  )
}
