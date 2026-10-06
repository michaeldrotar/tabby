import { memo, useEffect } from 'react'
import { loadBrowserStore } from './loadBrowserStore.js'
import type { PropsWithChildren } from 'react'

export type BrowserStoreProviderProps = PropsWithChildren

export const BrowserStoreProvider = memo((props: BrowserStoreProviderProps) => {
  useEffect(() => {
    loadBrowserStore()
  }, [])
  return <>{props.children}</>
})
