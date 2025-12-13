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

/*
<PowerList>
  <PowerListItem>
    <PowerListItemContent>
      <PowerListItemIcon />
      <PowerListItemTitle>
        {tab.name}
      </PowerListItemTitle>
    </PowerListItemContent>
    <PowerListItemActions>
      <Tooltip>
        <TooltipTrigger>
          <PowerListItemAction shortcut="Delete" onActivate={() => chrome.tabs.remove(tab.id)}>
            <CloseIcon />
          </PowerListItemAction>
        </TooltipTrigger>
        <TooltipContent>
          Close <Kbd>DEL</Kbd>
        </TooltipContent>
      </Tooltip>
    </PowerListItemActions>
  </PowerListItem>
</PowerList>

<TabList tabs={tabs} />

<TabItem tab={tab} />
*/
