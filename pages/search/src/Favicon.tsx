type FaviconProps = {
  pageUrl?: string
  favIconUrl?: string
  size?: number | string
} & Pick<React.JSX.IntrinsicElements['img'], 'alt' | 'className'>

const Favicon = ({
  pageUrl,
  favIconUrl,
  size,
  ...imageProps
}: FaviconProps) => {
  const src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl || '')}&size=32`

  return (
    <img
      src={src}
      alt="favicon"
      {...imageProps}
      style={{ ...(size ? { height: `${size}px`, width: `${size}px` } : {}) }}
    />
  )
}

export { Favicon }
