import { loadBrowserWindowStore } from './loadBrowserWindowStore.js'
import { memo, useEffect } from 'react'
import type { PropsWithChildren } from 'react'

export type BrowserWindowStoreProviderProps = PropsWithChildren

export const BrowserWindowStoreProvider = memo(
  (props: BrowserWindowStoreProviderProps) => {
    useEffect(() => {
      loadBrowserWindowStore()
    }, [])
    return <>{props.children}</>
  },
)
