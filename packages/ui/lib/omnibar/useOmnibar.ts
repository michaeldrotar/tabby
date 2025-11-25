import { useCallback, useEffect, useState } from 'react'
import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const useOmnibar = () => {
  const [tabs, setTabs] = useState<OmnibarSearchItem[]>([])

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_TABS' }).then((response) => {
      if (response) {
        setTabs(
          response.map(
            (t: {
              id?: number
              title?: string
              url?: string
              favIconUrl?: string
              windowId?: number
            }) => ({
              id: t.id || 0,
              type: 'tab',
              title: t.title || 'Untitled',
              url: t.url,
              favIconUrl: t.favIconUrl,
              windowId: t.windowId,
              tabId: t.id,
            }),
          ),
        )
      }
    })
  }, [])

  const onSearch = useCallback(async (query: string) => {
    return chrome.runtime.sendMessage({ type: 'SEARCH', query })
  }, [])

  const onSelect = useCallback(
    async (
      item: OmnibarSearchItem,
      modifier?: 'new-tab' | 'new-window',
      originalWindowId?: number,
    ) => {
      return chrome.runtime.sendMessage({
        type: 'EXECUTE',
        item,
        modifier,
        originalWindowId,
      })
    },
    [],
  )

  return { tabs, onSearch, onSelect }
}
