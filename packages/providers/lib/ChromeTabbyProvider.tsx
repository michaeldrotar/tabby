import {
  createTabbyViews,
  createTabManagerController,
  initializeTabManagerView,
  TabbyProvider,
} from '@extension/app'
import { createChromeBackend } from '@extension/chrome/createChromeBackend'
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
    const backend = createChromeBackend(api)
    const preferences = createChromePreferences(api)
    const views = createTabbyViews()
    const host = createChromeTabManagerHost(api, {
      writeClipboardText: (text) => navigator.clipboard.writeText(text),
      onSidebarExpandedChange: (expanded) =>
        preferences.set({
          tabManagerCompactLayout: expanded ? 'list' : 'icon',
        }),
      onWindowActivated: (windowId) => {
        const snapshot = backend.getSnapshot()
        if (!snapshot.windows.some((window) => window.id === windowId)) return
        const active = snapshot.tabs.find(
          (tab) => tab.windowId === windowId && tab.active,
        )
        views.tabManager.setState({
          viewedWindowId: windowId,
          ...(active
            ? {
                scrollToItem: {
                  id: active.id,
                  revision:
                    (views.tabManager.getState().scrollToItem?.revision ?? 0) +
                    1,
                },
              }
            : {}),
        })
      },
    })
    return {
      backend,
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
      systemTheme,
      platform: navigator.userAgent.includes('Mac') ? 'mac' : 'other',
      schedule: (callback, delay) => {
        const timer = window.setTimeout(callback, delay)
        return () => window.clearTimeout(timer)
      },
    }),
    [systemTheme],
  )
  useEffect(() => {
    let live = true
    const browserReady = Promise.all([
      resources.backend.start(),
      resources.preferences.start(),
      surface === 'tab-manager' ? resources.host.start() : undefined,
    ])
    void browserReady.then(
      ([, , windowId]) => {
        if (live)
          initializeTabManagerView(
            resources.views.tabManager,
            resources.backend.getSnapshot(),
            windowId,
          )
      },
      () => {},
    )
    void Promise.all([
      browserReady,
      resources.omnibar.start(),
      resources.options.start(),
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
      resources.host.dispose()
      resources.backend.dispose()
      resources.preferences.dispose()
      resources.omnibar.dispose()
      resources.options.dispose()
    }
  }, [resources, surface])
  return (
    <TabbyProvider
      backend={resources.backend}
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
