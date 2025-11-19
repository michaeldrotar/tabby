import { loadBrowserWindowStore } from './window/loadBrowserWindowStore.js'
import { memo, useEffect } from 'react'
import type { PropsWithChildren } from 'react'

export type BrowserStoreProviderProps = PropsWithChildren

export const BrowserStoreProvider = memo((props: BrowserStoreProviderProps) => {
  useEffect(() => {
    loadBrowserWindowStore()
  }, [])
  return <>{props.children}</>
})
