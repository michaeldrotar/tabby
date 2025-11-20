import { loadBrowserTabStore } from './tab/loadBrowserTabStore.js'
import { loadBrowserWindowStore } from './window/loadBrowserWindowStore.js'
import { memo, useEffect } from 'react'
import type { PropsWithChildren } from 'react'

export type BrowserStoreProviderProps = PropsWithChildren

export const BrowserStoreProvider = memo((props: BrowserStoreProviderProps) => {
  useEffect(() => {
    Promise.all([loadBrowserWindowStore(), loadBrowserTabStore()])
  }, [])
  return <>{props.children}</>
})
