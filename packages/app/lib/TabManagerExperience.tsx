import { useSurface } from '@extension/ui/Surface'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import { ThemeColorSettings } from '@extension/ui/ThemeColorSettings'
import { useShouldReduceMotion } from '@extension/ui/useShouldReduceMotion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useStore } from 'zustand'
import { resolveTheme } from './PreferenceSurface'
import { useTabManagerResources } from './TabbyProvider'
import {
  createTabManagerController,
  projectTabManager,
  projectTabManagerWindows,
} from './tabManagerModel'
import { useExperienceClock } from './useExperienceClock'
import type { TabManagerController } from './tabManagerModel'

export const TabManagerExperience = ({
  controller: supplied,
  focusOnMount,
  appearanceExperiment,
}: {
  controller?: TabManagerController
  focusOnMount?: boolean
  appearanceExperiment?: boolean
}) => {
  const resources = useTabManagerResources()
  const [colorError, setColorError] = useState<string | null>(null)
  const { backend, view, environment, preferences, host } = resources
  const reduceAgePrecision = !!useShouldReduceMotion()
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const snapshot = useSyncExternalStore(
    backend.subscribe,
    backend.getSnapshot,
    backend.getSnapshot,
  )
  const selectClock = useCallback(
    (time: number) =>
      projectTabManagerWindows(snapshot, time, reduceAgePrecision).clockKey,
    [snapshot, reduceAgePrecision],
  )
  const now = useExperienceClock(environment, selectClock)
  const preferenceState = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
    preferences.getSnapshot,
  )
  const state = useStore(view)
  const controller = useMemo(
    () =>
      supplied ??
      createTabManagerController({
        backend,
        view,
        environment,
        preferences,
        host,
      }),
    [supplied, backend, view, environment, preferences, host],
  )
  useLayoutEffect(() => {
    controller.reconcile()
  }, [controller, snapshot])
  useEffect(() => {
    if (live) controller.startNotifications()
    else controller.cancel()
    return () => controller.cancel()
  }, [controller, live])
  const model = projectTabManager(snapshot, state, now, {
    reduceAgePrecision,
    windowSource: preferenceState.tabManagerCompactIconMode,
  })
  const activeThemeMode = resolveTheme(
    preferenceState,
    environment.systemTheme,
  ).theme
  return (
    <TabManager
      model={model}
      onIntent={controller.dispatch}
      focusOnMount={focusOnMount}
      appearanceExperiment={appearanceExperiment}
      designSettings={
        appearanceExperiment ? (
          <>
            <h2 className="text-muted mb-3 text-xs">
              {activeThemeMode === 'dark' ? 'Dark colors' : 'Light colors'}
            </h2>
            <ThemeColorSettings
              preferences={preferenceState}
              activeThemeMode={activeThemeMode}
              compact
              onPreferenceChange={async (patch) => {
                setColorError(null)
                try {
                  await preferences.set(patch)
                } catch (error) {
                  setColorError(
                    error instanceof Error ? error.message : String(error),
                  )
                }
              }}
            />
            <p className="text-muted mt-3 text-xs">
              Colors save automatically.
            </p>
            {colorError && (
              <p role="alert" className="text-destructive mt-2 text-xs">
                {colorError}
              </p>
            )}
          </>
        ) : undefined
      }
    />
  )
}
