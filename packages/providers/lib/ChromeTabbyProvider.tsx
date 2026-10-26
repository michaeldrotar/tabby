import {
  createTabbyViews,
  createTabManagerController,
  initializeTabManagerView,
  TabbyProvider,
} from '@extension/app'
import { createChromeBackend } from '@extension/chrome/createChromeBackend'
import { createChromeBookmarks } from '@extension/chrome/createChromeBookmarks'
import { createChromeOmnibarResource } from '@extension/chrome/createChromeOmnibarResource'
import { createChromeOptionsResource } from '@extension/chrome/createChromeOptionsResource'
import { createChromePreferences } from '@extension/chrome/createChromePreferences'
import { createChromeTabManagerHost } from '@extension/chrome/createChromeTabManagerHost'
import { createSystemThemeResource } from '@extension/chrome/systemTheme'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { TabbyResources } from '@extension/app'
import type { PropsWithChildren } from 'react'

export type ChromeTabbyProviderProps = PropsWithChildren<{
  api?: typeof chrome
  surface?: 'tab-manager' | 'omnibar' | 'options'
  originalWindowId?: number
}>

/** Owns the extension resources; application surfaces share one injected contract. */
export const ChromeTabbyProvider = ({
  children,
  api = chrome,
  surface = 'tab-manager',
  originalWindowId,
}: ChromeTabbyProviderProps) => {
  const resources = useMemo(() => {
    const backend = createChromeBackend(api, {
      delegateClosingWindowMoves: true,
    })
    const preferences = createChromePreferences(api)
    const views = createTabbyViews()
    const host = createChromeTabManagerHost(api, {
      writeClipboardText: (text) => navigator.clipboard.writeText(text),
      onWindowActivated: (windowId, tabIds) => {
        if (
          tabIds &&
          (backend.getSnapshot().state !== 'loaded' ||
            tabIds.some(
              (id) =>
                !backend
                  .getSnapshot()
                  .tabs.some(
                    (tab) => tab.id === id && tab.windowId === windowId,
                  ),
            ))
        )
          return false
        createTabManagerController({
          backend,
          view: views.tabManager,
          preferences,
          environment: { now: Date.now, systemTheme: 'light' },
        }).dispatch(
          tabIds
            ? { type: 'receive-moved-tabs', windowId, tabIds }
            : { type: 'view-window', windowId },
        )
        return true
      },
    })
    return {
      backend,
      bookmarks: createChromeBookmarks(api),
      preferences,
      views,
      omnibar: createChromeOmnibarResource(api, originalWindowId),
      options: createChromeOptionsResource(api),
      host,
      systemTheme: createSystemThemeResource(
        window.matchMedia('(prefers-color-scheme: dark)'),
      ),
    }
  }, [api, originalWindowId])
  const systemTheme = useSyncExternalStore(
    resources.systemTheme.subscribe,
    resources.systemTheme.getSnapshot,
    resources.systemTheme.getServerSnapshot,
  )
  const environment = useMemo<TabbyResources['environment']>(
    () => ({
      now: Date.now,
      locale: api.i18n.getUILanguage(),
      systemTheme,
      platform: navigator.userAgent.includes('Mac') ? 'mac' : 'other',
      schedule: (callback, delay) => {
        const timer = window.setTimeout(callback, delay)
        return () => window.clearTimeout(timer)
      },
    }),
    [api, systemTheme],
  )
  useEffect(() => {
    let live = true
    const unsubscribe = resources.backend.subscribe(() => {
      if (live && surface === 'tab-manager')
        void resources.host.restoreMovedTabs()
    })
    const browserReady = Promise.all([
      resources.backend.start(),
      resources.preferences.start(),
      surface === 'tab-manager' ? resources.host.start() : undefined,
    ])
    void browserReady.then(
      async ([, , windowId]) => {
        if (live) {
          initializeTabManagerView(
            resources.views.tabManager,
            resources.backend.getSnapshot(),
            windowId,
          )
          await resources.host.restoreMovedTabs()
        }
      },
      () => {},
    )
    void Promise.all([
      browserReady,
      resources.omnibar.start(),
      resources.options.start(),
      surface === 'tab-manager' ? resources.bookmarks.start() : undefined,
    ]).catch((error: unknown) => {
      if (!live) return
      const message =
        error instanceof Error
          ? error.message
          : 'Could not connect to the browser.'
      resources.views.omnibar.setState({ error: message })
      resources.views.options.setState({ error: message })
      createTabManagerController({
        backend: resources.backend,
        preferences: resources.preferences,
        view: resources.views.tabManager,
        environment: { now: Date.now, systemTheme: 'light' },
      }).notify({ message, kind: 'error' })
    })
    return () => {
      live = false
      unsubscribe()
      resources.host.dispose()
      resources.backend.dispose()
      resources.preferences.dispose()
      resources.omnibar.dispose()
      resources.options.dispose()
      resources.bookmarks.dispose()
    }
  }, [resources, surface])
  return (
    <TabbyProvider
      backend={resources.backend}
      bookmarks={surface === 'tab-manager' ? resources.bookmarks : undefined}
      preferences={resources.preferences}
      omnibar={resources.omnibar}
      options={resources.options}
      views={resources.views}
      environment={environment}
      host={resources.host.capabilities}
    >
      {children}
    </TabbyProvider>
  )
}
